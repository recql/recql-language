---
title: Query Semantics & Execution Model
sidebar_label: Execution Semantics
slug: /semantics
---

# Query Semantics & Execution Model

RecQL defines strict pipeline execution semantics. Every query follows a deterministic, stage-oriented execution flow.

---

## The 6 Execution Stages

When a RecQL query executes, it advances through six distinct stages in order:

```
┌────────────────────────────────────────────────────────┐
│ 1. RETRIEVE (Parallel Fan-out)                         │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. MERGE & DEDUPLICATION (Union)                       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. POSTFILTER (Global WHERE & Exclusion)               │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. SCORING & COMPUTED COLUMNS (ML Inference)           │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 5. REORDERING (Diversity / Exploration / Boosted)      │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 6. SLICING & PAGINATION (Limit / Offset / KV State)    │
└────────────────────────────────────────────────────────┘
```

---

### Stage 1: Retrieval (Parallel Candidate Generation)

The `FROM retrieve(...)` clause specifies one or more retriever calls:
* All retriever calls execute **concurrently** via asynchronous I/O (`asyncio`).
* Each retriever queries its respective storage/index backend and returns an ordered list of candidate items with a `retrieval_score`.
* **Prefilter Pushdown**: Predicates declared inside a retriever call (e.g. `similarity(..., where=...)`) are pushed down into the storage engine's index scan before candidate selection.

### Stage 2: Merge & Deduplication

Candidates from all retrieve bags are merged into a unified candidate pool:
* **Deterministic Priority**: If an item appears in multiple bags, the instance from the earliest declared retriever in `retrieve(...)` takes precedence.
* **Score Normalization & Preservation**: The candidate's `retrieval_score` is preserved or combined using Reciprocal Rank Fusion (`rrf`).

### Stage 3: Global Postfilter (`WHERE` Clause)

The top-level `WHERE` clause filters the merged candidate set in-memory:
* **Separation of Concerns**: Retriever `where=` is a *prefilter* applied before retrieval; top-level `WHERE` is a *postfilter* applied to merged candidates.
* **Expression Evaluation**: Standard boolean predicates, comparisons, array functions (`array_has`), and null checks evaluate against candidate attributes.
* **Pagination Exclusion**: If a `pagination_key` is provided, items recorded in prior pages are excluded here.

### Stage 4: Scoring & Computed Columns

Calculates machine learning inference scores and derived features:
* **GBDT / Model Inference**: Evaluates LightGBM, tree ensembles, or neural scoring models on user and item attributes.
* **Computed Expressions**: Calculates custom formulas, dot products, or feature transformations.
* **Order Preservation**: By default, the candidate pool is re-sorted in descending order of the computed score unless `preserve_order=true` is set.

### Stage 5: Reordering

Applies post-scoring reordering algorithms:
* **Diversity (`diversity`)**: Maximal Marginal Relevance (MMR) greedy selection that penalizes redundant attribute overlap using Jaccard similarity.
* **Exploration (`exploration`)**: Interleaves candidate items with an exploration pool to combat filter bubbles and surface novel content.
* **Boosted Promotion (`boosted`)**: Interleaves promoted items (e.g., promotional campaigns or sponsored products) into the organic candidate stream.
* **Column Sorting (`column_sort`)**: Sorts by specific attribute columns (`ORDER BY col ASC/DESC`).

### Stage 6: Slicing & Pagination

Applies `LIMIT` and `OFFSET`:
* Returns the final page of items to the caller.
* If pagination tracking is active, the returned item IDs are saved to the persistent key-value store (e.g., `pagination_seen` table) with the configured TTL.

---

## Prefilter vs. Postfilter Semantics

Understanding the difference between `where=` and `WHERE` is fundamental to RecQL:

| Concept | Retriever `where=` (Prefilter) | Query `WHERE` (Postfilter) |
| :--- | :--- | :--- |
| **Location** | Inside `retrieve(retriever(where=...))` | Top-level query `WHERE ...` |
| **Execution Point** | Stage 1 (Storage Engine / Index Scan) | Stage 3 (In-Memory Pipeline) |
| **Scope** | Applies only to that specific retriever | Applies to the union of all retrieved items |
| **Pushdown** | Must be supported by backend index | Evaluated in memory across all attributes |
| **Failure Mode** | Fails closed if backend cannot enforce | Always succeeds |

### Example Comparison:

```sql
-- PREFILTER: Pushed down to index scan; only 100 Animation items are retrieved
SELECT * FROM retrieve(
  similarity(
    embedding_ref='content_embedding',
    encoder=precomputed_item(input_item_id='1'),
    where='genre = ''Animation''',
    limit=100
  )
)
LIMIT 20;

-- POSTFILTER: Retrieves 100 general items, then filters in-memory
SELECT * FROM retrieve(
  similarity(
    embedding_ref='content_embedding',
    encoder=precomputed_item(input_item_id='1'),
    limit=100
  )
)
WHERE array_has(genres, 'Animation')
LIMIT 20;
```
