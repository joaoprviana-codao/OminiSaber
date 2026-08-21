# Backend Supabase | OminiSaber

## Stack

- Supabase Auth para identidade e sessão.
- PostgreSQL para dados relacionais.
- RLS para autorização por `aluno`, `professor`, `bibliotecaria` e `gestor`.
- JavaScript no browser somente com a chave pública `anon`.
- `.env` apenas para ambiente local/deploy; nunca para transportar segredo ao HTML.

## Organização

- `supabase_schema.sql`: tabelas, índices, funções, triggers e policies.
- `supabase-client.js`: gateway único do frontend para Auth e domínio.
- `supabase-config.js`: configuração pública consumida pelo browser.
- `.env.example`: contrato de ambiente para ferramentas locais.
- `config/`: documentação e exemplos de configuração.

1. Execute `supabase_schema.sql` no SQL Editor do projeto Supabase.
2. Em Authentication > Users, crie os usuários ou habilite o método de e-mail/senha.
3. Copie a URL do projeto e a chave pública `anon` para `supabase-config.js`:

```js
window.OMINI_SUPABASE_CONFIG = {
  url: 'https://seu-projeto.supabase.co',
  anonKey: 'sua-chave-anon'
};
```

Nunca use a chave `service_role` no navegador.

O frontend usa a camada `supabase-client.js`, que fornece autenticação, perfis, trilhas, redações, livros e empréstimos. As permissões são aplicadas pelas políticas RLS do schema. A documentação completa de pastas está em `docs/ARCHITECTURE.md`.
