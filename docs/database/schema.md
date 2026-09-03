# Schema do banco

## Objetivo

Oferecer uma visão legível do PostgreSQL usado pelo OmniSaber.

## Estrutura

A fonte consolidada é `backend/ominisaber-schema-completo.sql`. Os schemas organizados por domínio ficam em `backend/schema/` e representam a fonte humana do mesmo modelo.

## Grupos principais

- Identidade: `perfis`, `turmas`, `professor_turmas`.
- Aprendizagem: `trilhas`, `atividades`, progresso, notas e histórico.
- Redação: propostas, redações, versões, planejamentos, repertórios, comentários e competências.
- Docência: laboratórios, avaliações, questões, gabaritos, tentativas e entregas.
- Agenda: eventos, notificações e leituras.
- Biblioteca: livros, exemplares, empréstimos e acervo.
- Gestão: descritores, acessos, auditoria e configurações.

## Pontos de atenção

O schema completo é a referência para instalação consolidada; migrations são a referência para atualização incremental.
