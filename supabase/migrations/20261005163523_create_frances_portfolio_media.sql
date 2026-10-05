/*
# Create Frances Braimah portfolio media gallery

1. New Tables
- `portfolio_media` stores public photo and video uploads for Frances's portfolio.
- `id` (uuid, primary key)
- `file_name` (text, original display name)
- `storage_path` (text, path inside the portfolio-media bucket)
- `media_type` (text, photo or video)
- `created_at` (timestamp, upload time)

2. Storage
- Create the public `portfolio-media` bucket so uploaded gallery items can be displayed directly.
- Allow the no-sign-in portfolio to list, upload, update, and remove only objects inside this bucket.

3. Security
- Enable RLS on `portfolio_media`.
- Add separate anon/authenticated policies for each CRUD operation because this is an intentionally public, single-tenant portfolio.
- Scope storage policies to the `portfolio-media` bucket and limit accepted object types to image and video MIME families.

4. Important Notes
- This portfolio intentionally has no sign-in screen, so the gallery is shared and public.
- The interface also enforces a 50 MB upload limit before sending files to storage.
*/

CREATE TABLE IF NOT EXISTS public.portfolio_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view portfolio media" ON public.portfolio_media;
CREATE POLICY "Public can view portfolio media"
ON public.portfolio_media FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can add portfolio media" ON public.portfolio_media;
CREATE POLICY "Public can add portfolio media"
ON public.portfolio_media FOR INSERT
TO anon, authenticated
WITH CHECK (media_type IN ('image', 'video'));

DROP POLICY IF EXISTS "Public can update portfolio media" ON public.portfolio_media;
CREATE POLICY "Public can update portfolio media"
ON public.portfolio_media FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (media_type IN ('image', 'video'));

DROP POLICY IF EXISTS "Public can remove portfolio media" ON public.portfolio_media;
CREATE POLICY "Public can remove portfolio media"
ON public.portfolio_media FOR DELETE
TO anon, authenticated
USING (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-media',
  'portfolio-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];

DROP POLICY IF EXISTS "Public can view portfolio uploads" ON storage.objects;
CREATE POLICY "Public can view portfolio uploads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'portfolio-media');

DROP POLICY IF EXISTS "Public can upload portfolio media" ON storage.objects;
CREATE POLICY "Public can upload portfolio media"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'portfolio-media'
  AND (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov')
);

DROP POLICY IF EXISTS "Public can update portfolio uploads" ON storage.objects;
CREATE POLICY "Public can update portfolio uploads"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'portfolio-media')
WITH CHECK (bucket_id = 'portfolio-media');

DROP POLICY IF EXISTS "Public can delete portfolio uploads" ON storage.objects;
CREATE POLICY "Public can delete portfolio uploads"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'portfolio-media');