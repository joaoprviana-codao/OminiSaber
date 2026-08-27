-- OminiSaber | Biblioteca digital e leituras do aluno
-- Execute no SQL Editor do Supabase.

create table if not exists public.livros (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  autor text not null,
  materia text not null default 'Geral',
  categoria text not null default 'Didáticos',
  capa_url text,
  pdf_url text,
  sinopse text,
  paginas integer check (paginas is null or paginas > 0),
  palavras_chave text,
  quantidade_total integer not null default 0 check (quantidade_total >= 0),
  quantidade_disponivel integer not null default 0 check (quantidade_disponivel >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.livros add column if not exists materia text default 'Geral';
alter table public.livros add column if not exists categoria text default 'Didáticos';
alter table public.livros add column if not exists capa_url text;
alter table public.livros add column if not exists pdf_url text;
alter table public.livros add column if not exists sinopse text;
alter table public.livros add column if not exists paginas integer;
alter table public.livros add column if not exists palavras_chave text;

create table if not exists public.leituras_aluno (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis(id) on delete cascade,
  livro_id uuid not null references public.livros(id) on delete cascade,
  status text not null default 'lendo' check (status in ('lendo', 'concluido')),
  progresso_pct integer not null default 0 check (progresso_pct between 0 and 100),
  atualizado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (aluno_id, livro_id)
);

create index if not exists idx_livros_materia on public.livros (materia);
create index if not exists idx_livros_categoria on public.livros (categoria);
create index if not exists idx_leituras_aluno on public.leituras_aluno (aluno_id, atualizado_em desc);

alter table public.livros enable row level security;
alter table public.leituras_aluno enable row level security;

grant select on table public.livros to anon, authenticated;
grant select, insert, update on table public.leituras_aluno to authenticated;

drop policy if exists livros_public_select on public.livros;
create policy livros_public_select
  on public.livros
  for select
  to anon, authenticated
  using (true);

drop policy if exists leituras_aluno_own_select on public.leituras_aluno;
create policy leituras_aluno_own_select
  on public.leituras_aluno
  for select
  to authenticated
  using (auth.uid() = aluno_id);

drop policy if exists leituras_aluno_own_insert on public.leituras_aluno;
create policy leituras_aluno_own_insert
  on public.leituras_aluno
  for insert
  to authenticated
  with check (auth.uid() = aluno_id);

drop policy if exists leituras_aluno_own_update on public.leituras_aluno;
create policy leituras_aluno_own_update
  on public.leituras_aluno
  for update
  to authenticated
  using (auth.uid() = aluno_id)
  with check (auth.uid() = aluno_id);

insert into public.livros (
  titulo,
  autor,
  materia,
  categoria,
  sinopse,
  paginas,
  palavras_chave
)
select * from (values
  ('Dom Casmurro', 'Machado de Assis', 'Literatura Obrigatória', 'Literatura Obrigatória', 'Bentinho revisita sua história e tenta reconstruir as relações, as suspeitas e as escolhas que marcaram sua vida.', 256, 'realismo, narrador, clássico'),
  ('Física em Movimento', 'Coleção EduTech', 'Física', 'Didáticos', 'Um guia visual para compreender movimento, energia e as leis que conectam teoria e experiências cotidianas.', 142, 'força, energia, velocidade'),
  ('A célula por dentro', 'Coleção EduTech', 'Biologia', 'Apostilas', 'Diagramas e explicações para investigar as estruturas celulares e os processos que sustentam a vida.', 96, 'célula, genética, vida'),
  ('Álgebra para pensar', 'Coleção EduTech', 'Matemática', 'Didáticos', 'Problemas graduais, estratégias e exemplos para transformar relações algébricas em ferramentas de raciocínio.', 188, 'equações, álgebra, problemas')
) as seed(titulo, autor, materia, categoria, sinopse, paginas, palavras_chave)
where not exists (
  select 1 from public.livros existing where existing.titulo = seed.titulo
);

revoke insert, update, delete on table public.livros from anon, authenticated;
