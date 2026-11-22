-- EPISJ 360 0.9.160 — Econo360: faturas (fotografias e PDF)
-- 1) Peça «EF» em g360_estado (lista das faturas): o perfil Economato lê e grava, como a peça «EC».
-- 2) Bucket privado «eco-faturas» no Storage com os ficheiros (fotografias comprimidas e PDF).
--    Só a Direção e o perfil Economato (g360_economato()) leem e acrescentam. Nada se apaga nem se substitui
--    (sem políticas de UPDATE/DELETE: um ficheiro guardado fica para sempre).

drop policy if exists "estado: economato lê EF" on public.g360_estado;
drop policy if exists "estado: economato grava EF" on public.g360_estado;
drop policy if exists "estado: economato atualiza EF" on public.g360_estado;
create policy "estado: economato lê EF" on public.g360_estado for select to authenticated using (nome = 'EF' and public.g360_economato());
create policy "estado: economato grava EF" on public.g360_estado for insert to authenticated with check (nome = 'EF' and public.g360_economato());
create policy "estado: economato atualiza EF" on public.g360_estado for update to authenticated using (nome = 'EF' and public.g360_economato()) with check (nome = 'EF' and public.g360_economato());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('eco-faturas', 'eco-faturas', false, 15728640,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists eco_faturas_ler on storage.objects;
drop policy if exists eco_faturas_inserir on storage.objects;
create policy eco_faturas_ler on storage.objects for select to authenticated
  using (bucket_id = 'eco-faturas' and public.g360_economato());
create policy eco_faturas_inserir on storage.objects for insert to authenticated
  with check (bucket_id = 'eco-faturas' and public.g360_economato());
