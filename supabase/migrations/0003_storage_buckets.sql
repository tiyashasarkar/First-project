-- Storage buckets for media/stickers. Both private; objects are keyed as
-- "<user_id>/<file>" so RLS can scope access to the owning user's own folder.

insert into storage.buckets (id, name, public)
values ('journal-media', 'journal-media', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('sticker-assets', 'sticker-assets', false)
on conflict (id) do nothing;

create policy "journal_media_owner_select" on storage.objects
  for select using (
    bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "journal_media_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "journal_media_owner_update" on storage.objects
  for update using (
    bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "journal_media_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "sticker_assets_owner_select" on storage.objects
  for select using (
    bucket_id = 'sticker-assets' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "sticker_assets_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'sticker-assets' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "sticker_assets_owner_update" on storage.objects
  for update using (
    bucket_id = 'sticker-assets' and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'sticker-assets' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "sticker_assets_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'sticker-assets' and auth.uid()::text = (storage.foldername(name))[1]
  );
