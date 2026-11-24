-- EPISJ 360 0.9.235 — Ofício360 (ofícios em carta e digitais)
-- Os dados do Ofício360 vão na peça «OF» de g360_estado (como as outras peças da Direção — não precisa de políticas novas).
-- Os documentos (cartas digitalizadas, PDF recebidos, emails .eml, cópias dos ofícios enviados) vão para o bucket privado «oficios».
--    Só a Direção (g360_direcao()) lê e acrescenta. Nada se apaga nem se substitui (sem UPDATE nem DELETE). Não apaga dados.
insert into storage.buckets (id, name, public, file_size_limit)
values ('oficios', 'oficios', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;

drop policy if exists "oficios: direção lê" on storage.objects;
drop policy if exists "oficios: direção acrescenta" on storage.objects;
create policy "oficios: direção lê" on storage.objects for select to authenticated
  using (bucket_id = 'oficios' and public.g360_direcao());
create policy "oficios: direção acrescenta" on storage.objects for insert to authenticated
  with check (bucket_id = 'oficios' and public.g360_direcao());
