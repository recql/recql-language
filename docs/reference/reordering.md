---
title: Reordering Functions Reference
sidebar_label: Reordering
---

# Reordering Functions Reference

Reordering stages run after scoring to optimize business criteria, ensure catalogue diversity, inject exploration candidates, and enforce promotion rules.

---

## 1. `diversity(...)`

Implements **Maximal Marginal Relevance (MMR)** greedy selection to prevent recommendation homogenization (e.g. recommending 10 nearly identical items).

```sql
SELECT 
  score(expression='click_through_rate', input_user_id=$user_id) AS s,
  diversity(
    score=s,
    strength=0.3,
    [diversity_attributes=['genre', 'author']],
    [max_diversity_candidates=1000]
  ) AS d, *
FROM retrieve(...)
ORDER BY d
LIMIT 20;
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `score` | `Expr \| identifier` | **Yes** | — | Base relevance score alias (e.g. `s`). |
| `strength` | `float \| $param` | No | `0.5` | Diversity penalty weight `lambda` in `[0.0, 1.0]`. `0.0` = purely score-based, `1.0` = maximum diversity. |
| `diversity_attributes` | `list[string]` | No | `ALL` | Specific attribute keys used to compute candidate Jaccard distance. If omitted, all attributes are tokenized. |
| `max_diversity_candidates` | `integer` | No | `1000` | Truncation cap for MMR computation. |

### MMR Objective Function
For each candidate $c_i$:
```
MMR(c_i) = (1 - lambda) * rel(c_i) - lambda * max_{s in S} Sim(c_i, s)
```

---

## 2. `exploration(...)`

Interleaves items from an exploration pool into the primary candidate stream to combat "filter bubbles" and surface novel items.

```sql
SELECT 
  score(expression='ctr', input_user_id=$user_id) AS s,
  exploration(
    score=s,
    retriever=column_order(columns=[created_at DESC], limit=50),
    strength=0.2
  ) AS e, *
FROM retrieve(...)
ORDER BY e
LIMIT 20;
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `score` | `Expr \| identifier` | **Yes** | — | Primary score alias. |
| `retriever` | `RetrieverCall` | No | `column_order` | Secondary retriever generating the exploration candidate pool. |
| `strength` | `float \| $param` | No | `0.5` | Ratio of exploration slots to allocate (e.g. `0.2` = 20% of slots). |

---

## 3. `boosted(...)`

Interleaves promoted, sponsored, or campaign-specific items into organic recommendation streams at a configured ratio.

```sql
SELECT 
  score(expression='ctr', input_user_id=$user_id) AS s,
  boosted(
    score=s,
    retriever=filter(where="JSON_VALUE(attrs, '$.is_sponsored') = 'true'", limit=40),
    strength=0.25
  ) AS b, *
FROM retrieve(...)
ORDER BY b
LIMIT 20;
```
