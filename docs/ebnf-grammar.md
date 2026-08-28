---
title: Formal EBNF Grammar
sidebar_label: EBNF Grammar
slug: /ebnf-grammar
---

# Formal EBNF Grammar Specification

This document provides the formal **Extended Backus-Naur Form (EBNF)** specification for RecQL.

Unlike generic SQL grammars that treat function calls as arbitrary identifier-value lists, this grammar is aligned with the **OpenAPI / YAML Query Definition** schema. Function productions explicitly enumerate the exact supported named parameters for retrievers, query encoders, scorers, and reorderers.

---

## 1. Statement Level Grammar

```ebnf
(* =========================================================================== *)
(* RecQL Statement Level Grammar                                              *)
(* =========================================================================== *)

query                 ::= select_stmt [ ';' ] EOF

select_stmt           ::= [ with_clause ]
                          'SELECT' select_list
                          [ 'FROM' from_clause ]
                          [ 'WHERE' expr ]
                          [ 'ORDER' 'BY' order_list ]
                          [ 'REORDER' 'BY' reorder_list ]
                          [ 'LIMIT'  limit_value ]
                          [ 'OFFSET' offset_value ]

with_clause           ::= 'WITH' identifier 'AS' '(' select_stmt ')'

select_list           ::= select_item { ',' select_item }
select_item           ::= '*'
                        | expr [ 'AS' identifier ]

from_clause           ::= from_source { ',' from_source }
from_source           ::= [ ns_prefix ] 'retrieve' '(' retriever_list ')'
                        | [ ns_prefix ] retriever_call
                        | table_ref

ns_prefix             ::= 'engine' '.' identifier '.'

table_ref             ::= 'data' '.' identifier { '.' identifier }
                        | 'engine' '.' identifier '.' ( 'items' | 'users' | 'interactions' )
                        | 'items' | 'users' | 'interactions'
                        | identifier

order_list            ::= order_item { ',' order_item }
order_item            ::= order_key [ 'ASC' | 'DESC' ] [ 'NULLS' ( 'FIRST' | 'LAST' ) ]
order_key             ::= identifier
                        | score_call
                        | reorder_call

reorder_list          ::= reorder_call { ',' reorder_call }

limit_value           ::= INTEGER | param
offset_value          ::= INTEGER | param
param                 ::= '$' identifier [ '.' identifier ]
```

---

## 2. Retriever Function Calls (Aligned with OpenAPI IR)

