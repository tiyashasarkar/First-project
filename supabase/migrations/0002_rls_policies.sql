-- Row-Level Security: every table is readable/writable only by its owning user.
-- `journals.is_private` needs an *additional* app-lock gate on top of this
-- (biometric/PIN re-auth) — that lands in the Phase 9 privacy work, tracked
-- as a TODO here rather than guessed at now.

alter table public.journals enable row level security;
alter table public.pages enable row level security;
alter table public.page_elements enable row level security;
alter table public.media_assets enable row level security;
alter table public.sticker_packs enable row level security;

-- journals: direct ownership
create policy "journals_select_own" on public.journals
  for select using (auth.uid() = user_id);
create policy "journals_insert_own" on public.journals
  for insert with check (auth.uid() = user_id);
create policy "journals_update_own" on public.journals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "journals_delete_own" on public.journals
  for delete using (auth.uid() = user_id);

-- pages: ownership via parent journal
create policy "pages_select_own" on public.pages
  for select using (
    exists (select 1 from public.journals j where j.id = journal_id and j.user_id = auth.uid())
  );
create policy "pages_insert_own" on public.pages
  for insert with check (
    exists (select 1 from public.journals j where j.id = journal_id and j.user_id = auth.uid())
  );
create policy "pages_update_own" on public.pages
  for update using (
    exists (select 1 from public.journals j where j.id = journal_id and j.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.journals j where j.id = journal_id and j.user_id = auth.uid())
  );
create policy "pages_delete_own" on public.pages
  for delete using (
    exists (select 1 from public.journals j where j.id = journal_id and j.user_id = auth.uid())
  );

-- page_elements: ownership via page -> journal
create policy "page_elements_select_own" on public.page_elements
  for select using (
    exists (
      select 1 from public.pages p
      join public.journals j on j.id = p.journal_id
      where p.id = page_id and j.user_id = auth.uid()
    )
  );
create policy "page_elements_insert_own" on public.page_elements
  for insert with check (
    exists (
      select 1 from public.pages p
      join public.journals j on j.id = p.journal_id
      where p.id = page_id and j.user_id = auth.uid()
    )
  );
create policy "page_elements_update_own" on public.page_elements
  for update using (
    exists (
      select 1 from public.pages p
      join public.journals j on j.id = p.journal_id
      where p.id = page_id and j.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.pages p
      join public.journals j on j.id = p.journal_id
      where p.id = page_id and j.user_id = auth.uid()
    )
  );
create policy "page_elements_delete_own" on public.page_elements
  for delete using (
    exists (
      select 1 from public.pages p
      join public.journals j on j.id = p.journal_id
      where p.id = page_id and j.user_id = auth.uid()
    )
  );

-- media_assets: direct ownership
create policy "media_assets_select_own" on public.media_assets
  for select using (auth.uid() = user_id);
create policy "media_assets_insert_own" on public.media_assets
  for insert with check (auth.uid() = user_id);
create policy "media_assets_update_own" on public.media_assets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "media_assets_delete_own" on public.media_assets
  for delete using (auth.uid() = user_id);

-- sticker_packs: direct ownership
create policy "sticker_packs_select_own" on public.sticker_packs
  for select using (auth.uid() = user_id);
create policy "sticker_packs_insert_own" on public.sticker_packs
  for insert with check (auth.uid() = user_id);
create policy "sticker_packs_update_own" on public.sticker_packs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sticker_packs_delete_own" on public.sticker_packs
  for delete using (auth.uid() = user_id);
