# OminiSaber

Plataforma educacional com jornadas para aluno, professor, gestor e bibliotecária, integrada ao Supabase.

## Executar localmente

Sirva a raiz do projeto com um servidor HTTP estático:

~~~powershell
python -m http.server 4173
~~~

Abra o endereço local na porta 4173. O arquivo raiz redireciona para o login.

Todas as áreas exigem sessão e dados reais do Supabase. Sem configuração, sessão ou conteúdo publicado, a interface mostra um estado vazio ou uma mensagem de erro; não há modo de demonstração com registros fictícios.

As rotas docentes de produção ficam em `frontend/professor/professor_*/`.

## Configurar Supabase

1. Para uma instalação limpa, execute apenas `backend/ominisaber-schema-completo.sql` no SQL Editor.
2. A ordem modular e as instruções de atualização ficam em `backend/README-SQL.md`.
3. Configure URL e chave anon em backend/ominisaber-supabase-config.js.
4. Nunca use service_role no navegador.

## Documentação

- [Índice técnico](docs/README.md)
- [Arquitetura](docs/arquitetura.md)
- [Stack](docs/stack.md)
- [Decisões](docs/decisoes-arquiteturais.md)
- [Segurança](docs/seguranca.md)
- [Padrões](docs/padroes-do-projeto.md)
- [Experiência e acessibilidade](docs/experiencia-e-acessibilidade.md)
- [Área do professor](docs/area-do-professor.md)
