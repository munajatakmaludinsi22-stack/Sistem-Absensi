-- ============================================================================
-- SIA-MIS — Migrasi v3: Upload Logo Sekolah
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New Query > Run
-- (Aman dijalankan setelah supabase/schema.sql dan migration_v2_accounts.sql
-- — hanya menambah izin folder baru di bucket Storage "avatars", tidak
-- menghapus data apa pun.)
--
-- Yang berubah: admin sekarang bisa mengunggah logo sekolah (satu file
-- global) ke folder "sekolah/" pada bucket avatars — dipakai halaman
-- Pengaturan agar logo tidak lagi bergantung pada link gambar eksternal
-- yang beresolusi rendah / bisa mati sewaktu-waktu.
-- ============================================================================

drop policy if exists "avatars_write" on storage.objects;
drop policy if exists "avatars_update" on storage.objects;
drop policy if exists "avatars_delete" on storage.objects;

create policy "avatars_write" on storage.objects for insert
  with check (
    bucket_id = 'avatars' and (
      ((storage.foldername(name))[1] = 'profil' and (
        (storage.foldername(name))[2] = auth.uid()::text
        or public.current_role() = 'admin'
      ))
      or ((storage.foldername(name))[1] in ('guru', 'siswa') and public.current_role() in ('admin', 'guru'))
      or ((storage.foldername(name))[1] = 'sekolah' and public.current_role() = 'admin')
    )
  );

create policy "avatars_update" on storage.objects for update
  using (
    bucket_id = 'avatars' and (
      ((storage.foldername(name))[1] = 'profil' and (
        (storage.foldername(name))[2] = auth.uid()::text
        or public.current_role() = 'admin'
      ))
      or ((storage.foldername(name))[1] in ('guru', 'siswa') and public.current_role() in ('admin', 'guru'))
      or ((storage.foldername(name))[1] = 'sekolah' and public.current_role() = 'admin')
    )
  );

create policy "avatars_delete" on storage.objects for delete
  using (
    bucket_id = 'avatars' and (
      ((storage.foldername(name))[1] = 'profil' and (
        (storage.foldername(name))[2] = auth.uid()::text
        or public.current_role() = 'admin'
      ))
      or ((storage.foldername(name))[1] in ('guru', 'siswa') and public.current_role() in ('admin', 'guru'))
      or ((storage.foldername(name))[1] = 'sekolah' and public.current_role() = 'admin')
    )
  );
