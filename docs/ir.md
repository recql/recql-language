---
title: Intermediate Representation (IR)
sidebar_label: Intermediate Representation (IR)
slug: /ir
---

# Intermediate Representation (IR) Specification

The **RecQL Intermediate Representation (IR)** is the canonical, machine-executable representation of a recommendation and search ranking pipeline.

The IR sits between high-level language frontends and backend execution engines. It provides a formal, structural definition of all retrieval, filtering, scoring, and reordering operations.

```
                  ┌───────────────────────────────┐
                  │    RecQL Query Text (SQL)     │
                  └───────────────┬───────────────┘
                                  │ (Frontend Lex/Parse & Lowering)
                                  ▼
┌─────────────────────────┐  ┌─────────────────────────────────┐
│ Direct YAML / JSON IR   │─►│   RecQL Executable IR (AST/IR)  │
│ (Programmatic / API)    │  └────────────────┬────────────────┘
└─────────────────────────┘                   │
                                              │ (Catalog Binding & Plan Generation)
                                              ▼
                             ┌─────────────────────────────────┐
                             │       Bound Execution Plan      │
                             └────────────────┬────────────────┘
                                              ▼
                             ┌─────────────────────────────────┐
                             │  Storage & Execution Backends   │
                             │ (Postgres, MSSQL, Oracle, etc.) │
                             └─────────────────────────────────┘
```

---

## Direct IR Submission vs. Language Compilation

RecQL query engines treat high-level text queries and raw IR as peer inputs:

1. **Language Compilation Path**: A RecQL text statement is parsed into an AST and lowered into IR by the language compiler.
2. **Direct Submission Path**: Applications, API gateways, and microservices can bypass text parsing entirely and submit queries directly as structured JSON or YAML IR. Both paths construct identical IR data structures and yield identical execution plans and results.

---

## IR Top-Level Structure

A complete IR program is packaged into a **`QueryDefinition`** containing:
1. **`parameters`**: A symbol table declaring typed input parameters and default values.
2. **`query`**: The executable ranking pipeline specification.

```yaml
parameters:
  user_id:
    type: string
    default: "55"
  query_text:
    type: string
    default: "space exploration"
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

---

## AST to IR Lowering Table

The frontend compiler maps RecQL AST nodes into IR instructions using standard lowering rules:

| RecQL SQL Construct | IR Stage / Step Node | IR Instruction Type |
| :--- | :--- | :--- |
| `FROM items` / `FROM users` | `from: "item"` / `from: "user"` | Target Entity Domain |
| `FROM retrieve(similarity(...))` | `retrieve[i]` | `similarity` |
| `FROM retrieve(text_search(...))` | `retrieve[i]` | `text_search` |
| `FROM retrieve(column_order(...))` | `retrieve[i]` | `column_order` |
| `FROM retrieve(filter(...))` | `retrieve[i]` | `filter` |
| `FROM retrieve(candidate_ids(...))` | `retrieve[i]` | `candidate_ids` |
| `FROM retrieve(candidate_attributes(...))` | `retrieve[i]` | `candidate_attributes` |
| `WHERE <expr>` (top-level) | `filter[i]` | `expression` |
| `SELECT score(expression='...') AS s` | `score` | `score_ensemble` |
| `SELECT computed_column(...) AS c` | `computed_columns[i]` | `computed_column` |
| `SELECT diversity(...) AS d` | `reorder[i]` | `diversity` |
| `SELECT exploration(...) AS e` | `reorder[i]` | `exploration` |
| `SELECT boosted(...) AS b` | `reorder[i]` | `boosted` |
| `ORDER BY col ASC` | `reorder[i]` | `column_sort` |
| `LIMIT n OFFSET m` | `limit: n`, `offset: m` | Slicing Spec |

---

## Instruction Set & Step Reference

### 1. Retrieval Instructions (`retrieve: []`)

Retrieval instructions execute **concurrently** in Stage 1 to generate candidate pools.

#### `similarity`
Executes vector similarity search against a named embedding store.

```yaml
type: similarity
embedding_ref: string          # Required: Named embedding store in catalog
query_encoder: QueryEncoder    # Required: Instruction producing query vector
where: string | null           # Optional: Prefilter pushed down to index scan
limit: integer                 # Optional: Default 100
name: string | null            # Optional: Diagnostic retrieve bag name
use_exact_search: boolean      # Optional: Default false (exact vs ANN)
```

#### `text_search`
Executes full-text lexical or vector-based text retrieval.

```yaml
type: text_search
input_text_query: string       # Required: Text query string or $parameter ref
mode: SearchMode               # Required: { type: "lexical" } or { type: "vector", ... }
where: string | null           # Optional: Prefilter pushed to search engine
limit: integer                 # Optional: Default 100
name: string | null            # Optional: Diagnostic retrieve bag name
```

#### `column_order`
Retrieves items ordered by static table columns.

```yaml
type: column_order
columns:                       # Required: Ordered list of column specs
  - name: string
    ascending: boolean         # Default true
    nulls_first: boolean       # Default false
