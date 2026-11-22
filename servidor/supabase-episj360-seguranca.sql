-- EPISJ 360 0.9.133 — segurança: só contas do Office 365 da própria escola contam como utilizadores da EPISJ 360.
-- Aplicado no projeto episj360 (oovqekytlhkbinfdxjwf) a 22/11/2026.
--
-- Antes, g360_email() aceitava qualquer sessão vinda do fornecedor «azure» e confiava no email que vinha nela.
-- Se o fornecedor Azure do Supabase alguma vez aceitar contas de outras organizações (multi-inquilino), uma conta de
-- outra organização com o email de alguém da escola passaria a ser tratada como essa pessoa (ataque conhecido como «nOAuth»).
-- Agora a identidade tem de ter sido emitida pelo inquilino da escola (1f5546c5-0267-4003-b3fa-80c4372f6d2d).

create or replace function public.g360_tenant_ok() returns boolean
language sql stable security definer set search_path = public as $f$
  select exists (select 1 from auth.identities i
                  where i.user_id = auth.uid() and i.provider = 'azure'
                    and coalesce(i.identity_data->>'iss','') like '%/1f5546c5-0267-4003-b3fa-80c4372f6d2d/%') $f$;
revoke all on function public.g360_tenant_ok() from public, anon;
grant execute on function public.g360_tenant_ok() to authenticated;

create or replace function public.g360_email() returns text
language sql stable set search_path = public as $f$
  select case when (coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '') = 'azure'
                    or coalesce(auth.jwt() -> 'app_metadata' -> 'providers', '[]'::jsonb) ? 'azure')
                   and public.g360_tenant_ok()
              then lower(coalesce(auth.jwt() ->> 'email', '')) else '' end $f$;

-- O primeiro administrador só pode ser reclamado por uma conta @episj.com (e só quando ainda não há nenhum).
create or replace function public.g360_reclamar_admin() returns boolean
language plpgsql security definer set search_path = public as $f$
declare em text := public.g360_email(); nm text := coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', '');
begin
  if em = '' then return false; end if;
  if exists (select 1 from public.g360_membros where admin) then
    return exists (select 1 from public.g360_membros where email = em and admin);
  end if;
  if em not like '%@episj.com' then return false; end if;
  insert into public.g360_membros (email, nome, perfil, admin) values (em, nm, 'dexec', true)
    on conflict (email) do update set admin = true, perfil = 'dexec';
  return true;
end $f$;
