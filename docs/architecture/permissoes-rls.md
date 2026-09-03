# Permissões e RLS

## Objetivo

Garantir que cada papel veja e altere somente os dados necessários.

## Funcionamento

As policies usam `auth.uid()`, funções auxiliares como `usuario_role()`, `usuario_turma_id()` e `usuario_tipo_professor()`, além de vínculos em `professor_turmas`.

## Regras principais

- Aluno: próprios dados, conteúdos publicados da turma e próprio progresso.
- Professor: perfil próprio, turmas vinculadas, alunos dessas turmas e recursos de sua especialidade.
- Gestor: administração global conforme as policies.
- Bibliotecária: operação de biblioteca, sem acesso pedagógico indevido.

## Banco de dados

As policies estão no schema completo e nas migrations correspondentes. Consultas relacionais do PostgREST devem explicitar FKs quando houver mais de uma relação possível.

## Pontos de atenção

RLS não deve ser desativado como solução de diagnóstico ou desenvolvimento.