where: string | null           # Optional: Prefilter
limit: integer                 # Optional: Default 100
name: string | null
```

#### `filter`
Retrieves items satisfying a standalone SQL predicate.

```yaml
type: filter
where: string                  # Required: Predicate expression
limit: integer                 # Optional: Default 100
name: string | null
```

#### `candidate_ids`
Injects explicit item IDs into the candidate stream.

```yaml
type: candidate_ids
item_ids: list[string] | param # Required: Array of item IDs or parameter reference
limit: integer | null          # Optional: Cap on candidate count
name: string | null
```

---

### 2. Query Encoder Nodes (`query_encoder: {}`)

Encoders produce query embedding representations at evaluation time.

| Encoder Type | Parameters | Operational Semantics |
| :--- | :--- | :--- |
| `precomputed_user` | `input_user_id` | Looks up precomputed user factor vector in catalog embedding table. |
| `precomputed_item` | `input_item_id` | Looks up precomputed item embedding vector in catalog table. |
| `interaction_pooling` | `input_user_id`, `pooling_function`, `truncate_interactions` | Aggregates embedding vectors of user's recent interactions (`mean`/`sum`/`max`). |
| `interaction_round_robin` | `input_user_id`, `num_clusters`, `pooling_function` | Clusters recent interactions to emit multiple candidate search vectors. |
| `user_attribute_pooling` | `input_user_id`, `input_user_features` | Pools features from tabular user attribute profiles. |
| `item_attribute_pooling` | `input_item_id`, `input_item_features` | Pools features from tabular item attribute profiles. |

---

### 3. Filter Instructions (`filter: []`)

Filter instructions execute sequentially in Stage 3 across the merged candidate pool.

#### `expression`
Evaluates in-memory boolean expressions on candidate attributes.
```yaml
type: expression
expression: string             # Required: Boolean expression string (e.g. "price < 50")
name: string | null
```

#### `prebuilt`
Invokes named catalog filter rules (e.g. user interaction history exclusion).
```yaml
type: prebuilt
filter_ref: string             # Required: Named filter in catalog (e.g. "exclude_seen")
input_user_id: string | null
input_item_id: string | null
name: string | null
```

#### `truncate`
Limits total candidate pool size before entering scoring stages.
```yaml
type: truncate
max_length: integer            # Required: Maximum candidate pool size
name: string | null
```

---

### 4. Scoring Instructions (`score: {}` & `computed_columns: []`)

#### `score_ensemble`
Evaluates machine learning models (LightGBM, tree ensembles, value formulas) on candidate features.

```yaml
type: score_ensemble
value_model: string                  # Required: Registered model name in catalog
input_user_id: string | null         # Optional: User ID for user feature lookup
input_user_features: dict | null     # Optional: Explicit user feature dictionary
input_interactions_item_ids: any     # Optional: Interaction history IDs for dynamic features
preserve_order: boolean              # Optional: Default false (sorts descending by score)
output_alias: string | null          # Optional: Output score attribute name
name: string | null
```

#### `computed_column`
Computes derived numerical features or auxiliary model predictions without re-sorting candidates.

```yaml
type: computed_column
value_model: string
output_alias: string
input_user_id: string | null
input_user_features: dict | null
preserve_order: true
```

---

### 5. Reordering Instructions (`reorder: []`)

Reorder instructions modify the candidate ordering in Stage 5.

#### `diversity`
Applies **Maximal Marginal Relevance (MMR)** greedy selection with attribute Jaccard distance.

```yaml
type: diversity
strength: float                      # Default 0.5: Balance between score and diversity penalty
diversity_attributes: list[string]   # Optional: Specific attribute keys for distance calculation
max_diversity_candidates: integer    # Default 1000: Truncation threshold for MMR calculation
diversity_lookback_window: integer   # Default 30: History window for diversity penalty
output_alias: string | null
name: string | null
```

#### `exploration`
Interleaves items from an exploration candidate retriever to promote discovery.

```yaml
type: exploration
strength: float                      # Default 0.5: Ratio of exploration slots to allocate
retriever: RetrieveStep              # Required: Secondary retriever generating exploration pool
output_alias: string | null
name: string | null
```

#### `boosted`
Interleaves promoted or campaign-specific items into the candidate stream.

```yaml
type: boosted
strength: float                      # Default 0.5: Promotion allocation ratio
retriever: RetrieveStep              # Required: Retriever generating promoted items
output_alias: string | null
name: string | null
```

#### `column_sort`
Sorts candidates by static column attributes.

```yaml
type: column_sort
columns:
  - name: string
    ascending: boolean
    nulls_first: boolean
output_alias: string | null
```

---

## Parameter Symbol Resolution

Parameter references within the IR use standard symbol prefixes:
* `$parameter.<name>` or `$param.<name>`: Resolves to named entries in the top-level `parameters` table.
* The lowering phase normalizes all parameter references to `$parameter.<name>`.
* If a parameter is omitted at query execution time, the runtime binds the declared `default` value.
