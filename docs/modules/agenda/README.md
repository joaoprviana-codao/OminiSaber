# Agenda

## Objetivo

Publicar aulas, provas, atividades e compromissos por turma.

## Estrutura

Professor: `frontend/professor/agenda/`. Aluno: `frontend/aluno/agenda/`. Backend: `eventos_agenda`, notificações e realtime no cliente Supabase.

## Funcionamento

O professor cria, atualiza ou cancela eventos das turmas vinculadas. Alunos veem eventos publicados de sua turma. Notificações podem ser geradas para eventos relevantes.

## Banco de dados

`eventos_agenda` possui FKs para turma e professor; `notificacoes` possui destino, criador e evento; `notificacoes_lidas` registra leitura.

## Permissões

RLS limita criação ao professor autenticado e à sua relação em `professor_turmas`; leitura considera papel, vínculo e status publicado.