```ebnf
(* =========================================================================== *)
(* Retriever Function Definitions                                              *)
(* =========================================================================== *)

retriever_list        ::= retriever_call { ',' retriever_call }

retriever_call        ::= similarity_call
                        | text_search_call
                        | column_order_call
                        | filter_call
                        | candidate_ids_call
                        | candidate_attributes_call

(* --------------------------------------------------------------------------- *)
(* 1. similarity(...)                                                          *)
(* --------------------------------------------------------------------------- *)
similarity_call       ::= 'similarity' '(' similarity_arg_list ')'

similarity_arg_list   ::= similarity_arg { ',' similarity_arg }
similarity_arg        ::= 'embedding_ref' '=' ( string_literal | param )
                        | ( 'encoder' | 'query_encoder' ) '=' encoder_call
                        | 'where' '=' ( predicate_expr | string_literal )
                        | 'limit' '=' ( INTEGER | param )
                        | 'name' '=' ( string_literal | identifier )
                        | 'use_exact_search' '=' ( BOOLEAN | param )

(* --------------------------------------------------------------------------- *)
(* 2. text_search(...)                                                         *)
(* --------------------------------------------------------------------------- *)
text_search_call      ::= 'text_search' '(' text_search_arg_list ')'

text_search_arg_list  ::= text_search_arg { ',' text_search_arg }
text_search_arg       ::= 'input_text_query' '=' ( string_literal | param )
                        | 'mode' '=' search_mode_call
                        | 'where' '=' ( predicate_expr | string_literal )
                        | 'limit' '=' ( INTEGER | param )
                        | 'name' '=' ( string_literal | identifier )

(* --------------------------------------------------------------------------- *)
(* 3. column_order(...)                                                        *)
(* --------------------------------------------------------------------------- *)
column_order_call     ::= 'column_order' '(' column_order_arg_list ')'

column_order_arg_list ::= column_order_arg { ',' column_order_arg }
column_order_arg      ::= 'columns' '=' ( column_spec_list | string_literal )
                        | 'where' '=' ( predicate_expr | string_literal )
                        | 'limit' '=' ( INTEGER | param )
                        | 'name' '=' ( string_literal | identifier )

column_spec_list      ::= '[' column_spec { ',' column_spec } ']'
column_spec           ::= identifier [ 'ASC' | 'DESC' ] [ 'NULLS' ( 'FIRST' | 'LAST' ) ]

(* --------------------------------------------------------------------------- *)
(* 4. filter(...)                                                              *)
(* --------------------------------------------------------------------------- *)
filter_call           ::= 'filter' '(' filter_arg_list ')'

filter_arg_list       ::= filter_arg { ',' filter_arg }
filter_arg            ::= 'where' '=' ( predicate_expr | string_literal )
                        | 'limit' '=' ( INTEGER | param )
                        | 'name' '=' ( string_literal | identifier )

(* --------------------------------------------------------------------------- *)
(* 5. candidate_ids(...)                                                       *)
(* --------------------------------------------------------------------------- *)
candidate_ids_call    ::= 'candidate_ids' '(' candidate_ids_arg_list ')'

candidate_ids_arg_list ::= candidate_ids_arg { ',' candidate_ids_arg }
candidate_ids_arg     ::= ( 'item_ids' | 'ids' ) '=' ( array_literal | param )
                        | 'limit' '=' ( INTEGER | param )
                        | 'name' '=' ( string_literal | identifier )

(* --------------------------------------------------------------------------- *)
(* 6. candidate_attributes(...)                                                *)
(* --------------------------------------------------------------------------- *)
candidate_attributes_call ::= 'candidate_attributes' '(' candidate_attributes_arg_list ')'

candidate_attributes_arg_list ::= candidate_attributes_arg { ',' candidate_attributes_arg }
candidate_attributes_arg      ::= 'item_attributes' '=' ( array_literal | param )
                                | 'limit' '=' ( INTEGER | param )
                                | 'name' '=' ( string_literal | identifier )
```

---

## 3. Query Encoders & Search Modes

