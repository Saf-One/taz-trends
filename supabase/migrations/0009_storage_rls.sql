-- =====================================================================
-- 0009_storage_rls.sql - secure product-images storage bucket
-- =====================================================================
-- The product-images bucket is public-read (images must be visible on the
-- storefront). Uploads are restricted to authenticated admin users only.
-- File type validation is handled client-side (ImageUploader component)
-- and should be enforced server-side via Supabase Storage policies.

-- Bucket-level: authenticated users can upload; public can only view
-- (this bucket is public = true, so RLS policies handle the access).

-- Policy: only authenticated users with admin role can insert/update/delete
-- Policy assumes profile.is_admin flag is set in profiles table.
create policy "Admin can upload product images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admin can update product images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admin can delete product images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Everyone (including anonymous) can view product images
create policy "Anyone can view product images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-images');
