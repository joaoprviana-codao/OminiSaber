# Administração

## Objetivo

Oferecer ao gestor visão institucional, contas, turmas, vínculos, descritores, conteúdos e auditoria.

## Estrutura

Implementação em `frontend/gestor/` e Edge Function em `backend/supabase/functions/gestor-contas/`.

## Funcionamento

O gestor consulta indicadores, administra usuários e turmas, vincula professores, acompanha cobertura curricular e acessos.

## Banco de dados

Usa `perfis`, `turmas`, `professor_turmas`, descritores, conteúdos publicados, solicitações de acesso e auditoria.

## Permissões

Operações administrativas exigem `role = gestor` e permanecem protegidas por RLS.

## Pontos de atenção

A documentação detalhada da área está preservada em [área do gestor](../../legacy/area-do-gestor.md).