```ebnf
(* =========================================================================== *)
(* Query Encoders (for similarity)                                             *)
(* =========================================================================== *)

encoder_call          ::= precomputed_user_call
                        | precomputed_item_call
                        | interaction_pooling_call
                        | interaction_round_robin_call
                        | user_attribute_pooling_call
                        | item_attribute_pooling_call
                        | text_encoder_call

precomputed_user_call ::= 'precomputed_user' '(' 'input_user_id' '=' ( string_literal | param ) ')'
                        | 'precomputed_user' '(' ( string_literal | param ) ')'

precomputed_item_call ::= 'precomputed_item' '(' 'input_item_id' '=' ( string_literal | param ) ')'
                        | 'precomputed_item' '(' ( string_literal | param ) ')'

interaction_pooling_call ::= 'interaction_pooling' '(' interaction_pooling_arg_list ')'
interaction_pooling_arg_list ::= interaction_pooling_arg { ',' interaction_pooling_arg }
interaction_pooling_arg  ::= 'input_user_id' '=' ( string_literal | param )
                           | 'pooling_function' '=' ( string_literal | 'mean' | 'sum' | 'max' )
                           | 'truncate_interactions' '=' ( INTEGER | param )

interaction_round_robin_call ::= 'interaction_round_robin' '(' interaction_rr_arg_list ')'
interaction_rr_arg_list      ::= interaction_rr_arg { ',' interaction_rr_arg }
interaction_rr_arg           ::= 'input_user_id' '=' ( string_literal | param )
                               | 'pooling_function' '=' ( string_literal | 'mean' | 'sum' | 'max' )
                               | 'num_clusters' '=' ( INTEGER | param )

user_attribute_pooling_call  ::= 'user_attribute_pooling' '(' user_attr_pooling_arg_list ')'
user_attr_pooling_arg_list   ::= user_attr_pooling_arg { ',' user_attr_pooling_arg }
user_attr_pooling_arg        ::= 'input_user_id' '=' ( string_literal | param )
                               | 'input_user_features' '=' ( object_literal | param )

item_attribute_pooling_call  ::= 'item_attribute_pooling' '(' item_attr_pooling_arg_list ')'
item_attr_pooling_arg_list   ::= item_attr_pooling_arg { ',' item_attr_pooling_arg }
item_attr_pooling_arg        ::= 'input_item_id' '=' ( string_literal | param )
                               | 'input_item_features' '=' ( object_literal | param )

text_encoder_call            ::= 'text_encoder' '(' text_encoder_arg_list ')'
text_encoder_arg_list        ::= text_encoder_arg { ',' text_encoder_arg }
text_encoder_arg             ::= 'text_embedding_ref' '=' ( string_literal | param )
                               | 'use_exact_search' '=' ( BOOLEAN | param )

(* =========================================================================== *)
(* Search Modes (for text_search)                                              *)
(* =========================================================================== *)

search_mode_call      ::= lexical_mode_call
                        | vector_mode_call

lexical_mode_call     ::= 'lexical' '(' [ 'fuzziness_edit_distance' '=' ( INTEGER | param ) ] ')'
                        | 'lexical'

vector_mode_call      ::= 'vector' '(' vector_mode_arg_list ')'
vector_mode_arg_list  ::= vector_mode_arg { ',' vector_mode_arg }
vector_mode_arg       ::= 'text_embedding_ref' '=' ( string_literal | param )
                        | 'use_exact_search' '=' ( BOOLEAN | param )
```

---

## 4. Scoring & Computed Columns

```ebnf
(* =========================================================================== *)
(* Scoring & Computed Columns                                                 *)
(* =========================================================================== *)

score_call            ::= 'score' '(' score_arg_list ')'
                        | 'computed_column' '(' score_arg_list ')'

score_arg_list        ::= score_arg { ',' score_arg }
score_arg             ::= ( 'expression' | 'value_model' ) '=' ( string_literal | identifier )
                        | 'input_user_id' '=' ( string_literal | param )
                        | 'input_user_features' '=' ( object_literal | param )
                        | 'input_interactions_item_ids' '=' ( array_literal | param )
                        | 'preserve_order' '=' ( BOOLEAN | param )
                        | 'name' '=' ( string_literal | identifier )
                        | 'output_alias' '=' ( string_literal | identifier )
```

---

## 5. Reordering Functions

