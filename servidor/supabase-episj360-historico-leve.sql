-- EPISJ 360 0.9.175 — histórico mais leve e gravações grandes sem «statement timeout»
-- Correr uma vez no Supabase: SQL Editor › New query › colar › Run.
-- Nada é apagado: a versão atual de cada peça continua em g360_estado e as cópias antigas ficam em g360_historico.

-- 1) As peças que são cópias refazíveis da Box (textos dos documentos «tx», «tx1»…, listagens «L_*» e análises «B_*»)
--    deixam de ganhar uma cópia no histórico a cada gravação (o histórico já ia em 81 MB, quase tudo destas peças).
create or replace function public.g360_guardar_historico()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if tg_op = 'UPDATE' and old.dados is distinct from new.dados
     and not (old.nome ~ '^tx[0-9]*$' or old.nome like 'L\_%' or old.nome like 'B\_%') then
    if length(coalesce(new.dados, '')) < length(coalesce(old.dados, '')) * 0.8
       or split_part(coalesce(old.por, ''), '#', 1) is distinct from split_part(coalesce(new.por, ''), '#', 1)
       or not exists (select 1 from public.g360_historico h where h.nome = old.nome and h.guardado > now() - interval '15 minutes')
    then
      insert into public.g360_historico (nome, dados, t, por) values (old.nome, old.dados, old.t, old.por);
    end if;
  end if;
  new.atualizado := now();
  return new;
end $function$;

-- 2) Mais tempo para gravar peças grandes (o padrão do Supabase para contas autenticadas é 8 segundos)
alter role authenticated set statement_timeout = '30s';
notify pgrst, 'reload config';
