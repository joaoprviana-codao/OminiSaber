-- OminiSaber | Migracao da Etapa 2: secoes fisicas e alocacao
-- Execute depois de ominisaber-schema-biblioteca.sql e ominisaber-schema-estoque-etapa1.sql.

create table if not exists public.secoes_fisicas (
  id uuid primary key default gen_random_uuid(),
  nome varchar(100) not null,
  genero_associado varchar(80) not null,
  capacidade_maxima integer not null check (capacidade_maxima > 0),
  ocupacao_atual integer not null default 0 check (ocupacao_atual >= 0 and ocupacao_atual <= capacidade_maxima),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint secoes_fisicas_nome_unico unique (nome)
);

alter table public.exemplares add column if not exists secao_fisica_id uuid references public.secoes_fisicas(id) on delete set null;
create index if not exists idx_exemplares_secao_fisica on public.exemplares (secao_fisica_id);

alter table public.secoes_fisicas enable row level security;
grant select, insert, update on public.secoes_fisicas to authenticated;
grant update on public.exemplares to authenticated;

drop policy if exists secoes_fisicas_staff_select on public.secoes_fisicas;
create policy secoes_fisicas_staff_select on public.secoes_fisicas for select to authenticated
  using (public.usuario_role() in ('bibliotecaria', 'gestor'));
drop policy if exists secoes_fisicas_staff_insert on public.secoes_fisicas;
create policy secoes_fisicas_staff_insert on public.secoes_fisicas for insert to authenticated
  with check (public.usuario_role() in ('bibliotecaria', 'gestor'));
drop policy if exists secoes_fisicas_staff_update on public.secoes_fisicas;
create policy secoes_fisicas_staff_update on public.secoes_fisicas for update to authenticated
  using (public.usuario_role() in ('bibliotecaria', 'gestor'))
  with check (public.usuario_role() in ('bibliotecaria', 'gestor'));

-- Aloca em uma transacao e recalcula a ocupacao a partir dos exemplares associados.
create or replace function public.biblioteca_alocar_exemplares(p_secao_fisica_id uuid, p_exemplar_ids uuid[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_secao public.secoes_fisicas;
  v_quantidade integer := coalesce(array_length(p_exemplar_ids, 1), 0);
  v_novos_livros integer;
begin
  if public.usuario_role() not in ('bibliotecaria', 'gestor') then raise exception 'Sem permissao'; end if;
  select * into v_secao from public.secoes_fisicas where id = p_secao_fisica_id for update;
  if v_secao.id is null then raise exception 'Secao fisica nao encontrada'; end if;
  if v_quantidade = 0 then raise exception 'Selecione ao menos um exemplar'; end if;
  if v_quantidade > v_secao.capacidade_maxima - v_secao.ocupacao_atual then raise exception 'Capacidade da secao excedida'; end if;
  select count(*) into v_novos_livros from public.exemplares where id = any(p_exemplar_ids) and secao_fisica_id is null;
  if v_novos_livros <> v_quantidade then raise exception 'Um ou mais exemplares ja foram alocados'; end if;
  update public.exemplares set secao_fisica_id = p_secao_fisica_id where id = any(p_exemplar_ids) and secao_fisica_id is null;
  update public.secoes_fisicas set ocupacao_atual = ocupacao_atual + v_quantidade, updated_at = now() where id = p_secao_fisica_id;
  return jsonb_build_object('secao_id', p_secao_fisica_id, 'quantidade', v_quantidade);
end;
$$;
grant execute on function public.biblioteca_alocar_exemplares(uuid, uuid[]) to authenticated;

-- Consulta opcional para conferir a ocupacao real e corrigir dados legados.
update public.secoes_fisicas section
set ocupacao_atual = (select count(*) from public.exemplares copy where copy.secao_fisica_id = section.id);