```ebnf
(* =========================================================================== *)
(* Reordering Functions                                                       *)
(* =========================================================================== *)

reorder_call          ::= diversity_call
                        | exploration_call
                        | boosted_call
                        | column_sort_call

(* --------------------------------------------------------------------------- *)
(* diversity(...)                                                              *)
(* --------------------------------------------------------------------------- *)
diversity_call        ::= 'diversity' '(' diversity_arg_list ')'

diversity_arg_list    ::= diversity_arg { ',' diversity_arg }
diversity_arg         ::= 'score' '=' ( identifier | expr )
                        | 'strength' '=' ( FLOAT | param )
                        | 'diversity_attributes' '=' ( array_literal | param )
                        | 'max_diversity_candidates' '=' ( INTEGER | param )
                        | 'diversity_lookback_window' '=' ( INTEGER | param )
                        | 'diversity_lookforward_window' '=' ( INTEGER | param )
                        | 'text_encoding_embedding_ref' '=' ( string_literal | param )
                        | 'name' '=' ( string_literal | identifier )
                        | 'output_alias' '=' ( string_literal | identifier )

(* --------------------------------------------------------------------------- *)
(* exploration(...) & boosted(...)                                             *)
(* --------------------------------------------------------------------------- *)
exploration_call      ::= 'exploration' '(' exploration_arg_list ')'
boosted_call          ::= 'boosted' '(' exploration_arg_list ')'

exploration_arg_list  ::= exploration_arg { ',' exploration_arg }
exploration_arg       ::= 'score' '=' ( identifier | expr )
                        | 'retriever' '=' retriever_call
                        | 'strength' '=' ( FLOAT | param )
                        | 'name' '=' ( string_literal | identifier )
                        | 'output_alias' '=' ( string_literal | identifier )

column_sort_call      ::= 'column_sort' '(' column_sort_arg_list ')'
column_sort_arg_list  ::= column_sort_arg { ',' column_sort_arg }
column_sort_arg       ::= 'columns' '=' column_spec_list
                        | 'name' '=' ( string_literal | identifier )
```

---

## 6. Expression & Operator Precedence

```ebnf
(* =========================================================================== *)
(* Expressions (WHERE predicates, score expressions, computed columns)       *)
(* =========================================================================== *)

expr                  ::= or_expr

or_expr               ::= and_expr { 'OR' and_expr }
and_expr              ::= not_expr { 'AND' not_expr }
not_expr              ::= 'NOT' not_expr
                        | pred_expr

pred_expr             ::= add_expr { predicate_tail }
predicate_tail        ::= cmp_op add_expr
                        | 'IS' [ 'NOT' ] ( 'NULL' | 'TRUE' | 'FALSE' )
                        | [ 'NOT' ] 'IN' in_rhs
                        | [ 'NOT' ] ( 'LIKE' | 'ILIKE' ) add_expr
                        | [ 'NOT' ] 'BETWEEN' add_expr 'AND' add_expr

cmp_op                ::= '=' | '!=' | '<>' | '<' | '<=' | '>' | '>='

in_rhs                ::= '(' expr { ',' expr } ')'
                        | param

add_expr              ::= mul_expr { ( '+' | '-' ) mul_expr }
mul_expr              ::= pow_expr { ( '*' | '/' | '%' ) pow_expr }
pow_expr              ::= unary_expr [ '**' pow_expr ]
unary_expr            ::= ( '+' | '-' ) unary_expr
                        | primary_expr

primary_expr          ::= literal
                        | param
                        | identifier [ '.' identifier ]
                        | array_literal
                        | object_literal
                        | general_func_call
                        | case_expr
                        | cast_expr
                        | '(' expr ')'

general_func_call     ::= identifier '(' [ expr { ',' expr } ] ')'
cast_expr             ::= 'CAST' '(' expr 'AS' identifier ')'
case_expr             ::= 'CASE' [ expr ] { 'WHEN' expr 'THEN' expr } [ 'ELSE' expr ] 'END'

array_literal         ::= '[' [ expr { ',' expr } ] ']'
object_literal        ::= '{' [ string_literal ':' expr { ',' string_literal ':' expr } ] '}'

literal               ::= string_literal | INTEGER | FLOAT | BOOLEAN | 'NULL'
string_literal        ::= "'" { any_char_except_single_quote | "''" } "'"
                        | '"' { any_char_except_double_quote | '""' } '"'
BOOLEAN               ::= 'TRUE' | 'FALSE' | 'true' | 'false'
INTEGER               ::= [0-9]+
FLOAT                 ::= [0-9]+ '.' [0-9]+ [ ( 'e' | 'E' ) [ '+' | '-' ] [0-9]+ ]
identifier            ::= [a-zA-Z_][a-zA-Z0-9_]*
```
