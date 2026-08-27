# OminiSaber: arquitetura e organização

## Visão geral

O projeto é uma aplicação estática no frontend com Supabase como backend gerenciado:

- **Frontend:** HTML sem build obrigatório, Tailwind CDN para prototipação visual e JavaScript compartilhado.
- **Backend:** PostgreSQL, Auth e RLS do Supabase. O navegador usa somente a chave pública `anon`.
- **Segurança:** permissões de interface são apenas UX; autorização real está nas policies RLS e nas funções SQL.
- **Ambiente:** `backend/config/env.example.js` documenta as variáveis para ferramentas locais. Segredos reais ficam em `backend/.env`, ignorado pelo Git.

## Árvore de pastas

```text
Consulte [`docs/estrutura-atual.md`](estrutura-atual.md) para a listagem completa. Os pontos principais são:

- `frontend/aluno/shared/`: navegação, responsividade e carregamento de dados do shell integrado.
- `frontend/aluno/laboratorio_de_redacao/`: protótipo independente com `index.html`, `script.js` e `style.css`.
- `backend/`: cliente Supabase, configuração pública, schema, ferramenta de seed e dependências Node.

`backend/.env` e `backend/node_modules/` podem existir localmente, mas são ignorados pelo Git e não fazem parte do inventário do projeto.
```

As telas integradas usam `code.html` como entrada. O laboratório de redação é uma exceção atual e usa `index.html` com CSS e JavaScript próprios. O que é compartilhado permanece em `frontend/aluno/shared` até a migração das demais áreas para o mesmo shell.

## RBAC

- **aluno:** dashboard, trilhas publicadas, próprias notas/redações e solicitações de empréstimo.
- **professor:** dados pedagógicos dos alunos da própria turma, criação de trilhas e notas.
- **bibliotecária:** acervo e empréstimos globalmente.
- **gestor:** visão institucional e administração global.

A tela de role usa um guard de UX em `supabase-client.js`; o bloqueio definitivo é feito pelas policies RLS do SQL.

## Fluxo de inicialização

1. A tela carrega o SDK Supabase, `supabase-config.js` e `supabase-client.js`.
2. O cliente recupera a sessão Auth.
3. O perfil é consultado em `perfis`.
4. A tela de role é validada e os dados são carregados por serviços RLS.
5. Falhas são exibidas como estado explícito. Sem configuração, o cliente emite um aviso e as telas de dados não exibem valores fictícios.

## Configuração

Crie `backend/.env` com as variáveis descritas em `backend/config/env.example.js` para ferramentas locais. Como HTML estático não lê `.env`, configure apenas `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `backend/supabase-config.js`. Nunca copie `service_role` para o frontend.
