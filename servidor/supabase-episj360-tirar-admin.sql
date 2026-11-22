-- EPISJ 360 0.9.179 — um administrador pode tirar-se (ou tirar outro) da lista de administradores.
-- Antes, a conta de quem gravava voltava sempre à lista. Agora só volta se a escola ficasse sem NENHUM administrador
-- (lista vazia e ninguém marcado como administrador em g360_membros).
-- Correr uma vez no Supabase: SQL Editor › New query › colar › Run.
create or replace function public.g360_perfis_gravar(p_loja jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare e text := g360_email(); l jsonb := coalesce(p_loja, '{}'::jsonb);
begin
  if not g360_admin() then raise exception 'Só os administradores da EPISJ 360 gerem os perfis.' using errcode = '42501'; end if;
  if jsonb_array_length(coalesce(l -> 'admins', '[]'::jsonb)) = 0 and not exists (select 1 from g360_membros where admin) then
    l := jsonb_set(l, '{admins}', jsonb_build_array(e));
  end if;
  l := l || jsonb_build_object('t', (extract(epoch from now()) * 1000)::bigint, 'por', e);
  insert into g360_config (chave, valor, t, por) values ('perfis', l, (l ->> 't')::bigint, e)
    on conflict (chave) do update set valor = excluded.valor, t = excluded.t, por = excluded.por;
  return jsonb_build_object('ok', true, 'loja', l);
end $function$;
