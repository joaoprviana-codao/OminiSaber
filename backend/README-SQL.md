# Banco de dados do OminiSaber

Todos os arquivos são transacionais e idempotentes para a estrutura que criam. Se um comando falhar, o respectivo arquivo é revertido por inteiro.

## Instalação nova

### Opção recomendada: arquivo único

No SQL Editor do Supabase, execute somente:

1. `ominisaber-schema-completo.sql`

Esse arquivo reúne toda a instalação em uma única transação. Não execute também os arquivos individuais na mesma instalação.

Para regerar o arquivo consolidado depois de alterar algum schema de origem:

```powershell
npm run schema:build
```

### Opção modular

Execute os arquivos abaixo no SQL Editor do Supabase, exatamente nesta ordem:

1. `schema/core.sql`
2. `migrations/20260831_acesso_materias_aluno.sql`
3. `schema/configuracoes.sql`
4. `schema/biblioteca.sql`
5. `schema/estoque-etapa1.sql`
6. `schema/estoque-etapa2.sql`
7. `schema/conquistas.sql`
8. `schema/espacos-docentes.sql`
9. `migrations/20260831_trilhas_estudos_completos.sql`
10. `migrations/20260831_redacao_jornada_completa.sql`
11. `migrations/20260831_agenda_notificacoes.sql`

`schema/professor.sql` é somente uma atualização de compatibilidade para bancos antigos. Não é necessário executá-lo em uma instalação nova, pois o conteúdo estrutural correspondente já está no schema principal.

## Validação local

Na pasta `backend`, execute:

```powershell
python -m pip install -r requirements-dev.txt
npm run sql:check
```

A validação confere a sintaxe PostgreSQL, transações, concessões globais perigosas e requisitos de segurança das funções `SECURITY DEFINER`.

## Segurança

- O cliente nunca recebe a chave `service_role`.
- Todas as tabelas expostas possuem RLS.
- Funções privilegiadas usam `search_path` vazio e permissões explícitas.
- Tabelas privadas de gabaritos e rotinas internas permanecem no schema `private`.
- A autorização continua sendo feita no banco, mesmo quando o frontend oculta uma ação.
