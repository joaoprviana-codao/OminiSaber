# Tabelas principais

## Identidade e vínculos

`perfis` liga o usuário ao Auth e guarda papel, turma e especialidade. `turmas` representa grupos letivos. `professor_turmas` é a tabela de vínculo professor-turma e guarda a matéria do vínculo.

## Conteúdo e aprendizagem

`trilhas` contém percursos; `atividades` contém etapas; tabelas de progresso, notas, histórico, XP e conteúdos salvos registram a jornada do aluno.

## Redação

`propostas_redacao` pertence ao professor e pode apontar para uma turma. `redacoes` pertence ao aluno e pode apontar para uma proposta. Correções ficam em `avaliacoes_competencias_redacao`, `comentarios_redacao` e no próprio registro da redação.

## Docência e agenda

`laboratorios_docentes` e `avaliacoes_docentes` pertencem ao professor e podem apontar para turma. `eventos_agenda` aponta para turma e professor; notificações apontam para turma, evento e criador.

## Pontos de atenção

Consulte o schema para tipos, checks, índices e colunas completas antes de criar consultas.
