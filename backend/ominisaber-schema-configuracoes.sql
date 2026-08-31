-- Preferencias e dados editaveis do perfil do aluno.
alter table public.perfis
  add column if not exists tema_preferido text not null default 'light'
    check (tema_preferido in ('light', 'dark')),
  add column if not exists avatar_url text;

alter table public.perfis enable row level security;

-- Evita que um cliente altere role, matricula ou turma_id pela API.
revoke update on public.perfis from authenticated;
grant update (nome, avatar_url, tema_preferido) on public.perfis to authenticated;

-- O aluno pode consultar e editar somente o proprio perfil.
drop policy if exists "Alunos podem consultar o proprio perfil" on public.perfis;
create policy "Alunos podem consultar o proprio perfil"
  on public.perfis for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Alunos podem atualizar o proprio perfil" on public.perfis;
create policy "Alunos podem atualizar o proprio perfil"
  on public.perfis for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Mantem updated_at consistente para alteracoes de perfil e tema.
create or replace function public.atualizar_perfil_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists perfis_updated_at on public.perfis;
create trigger perfis_updated_at
before update on public.perfis
for each row execute procedure public.atualizar_perfil_updated_at();
