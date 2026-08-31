# Padrões do projeto

## Nomes e rotas

- Marca: OminiSaber.
- Identificador global: window.OminiSaber.
- Configuração global: window.OMINISABER_SUPABASE_CONFIG.
- Arquivos novos em kebab-case.
- Entrada canônica: index.html.
- Arquivos da página: style.css e script.js.
- SQL: ominisaber-schema seguido do domínio.
- Eventos: ominisaber:nome-do-evento.
- Chaves locais: ominisaber:contexto:chave.

## HTML

- Um h1 por página.
- Regiões nomeadas por aria-label ou aria-labelledby.
- Ações usam button; navegação usa a.
- Estados dinâmicos usam aria-live; erros importantes usam role=alert.
- Botões de ícone sempre têm nome acessível.

## CSS

- Tokens semânticos no seletor :root.
- Espaçamento baseado em múltiplos de 4 px.
- Breakpoints orientados ao conteúdo.
- Foco visível nunca é removido.
- Movimento respeita prefers-reduced-motion.
- Indigo identifica aluno; azul-petróleo identifica biblioteca; a área docente usa acento por especialidade.
- Barras laterais reutilizam `frontend/shared/sidebar.css`: 236 px no desktop, navegação de 48 px de altura mínima, foco visível e recolhimento abaixo de 900 px.
- A estrutura visual da navegação é comum, enquanto ícone, acento e ferramentas preservam o contexto de aluno, biblioteca e professor.

## JavaScript

- IIFE isola scripts clássicos.
- const por padrão e nomes camelCase.
- Seletores dinâmicos usam data attributes.
- Conteúdo montado como HTML deve ser escapado.
- Supabase deve passar pelo gateway window.OminiSaber.
- Carregamento prevê loading, ready, empty e error.
- Nas telas legadas, `preview=1` pode usar conteúdo demonstrativo; nos novos espaços docentes, apresenta somente estados vazios e bloqueia persistência.

## SQL

- Objetos explicitam public.
- Tabelas no plural e snake_case.
- Timestamps usam timestamptz.
- Toda tabela exposta precisa de RLS e policy.
- Migrações complementares devem ser idempotentes quando possível.

## Ordem dos schemas

1. ominisaber-schema.sql
2. ominisaber-schema-biblioteca.sql
3. ominisaber-schema-estoque-etapa1.sql
4. ominisaber-schema-estoque-etapa2.sql
5. ominisaber-schema-configuracoes.sql
6. ominisaber-schema-conquistas.sql
7. ominisaber-schema-professor.sql (somente ao migrar uma base existente)
8. ominisaber-schema-espacos-docentes.sql
