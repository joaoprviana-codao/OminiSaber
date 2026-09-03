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

## ADR-006 — Dados reais e falha explícita

**Decisão:** as áreas operacionais não fabricam conteúdo quando o Supabase está indisponível. A interface apresenta estado vazio ou erro e só grava com sessão válida.

**Motivo:** notas, progresso, empréstimos e produções escolares não podem ser confundidos com registros fictícios.

**Limite:** testes visuais devem usar uma instância de desenvolvimento com dados de teste identificados no próprio banco e protegidos pelas mesmas políticas RLS.

## ADR-007 — Rotas canônicas

**Decisão:** index.html é a entrada de cada pasta.

**Motivo:** URLs menores e comportamento previsível. code.html permanece como redirecionamento temporário.
