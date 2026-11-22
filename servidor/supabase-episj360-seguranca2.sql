-- EPISJ 360 0.9.145 — revisão de segurança (22/11/2026)
-- Aplicar depois de supabase-episj360-econo360.sql. Não apaga dados.

-- 1) g360_trincos: só se usa através de g360_trinco() (SECURITY DEFINER). Ninguém precisa de acesso direto à tabela.
revoke all on public.g360_trincos from anon, authenticated;

-- 2) Social360: o papel «aprovador» só aprova, comenta e pede alterações.
--    Não pode mudar o conteúdo de uma publicação (texto, redes, imagens, data, formato, resultados da publicação)
--    nem pô-la a publicar por conta própria. Pode completar uma aprovação que um editor deixou com «agendar ao aprovar».
--    O servidor (chave de serviço, sem auth.uid()) não é afetado.
create or replace function public.s360_docs_guarda() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare
  papel text;
  conteudo text[] := array['text','custom','mediaIds','firstComment','pageIds','date','format','pub','ws'];
  pub text[] := array['scheduled','publishing','published','failed'];
  k text;
begin
  if auth.uid() is null or new.col <> 'posts' then return new; end if;
  papel := public.s360_papel(new.ws);
  if papel in ('admin', 'editor') then return new; end if;
  if tg_op = 'INSERT' then
    if coalesce(new.dados ->> 'status', 'draft') = any(pub) then
      raise exception 'Só administradores e editores agendam publicações.' using errcode = '42501';
    end if;
    return new;
  end if;
  foreach k in array conteudo loop
    if (new.dados -> k) is distinct from (old.dados -> k) then
      raise exception 'Quem aprova não pode mudar o conteúdo da publicação (%).', k using errcode = '42501';
    end if;
  end loop;
  if new.ws is distinct from old.ws then
    raise exception 'Não é possível mudar a publicação de espaço.' using errcode = '42501';
  end if;
  if coalesce(new.dados ->> 'status', '') is distinct from coalesce(old.dados ->> 'status', '')
     and coalesce(new.dados ->> 'status', '') = any(pub)
     and not (coalesce(old.dados ->> 'autoSchedule', '') = 'true' and new.dados ->> 'status' in ('scheduled', 'published')) then
    raise exception 'Só administradores e editores agendam publicações.' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function public.s360_docs_guarda() from public, anon, authenticated;
drop trigger if exists s360_docs_guarda on public.s360_docs;
create trigger s360_docs_guarda before insert or update on public.s360_docs
  for each row execute function public.s360_docs_guarda();
