begin;

alter table public.perfis add column if not exists ativo boolean not null default true;

-- A role do gestor e o status ativo são consultados fora do RLS da própria tabela.
-- Isso evita recursão quando a função é usada nas policies de perfis.
create or replace function public.gestor_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = (select auth.uid())
      and p.role = 'gestor'
      and p.ativo = true
  );
$$;

revoke all on function public.gestor_ativo() from public, anon, authenticated;
grant execute on function public.gestor_ativo() to authenticated;

alter table public.perfis enable row level security;

drop policy if exists perfis_select on public.perfis;
create policy perfis_select on public.perfis for select to authenticated
using (
  id = (select auth.uid())
  or public.gestor_ativo()
  or (
    (select public.usuario_role()) = 'professor'
    and exists (
      select 1
      from public.professor_turmas pt
      where pt.professor_id = (select auth.uid())
        and pt.turma_id = perfis.turma_id
    )
  )
);

drop policy if exists perfis_update_gestor on public.perfis;
create policy perfis_update_gestor on public.perfis for update to authenticated
using (public.gestor_ativo())
with check (public.gestor_ativo());

-- O frontend do gestor edita apenas estes atributos. Role, ativo e credenciais
-- permanecem protegidos; as duas últimas operações usam a Edge Function.
revoke update on public.perfis from authenticated;
grant update (nome, matricula, curso_tecnico, turma_id, tipo_professor) on public.perfis to authenticated;
grant select on public.perfis to authenticated;
grant usage on schema public to authenticated;

revoke all on public.perfis from anon;

commit;