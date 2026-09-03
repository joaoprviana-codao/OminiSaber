# Supabase

## Objetivo

Registrar a sequência de implantação e validação do backend Supabase.

## Estrutura

- Schema consolidado: `backend/ominisaber-schema-completo.sql`.
- Migrations incrementais: `backend/migrations/`.
- Functions locais: `backend/supabase/functions/`.
- Cliente web: `backend/ominisaber-supabase-client.js`.

## Funcionamento

Para um banco novo, aplique o schema completo conforme as instruções de `backend/README-SQL.md`. Para bancos existentes, aplique migrations em ordem cronológica e valide no SQL Editor.

## Banco de dados

O schema cria tipos, tabelas, índices, policies, funções e triggers. O cliente usa a chave anon e depende das policies RLS para autorização.

## Pontos de atenção

A execução deve ser feita no projeto Supabase correto. O schema não deve ser aplicado destrutivamente em produção.
