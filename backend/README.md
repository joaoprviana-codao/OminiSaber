# Backend Supabase | OminiSaber

O backend usa Supabase Auth, PostgreSQL e RLS. O navegador usa somente a chave pública `anon`; a `service_role` é exclusiva do seed local.

## Cadastro público

A tela `frontend/cadastro/index.html` cria contas usando `auth.signUp`. O trigger do schema cria o perfil com role `aluno`. O usuário não escolhe professor, bibliotecária ou gestor no formulário.

## Usuários de teste

Crie `backend/.env` com base em `backend/config/env.example.js`, incluindo `SUPABASE_SERVICE_ROLE_KEY`, e execute:

```bash
cd backend
npm install
npm run seed:test-users
```

| Role | Usuário | Senha |
| --- | --- | --- |
| aluno | `useraluno` | `senha123aluno` |
| professor de Matemática | `profmatematica` | `senha123matematica` |
| professor de Português | `profportugues` | `senha123portugues` |
| professor técnico em Administração | `profadministracao` | `senha123administracao` |
| professor técnico em Informática | `profinformatica` | `senha123informatica` |
| bibliotecária | `userbibliotecaria` | `senha123bibliotecaria` |
| gestor | `usergestor` | `senha123gestor` |

O login aceita o nome informado como matrícula. Essas contas são apenas para testes.

## Segurança

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` em `ominisaber-supabase-config.js`, HTML, JavaScript público ou Git. Execute `ominisaber-schema.sql` e `ominisaber-schema-espacos-docentes.sql` no SQL Editor antes de usar o seed.
