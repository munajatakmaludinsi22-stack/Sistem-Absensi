-- ============================================================================
-- SIA-MIS — Migrasi v2: Kelola Akun Pengguna & Upload Foto
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New Query > Run
-- (Aman dijalankan di project yang sudah memakai supabase/schema.sql versi
-- sebelumnya — hanya menambah/menggantikan kebijakan Storage, tidak
-- menghapus data apa pun.)
--
-- Yang berubah:
--  1. Admin sekarang bisa mengunggah/mengganti/menghapus foto profil akun
--     LAIN (guru & kepsek), tidak hanya foto profilnya sendiri — dipakai
--     oleh halaman "Kelola Akun Pengguna".
--  2. (Prasyarat) Pastikan Edge Function `admin-users` sudah di-deploy —
--     lihat MIGRATION.md bagian "Deploy Edge Function admin-users" — supaya
--     tombol "Buat Akun Baru", "Reset Sandi", dan "Hapus Akun" berfungsi.
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
    )
  );

-- Catatan: kebijakan RLS pada tabel `profiles`, `username_email_map`, dan
-- fungsi `update_own_avatar` / `get_email_by_username` dari schema.sql
-- sebelumnya TIDAK berubah dan tidak perlu dijalankan ulang.
