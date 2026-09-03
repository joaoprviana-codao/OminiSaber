# Policies RLS

## Objetivo

Documentar o controle de acesso no banco.

## Funcionamento

As tabelas sensíveis habilitam Row Level Security e concedem operações a `authenticated` conforme policies. As condições consultam `auth.uid()`, o papel do perfil, a turma do usuário e `professor_turmas`.

## Escopos

- Alunos acessam próprios registros e conteúdos publicados para sua turma.
- Professores acessam turmas vinculadas, alunos dessas turmas e sua especialidade.
- Gestores possuem escopo administrativo previsto nas policies.
- Biblioteca possui policies próprias para equipe autorizada.

## Redações, avaliações e agenda

O professor de Português pode acessar e corrigir redações de alunos vinculados às suas turmas. Avaliações, laboratórios e eventos são limitados ao professor ou às turmas autorizadas.

## Pontos de atenção

Ao diagnosticar acesso, verifique role, vínculo, grants, policy e sessão. Nunca desative RLS globalmente.
