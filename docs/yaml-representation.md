---
title: YAML & OpenAPI Query Representation
sidebar_label: YAML / OpenAPI IR
slug: /yaml-representation
---

# YAML & OpenAPI Intermediate Representation

RecQL defines a 1:1 bidirectional mapping between human-authored RecQL SQL queries and structured **`RankQueryConfig`** / **`QueryDefinition`** documents.

The structured format is strictly validated against the OpenAPI specification and can be consumed directly by the execution runtime via YAML or JSON.

---

## 1. Top-Level `QueryDefinition` & `RankQueryConfig`

A complete query definition in YAML format consists of parameters and the executable pipeline configuration (`RankQueryConfig`):

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
    - type: similarity
      name: vector_matches
      embedding_ref: content_embedding
      query_encoder:
        type: text_encoder
        text_embedding_ref: content_embedding
        input_text_query: $parameter.query_text
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

## 2. SQL to YAML Step Mapping

The table below summarizes how each SQL clause lowers to OpenAPI IR:

| RecQL SQL Construct | OpenAPI IR Field / Step |
| :--- | :--- |
| `FROM items` / `FROM users` | `from: "item"` / `from: "user"` |
| `FROM retrieve(similarity(...))` | `retrieve: [{ type: "similarity", ... }]` |
| `FROM retrieve(text_search(...))` | `retrieve: [{ type: "text_search", ... }]` |
| `FROM retrieve(column_order(...))` | `retrieve: [{ type: "column_order", ... }]` |
| `FROM retrieve(filter(...))` | `retrieve: [{ type: "filter", ... }]` |
| `FROM retrieve(candidate_ids(...))` | `retrieve: [{ type: "candidate_ids", ... }]` |
| `WHERE <expr>` (top-level) | `filter: [{ type: "expression", expression: "<expr>" }]` |
| `SELECT score(expression='...') AS s` | `score: { type: "score_ensemble", value_model: "...", output_alias: "s" }` |
| `SELECT diversity(...) AS d` | `reorder: [{ type: "diversity", output_alias: "d", ... }]` |
| `SELECT exploration(...) AS e` | `reorder: [{ type: "exploration", output_alias: "e", ... }]` |
| `SELECT boosted(...) AS b` | `reorder: [{ type: "boosted", output_alias: "b", ... }]` |
| `ORDER BY price ASC` | `reorder: [{ type: "column_sort", columns: [{ name: "price", ascending: true }] }]` |
| `LIMIT 20 OFFSET 10` | `limit: 20`, `offset: 10` |

---

## 3. Detailed Step Schemas

### 3.1 Retrieval Steps (`retrieve: []`)

#### Similarity (Vector / ANN)
```yaml
type: similarity
embedding_ref: als # Named embedding store in engine.yaml
query_encoder:
  type: precomputed_user
  input_user_id: $parameter.user_id
where: "release_year >= 1990" # Prefilter pushed to vector index
limit: 100
name: main_als
use_exact_search: false
```

#### Text Search (Lexical & Hybrid)
```yaml
type: text_search
input_text_query: $parameter.query_text
mode:
  type: lexical # Or { type: vector, text_embedding_ref: content_embedding }
  fuzziness_edit_distance: 0
where: "in_stock = true"
limit: 100
name: text_hits
```

#### Column Order (Cold-Start / Popularity)
```yaml
type: column_order
columns:
  - name: popular_rank
    ascending: true
    nulls_first: false
limit: 50
name: popular_pool
```

#### Filter (Attribute / Promo Retrieval)
```yaml
type: filter
where: "JSON_VALUE(attrs, '$.genre') = 'Comedy'"
limit: 40
name: comedy_promo
```

#### Candidate IDs (Specific Selection)
```yaml
type: candidate_ids
item_ids: ["1", "50", "105", "258"] # Or parameter ref: $parameter.curated_ids
limit: 20
name: curated
```

---

### 3.2 Postfilter Steps (`filter: []`)

#### Expression Filter
```yaml
type: expression
expression: "price < 50.0 AND rating >= 4.0"
name: affordable_high_rated
```

#### Prebuilt Personal Filter
```yaml
type: prebuilt
filter_ref: exclude_seen # Named personal filter in engine.yaml
input_user_id: $parameter.user_id
name: exclude_history
```

#### Truncate
```yaml
type: truncate
max_length: 200
name: cap_candidates
```

---

### 3.3 Scoring Step (`score: {}`)

```yaml
type: score_ensemble
value_model: click_through_rate # Name of trained GBDT or value model in engine.yaml
input_user_id: $parameter.user_id
input_user_features:
  age: 28
  country: "US"
input_interactions_item_ids: $parameter.recent_clicks
preserve_order: false # true to compute score without re-sorting
output_alias: predicted_ctr
```

---

### 3.4 Reordering Steps (`reorder: []`)

#### Diversity (MMR)
```yaml
type: diversity
strength: 0.3 # Balance between score (1-strength) and diversity (strength)
diversity_attributes: ["genre", "director"] # Attributes for Jaccard similarity
max_diversity_candidates: 500
diversity_lookback_window: 30
output_alias: div_rank
```

#### Exploration (Novelty Interleaving)
```yaml
type: exploration
strength: 0.2 # 20% of returned slots populated from exploration pool
retriever:
  type: column_order
  columns:
    - name: created_at
      ascending: false
  limit: 50
output_alias: explore_rank
```

#### Boosted (Promo / Sponsored Interleaving)
```yaml
type: boosted
strength: 0.35
retriever:
  type: filter
  where: "JSON_VALUE(attrs, '$.is_promoted') = 'true'"
  limit: 40
output_alias: boosted_rank
```
