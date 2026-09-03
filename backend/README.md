# Backend Supabase | OminiSaber

O backend usa Supabase Auth, PostgreSQL e RLS. O navegador usa somente a chave pública publishable/`anon`; a `service_role` é exclusiva de scripts administrativos locais.

## Configuração do ambiente

Preencha o arquivo `.env` da raiz e gere a configuração pública do navegador:

```bash
npm --prefix backend run env:sync
```

O comando copia somente `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` — ou a chave `anon` legada — para `ominisaber-supabase-config.js`. `SUPABASE_SECRET_KEY` e `SUPABASE_SERVICE_ROLE_KEY` nunca são copiadas para o frontend.

## Cadastro público

A tela `frontend/cadastro/index.html` cria contas usando `auth.signUp`. O trigger do schema cria o perfil com role `aluno`. O usuário não escolhe professor, bibliotecária ou gestor no formulário.

## Usuários de teste

Preencha `SUPABASE_SECRET_KEY` — ou `SUPABASE_SERVICE_ROLE_KEY` em projetos legados — no `.env` da raiz e execute:

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

## Instalação e verificação atuais

Para uma instalação limpa, execute apenas `ominisaber-schema-completo.sql` no SQL Editor. Em um banco que já contém o schema anterior, a atualização da correção de redações está em `migrations/20260903_redacoes_avaliacoes_portugues.sql`.

Depois de criar a conta de teste de Português, o fluxo de leitura pode ser verificado sem gravar conteúdo:

```bash
npm run teacher:portuguese:check
```

O comando confere login, especialidade, turmas, redações, propostas, avaliações e rascunhos de correção usando a conexão definida no `.env`.
