---
title: Scoring & ML Models Reference
sidebar_label: Scoring & Models
---

# Scoring & ML Models Reference

RecQL allows ranking candidates using machine learning models (Gradient Boosted Trees / LightGBM, tree ensembles, neural models) or mathematical expressions.

---

## 1. `score(...)`

Evaluates a machine learning value model on the merged candidate pool.

```sql
SELECT score(
  expression='click_through_rate',
  input_user_id=$user_id,
  [input_user_features=$user_features],
  [input_interactions_item_ids=$recent_clicks],
  [preserve_order=false]
) AS ctr_score, *
FROM retrieve(...)
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `expression` / `value_model` | `string` | **Yes** | — | Name of the registered model in `engine.yaml` (e.g. LightGBM binary blob). |
| `input_user_id` | `string \| $param` | No | `NULL` | ID of the target user for user feature resolution. |
| `input_user_features` | `object \| $param` | No | `NULL` | Inline or parameterized user feature dictionary. |
| `input_interactions_item_ids`| `list[string] \| $param`| No | `NULL` | Recent interaction item IDs for dynamic feature generation. |
| `preserve_order` | `boolean` | No | `false` | If `false`, candidates are re-sorted descending by score. |

---

## 2. Feature Extraction & GBDT Inference

When `score(expression='model_name')` executes:
1. The engine extracts candidate attributes (`popular_rank`, `price`, category features).
2. Lookups user profile features and interaction embeddings if required by the feature spec.
3. Feeds feature vectors into the compiled GBDT model (e.g. `LightGBM Booster`).
4. Attaches the resulting inference probabilities to each candidate's attribute set under the specified alias.

---

## 3. `computed_column(...)`

Computes derived mathematical features or model outputs without altering the default candidate sort order.

```sql
SELECT computed_column(
  value_model='conversion_rate',
  input_user_id=$user_id,
  preserve_order=true
) AS cvr_score, *
FROM retrieve(...)
```
