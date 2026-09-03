# Módulo do professor

## Objetivo

Permitir que professores acompanhem turmas, publiquem conteúdos, criem avaliações e acompanhem entregas.

## Estrutura

A implementação fica em `frontend/professor/`. O portal especializado usa `specialty/portal.js` e configurações por disciplina.

## Funcionamento

O perfil autenticado define a especialidade. `professor_turmas` define as turmas acessíveis; o cliente carrega laboratórios, avaliações, alunos, redações e agenda.

## Banco de dados

Usa `perfis`, `turmas`, `professor_turmas`, `laboratorios_docentes`, `avaliacoes_docentes`, `redacoes` e `eventos_agenda`.

## Pontos de atenção

Filtros do frontend não substituem as policies RLS.
