-- Equalize admin and editor blog CRUD on the live adtune-digital schema.
-- Does not create or alter tables. Run in the Supabase SQL editor after backup.
-- Relies on existing private.is_editor() (true for both editor and admin).

do $$
declare
  r record;
begin
  for r in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('blog_posts', 'categories', 'tags', 'blog_post_tags', 'media')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;

  for r in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') ilike '%blog-media%'
        or coalesce(with_check, '') ilike '%blog-media%'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end;
$$;

create policy "Published posts are public"
  on public.blog_posts for select
  using (status = 'published' and deleted_at is null);

create policy "Staff read all posts"
  on public.blog_posts for select
  to authenticated
  using (private.is_editor());

create policy "Staff create posts"
  on public.blog_posts for insert
  to authenticated
  with check (private.is_editor() and author_id = auth.uid());

create policy "Staff update posts"
  on public.blog_posts for update
  to authenticated
  using (private.is_editor())
  with check (private.is_editor());

create policy "Active categories are public"
  on public.categories for select
  using (deleted_at is null);

create policy "Staff read categories"
  on public.categories for select
  to authenticated
  using (private.is_editor());

create policy "Staff write categories"
  on public.categories for insert
  to authenticated
  with check (private.is_editor());

create policy "Staff update categories"
  on public.categories for update
  to authenticated
  using (private.is_editor())
  with check (private.is_editor());

create policy "Active tags are public"
  on public.tags for select
  using (deleted_at is null);

create policy "Staff read tags"
  on public.tags for select
  to authenticated
  using (private.is_editor());

create policy "Staff write tags"
  on public.tags for insert
  to authenticated
  with check (private.is_editor());

create policy "Staff update tags"
  on public.tags for update
  to authenticated
  using (private.is_editor())
  with check (private.is_editor());

create policy "Tags of published posts are public"
  on public.blog_post_tags for select
  using (
    exists (
      select 1
      from public.blog_posts p
      where p.id = blog_post_id
        and p.status = 'published'
        and p.deleted_at is null
    )
  );

create policy "Staff read post tags"
  on public.blog_post_tags for select
  to authenticated
  using (private.is_editor());

create policy "Staff write post tags"
  on public.blog_post_tags for insert
  to authenticated
  with check (private.is_editor());

create policy "Staff delete post tags"
  on public.blog_post_tags for delete
  to authenticated
  using (private.is_editor());

create policy "Active media is public"
  on public.media for select
  using (deleted_at is null);

create policy "Staff read media"
  on public.media for select
  to authenticated
  using (private.is_editor());

create policy "Staff write media"
  on public.media for insert
  to authenticated
  with check (private.is_editor() and uploaded_by = auth.uid());

create policy "Staff update media"
  on public.media for update
  to authenticated
  using (private.is_editor())
  with check (private.is_editor());

create policy "Public reads blog media"
  on storage.objects for select
  using (bucket_id = 'blog-media');

create policy "Staff upload blog media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'blog-media'
    and private.is_editor()
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Staff update blog media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'blog-media'
    and private.is_editor()
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'blog-media'
    and private.is_editor()
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
