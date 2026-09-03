# Migrations

## Objetivo

Documentar a evolução incremental do banco.

## Estrutura

As migrations ficam em `backend/migrations/` e usam prefixo de data.

## Migrations importantes

- `20260831_acesso_materias_aluno.sql`: acesso do aluno às matérias.
- `20260831_agenda_notificacoes.sql`: agenda, notificações e policies.
- `20260831_redacao_jornada_completa.sql`: jornada de redação.
- `20260831_trilhas_estudos_completos.sql`: trilhas e estudos.
- `20260902_biblioteca_acervo_unificado.sql`: biblioteca unificada.
- `20260903_portal_gestor.sql`: portal do gestor.
- `20260903_redacoes_avaliacoes_portugues.sql`: suporte incremental à correção de redações em Português.

## Funcionamento

Aplique migrations em ordem cronológica no projeto Supabase correto. Elas devem ser idempotentes quando indicado pelo SQL.

## Pontos de atenção

Não usar `DROP` destrutivo para resolver divergências de ambiente. Para banco novo, consulte `backend/README-SQL.md`.
