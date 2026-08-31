---
title: Formal EBNF Grammar
sidebar_label: EBNF Grammar
slug: /ebnf-grammar
---

# Formal EBNF Grammar Specification

This document provides the formal **Extended Backus-Naur Form (EBNF)** specification for RecQL.

The grammar defines the statement syntax, retriever functions, encoder configurations, search modes, ML scoring/expression definitions, reordering operators, and expression operator precedence.

---

## 1. Statement Level Grammar

```ebnf
(* =========================================================================== *)
(* RecQL Statement Level Grammar                                              *)
(* =========================================================================== *)

query                 ::= select_stmt [ ';' ] EOF

select_stmt           ::= 'SELECT' select_list
                          [ 'FROM' from_clause ]
                          [ 'WHERE' expr ]
                          [ 'ORDER' 'BY' order_list ]
                          [ 'REORDER' 'BY' reorder_list ]
                          [ 'LIMIT'  limit_value ]
                          [ 'OFFSET' offset_value ]

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

## 2. Retriever Function Calls (in `FROM retrieve(...)`)

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
(* 1. similarity(...) (alias: similar_items)                                   *)
(* --------------------------------------------------------------------------- *)
similarity_call       ::= ( 'similarity' | 'similar_items' ) '(' similarity_arg_list ')'

similarity_arg_list   ::= similarity_arg { ',' similarity_arg }
similarity_arg        ::= ( 'embedding_ref' | 'embedding' ) '=' ( string_literal | identifier | param )
                        | ( 'encoder' | 'query_encoder' ) '=' encoder_spec
                        | 'input_user_id' '=' ( string_literal | identifier | param )
                        | 'input_item_id' '=' ( string_literal | identifier | param )
                        | 'pooling_function' '=' ( string_literal | identifier | param )
                        | 'truncate_interactions' '=' ( INTEGER | param )
                        | 'input_user_features' '=' ( object_literal | param )
                        | 'input_item_features' '=' ( object_literal | param )
                        | 'num_clusters' '=' ( INTEGER | param )
                        | 'where' '=' ( predicate_expr | string_literal )
                        | 'limit' '=' ( INTEGER | param )
                        | 'name' '=' ( string_literal | identifier )
                        | 'backend' '=' ( string_literal | identifier )
                        | 'use_exact_search' '=' ( BOOLEAN | param )

(* --------------------------------------------------------------------------- *)
(* 2. text_search(...)                                                         *)
(* --------------------------------------------------------------------------- *)
text_search_call      ::= 'text_search' '(' text_search_arg_list ')'

text_search_arg_list  ::= text_search_arg { ',' text_search_arg }
text_search_arg       ::= ( 'input_text_query' | 'query' ) '=' ( string_literal | param )
                        | 'mode' '=' search_mode_spec
                        | ( 'text_embedding_ref' | 'embedding_ref' ) '=' ( string_literal | param )
                        | ( 'fuzziness' | 'fuzziness_edit_distance' ) '=' ( INTEGER | param )
                        | 'where' '=' ( predicate_expr | string_literal )
                        | 'limit' '=' ( INTEGER | param )
                        | 'name' '=' ( string_literal | identifier )
                        | 'backend' '=' ( string_literal | identifier )

(* --------------------------------------------------------------------------- *)
(* 3. column_order(...)                                                        *)
(* --------------------------------------------------------------------------- *)
column_order_call     ::= 'column_order' '(' column_order_arg_list ')'

column_order_arg_list ::= column_order_arg { ',' column_order_arg }
column_order_arg      ::= 'columns' '=' ( column_spec_list | string_literal )
                        | 'where' '=' ( predicate_expr | string_literal )
                        | 'limit' '=' ( INTEGER | param )
                        | 'name' '=' ( string_literal | identifier )
                        | 'backend' '=' ( string_literal | identifier )

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
                        | 'backend' '=' ( string_literal | identifier )

(* --------------------------------------------------------------------------- *)
(* 5. candidate_ids(...) (alias: ids)                                          *)
(* --------------------------------------------------------------------------- *)
candidate_ids_call    ::= ( 'candidate_ids' | 'ids' ) '(' candidate_ids_arg_list ')'
                        | ( 'candidate_ids' | 'ids' ) '(' ( array_literal | param ) ')'

candidate_ids_arg_list ::= candidate_ids_arg { ',' candidate_ids_arg }
candidate_ids_arg     ::= ( 'item_ids' | 'ids' ) '=' ( array_literal | param )
                        | 'limit' '=' ( INTEGER | param )
                        | 'name' '=' ( string_literal | identifier )
                        | 'backend' '=' ( string_literal | identifier )

(* --------------------------------------------------------------------------- *)
(* 6. candidate_attributes(...)                                                *)
(* --------------------------------------------------------------------------- *)
candidate_attributes_call ::= 'candidate_attributes' '(' candidate_attributes_arg_list ')'
                            | 'candidate_attributes' '(' ( array_literal | param ) ')'

candidate_attributes_arg_list ::= candidate_attributes_arg { ',' candidate_attributes_arg }
candidate_attributes_arg      ::= 'item_attributes' '=' ( array_literal | param )
                                | 'limit' '=' ( INTEGER | param )
                                | 'name' '=' ( string_literal | identifier )
                                | 'backend' '=' ( string_literal | identifier )
```

---

## 3. Query Encoder Specs & Search Modes

Query encoders are strategies configured within `similarity(...)` (either via string identifier `encoder='interaction_pooling'`, nested spec `encoder=interaction_pooling(...)`, or by passing input fields directly to `similarity(...)`). They are not standalone SQL functions.

