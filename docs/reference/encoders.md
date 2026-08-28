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

## 3. `interaction_pooling(...)`

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

## 4. `interaction_round_robin(...)`

Clusters recent interaction item embeddings into $k$ distinct interest clusters to generate multiple candidate queries for multi-interest users.

```sql
interaction_round_robin(
  input_user_id=$user_id,
  [pooling_function='mean'],
  [num_clusters=5]
)
```

---

## 5. `user_attribute_pooling(...)` & `item_attribute_pooling(...)`

Computes query representations from tabular attribute dictionaries or profile features.

```sql
user_attribute_pooling(
  input_user_id=$user_id,
  input_user_features=$features
)
```
