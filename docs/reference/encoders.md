---
title: Query Encoders Reference
sidebar_label: Encoders
---

# Query Encoders Reference

Query encoders produce dense or sparse vector representations at query time to drive `similarity(...)` retrieval.

---

## 1. `precomputed_user(...)`

Retrieves a pre-trained user embedding vector from the designated embedding table (e.g. Collaborative Filtering / ALS factor matrix).

```sql
precomputed_user(input_user_id=$user_id)
```

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `input_user_id` | `string \| $param` | **Yes** | ID of the user whose embedding vector should be looked up. |

---

## 2. `precomputed_item(...)`

Retrieves a precomputed item embedding vector (used for item-to-item similarity recommendations).

```sql
precomputed_item(input_item_id=$item_id)
```

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `input_item_id` | `string \| $param` | **Yes** | ID of the seed item. |

---

## 3. `text_encoder(...)`

Encodes an incoming text query string into a dense embedding vector in real time using a HuggingFace / SentenceTransformer model (e.g. `all-MiniLM-L6-v2`).

```sql
text_encoder(
  text_embedding_ref='content_embedding',
  [use_exact_search=false]
)
```

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `text_embedding_ref` | `string` | **Yes** | — | Embedding store name configured in `engine.yaml`. |
| `use_exact_search` | `boolean` | No | `false` | Whether to perform exact brute-force scan. |

---

## 4. `interaction_pooling(...)`

Dynamically pools the embedding vectors of items the user has recently interacted with into a composite user representation.

```sql
interaction_pooling(
  input_user_id=$user_id,
  [pooling_function='mean'],
  [truncate_interactions=10]
)
```

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `input_user_id` | `string \| $param` | **Yes** | — | User ID. |
| `pooling_function` | `string` | No | `'mean'` | Reduction function: `'mean'`, `'sum'`, or `'max'`. |
| `truncate_interactions` | `integer` | No | `10` | Maximum number of recent interaction item vectors to pool. |

---

## 5. `interaction_round_robin(...)`

Clusters recent interaction item embeddings into $k$ distinct interest clusters to generate multiple candidate queries for multi-interest users.

```sql
interaction_round_robin(
  input_user_id=$user_id,
  [pooling_function='mean'],
  [num_clusters=5]
)
```

---

## 6. `user_attribute_pooling(...)` & `item_attribute_pooling(...)`

Computes query representations from tabular attribute dictionaries or profile features.

```sql
user_attribute_pooling(
  input_user_id=$user_id,
  input_user_features=$features
)
```