```ebnf
(* =========================================================================== *)
(* Encoder Specifications (for similarity retrieval)                           *)
(* =========================================================================== *)

encoder_spec          ::= encoder_type_name
                        | encoder_constructor_spec

encoder_type_name     ::= 'precomputed_user'
                        | 'precomputed_item'
                        | 'interaction_pooling'
                        | 'interaction_round_robin'
                        | 'user_attribute_pooling'
                        | 'item_attribute_pooling'
                        | 'vector'
                        | string_literal

encoder_constructor_spec ::= 'precomputed_user' '(' [ precomputed_user_args ] ')'
                          | 'precomputed_item' '(' [ precomputed_item_args ] ')'
                          | 'interaction_pooling' '(' [ interaction_pooling_args ] ')'
                          | 'interaction_round_robin' '(' [ interaction_rr_args ] ')'
                          | 'user_attribute_pooling' '(' [ user_attr_pooling_args ] ')'
                          | 'item_attribute_pooling' '(' [ item_attr_pooling_args ] ')'
                          | 'vector' '(' [ vector_args ] ')'

precomputed_user_args ::= 'input_user_id' '=' ( string_literal | param | identifier )
                        | ( string_literal | param | identifier )

precomputed_item_args ::= 'input_item_id' '=' ( string_literal | param | identifier )
                        | ( string_literal | param | identifier )

interaction_pooling_args ::= interaction_pooling_arg { ',' interaction_pooling_arg }
interaction_pooling_arg  ::= 'input_user_id' '=' ( string_literal | param | identifier )
                           | 'pooling_function' '=' ( string_literal | identifier )
                           | 'truncate_interactions' '=' ( INTEGER | param )

interaction_rr_args      ::= interaction_rr_arg { ',' interaction_rr_arg }
interaction_rr_arg       ::= 'input_user_id' '=' ( string_literal | param | identifier )
                           | 'pooling_function' '=' ( string_literal | identifier )
                           | 'num_clusters' '=' ( INTEGER | param )

user_attr_pooling_args   ::= user_attr_pooling_arg { ',' user_attr_pooling_arg }
user_attr_pooling_arg    ::= 'input_user_id' '=' ( string_literal | param | identifier )
                           | 'input_user_features' '=' ( object_literal | param )

item_attr_pooling_args   ::= item_attr_pooling_arg { ',' item_attr_pooling_arg }
item_attr_pooling_arg    ::= 'input_item_id' '=' ( string_literal | param | identifier )
                           | 'input_item_features' '=' ( object_literal | param )

vector_args              ::= ( 'vector' | 'query_vector' ) '=' ( array_literal | param )

(* =========================================================================== *)
(* Search Modes (for text_search retrieval)                                   *)
(* =========================================================================== *)

search_mode_spec      ::= 'lexical'
                        | 'vector'
                        | string_literal
                        | lexical_mode_call
                        | vector_mode_call

lexical_mode_call     ::= 'lexical' '(' [ ( 'fuzziness' | 'fuzziness_edit_distance' ) '=' ( INTEGER | param ) ] ')'
vector_mode_call      ::= 'vector' '(' vector_mode_arg_list ')'
vector_mode_arg_list  ::= vector_mode_arg { ',' vector_mode_arg }
vector_mode_arg       ::= ( 'text_embedding_ref' | 'embedding_ref' ) '=' ( string_literal | param )
                        | 'use_exact_search' '=' ( BOOLEAN | param )
```

---

## 4. Scoring & Computed Columns

```ebnf
(* =========================================================================== *)
(* Scoring & Computed Columns (in SELECT or ORDER BY)                          *)
(* =========================================================================== *)

score_call            ::= 'score' '(' score_arg_list ')'
                        | 'computed_column' '(' score_arg_list ')'

score_arg_list        ::= score_arg { ',' score_arg }
score_arg             ::= ( 'expression' | 'value_model' | 'model' ) '=' ( string_literal | identifier | expr )
                        | 'input_user_id' '=' ( string_literal | param | identifier )
                        | 'input_user_features' '=' ( object_literal | param )
                        | 'input_interactions_item_ids' '=' ( array_literal | param )
                        | 'preserve_order' '=' ( BOOLEAN | param )
                        | 'name' '=' ( string_literal | identifier )
                        | 'output_alias' '=' ( string_literal | identifier )
                        | 'backend' '=' ( string_literal | identifier )
                        | expr  (* Positional expression / model name *)
```

---

## 5. Reordering Functions

```ebnf
(* =========================================================================== *)
(* Reordering Functions (in SELECT or REORDER BY)                              *)
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

(* --------------------------------------------------------------------------- *)
(* column_sort(...)                                                            *)
(* --------------------------------------------------------------------------- *)
column_sort_call      ::= 'column_sort' '(' column_sort_arg_list ')'
column_sort_arg_list  ::= column_sort_arg { ',' column_sort_arg }
column_sort_arg       ::= 'columns' '=' column_spec_list
                        | 'name' '=' ( string_literal | identifier )
```

---

## 6. Expressions & Operator Precedence

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
                        | dotted_identifier
                        | array_literal
                        | object_literal
                        | general_func_call
                        | case_expr
                        | cast_expr
                        | '(' expr ')'

dotted_identifier     ::= identifier { '.' identifier }

general_func_call     ::= identifier [ '.' identifier ] '(' [ call_arg_list ] ')'
call_arg_list         ::= call_arg { ',' call_arg }
call_arg              ::= [ identifier '=' ] expr

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
