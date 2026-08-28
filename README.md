# RecQL Language Specification & Documentation (`docs.recql.io`)

This repository contains the formal specification, EBNF grammar, OpenAPI intermediate representation, execution semantics, and reference documentation for **RecQL (Recommender Query Language)**.

It is built with [Docusaurus](https://docusaurus.io/) and deployed to **[docs.recql.io](https://docs.recql.io)**.

---

## Contents

- **Language Overview & Execution Semantics**: Detailed stage-by-stage pipeline execution lifecycle (Parallel Retrieve -> Deduplicate/Merge -> Postfilter -> ML Scoring -> Reorder -> Slicing).
- **Formal EBNF Grammar**: Normative grammar specifying concrete statement syntax and OpenAPI-aligned function signatures with explicit parameter names for retrievers, encoders, scorers, and reorderers.
- **YAML / OpenAPI Intermediate Representation**: Complete schema and 1:1 mapping between RecQL statements and executable `RankQueryConfig` / `QueryDefinition` documents.
- **Function & Pipeline Reference**:
  - Retrievers (`similarity`, `text_search`, `column_order`, `filter`, `candidate_ids`, `candidate_attributes`)
  - Query Encoders (`precomputed_user`, `precomputed_item`, `text_encoder`, `interaction_pooling`, `interaction_round_robin`, `user_attribute_pooling`)
  - Scoring Models (GBDT / LightGBM, `score`, `computed_column`)
  - Reorderers (`diversity`, `exploration`, `boosted`, `column_sort`)
  - Built-in Expressions & Predicates (`array_has`, `array_has_any`, `array_has_all`, `rrf`, `JSON_VALUE`)
- **Cookbook & Query Recipes**: Production query templates for Semantic Search, Hybrid Search, Item-to-Item CF, Personalized Feeds, Promo Boosting, and Filter Bubble mitigation.

---

## Local Development

### Prerequisites

- Node.js >= 18
- npm

### Installation & Build

```bash
# Install dependencies
npm install

# Start local development server (with live reload)
npm start

# Build static website for production
npm run build

# Serve the production build locally
npm run serve
```

---

## Related Repositories

- [recql-python-core](https://github.com/recql/recql-python-core): Core pure-Python RecQL parser, AST, lower to OpenAPI IR, and engine runtime.
- [recql-playground](https://github.com/recql/recql-playground): Interactive multi-database demo playground, menu CLI, and example suite.
- [recql-python-postgres](https://github.com/recql/recql-python-postgres): PostgreSQL + pgvector + pg_trgm backend plugin.
- [recql-python-mssql](https://github.com/recql/recql-python-mssql): Microsoft SQL Server 2025 backend plugin.
- [recql-python-oracle](https://github.com/recql/recql-python-oracle): Oracle 23ai backend plugin.
- [recql-python-mongodb](https://github.com/recql/recql-python-mongodb): MongoDB Atlas & Community backend plugin.
- [recql-python-mariadb](https://github.com/recql/recql-python-mariadb): MariaDB backend plugin.
