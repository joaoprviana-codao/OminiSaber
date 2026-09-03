begin;

alter table public.importacoes_curriculo
  add column if not exists curriculo_id uuid references public.curriculos(id) on delete set null,
  add column if not exists versao integer;

update public.curriculos
set status = 'publicado', updated_at = now()
where status = 'aprovado';

create or replace function public.aprovar_importacao_curriculo(p_importacao_id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  imp public.importacoes_curriculo;
  novo_curriculo_id uuid;
  proxima_versao integer;
  periodo public.curriculo_periodos;
  habilidade public.habilidades_curriculares;
  descritor public.descritores_curriculares;
  objeto public.objetos_conhecimento;
  item jsonb;
  child jsonb;
  serie_num smallint;
  tri_num smallint;
begin
  if public.usuario_role() <> 'gestor' then raise exception 'Apenas gestores podem aprovar importações'; end if;
  select * into imp from public.importacoes_curriculo where id = p_importacao_id for update;
  if imp.id is null then raise exception 'Importação não encontrada'; end if;
  if imp.status <> 'revisao' then raise exception 'A importação precisa estar em revisão'; end if;
  if imp.materia_codigo is null then raise exception 'Componente curricular não identificado'; end if;

  select coalesce(max(versao), 0) + 1 into proxima_versao
  from public.curriculos
  where origem = coalesce(imp.origem, 'Não identificada')
    and ano_letivo = imp.ano_letivo
    and materia_codigo = imp.materia_codigo;

  insert into public.curriculos (nome, origem, ano_letivo, materia_codigo, versao, status, criado_por)
  values (
    coalesce(imp.origem, 'Currículo importado') || ' ' || imp.ano_letivo,
    coalesce(imp.origem, 'Não identificada'), imp.ano_letivo,
    imp.materia_codigo, proxima_versao, 'publicado', imp.importado_por
  ) returning id into novo_curriculo_id;

  for item in select payload from public.importacoes_curriculo_itens
    where importacao_id = imp.id and tipo = 'habilidade' and status not in ('rejeitado', 'revisar')
  loop
    serie_num := nullif((item ->> 'serie')::smallint, 0);
    tri_num := coalesce(nullif((item ->> 'trimestre')::smallint, 0), imp.trimestre);
    if serie_num is null or tri_num is null then continue; end if;
    insert into public.curriculo_periodos (curriculo_id, serie, trimestre)
    values (novo_curriculo_id, serie_num, tri_num)
    on conflict (curriculo_id, serie, trimestre) do update set trimestre = excluded.trimestre
    returning * into periodo;
    insert into public.habilidades_curriculares (codigo, descricao, materia_codigo)
    values (upper(item ->> 'codigo'), coalesce(nullif(item ->> 'descricao', ''), 'Descrição pendente'), imp.materia_codigo)
    on conflict (codigo, materia_codigo) do update set descricao = case when public.habilidades_curriculares.descricao = 'Descrição pendente' then excluded.descricao else public.habilidades_curriculares.descricao end
    returning * into habilidade;
    insert into public.habilidade_curriculo_periodos (habilidade_id, periodo_id, quinzena, semana, source_page)
    values (habilidade.id, periodo.id, item ->> 'quinzena', item ->> 'semana', nullif(item ->> 'source_page', '')::integer)
    on conflict (habilidade_id, periodo_id) do update set quinzena = excluded.quinzena, semana = excluded.semana, source_page = excluded.source_page;
    for child in select value from jsonb_array_elements(coalesce(item -> 'descritores', '[]'::jsonb))
    loop
      insert into public.descritores_curriculares (codigo, titulo, descricao, materia_codigo, serie, trimestre, status)
      values (upper(child ->> 'code'), upper(child ->> 'code'), nullif(child ->> 'descricao', ''), imp.materia_codigo, serie_num, tri_num, 'revisao')
      on conflict (codigo) do update set descricao = coalesce(public.descritores_curriculares.descricao, excluded.descricao)
      returning * into descritor;
      insert into public.habilidade_descritores values (habilidade.id, descritor.id, periodo.id) on conflict do nothing;
    end loop;
    for child in select value from jsonb_array_elements(coalesce(item -> 'expectativas', '[]'::jsonb))
    loop
      insert into public.expectativas_aprendizagem (habilidade_id, periodo_id, descricao) values (habilidade.id, periodo.id, child #>> '{}') on conflict do nothing;
    end loop;
    for child in select value from jsonb_array_elements(coalesce(item -> 'objetos', '[]'::jsonb))
    loop
      insert into public.objetos_conhecimento (descricao) values (child #>> '{}') on conflict (descricao) do update set descricao = excluded.descricao returning * into objeto;
      insert into public.habilidade_objetos values (habilidade.id, objeto.id, periodo.id) on conflict do nothing;
    end loop;
  end loop;
  update public.importacoes_curriculo
  set status = 'aprovada', curriculo_id = novo_curriculo_id, versao = proxima_versao, updated_at = now()
  where id = imp.id;
  return novo_curriculo_id;
end;
$$;

revoke all on function public.aprovar_importacao_curriculo(uuid) from public, anon, authenticated;
grant execute on function public.aprovar_importacao_curriculo(uuid) to authenticated;

commit;