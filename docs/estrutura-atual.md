# Estrutura atual do projeto

Inventário da estrutura mantida no repositório em 27 de agosto de 2026. A árvore abaixo inclui pastas e arquivos do projeto, com exceção de dependências instaladas e segredos locais ignorados pelo Git.

## Árvore

```text
OminiSaber/
|-- .gitignore
|-- LICENSE
|-- README.md
|-- index.html
|-- backend/
|   |-- README.md
|   |-- config/
|   |   `-- env.example.js
|   |-- package-lock.json
|   |-- package.json
|   |-- scripts/
|   |   `-- seed-test-users.js
|   |-- supabase-client.js
|   |-- supabase-config.js
|   `-- supabase_schema.sql
|-- docs/
|   |-- aluno-telas-e-contratos.md
|   |-- arquitetura.md
|   `-- estrutura-atual.md
`-- frontend/
    |-- aluno/
    |   |-- biblioteca_digital/
    |   |   `-- code.html
    |   |-- configuracoes/
    |   |   `-- code.html
    |   |-- dashboard_principal/
    |   |   `-- code.html
    |   |-- edutech_clarity/
    |   |   `-- DESIGN.md
    |   |-- laboratorio_de_redacao/
    |   |   |-- index.html
    |   |   |-- script.js
    |   |   `-- style.css
    |   |-- minha_evolucao/
    |   |   `-- code.html
    |   |-- modulo_de_trilhas/
    |   |   `-- code.html
    |   `-- shared/
    |       |-- navigation.js
    |       |-- responsive.css
    |       `-- student-data.js
    |-- bibliotecaria/
    |   `-- dashboard/
    |       `-- code.html
    |-- cadastro/
    |   `-- code.html
    |-- erro/
    |   `-- code.html
    |-- gestor/
    |   `-- dashboard/
    |       `-- code.html
    |-- login/
    |   |-- code.html
    |   `-- screen.png
    `-- professor/
        `-- dashboard/
            `-- code.html
```

## Arquivos rastreados

```text
.gitignore
LICENSE
README.md
backend/README.md
backend/config/env.example.js
backend/package-lock.json
backend/package.json
backend/scripts/seed-test-users.js
backend/supabase-client.js
backend/supabase-config.js
backend/supabase_schema.sql
docs/aluno-telas-e-contratos.md
docs/arquitetura.md
docs/estrutura-atual.md
frontend/aluno/biblioteca_digital/code.html
frontend/aluno/configuracoes/code.html
frontend/aluno/dashboard_principal/code.html
frontend/aluno/edutech_clarity/DESIGN.md
frontend/aluno/laboratorio_de_redacao/index.html
frontend/aluno/laboratorio_de_redacao/script.js
frontend/aluno/laboratorio_de_redacao/style.css
frontend/aluno/minha_evolucao/code.html
frontend/aluno/modulo_de_trilhas/code.html
frontend/aluno/shared/navigation.js
frontend/aluno/shared/responsive.css
frontend/aluno/shared/student-data.js
frontend/bibliotecaria/dashboard/code.html
frontend/cadastro/code.html
frontend/erro/code.html
frontend/gestor/dashboard/code.html
frontend/login/code.html
frontend/login/screen.png
frontend/professor/dashboard/code.html
index.html
```

## Organização por área

### Raiz

- `index.html`: redireciona para a tela de login.
- `README.md`: visão geral e referências principais.
- `LICENSE`: licença do projeto.
- `.gitignore`: regras para segredos, dependências e artefatos locais.

### Backend

- `package.json` e `package-lock.json`: dependências e scripts das ferramentas Node.
- `supabase_schema.sql`: tabelas, funções, triggers, índices e políticas RLS.
- `supabase-client.js`: autenticação, autorização de interface e operações do domínio no frontend.
- `supabase-config.js`: configuração pública consumida pelo navegador.
- `config/env.example.js`: exemplo de variáveis para ferramentas locais.
- `scripts/seed-test-users.js`: criação de usuários de teste.
- `README.md`: configuração e uso do backend.

### Documentação

- `docs/arquitetura.md`: arquitetura, RBAC, inicialização e configuração.
- `docs/aluno-telas-e-contratos.md`: telas, contratos e limitações do frontend do aluno.
- `docs/estrutura-atual.md`: este inventário.

### Frontend

- `frontend/login/`: login e imagem de referência da tela.
- `frontend/cadastro/`: cadastro público.
- `frontend/erro/`: tela de acesso negado/erro.
- `frontend/aluno/`: telas e recursos do aluno.
- `frontend/professor/dashboard/`: dashboard do professor.
- `frontend/bibliotecaria/dashboard/`: dashboard da bibliotecária.
- `frontend/gestor/dashboard/`: dashboard do gestor.
- `frontend/aluno/edutech_clarity/DESIGN.md`: tokens e diretrizes visuais.

## Itens locais ignorados

Estes itens podem existir no workspace, mas não são versionados nem listados na árvore principal:

- `backend/.env`: variáveis locais, incluindo credenciais privadas.
- `backend/node_modules/`: dependências instaladas por `npm install`.

Não coloque `SUPABASE_SERVICE_ROLE_KEY` em arquivos públicos ou versionados.
