# Professor de Português

## Objetivo

Concentrar a experiência de linguagem, oficina, avaliações e correção de redações.

## Estrutura

- `frontend/professor/professor_portugues/dashboard/`
- `frontend/professor/professor_portugues/laboratorio/`
- `frontend/professor/professor_portugues/avaliacoes/`
- `frontend/professor/professor_portugues/redacoes/`
- `frontend/professor/specialty/`

## Funcionamento

A área valida `tipo_professor = portugues`, carrega turmas reais e restringe propostas, submissões e correções aos alunos das turmas vinculadas.

## Banco de dados

Usa propostas, redações, competências, comentários, rascunhos de correção, avaliações e agenda.

## Pontos de atenção

A relação professor-turma é `professor_turmas`; não deve ser inferida apenas por `perfis.turma_id`.
