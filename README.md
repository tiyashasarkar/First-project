# Photo Journal — Phase 0

A mobile photo journal / digital scrapbook app, built in phases. This is
**Phase 0: Foundation** — email/password auth, journal CRUD (create, rename,
delete, reorder), an empty page shell, the full Supabase schema + RLS, and a
dark mode toggle.

## Stack (Phase 0 slice)

- Expo SDK 57 + React Native, TypeScript, `expo-router` for navigation
- Supabase (Postgres, Auth, Storage) via `@supabase/supabase-js`
- `@tanstack/react-query` for server state, `zustand` for local UI state (theme)
- `.npmrc` sets `legacy-peer-deps=true` — `expo-router`'s web tab support
  pulls in a `react-dom` peer chain that otherwise conflicts under npm's
  default strict peer resolution.

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a Supabase project, then copy `.env.example` to `.env` and fill in
   your project's URL and anon key:

   ```sh
   cp .env.example .env
   ```

3. Apply the schema + RLS + storage bucket migrations in
   `supabase/migrations/` to your project, in order (via the Supabase CLI,
   `supabase db push`, or by pasting them into the SQL editor):

   - `0001_init_schema.sql` — journals, pages, page_elements, media_assets,
     sticker_packs
   - `0002_rls_policies.sql` — row-level security, scoped to the owning user
   - `0003_storage_buckets.sql` — `journal-media` and `sticker-assets`
     buckets, RLS'd to `<user_id>/...` paths

4. In your Supabase project's Auth settings, enable email/password sign-in
   (email confirmations on is fine — sign-up shows a "check your email"
   message).

5. Run the app:

   ```sh
   npm run web       # quickest way to sanity-check UI changes
   npm run ios        # requires a dev client / EAS build, not Expo Go
   npm run android     # requires a dev client / EAS build, not Expo Go
   ```

   Google sign-in and native Skia/gesture modules aren't in Phase 0 yet, but
   once they land this app will need a dev client (`npx expo run:ios` /
   `eas build --profile development`) rather than plain Expo Go.

## What's here

- `app/` — file-based routes (`expo-router`): `(auth)` for sign-in/sign-up,
  `(app)` for the authenticated journal list, journal detail, and the empty
  page shell.
- `context/` — `AuthProvider` (Supabase session) and `ThemeProvider`
  (light/dark/system, backed by the `zustand` store in `store/`).
- `hooks/` — React Query hooks for journals and pages.
- `lib/supabase.ts` — Supabase client (AsyncStorage-backed session
  persistence). Not yet passed a generated `Database` generic — there's no
  live project to generate types from until you connect one; hooks cast
  against the hand-written row types in `types/database.ts` in the meantime.
- `supabase/migrations/` — SQL schema, RLS, and storage bucket setup.

## Known gaps / deferred to later phases

- **Freeform canvas** (Phase 1): the page shell at `app/(app)/pages/[pageId].tsx`
  is a placeholder `View`. Skia + gesture-handler + reanimated land with the
  canvas engine, not before.
- **Google sign-in**: only email/password is wired up. Add it once you have
  an OAuth client ID.
- **`is_private` enforcement**: the column exists and RLS already restricts
  every table to its owning user, but the *extra* app-lock gate for private
  journals (biometric/PIN re-auth) is Phase 9 work — don't treat the column
  alone as sufficient privacy today.
- **Offline queueing, compression, encryption at rest**: not implemented in
  Phase 0; see the phase plan for where each lands.
