---
title: RecQL Cookbook & Patterns
sidebar_label: Cookbook
slug: /recipes
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# RecQL Cookbook & Query Patterns

This cookbook provides production-ready query templates for the most common search and recommendation patterns. Each recipe is shown in both high-level **RecQL SQL syntax** and its canonical **Intermediate Representation (IR)** in YAML format.

---

## 1. Semantic Vector Search

Finds items semantically relevant to an unstructured text prompt using neural dense embeddings (e.g., SentenceTransformers / MiniLM).

<Tabs>
<TabItem value="sql" label="RecQL (SQL)" default>

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

</TabItem>
<TabItem value="yaml" label="IR (YAML)">

```yaml
parameters:
  query_text:
    type: string
    default: "space exploration sci-fi"

query:
  from: item
  type: rank
  retrieve:
    - type: similarity
      name: semantic_matches
      embedding_ref: content_embedding
      query_encoder:
        type: text_encoder
        text_embedding_ref: content_embedding
        input_text_query: $parameter.query_text
      limit: 50
  limit: 20
```

</TabItem>
</Tabs>

---

## 2. Hybrid Search (Lexical BM25 + Vector ANN)

Executes parallel full-text search and vector retrieval, merging candidates into a unified result set with deterministic priority.

<Tabs>
<TabItem value="sql" label="RecQL (SQL)" default>

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

</TabItem>
<TabItem value="yaml" label="IR (YAML)">

```yaml
parameters:
  query_text:
    type: string
    default: "star wars adventure"

query:
  from: item
  type: rank
  retrieve:
    - type: text_search
      name: bm25_bag
      input_text_query: $parameter.query_text
      mode:
        type: lexical
        fuzziness_edit_distance: 0
      limit: 100
    - type: similarity
      name: vector_bag
      embedding_ref: content_embedding
      query_encoder:
        type: text_encoder
        text_embedding_ref: content_embedding
        input_text_query: $parameter.query_text
      limit: 100
  limit: 20
```

</TabItem>
</Tabs>

---

## 3. Item-to-Item Similarity (Related Products / Similar Movies)

Uses precomputed collaborative filtering embeddings (e.g. ALS factor vectors) to find similar items based on co-occurrence and implicit feedback.

<Tabs>
<TabItem value="sql" label="RecQL (SQL)" default>

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

</TabItem>
<TabItem value="yaml" label="IR (YAML)">

```yaml
parameters:
  item_id:
    type: string
    default: "1"

query:
  from: item
  type: rank
  retrieve:
    - type: similarity
      name: similar_items
      embedding_ref: als
      query_encoder:
        type: precomputed_item
        input_item_id: $parameter.item_id
      limit: 50
  limit: 20
```

</TabItem>
</Tabs>

---

## 4. Personalized "For You" Feed with GBDT Re-ranking

Retrieves candidates via user collaborative filtering embeddings, then scores and re-ranks them using a trained LightGBM CTR model.

<Tabs>
<TabItem value="sql" label="RecQL (SQL)" default>

```sql
SELECT score(
  expression='click_through_rate',
  input_user_id=$user_id
) AS predicted_ctr, *
FROM retrieve(
  similarity(
    embedding_ref='als',
    encoder=precomputed_user(input_user_id=$user_id),
    name='user_cf',
    limit=100
  )
)
LIMIT 20;
```

</TabItem>
<TabItem value="yaml" label="IR (YAML)">

```yaml
parameters:
  user_id:
    type: string
    default: "42"

query:
  from: item
  type: rank
  retrieve:
    - type: similarity
      name: user_cf
      embedding_ref: als
      query_encoder:
        type: precomputed_user
        input_user_id: $parameter.user_id
      limit: 100
  score:
    type: score_ensemble
    value_model: click_through_rate
    input_user_id: $parameter.user_id
    output_alias: predicted_ctr
    preserve_order: false
  limit: 20
```

</TabItem>
</Tabs>

---

## 5. De-biasing & Diversity (Combating Filter Bubbles)

Combines collaborative filtering recommendations with Maximal Marginal Relevance (MMR) diversity and novelty exploration.

<Tabs>
<TabItem value="sql" label="RecQL (SQL)" default>

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

</TabItem>
<TabItem value="yaml" label="IR (YAML)">

```yaml
parameters:
  user_id:
    type: string
    default: "42"

query:
  from: item
  type: rank
  retrieve:
    - type: similarity
      embedding_ref: als
      query_encoder:
        type: precomputed_user
        input_user_id: $parameter.user_id
      limit: 100
  score:
    type: score_ensemble
    value_model: click_through_rate
    input_user_id: $parameter.user_id
    output_alias: s
  reorder:
    - type: diversity
      strength: 0.3
      output_alias: d
    - type: exploration
      strength: 0.2
      output_alias: e
  limit: 20
```

</TabItem>
</Tabs>

---

## 6. Promotional Boosting & Campaign Interleaving

Interleaves sponsored or promotional items (e.g. Comedy specials) into organic user recommendation streams.

<Tabs>
<TabItem value="sql" label="RecQL (SQL)" default>

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

</TabItem>
<TabItem value="yaml" label="IR (YAML)">

```yaml
parameters:
  user_id:
    type: string
    default: "42"

query:
  from: item
  type: rank
  retrieve:
    - type: similarity
      embedding_ref: als
      query_encoder:
        type: precomputed_user
        input_user_id: $parameter.user_id
      limit: 100
  score:
    type: score_ensemble
    value_model: click_through_rate
    input_user_id: $parameter.user_id
    output_alias: s
  reorder:
    - type: boosted
      strength: 0.35
      output_alias: r
      retriever:
        type: filter
        name: comedy_boost
        where: "JSON_VALUE(attrs, '$.genre') = 'Comedy'"
        limit: 40
  limit: 20
```

</TabItem>
</Tabs>

---

## 7. Faceted Search with In-Memory Postfiltering

Queries vector similarity while applying array facet constraints on multi-valued categories.

<Tabs>
<TabItem value="sql" label="RecQL (SQL)" default>

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

</TabItem>
<TabItem value="yaml" label="IR (YAML)">

```yaml
parameters:
  reference_item_id:
    type: string
    default: "1"
  genre:
    type: string
    default: "Animation"
  user_id:
    type: string
    default: "42"

query:
  from: item
  type: rank
  retrieve:
    - type: similarity
      name: similar
      embedding_ref: content_embedding
      query_encoder:
        type: precomputed_item
        input_item_id: $parameter.reference_item_id
      limit: 200
  filter:
    - type: expression
      expression: "array_has(genres, $parameter.genre)"
  score:
    type: score_ensemble
    value_model: click_through_rate
    input_user_id: $parameter.user_id
  limit: 20
```

</TabItem>
</Tabs>

---

## 8. Stateful Cursor Pagination

Excludes items already seen in prior pages using persistent key-value tracking (`pagination_key`).

<Tabs>
<TabItem value="sql" label="RecQL (SQL)" default>

```sql
SELECT * FROM retrieve(
  column_order(
    columns=[popular_rank ASC],
    limit=50
  )
)
LIMIT 10;
```

</TabItem>
<TabItem value="yaml" label="IR (YAML)">

```yaml
query:
  from: item
  type: rank
  retrieve:
    - type: column_order
      columns:
        - name: popular_rank
          ascending: true
          nulls_first: false
      limit: 50
  limit: 10
```

</TabItem>
</Tabs>
*(When executed with `--pagination-key <session_id>`, returned IDs are remembered and automatically excluded from subsequent calls).*
