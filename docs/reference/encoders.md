---
title: Query Encoders Reference
sidebar_label: Encoders
---

# Query Encoders Reference

Query encoders produce dense or sparse vector representations at query time to drive `similarity(...)` retrieval.

Encoders are specified **inside** the `similarity(...)` retriever call:
* Via the `encoder` argument: e.g. `similarity(..., encoder='interaction_pooling', input_user_id=$user_id)` or `similarity(..., encoder=interaction_pooling(input_user_id=$user_id))`
* Or by passing the encoder input parameters directly: e.g. `similarity(..., input_user_id=$user_id)` (defaults to `precomputed_user`).

---

## 1. `precomputed_user`

Retrieves a pre-computed user embedding vector from the designated embedding store (e.g. Collaborative Filtering / ALS factor matrix).

### Usage in RecQL

```sql
-- Direct parameters:
similarity(embedding_ref='als', input_user_id=$user_id, limit=100)

-- Or with explicit encoder specification:
similarity(
  embedding_ref='als',
  encoder=precomputed_user(input_user_id=$user_id),
  limit=100
)
```

### Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `input_user_id` | `string \| $param` | **Yes** | ID of the user whose embedding vector should be looked up. |

---

## 2. `precomputed_item`

Retrieves a precomputed item embedding vector (used for item-to-item similarity recommendations).

### Usage in RecQL

```sql
-- Direct parameters:
similarity(embedding_ref='als', input_item_id=$item_id, limit=100)

-- Or with explicit encoder specification:
similarity(
  embedding_ref='als',
  encoder=precomputed_item(input_item_id=$item_id),
  limit=100
)
```

### Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `input_item_id` | `string \| $param` | **Yes** | ID of the seed item. |

---

## 3. `interaction_pooling`

Dynamically pools the embedding vectors of items the user has recently interacted with into a composite user representation.

### Usage in RecQL

```sql
similarity(
  embedding_ref='als',
  encoder=interaction_pooling(
    input_user_id=$user_id,
    pooling_function='mean',
    truncate_interactions=10
  ),
  limit=100
)
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `input_user_id` | `string \| $param` | **Yes** | — | User ID whose recent interactions should be fetched. |
| `pooling_function` | `string` | No | `'mean'` | Reduction function: `'mean'`, `'sum'`, `'max'`, or `'min'`. |
| `truncate_interactions` | `integer` | No | `10` | Maximum number of recent interaction item vectors to pool. |

---

## 4. `interaction_round_robin`

Clusters recent interaction item embeddings into $k$ distinct interest clusters to generate multiple candidate queries for multi-interest users.

### Usage in RecQL

```sql
similarity(
  embedding_ref='als',
  encoder=interaction_round_robin(
    input_user_id=$user_id,
    pooling_function='mean',
    num_clusters=5
  ),
  limit=100
)
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `input_user_id` | `string \| $param` | **Yes** | — | User ID. |
| `pooling_function` | `string` | No | `'mean'` | Reduction function: `'mean'`, `'sum'`, or `'max'`. |
| `num_clusters` | `integer` | No | `5` | Number of distinct interest clusters to construct. |

---

## 5. `user_attribute_pooling` & `item_attribute_pooling`

Computes query representations from tabular attribute dictionaries or profile features.

### Usage in RecQL

```sql
similarity(
  embedding_ref='content_embedding',
  encoder=user_attribute_pooling(
    input_user_id=$user_id,
    input_user_features=$features
  ),
  limit=100
)
```
