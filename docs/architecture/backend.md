# Backend

## Objetivo

Descrever a camada backend baseada em Supabase.

## Estrutura

- PostgreSQL público com schema e migrations SQL.
- Cliente JavaScript compartilhado para o navegador.
- Edge Function `backend/supabase/functions/gestor-contas/`.
- Scripts de verificação em `backend/scripts/`.

## Funcionamento

O cliente resolve sessão, perfil, consultas e mutações. Operações sensíveis usam policies RLS e, quando necessário, funções PostgreSQL.

## Banco de dados

A fonte consolidada é `backend/ominisaber-schema-completo.sql`; arquivos modulares documentam etapas de evolução e podem ser usados conforme `backend/README-SQL.md`.

## Pontos de atenção

O backend não deve confiar em filtros visuais do frontend como mecanismo de segurança; a autorização deve permanecer no banco.
