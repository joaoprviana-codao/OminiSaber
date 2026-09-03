# Convenções do banco

## Objetivo

Registrar convenções observadas no schema.

## Estrutura

Tabelas e colunas usam `snake_case`; identificadores são UUID; datas usam `timestamptz`; registros normalmente possuem `created_at` e `updated_at`.

## Funcionamento

Enums e checks restringem estados. Índices acompanham filtros por usuário, turma, status e data. Triggers atualizam timestamps, versões e consistência de domínios específicos.

## Pontos de atenção

Mudanças estruturais devem ser incrementais, documentadas em migration e compatíveis com RLS.
