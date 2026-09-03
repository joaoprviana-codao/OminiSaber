# Convenções de código

## HTML

Preserve rotas relativas, atributos `data-*` para integração com scripts e estados acessíveis.

## CSS

Mantenha tokens locais, responsividade e componentes consistentes com o módulo existente.

## JavaScript

Centralize acesso ao Supabase no cliente compartilhado, trate carregamento/vazio/erro e registre falhas com contexto. Não introduza mocks para esconder indisponibilidade de dados.

## SQL

Use migrations incrementais, nomes `snake_case`, UUIDs e policies RLS explícitas. Confirme FKs antes de escrever joins PostgREST.
