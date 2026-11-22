-- EPISJ 360 0.9.157 — contas automáticas: formadores e formandos da Escola360 ficam com perfil sem ser preciso pô-los um a um
--  · a Direção publica também `contasFormandos` ([{email,nome,turma}] — formandos ativos de turmas do ano ativo ou seguintes);
--    a lista fica em g360_config chave 'formandos' (só as funções a leem) e NÃO fica no 'publico' (os formadores não veem emails dos formandos)
--  · se a publicação não trouxer `contasFormandos` (versões antigas da app), a lista anterior fica como estava (nada se apaga)
--  · g360_perfil_de: 1) atribuído à mão 2) administrador 3) formador publicado 4) formando da Escola360 (com a turma) 5) regra dos formandos

create or replace function public.g360_publico_gravar(p jsonb) returns jsonb
language plpgsql security definer set search_path to 'public' as $function$
declare e text := g360_email(); t bigint := (extract(epoch from now()) * 1000)::bigint; atual jsonb; q jsonb := coalesce(p, '{}'::jsonb);
begin
  if not g360_direcao() then raise exception 'Só a Direção publica os dados da escola.' using errcode = '42501'; end if;
  if jsonb_typeof(q -> 'contasFormandos') = 'array' then
    insert into g360_config (chave, valor, t, por)
      values ('formandos', coalesce((select jsonb_agg(distinct jsonb_build_object('email', lower(trim(x ->> 'email')), 'nome', coalesce(x ->> 'nome',''), 'turma', coalesce(x ->> 'turma','')))
                                    from jsonb_array_elements(q -> 'contasFormandos') x
                                    where jsonb_typeof(x) = 'object' and coalesce(x ->> 'email','') like '%@%'), '[]'::jsonb), t, e)
      on conflict (chave) do update set valor = excluded.valor, t = excluded.t, por = excluded.por
      where g360_config.valor is distinct from excluded.valor;
  end if;
  q := q - 'contasFormandos';
  select valor into atual from g360_config where chave = 'publico';
  if atual is not null and (atual - 't' - 'por') = (q - 't' - 'por') then
    return jsonb_build_object('ok', true, 't', (select c.t from g360_config c where c.chave = 'publico'), 'igual', true);
  end if;
  insert into g360_config (chave, valor, t, por) values ('publico', q, t, e)
    on conflict (chave) do update set valor = excluded.valor, t = excluded.t, por = excluded.por;
  insert into g360_config (chave, valor, t, por)
    values ('profs', coalesce((select jsonb_agg(jsonb_build_object('id', x ->> 'id', 'nome', x ->> 'nome', 'email', lower(x ->> 'email')))
                               from jsonb_array_elements(case when jsonb_typeof(q -> 'profs') = 'array' then q -> 'profs' else '[]'::jsonb end) x
                               where coalesce(x ->> 'email','') <> ''), '[]'::jsonb), t, e)
    on conflict (chave) do update set valor = excluded.valor, t = excluded.t, por = excluded.por;
  return jsonb_build_object('ok', true, 't', t);
end $function$;

create or replace function public.g360_perfil_de(p_email text) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $function$
declare
  e text := lower(trim(coalesce(p_email,'')));
  loja jsonb := coalesce((select valor from g360_config where chave = 'perfis'), '{}'::jsonb);
  profs jsonb := coalesce((select valor from g360_config where chave = 'profs'), '[]'::jsonb);
  forms jsonb := coalesce((select valor from g360_config where chave = 'formandos'), '[]'::jsonb);
  m record; u jsonb; x jsonb; perfil text; origem text := ''; adm boolean := false; turma text := ''; nome text := '';
  dom text := split_part(e, '@', 2); padrao text := coalesce(loja #>> '{formandos,padrao}', '');
  c jsonb := g360_const(); vis jsonb; off jsonb;
begin
  if e = '' then return jsonb_build_object('perfil', null); end if;
  select * into m from g360_membros where email = e;
  adm := coalesce(m.admin, false) or coalesce(loja -> 'admins', '[]'::jsonb) ? e;
  u := loja -> 'utilizadores' -> e;
  if u is not null and (u ->> 'perfil') in ('dexec','dped','prof','form','econ') then
    perfil := u ->> 'perfil'; origem := 'atribuído'; turma := coalesce(u ->> 'turma',''); nome := coalesce(u ->> 'nome','');
  elsif m.email is not null and not coalesce(m.admin,false) and m.perfil is not null then
    perfil := m.perfil; origem := 'atribuído'; turma := coalesce(m.turma,''); nome := coalesce(m.nome,'');
  end if;
  if perfil is null and adm then perfil := 'dexec'; origem := 'administrador'; end if;
  if perfil is null then
    select y into x from jsonb_array_elements(profs) y where lower(y ->> 'email') = e limit 1;
    if x is not null then perfil := 'prof'; origem := 'formador da EPISJ 360'; nome := coalesce(x ->> 'nome',''); end if;
  end if;
  if perfil is null then
    select y into x from jsonb_array_elements(forms) y where lower(y ->> 'email') = e limit 1;
    if x is not null then perfil := 'form'; origem := 'formando da EPISJ 360'; nome := coalesce(x ->> 'nome',''); turma := coalesce(x ->> 'turma',''); end if;
  end if;
  if perfil is null and ((coalesce(loja #> '{formandos,dominios}', '[]'::jsonb) ? dom)
                          or (padrao <> '' and e ~* padrao)) then
    perfil := 'form'; origem := 'regra dos formandos';
  end if;
  if perfil is null then return jsonb_build_object('email', e, 'perfil', null); end if;
  if nome = '' then
    select coalesce(y ->> 'nome','') into nome from jsonb_array_elements(profs || forms) y where lower(y ->> 'email') = e limit 1;
    nome := coalesce(nome, '');
  end if;
  if perfil = 'form' and turma = '' then
    select coalesce(y ->> 'turma','') into turma from jsonb_array_elements(forms) y where lower(y ->> 'email') = e limit 1;
    turma := coalesce(turma, '');
  end if;
  select coalesce(jsonb_agg(t), '[]'::jsonb) into off
    from jsonb_array_elements_text(coalesce(loja -> 'modsOff', '[]'::jsonb)) mo, jsonb_array_elements_text(c -> 'modTabs' -> mo) t;
  if adm then vis := (c -> 'separadores') || '["uti"]'::jsonb;
  else
    select coalesce(jsonb_agg(t), '[]'::jsonb) into vis
      from jsonb_array_elements_text(coalesce(loja -> 'vis' -> perfil, c -> 'visOmissao' -> perfil)) t
      where not (off ? t);
  end if;
  return jsonb_build_object('email', e, 'nome', nome, 'perfil', perfil, 'perfilNome', c -> 'perfis' ->> perfil, 'origem', origem,
    'admin', adm, 'vis', vis, 'modsOff', coalesce(loja -> 'modsOff', '[]'::jsonb), 'turma', turma);
end $function$;
revoke all on function public.g360_perfil_de(text) from public, anon, authenticated;
revoke all on function public.g360_publico_gravar(jsonb) from public, anon;
grant execute on function public.g360_publico_gravar(jsonb) to authenticated;
