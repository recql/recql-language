---
title: Retrievers Reference
sidebar_label: Retrievers
---

# Retrievers Reference

Retrievers generate initial candidate items from storage engines, vector indexes, full-text catalogs, and recommendation embeddings. All retrievers specified in a `FROM retrieve(...)` block execute concurrently.

---

## 1. `similarity(...)`

Performs nearest-neighbor vector similarity search (Exact or Approximate Nearest Neighbor / ANN) against a configured embedding store.

```sql
similarity(
  embedding_ref='als',
  encoder=precomputed_user(input_user_id=$user_id),
  [where='...'],
  [limit=100],
  [name='main_similarity'],
  [use_exact_search=false]
)
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `embedding_ref` | `string` | **Yes** | — | Name of the embedding store configured in `engine.yaml`. |
| `encoder` | `QueryEncoder` | **Yes** | — | The encoder function used to produce the query vector (e.g. `precomputed_user`, `precomputed_item`, `interaction_pooling`). |
| `where` | `Expr \| string` | No | `NULL` | Prefilter predicate pushed down to the vector index scan. |
| `limit` | `integer` | No | `100` | Maximum candidate count to retrieve from this index. |
| `name` | `string` | No | `'similarity'` | Identifier for this retrieve bag in diagnostics and merge logs. |
| `use_exact_search` | `boolean` | No | `false` | If `true`, bypasses ANN index (HNSW / IVF) to perform flat exact distance scan. |

---

## 2. `text_search(...)`

Performs full-text lexical or vector-based search on catalog text.

```sql
text_search(
  input_text_query=$query_text,
  mode=lexical(fuzziness_edit_distance=0),
  [where='...'],
  [limit=100],
  [name='keyword_search']
)
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `input_text_query` | `string` | **Yes** | — | Search string query. |
| `mode` | `SearchMode` | **Yes** | `lexical()` | `lexical([fuzziness_edit_distance])` for BM25 / FTS, or `vector(text_embedding_ref=...)` for semantic search. |
| `where` | `Expr \| string` | No | `NULL` | Prefilter predicate pushed to full-text search index scan. |
| `limit` | `integer` | No | `100` | Maximum candidate count. |
| `name` | `string` | No | `'text_search'` | Retrieve bag identifier. |

---

## 3. `column_order(...)`

Retrieves candidates ordered by static database columns (e.g. popular items, newest releases, highest rated).

```sql
column_order(
  columns=[popular_rank ASC, release_date DESC],
  [where='...'],
  [limit=50],
  [name='trending_pool']
)
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `columns` | `list[ColumnSpec] \| string` | **Yes** | — | List of columns and directions: `[col ASC|DESC NULLS FIRST|LAST]`. |
| `where` | `Expr \| string` | No | `NULL` | Prefilter predicate. |
| `limit` | `integer` | No | `100` | Maximum candidate count. |
| `name` | `string` | No | `'column_order'` | Retrieve bag identifier. |

---

## 4. `filter(...)`

Retrieves items matching a specific attribute predicate (frequently used to generate exploration or promotion bags for `boosted` / `exploration`).

```sql
filter(
  where="JSON_VALUE(attrs, '$.genre') = 'Comedy'",
  [limit=40],
  [name='promo_bag']
)
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `where` | `Expr \| string` | **Yes** | — | Attribute condition for candidate generation. |
| `limit` | `integer` | No | `100` | Maximum candidate count. |
| `name` | `string` | No | `'filter'` | Retrieve bag identifier. |

---

## 5. `candidate_ids(...)`

Selects an explicit list of item IDs (e.g., editorial selections, basket items, or client-supplied candidate IDs).

```sql
candidate_ids(
  item_ids=['101', '102', '103'],
  [limit=20],
  [name='pinned_items']
)
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `item_ids` | `list[string] \| $param` | **Yes** | — | List of item ID strings or parameter reference. |
| `limit` | `integer` | No | `NULL` | Maximum candidates to keep. |
| `name` | `string` | No | `'candidate_ids'` | Retrieve bag identifier. |

---

## 6. `candidate_attributes(...)`

Injects inline candidate items with client-provided attribute dictionaries directly into the ranking pipeline.

```sql
candidate_attributes(
  item_attributes=$dynamic_candidates,
  [limit=50],
  [name='ad_hoc_candidates']
)
```
