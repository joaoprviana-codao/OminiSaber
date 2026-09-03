# Avaliações

## Objetivo

Criar, publicar e acompanhar avaliações docentes.

## Estrutura

Páginas em `frontend/professor/*/avaliacoes/`; execução do aluno em `frontend/aluno/` e cliente compartilhado em `backend/`.

## Funcionamento

O professor monta avaliação, adiciona questões, salva rascunho ou publica para uma turma. Alunos acessam avaliações publicadas e registram tentativas.

## Banco de dados

`avaliacoes_docentes`, `questoes_avaliacao`, `gabaritos_avaliacao` e `tentativas_avaliacao`.

## Permissões

O professor gerencia avaliações próprias e de suas turmas conforme especialidade. O aluno consulta e responde avaliações publicadas autorizadas.
