-- Preferencias e dados editaveis do perfil do aluno.
-- Execute depois de backend/ominisaber-schema.sql.

begin;

alter table public.perfis
  add column if not exists tema_preferido text not null default 'light'
    check (tema_preferido in ('light', 'dark')),
  add column if not exists avatar_url text;

alter table public.perfis enable row level security;

-- Evita que um cliente altere role, matricula ou turma_id pela API.
revoke update on public.perfis from authenticated;
grant update (nome, avatar_url, tema_preferido) on public.perfis to authenticated;

-- Remove políticas antigas que eram redundantes com perfis_select e
-- perfis_update_proprio do schema principal. Políticas permissivas são somadas
-- com OR, portanto duplicá-las enfraquece futuras regras de perfil.
drop policy if exists "Alunos podem consultar o proprio perfil" on public.perfis;
drop policy if exists "Alunos podem atualizar o proprio perfil" on public.perfis;
-- Remove o trigger legado; set_perfis_updated_at já é instalado pelo schema base.
drop trigger if exists perfis_updated_at on public.perfis;
drop function if exists public.atualizar_perfil_updated_at();

commit;
