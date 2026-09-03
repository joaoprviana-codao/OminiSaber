# Relacionamentos

## Objetivo

Registrar relações que afetam consultas e autorização.

## Relações críticas

- `perfis.turma_id -> turmas.id`: turma principal do perfil, especialmente aluno.
- `professor_turmas.professor_id -> perfis.id` e `professor_turmas.turma_id -> turmas.id`: atribuição docente.
- `propostas_redacao.professor_id -> perfis.id` e `propostas_redacao.turma_id -> turmas.id`.
- `redacoes.aluno_id -> perfis.id`, `redacoes.proposta_id -> propostas_redacao.id` e `redacoes.corrigida_por -> perfis.id`.
- `avaliacoes_docentes.professor_id -> perfis.id` e `avaliacoes_docentes.turma_id -> turmas.id`.
- `eventos_agenda.professor_id -> perfis.id` e `eventos_agenda.turma_id -> turmas.id`.

## PostgREST

Quando a tabela possui mais de uma FK para o mesmo destino, o select deve nomear a constraint, por exemplo `turmas!professor_turmas_turma_id_fkey(...)` ou `perfis!eventos_agenda_professor_id_fkey(...)`. Os nomes devem ser conferidos no banco antes de alterar uma query.

## Pontos de atenção

Não confundir a turma do perfil do aluno com o vínculo docente em `professor_turmas`.
