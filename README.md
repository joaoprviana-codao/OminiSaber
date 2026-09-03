# OmniSaber

O OmniSaber é uma plataforma educacional para organizar jornadas de aprendizagem, produção docente, gestão acadêmica e operação de biblioteca.

## Objetivo

Conectar alunos, professores, gestores e bibliotecários em experiências orientadas por turma, matéria, conteúdo e evidências de aprendizagem.

## Módulos principais

- Aluno: trilhas, atividades, redação, evolução, biblioteca e agenda.
- Professor: dashboards por especialidade, laboratórios, avaliações, redações e agenda.
- Gestão: contas, turmas, vínculos, descritores, conteúdos e auditoria.
- Biblioteca: acervo, exemplares, empréstimos e materiais digitais.

## Stack

Frontend estático em HTML, CSS e JavaScript; Supabase Auth; PostgreSQL com RLS; Realtime; Edge Functions e scripts auxiliares.

## Executar localmente

Sirva a raiz com um servidor HTTP:

```bash
python3 -m http.server 4173
```

Abra `http://localhost:4173/`. As páginas devem ser executadas por HTTP, não por `file://`.

## Configuração e Supabase

Configure URL e chave pública anon conforme [configuração e ambiente](docs/getting-started/configuracao.md). Para banco novo, use [ominisaber-schema-completo.sql](backend/ominisaber-schema-completo.sql). Para bancos existentes, aplique as migrations de [backend/migrations/](backend/migrations/) em ordem cronológica. Nunca exponha `service_role` no navegador.

## Estrutura do repositório

- `frontend/`: telas e recursos compartilhados por papel.
- `backend/`: cliente Supabase, configuração, schema, migrations, scripts e functions.
- `docs/`: documentação técnica, guias e histórico preservado.
- `tmp/`: fontes e artefatos temporários do projeto.

## Documentação

Comece pelo [índice central](docs/README.md). Há seções para [arquitetura](docs/architecture/visao-geral.md), [banco](docs/database/schema.md), [módulos](docs/modules/), [guias de usuário](docs/user-guides/) e [desenvolvimento](docs/development/).

## Status

O projeto está em desenvolvimento ativo. Algumas áreas, integrações e dados dependem da configuração do Supabase e ainda podem exigir validação ou evolução.
