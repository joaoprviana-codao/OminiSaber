begin;

-- Rascunhos privados da devolutiva. A redação do aluno permanece imutável até
-- que o professor conclua a correção e altere seu estado para "corrigida".
create table if not exists public.rascunhos_correcao_redacao (
  redacao_id uuid not null references public.redacoes(id) on delete cascade,
  professor_id uuid not null references public.perfis(id) on delete cascade,
  nota numeric(5,2) check (nota is null or nota between 0 and 1000),
  feedback text not null default '' check (char_length(feedback) <= 20000),
  competencias jsonb not null default '[]'::jsonb check (jsonb_typeof(competencias) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (redacao_id, professor_id)
);

create index if not exists rascunhos_correcao_professor_data_idx
  on public.rascunhos_correcao_redacao (professor_id, updated_at desc);

alter table public.rascunhos_correcao_redacao enable row level security;
revoke all on public.rascunhos_correcao_redacao from anon;
grant select, insert, update, delete on public.rascunhos_correcao_redacao to authenticated;

drop policy if exists rascunhos_correcao_select on public.rascunhos_correcao_redacao;
create policy rascunhos_correcao_select on public.rascunhos_correcao_redacao
for select to authenticated using (
  (select public.usuario_role()) = 'gestor'
  or (
    professor_id = (select auth.uid())
    and (select public.usuario_tipo_professor()) = 'portugues'
    and exists (
      select 1
      from public.redacoes r
      join public.perfis aluno on aluno.id = r.aluno_id
      join public.professor_turmas pt on pt.turma_id = aluno.turma_id
      where r.id = redacao_id and pt.professor_id = (select auth.uid())
    )
  )
);

drop policy if exists rascunhos_correcao_manage on public.rascunhos_correcao_redacao;
create policy rascunhos_correcao_manage on public.rascunhos_correcao_redacao
for all to authenticated
using (
  (select public.usuario_role()) = 'gestor'
  or (
    professor_id = (select auth.uid())
    and (select public.usuario_tipo_professor()) = 'portugues'
    and exists (
      select 1
      from public.redacoes r
      join public.perfis aluno on aluno.id = r.aluno_id
      join public.professor_turmas pt on pt.turma_id = aluno.turma_id
      where r.id = redacao_id and pt.professor_id = (select auth.uid())
    )
  )
)
with check (
  (select public.usuario_role()) = 'gestor'
  or (
    professor_id = (select auth.uid())
    and (select public.usuario_tipo_professor()) = 'portugues'
    and exists (
      select 1
      from public.redacoes r
      join public.perfis aluno on aluno.id = r.aluno_id
      join public.professor_turmas pt on pt.turma_id = aluno.turma_id
      where r.id = redacao_id and pt.professor_id = (select auth.uid())
    )
  )
);

drop trigger if exists set_rascunhos_correcao_updated_at on public.rascunhos_correcao_redacao;
create trigger set_rascunhos_correcao_updated_at
before update on public.rascunhos_correcao_redacao
for each row execute function public.set_updated_at();

-- Publica a devolutiva em uma única transação. SECURITY INVOKER mantém as
-- políticas RLS ativas durante todas as gravações.
create or replace function public.corrigir_redacao(
  redacao_input uuid,
  nota_input numeric,
  feedback_input text,
  competencias_input jsonb default '[]'::jsonb,
  comentarios_input jsonb default '[]'::jsonb
)
returns public.redacoes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  resultado public.redacoes;
  item jsonb;
  competencia_numero smallint;
  competencia_nota smallint;
begin
  if nota_input is null or nota_input < 0 or nota_input > 1000 then
    raise exception 'A nota deve estar entre 0 e 1000.';
  end if;
  if char_length(btrim(coalesce(feedback_input, ''))) < 2 then
    raise exception 'A devolutiva precisa ser preenchida.';
  end if;
  if jsonb_typeof(coalesce(competencias_input, '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(comentarios_input, '[]'::jsonb)) <> 'array' then
    raise exception 'Competências e comentários devem ser listas.';
  end if;
  if (select public.usuario_role()) <> 'gestor' and not (
    (select public.usuario_tipo_professor()) = 'portugues'
    and exists (
      select 1
      from public.redacoes r
      join public.perfis aluno on aluno.id = r.aluno_id
      join public.professor_turmas pt on pt.turma_id = aluno.turma_id
      where r.id = redacao_input and pt.professor_id = (select auth.uid())
    )
  ) then
    raise exception 'Sem permissão para corrigir esta redação.';
  end if;

  update public.redacoes
  set nota = nota_input,
      feedback = btrim(feedback_input),
      status = 'corrigida',
      corrigida_por = (select auth.uid()),
      corrigida_em = now()
  where id = redacao_input
  returning * into resultado;
  if resultado.id is null then raise exception 'Redação não encontrada.'; end if;

  for item in select value from jsonb_array_elements(coalesce(competencias_input, '[]'::jsonb)) loop
    competencia_numero := (item ->> 'competencia')::smallint;
    competencia_nota := (item ->> 'nota')::smallint;
    if competencia_numero not between 1 and 5 or competencia_nota not in (0,40,80,120,160,200) then
      raise exception 'Competência ou nota inválida.';
    end if;
    insert into public.avaliacoes_competencias_redacao (redacao_id, competencia, nota, comentario, professor_id)
    values (redacao_input, competencia_numero, competencia_nota, nullif(item ->> 'comentario', ''), (select auth.uid()))
    on conflict (redacao_id, competencia) do update
      set nota = excluded.nota, comentario = excluded.comentario, professor_id = excluded.professor_id, updated_at = now();
  end loop;

  for item in select value from jsonb_array_elements(coalesce(comentarios_input, '[]'::jsonb)) loop
    insert into public.comentarios_redacao (redacao_id, professor_id, inicio_offset, fim_offset, trecho, comentario, tipo)
    values (
      redacao_input,
      (select auth.uid()),
      nullif(item ->> 'inicioOffset', '')::integer,
      nullif(item ->> 'fimOffset', '')::integer,
      nullif(item ->> 'trecho', ''),
      item ->> 'comentario',
      coalesce(nullif(item ->> 'tipo', ''), 'orientacao')
    );
  end loop;

  delete from public.rascunhos_correcao_redacao
  where redacao_id = redacao_input and professor_id = (select auth.uid());
  return resultado;
end;
$$;

revoke all on function public.corrigir_redacao(uuid,numeric,text,jsonb,jsonb) from public, anon;
grant execute on function public.corrigir_redacao(uuid,numeric,text,jsonb,jsonb) to authenticated;

commit;
