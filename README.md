# AdTune Growth Engine

## Supabase blog setup

The live project **adtune-digital** (`vruvhdageykohohpaleb`) is the schema source of truth. Do not apply a local table redesign.

1. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY` (publishable/anon key only — never a service-role key).
2. In the Supabase SQL editor, run `supabase/sql/equalize_blog_staff_rls.sql` so admin and editor have the same blog CRUD.
3. Create staff users in Authentication, then set `public.profiles.role` to `admin` or `editor`.

Public `/blog` reads published, non-deleted posts through RLS. `/admin` requires a staff session. Posts are written as Markdown and soft-deleted via `deleted_at`.
