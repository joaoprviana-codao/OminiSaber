# Visão geral da arquitetura

O OmniSaber é organizado como frontend estático por papel, cliente Supabase compartilhado e PostgreSQL protegido por RLS.

## Objetivo

Separar apresentação, acesso a dados e autorização sem introduzir um framework frontend.

## Estrutura

- `frontend/aluno/`: experiência do aluno.
- `frontend/professor/`: área docente e especialidades.
- `frontend/gestor/`: administração acadêmica.
- `frontend/bibliotecaria/`: operação da biblioteca.
- `backend/`: schema, migrations, cliente e Edge Functions.

## Funcionamento

As páginas HTML carregam CSS e JavaScript por módulo. O cliente em `backend/ominisaber-supabase-client.js` centraliza sessão, consultas e mutações. O Supabase aplica autenticação, policies, funções e realtime.

## Fluxo

Login → sessão Supabase → perfil em `perfis` → rota por papel/especialidade → consultas autorizadas por RLS.

## Pontos de atenção

As rotas são arquivos HTML relativos. Alterações de diretório exigem auditoria de todos os links.
