-- OminiSaber | Catálogo e progresso de conquistas
-- Execute depois de backend/ominisaber-schema.sql.

begin;

create table if not exists public.conquistas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null,
  requisito text not null,
  categoria text not null default 'geral' check (categoria in ('trilhas', 'redacao', 'leitura', 'geral')),
  xp integer not null default 0 check (xp >= 0),
  icone text not null default 'workspace_premium',
  created_at timestamptz not null default now()
);

create table if not exists public.conquistas_aluno (
  id uuid primary key default gen_random_uuid(),
  conquista_id uuid not null references public.conquistas(id) on delete cascade,
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  desbloqueado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (conquista_id, aluno_id)
);

create index if not exists idx_conquistas_categoria
  on public.conquistas (categoria);

create index if not exists idx_conquistas_aluno_aluno
  on public.conquistas_aluno (aluno_id, desbloqueado_em desc);

alter table public.conquistas enable row level security;
alter table public.conquistas_aluno enable row level security;

grant select on table public.conquistas to anon, authenticated;
grant select on table public.conquistas_aluno to authenticated;

drop policy if exists conquistas_public_select on public.conquistas;
create policy conquistas_public_select
  on public.conquistas
  for select
  to anon, authenticated
  using (true);

drop policy if exists conquistas_aluno_own_select on public.conquistas_aluno;
create policy conquistas_aluno_own_select
  on public.conquistas_aluno
  for select
  to authenticated
  using ((select auth.uid()) = aluno_id);

insert into public.conquistas (id, nome, descricao, requisito, categoria, xp, icone)
values
  ('00000000-0000-0000-0000-000000000001', 'Primeira Redação', 'Sua primeira produção foi enviada para avaliação.', 'Envie sua primeira redação.', 'redacao', 150, 'edit_note'),
  ('00000000-0000-0000-0000-000000000002', 'Leitor Assíduo', 'Você concluiu seu primeiro empréstimo na biblioteca.', 'Conclua um empréstimo de livro.', 'leitura', 200, 'menu_book'),
  ('00000000-0000-0000-0000-000000000003', 'Explorador de Trilhas', 'Você iniciou sua jornada de atividades.', 'Conclua sua primeira atividade.', 'trilhas', 100, 'route'),
  ('00000000-0000-0000-0000-000000000004', 'Foco Total', 'Sua consistência trouxe uma média de excelência.', 'Alcance média acima de 8 em uma matéria.', 'geral', 250, 'local_fire_department')
on conflict (id) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  requisito = excluded.requisito,
  categoria = excluded.categoria,
  xp = excluded.xp,
  icone = excluded.icone;

-- Atribuições em conquistas_aluno devem ser feitas por uma função segura
-- ou por um processo administrativo. O aluno só pode consultar as próprias.
revoke insert, update, delete on table public.conquistas from anon, authenticated;
revoke insert, update, delete on table public.conquistas_aluno from anon, authenticated;

commit;
