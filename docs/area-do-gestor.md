# Área do gestor

## Objetivo

A área do gestor concentra a organização institucional do OminiSaber. O dashboard usa um **painel executivo** com indicadores, cobertura curricular, fila de prioridades e atividades recentes. Todos os números são calculados a partir do Supabase; não existem dados simulados.

## Páginas

- **Dashboard:** alunos ativos, turmas, professores, cobertura curricular, prioridades e atividades recentes.
- **Turmas:** cadastro e edição de séries e ano letivo.
- **Alunos:** busca, vínculo com turma, curso técnico e situação da conta.
- **Professores:** especialidade docente e situação da conta.
- **Vínculos:** relação entre professor, turma e matéria.
- **Descritores:** catálogo curricular por matéria, série e trimestre.
- **Conteúdos publicados:** visão conjunta de trilhas, laboratórios, avaliações e propostas de redação.
- **Acessos e senhas:** criação de contas, redefinição de senha e bloqueio.
- **Auditoria:** histórico somente leitura das operações administrativas.
- **Perfil:** nome, e-mail e encerramento da sessão.

## Arquitetura

O frontend é composto por HTML, CSS e JavaScript compartilhados em `frontend/gestor/shared`. As páginas usam o cliente comum `backend/ominisaber-supabase-client.js`. O schema administrativo está em `backend/migrations/20260903_portal_gestor.sql` e também faz parte do schema unificado.

Os gráficos são renderizados com elementos semânticos, alimentados pelos descritores e conteúdos reais. Os ícones seguem Material Symbols e o restante da interface usa os componentes nativos do portal.

## Segurança de contas

A chave administrativa nunca é enviada ao navegador. Criação de usuário, bloqueio e redefinição de senha são executados pela Edge Function `gestor-contas`, que:

1. valida o JWT da sessão;
2. confirma que o perfil é um gestor ativo;
3. usa a chave secreta somente no servidor;
4. cria uma senha temporária forte;
5. mostra a senha uma única vez, sem salvá-la no banco;
6. registra a operação nas tabelas de solicitação e auditoria.

Para publicar a função, execute a implantação pelo Supabase CLI no projeto indicado pelo `.env`. Configure `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` apenas nos secrets da função.

## Instalação do banco

O arquivo `backend/ominisaber-schema-completo.sql` inclui a área do gestor. Ele deve ser executado no SQL Editor do projeto correto. A migração é idempotente para permitir reaplicação segura.

## Responsividade e acessibilidade

Em telas pequenas, o menu vira uma gaveta com fundo de proteção. Tabelas permanecem roláveis, formulários passam para uma coluna e o dashboard reorganiza os cartões. Há foco semântico, rótulos acessíveis, contraste alto e respeito à preferência de movimento reduzido.

Em computadores, a sidebar pode ser recolhida para uma faixa de 82 px. O conteúdo se expande automaticamente, o estado é preservado entre as páginas e um controle discreto aparece na borda para reabrir o menu. No celular, o mesmo componente fecha pelo botão interno, pelo fundo de proteção ou pela tecla `Esc`, bloqueando a rolagem do conteúdo enquanto estiver aberto.
