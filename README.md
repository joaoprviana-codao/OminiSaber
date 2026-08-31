# OminiSaber

Plataforma educacional com jornadas para aluno, professor, gestor e bibliotecária, integrada ao Supabase.

## Executar localmente

Sirva a raiz do projeto com um servidor HTTP estático:

~~~powershell
python -m http.server 4173
~~~

Abra o endereço local na porta 4173. O arquivo raiz redireciona para o login.

Para QA visual das páginas antigas, use ?preview=1. Os novos espaços docentes não utilizam dados fictícios: exigem sessão Supabase e mostram estados vazios quando ainda não há conteúdo.

- frontend/aluno/dashboard_principal/index.html?preview=1
- frontend/aluno/minha_evolucao/index.html?preview=1
- frontend/bibliotecaria/dashboard/index.html?preview=1
- frontend/bibliotecaria/gestao_emprestimos/index.html?preview=1
- frontend/professor/dashboard/index.html?preview=1
- frontend/professor/redacoes/index.html?preview=1
- frontend/aluno/laboratorio_de_redacao/index.html?preview=1

As rotas docentes de produção ficam em `frontend/professor/professor_*/`.

## Configurar Supabase

1. Execute backend/ominisaber-schema.sql.
2. Execute `backend/ominisaber-schema-espacos-docentes.sql` e os demais schemas complementares na ordem descrita em docs/padroes-do-projeto.md.
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
