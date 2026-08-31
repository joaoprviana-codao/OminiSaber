# Decisões arquiteturais

## ADR-001 — Frontend estático

**Decisão:** manter HTML, CSS e JavaScript sem framework.

**Motivo:** execução sem build, baixo custo operacional e compatibilidade com as telas existentes.

**Consequência:** componentes compartilhados dependem de convenções e revisão disciplinada.

## ADR-002 — Supabase como backend

**Decisão:** concentrar autenticação, persistência, API e autorização no Supabase.

**Motivo:** reduz infraestrutura própria e aproxima as regras de acesso dos dados.

**Consequência:** schema e policies são partes críticas da aplicação.

## ADR-003 — Gateway único

**Decisão:** páginas consomem window.OminiSaber em vez de repetir consultas.

**Motivo:** centraliza sessão, erros, operações de domínio e notificações.

**Consequência:** novas consultas devem entrar no gateway; acesso direto ao client deve ser removido gradualmente.

## ADR-004 — Schema PostgreSQL public

**Decisão:** manter as tabelas da API no schema public.

**Motivo:** ele é exposto por padrão pelo Supabase/PostgREST. Renomeá-lo por marca quebraria clientes sem aumentar segurança.

## ADR-005 — Design por papel

**Decisão:** compartilhar marca e acessibilidade, adaptando a experiência.

- Aluno: descoberta, domínio, motivação e feedback educativo.
- Bibliotecária: fila operacional, exceções, busca e conclusão rápida.

## ADR-006 — Modo de visualização isolado

**Decisão:** páginas redesenhadas antigas podem aceitar `?preview=1` com conteúdo demonstrativo. Nos novos espaços docentes, o modo apresenta apenas estados vazios e bloqueia qualquer gravação, evitando confundir demonstração visual com dados reais.

**Motivo:** permite QA visual sem contas ou dados pessoais.

**Limite:** não cria sessão, não consulta dados reais e não concede autorização.

## ADR-007 — Rotas canônicas

**Decisão:** index.html é a entrada de cada pasta.

**Motivo:** URLs menores e comportamento previsível. code.html permanece como redirecionamento temporário.
