
CREATE POLICY "Authenticated can view shop logos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'shop-logos');

CREATE POLICY "Admins upload shop logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update shop logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'shop-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete shop logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'shop-logos' AND public.has_role(auth.uid(), 'admin'));
