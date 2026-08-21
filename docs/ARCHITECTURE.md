# OminiSaber: arquitetura e organização

## Visão geral

O projeto é uma aplicação estática no frontend com Supabase como backend gerenciado:

- **Frontend:** HTML sem build obrigatório, Tailwind CDN para prototipação visual e JavaScript compartilhado.
- **Backend:** PostgreSQL, Auth e RLS do Supabase. O navegador usa somente a chave pública `anon`.
- **Segurança:** permissões de interface são apenas UX; autorização real está nas policies RLS e nas funções SQL.
- **Ambiente:** `backend/.env.example` documenta as variáveis. Segredos reais ficam em `.env`, ignorado pelo Git.

## Árvore de pastas

```text
frontend/
|-- login/
|   |-- code.html
|   `-- screen.png
|-- aluno/
|   |-- dashboard_principal/
|   |   `-- code.html
|   |-- biblioteca_digital/
|   |   `-- code.html
|   |-- configuracoes/
|   |   `-- code.html
|   |-- laboratorio_de_redacao/
|   |   `-- code.html
|   |-- minha_evolucao/
|   |   `-- code.html
|   |-- modulo_de_trilhas/
|   |   `-- code.html
|   |-- edutech_clarity/
|   |   `-- DESIGN.md
|   `-- shared/
|       |-- navigation.js
|       `-- responsive.css
|-- professor/
|   `-- dashboard/
|       `-- code.html
|-- gestor/
|   `-- dashboard/
|       `-- code.html
`-- bibliotecaria/
    `-- dashboard/
        `-- code.html

backend/
|-- .env.example
|-- supabase_schema.sql
|-- supabase-config.js
|-- supabase-client.js
|-- config/
|   `-- README.md
`-- README.md
```

Cada tela segue o formato pedido: uma pasta de contexto, `code.html` como entrada e `screen.png` ou CSS/JS específico quando necessário. O que é compartilhado permanece em `frontend/aluno/shared` até a migração das demais áreas para o mesmo shell.

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
5. Falhas são exibidas como estado explícito; sem configuração o frontend entra em modo demonstração.

## Configuração

Copie `backend/.env.example` para `.env` para ferramentas locais. Como HTML estático não lê `.env`, copie apenas `SUPABASE_URL` e `SUPABASE_ANON_KEY` para `backend/supabase-config.js`. Nunca copie `service_role` para o frontend.
