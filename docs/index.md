---
title: RecQL Language Overview
sidebar_label: Overview
slug: /
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# RecQL Language Overview

**RecQL** (Recommender Query Language) is a declarative, vendor-agnostic domain-specific query language for **multi-stage recommendation, vector search, lexical search, hybrid fusion, ML scoring, and reordering pipelines**.

RecQL combines the familiarity of SQL syntax with first-class primitives for machine learning and information retrieval. It operates seamlessly across relational databases, document stores, vector indexes, and search backends (including PostgreSQL + pgvector, Microsoft SQL Server 2025, Oracle 23ai, MongoDB, and MariaDB).

---

## Why RecQL?

Modern search and recommendation engines require multi-stage pipelines:
1. **Candidate Retrieval**: Fan out across vector similarity, full-text lexical search, collaborative filtering, or column rankings.
2. **Merge & Deduplication**: Unify candidate bags from heterogeneous sources with deterministic priority and fusion (e.g. Reciprocal Rank Fusion).
3. **Filtering**: Enforce catalog rules, availability constraints, and user interaction histories (e.g. exclude seen items).
4. **Machine Learning Scoring**: Evaluate Gradient Boosted Decision Trees (LightGBM) or custom value models on candidate feature sets.
5. **Reordering & De-biasing**: Apply diversity (Maximal Marginal Relevance with attribute Jaccard), novelty exploration (interleaving), or business promotion boosting.
6. **Slicing & Pagination**: Slice results and persist pagination state in KV stores.

Traditionally, developers glue these stages together using ad-hoc application code, leading to fragmented pipelines, latency bottlenecks, and vendor lock-in. **RecQL expresses this entire ranking pipeline in a single declarative query.**

---

## Anatomy of a RecQL Query

A standard RecQL query expresses the full ranking pipeline declaratively:

<Tabs>
<TabItem value="recql" label="RecQL" default>

```sql
SELECT 
  score(expression='click_through_rate', input_user_id=$user_id) AS ctr,
  diversity(score=ctr, strength=0.3) AS div_rank,
  *
FROM retrieve(
  text_search(
    query=$query_text,
    mode=vector(text_embedding_ref='content_embedding'),
    name='vector_matches',
    limit=100
  ),
  text_search(
    query=$query_text,
    mode=lexical(),
    name='keyword_matches',
    limit=100
  )
)
WHERE array_has(genres, $genre)
ORDER BY div_rank
LIMIT 20 OFFSET 0;
```

</TabItem>
<TabItem value="yaml" label="YAML">

```yaml
parameters:
  user_id:
    type: string
    default: "42"
  query_text:
    type: string
    default: "sci-fi adventure"
  genre:
    type: string
    default: "Sci-Fi"

query:
  from: item
  type: rank
  retrieve:
    - type: text_search
      name: vector_matches
      input_text_query: $parameter.query_text
      mode:
        type: vector
        text_embedding_ref: content_embedding
      limit: 100
    - type: text_search
      name: keyword_matches
      input_text_query: $parameter.query_text
      mode:
        type: lexical
        fuzziness_edit_distance: 0
      limit: 100
  filter:
    - type: expression
      expression: "array_has(genres, $parameter.genre)"
  score:
    type: score_ensemble
    value_model: click_through_rate
    input_user_id: $parameter.user_id
    output_alias: ctr
  reorder:
    - type: diversity
      strength: 0.3
      output_alias: div_rank
  limit: 20
  offset: 0
```

</TabItem>
</Tabs>

---

## Core Pipeline Architecture

```
                               ┌────────────────────────────────┐
                               │       RecQL Query String       │
                               └───────────────┬────────────────┘
                                               │ (Lex & Parse)
                                               ▼
                               ┌────────────────────────────────┐
                               │   Executable IR (YAML / JSON)  │◄── Direct IR Submission
                               └───────────────┬────────────────┘
                                               │ (Bind against EngineCatalog)
                                               ▼
                               ┌────────────────────────────────┐
                               │       BoundRankQuery Plan      │
                               └───────────────┬────────────────┘
                                               │
                        ┌──────────────────────┴──────────────────────┐
                        ▼                                             ▼
             ┌─────────────────────┐                       ┌─────────────────────┐
             │ Vector / ANN Search │                       │ Lexical Full-Text   │
             └──────────┬──────────┘                       └──────────┬──────────┘
                        │ (Async Parallel Execution)                  │
                        └──────────────────────┬──────────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │      Union & Deduplication     │
                               └───────────────┬────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │   Global Filter Stage (WHERE)  │
                               └───────────────┬────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │  ML Scoring & Computed Columns │
                               └───────────────┬────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │   Reordering (MMR / Explore)   │
                               └───────────────┬────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │      Limit, Offset & Slicing   │
                               └────────────────────────────────┘
```

---

## Dual Query Ingestion: High-Level RecQL or Direct IR

RecQL text queries lower directly into the canonical Intermediate Representation (IR). Applications and services can submit ranking queries either in high-level RecQL SQL syntax or directly as structured IR in YAML or JSON:

| High-Level RecQL SQL Syntax | Direct Intermediate Representation (IR) |
| :--- | :--- |
| Concise, expressive, human-readable | Machine-generated, structural, API-native |
| Perfect for interactive queries, REPL, and codebases | Perfect for configuration files, programmatic clients, and APIs |
| Lowers deterministically to IR | Directly executes on the RecQL runtime |

See [Intermediate Representation (IR)](/docs/ir) for the complete structural specification.
