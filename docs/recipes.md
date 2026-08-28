---
title: RecQL Cookbook & Patterns
sidebar_label: Cookbook
slug: /recipes
---

# RecQL Cookbook & Query Patterns

This cookbook provides production-ready query templates for the most common search and recommendation patterns.

---

## 1. Semantic Vector Search

Finds items semantically relevant to an unstructured text prompt using neural dense embeddings.

```sql
SELECT * FROM retrieve(
  similarity(
    embedding_ref='content_embedding',
    encoder=text_encoder(text_embedding_ref='content_embedding'),
    name='semantic_matches',
    limit=50
  )
)
LIMIT 20;
```

---

## 2. Hybrid Search (Lexical BM25 + Vector ANN)

Executes parallel full-text search and vector retrieval, merging candidates into a unified result set.

```sql
SELECT * FROM retrieve(
  text_search(
    input_text_query=$query_text,
    mode=lexical(),
    name='bm25_bag',
    limit=100
  ),
  similarity(
    embedding_ref='content_embedding',
    encoder=text_encoder(text_embedding_ref='content_embedding'),
    name='vector_bag',
    limit=100
  )
)
LIMIT 20;
```

---

## 3. Item-to-Item Similarity (Related Products / Similar Movies)

Uses precomputed collaborative filtering embeddings (e.g. ALS factor vectors) to find similar items based on co-occurrence and implicit feedback.

```sql
SELECT * FROM retrieve(
  similarity(
    embedding_ref='als',
    encoder=precomputed_item(input_item_id=$item_id),
    name='similar_items',
    limit=50
  )
)
LIMIT 20;
```

---

## 4. Personalized "For You" Feed with GBDT Re-ranking

Retrieves candidates via user collaborative filtering embeddings, then scores and re-ranks them using a trained LightGBM CTR model.

```sql
SELECT score(
  expression='click_through_rate',
  input_user_id=$user_id
) AS predicted_ctr, *
FROM retrieve(
  similarity(
    embedding_ref='als',
    encoder=precomputed_user(input_user_id=$user_id),
    limit=100,
    name='user_cf'
  )
)
LIMIT 20;
```

---

## 5. De-biasing & Diversity (Combating Filter Bubbles)

Combines collaborative filtering recommendations with Maximal Marginal Relevance (MMR) diversity and novelty exploration.

```sql
SELECT 
  score(expression='click_through_rate', input_user_id=$user_id) AS s,
  diversity(score=s, strength=0.3) AS d,
  exploration(score=s, strength=0.2) AS e, 
  *
FROM retrieve(
  similarity(
    embedding_ref='als',
    encoder=precomputed_user(input_user_id=$user_id),
    limit=100
  )
)
ORDER BY e
LIMIT 20;
```

---

## 6. Promotional Boosting & Campaign Interleaving

Interleaves sponsored or promotional items (e.g. Comedy specials) into organic user recommendation streams.

```sql
SELECT 
  score(expression='click_through_rate', input_user_id=$user_id) AS s,
  boosted(
    score=s,
    retriever=filter(
      where="JSON_VALUE(attrs, '$.genre') = 'Comedy'",
      limit=40,
      name='comedy_boost'
    ),
    strength=0.35
  ) AS r, 
  *
FROM retrieve(
  similarity(
    embedding_ref='als',
    encoder=precomputed_user(input_user_id=$user_id),
    limit=100
  )
)
ORDER BY r
LIMIT 20;
```

---

## 7. Faceted Search with In-Memory Array Filtering

Queries vector similarity while applying array facet constraints on multi-valued categories.

```sql
SELECT * FROM retrieve(
  similarity(
    embedding_ref='content_embedding',
    encoder=precomputed_item(input_item_id=$reference_item_id),
    name='similar',
    limit=200
  )
)
WHERE array_has(genres, $genre)
ORDER BY score(expression='click_through_rate', input_user_id=$user_id)
LIMIT 20;
```

---

## 8. Stateful Cursor Pagination

Excludes items already seen in prior pages using persistent key-value tracking (`pagination_key`).

```sql
SELECT * FROM retrieve(
  column_order(
    columns=[popular_rank ASC],
    limit=50
  )
)
LIMIT 10;
```
*(When executed with `--pagination-key <session_id>`, returned IDs are remembered and automatically excluded from subsequent calls).*
