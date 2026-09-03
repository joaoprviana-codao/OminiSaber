# Documentação técnica do OminiSaber

- [Área do gestor](area-do-gestor.md)

Esta pasta reúne a referência técnica e de produto do projeto.

## Leitura recomendada

1. [Arquitetura](arquitetura.md) — componentes, camadas e fluxo de dados.
2. [Stack tecnológica](stack.md) — tecnologias adotadas e responsabilidades.
3. [Decisões arquiteturais](decisoes-arquiteturais.md) — motivos e consequências das escolhas.
4. [Segurança](seguranca.md) — autenticação, autorização, RLS e riscos conhecidos.
5. [Padrões do projeto](padroes-do-projeto.md) — nomes, arquivos, rotas, CSS, JavaScript e SQL.
6. [Experiência e acessibilidade](experiencia-e-acessibilidade.md) — princípios para aluno e biblioteca.
7. [Área do professor](area-do-professor.md) — quatro espaços, laboratórios, avaliações e redações.
8. [Trilhas e estudos](trilhas-e-estudos.md) — catálogo, aulas, atividades, resultados, salvos e histórico ligados ao Supabase.
9. [Jornada completa de redação](redacao-jornada-completa.md) — propostas, planejamento, editor, revisão, correção e versões.

## Fontes de verdade

- O banco é definido pelos arquivos SQL prefixados por ominisaber-schema.
- O navegador acessa o Supabase por meio de backend/ominisaber-supabase-client.js.
- A configuração pública fica em backend/ominisaber-supabase-config.js.
- As páginas canônicas usam index.html; code.html existe apenas para compatibilidade.
