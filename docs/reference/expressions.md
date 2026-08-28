---
title: Expressions & Built-in Functions Reference
sidebar_label: Expressions & Functions
---

# Expressions & Built-in Functions Reference

RecQL includes built-in expression evaluators and functions available in `WHERE` postfilters, computed columns, and ranking formulas.

---

## 1. Array & Set Functions

### `array_has(array_column, element)`
Returns `true` if `array_column` contains `element`.

```sql
WHERE array_has(genres, 'Animation')
WHERE array_has(tags, $target_tag)
```

### `array_has_any(array_column, elements_array)`
Returns `true` if `array_column` intersects with `elements_array`.

```sql
WHERE array_has_any(genres, ['Action', 'Sci-Fi'])
```

### `array_has_all(array_column, elements_array)`
Returns `true` if `array_column` contains every element in `elements_array`.

```sql
WHERE array_has_all(features, ['4K', 'HDR', 'Dolby Atmos'])
```

---

## 2. Fusion & Ranking Functions

### `rrf(rank1, rank2, [k=60])`
Computes **Reciprocal Rank Fusion** score across multiple retrieval bags:
```
RRF(d) = sum_{m in M} (1 / (k + r_m(d)))
```

```sql
SELECT rrf(bm25_rank, vector_rank, 60) AS hybrid_score, *
FROM retrieve(...)
ORDER BY hybrid_score DESC
```

---

## 3. SQL/JSON Path Extraction

### `JSON_VALUE(json_column, path)`
Standard SQL/JSON expression to extract scalar values from JSON document attributes.

```sql
WHERE JSON_VALUE(attrs, '$.genre') = 'Comedy'
WHERE CAST(JSON_VALUE(attrs, '$.release_year') AS INTEGER) >= 2000
```

---

## 4. Standard Operators

| Category | Operators | Examples |
| :--- | :--- | :--- |
| **Comparison** | `=`, `!=`, `<>`, `<`, `<=`, `>`, `>=` | `price <= 49.99` |
| **Logical** | `AND`, `OR`, `NOT` | `in_stock AND NOT is_discontinued` |
| **Membership** | `IN (...)`, `NOT IN (...)` | `status IN ('active', 'featured')` |
| **Pattern Matching** | `LIKE`, `ILIKE` | `title ILIKE '%star wars%'` |
| **Range** | `BETWEEN ... AND ...` | `rating BETWEEN 4.0 AND 5.0` |
| **Null Checks** | `IS NULL`, `IS NOT NULL` | `discount_code IS NOT NULL` |
| **Arithmetic** | `+`, `-`, `*`, `/`, `%`, `**` | `base_price * (1.0 - discount)` |
| **Conditional** | `CASE WHEN ... THEN ... ELSE ... END` | `CASE WHEN is_member THEN price * 0.9 ELSE price END` |
