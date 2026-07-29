-- ============================================================================
-- SIA-SD — Skema Supabase (Postgres)
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New Query > Run
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES (menggantikan tabel `users` di db.json)
--    Setiap baris terhubung 1:1 ke auth.users (Supabase Auth) via id (uuid).
--    Password TIDAK disimpan di sini — dikelola & di-hash oleh Supabase Auth.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  nama text not null,
  role text not null check (role in ('admin', 'guru', 'kepsek')),
  status text not null default 'aktif' check (status in ('aktif', 'nonaktif')),
  nip text,
  foto text default '',
  created_at timestamptz not null default now()
);

-- Fungsi bantu: ambil role user yang sedang login (dipakai di semua policy)
create or replace function public.current_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Update foto profil sendiri lewat fungsi security-definer ini (bukan lewat
-- policy blanket "update own row") supaya user tidak bisa mengubah kolom
-- `role` miliknya sendiri jadi 'admin' — hanya kolom foto yang bisa diubah.
create or replace function public.update_own_avatar(p_foto_url text)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles set foto = p_foto_url where id = auth.uid();
end;
$$;
grant execute on function public.update_own_avatar(text) to authenticated;

-- Fungsi bantu: lookup email dari username, dipanggil SEBELUM login (anon)
-- supaya form login tetap pakai "username", bukan email.
create table public.username_email_map (
  username text primary key,
  email text not null
);

create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
stable
as $$
  select email from public.username_email_map where lower(username) = lower(p_username)
$$;

grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. GURU
-- ----------------------------------------------------------------------------
create table public.guru (
  id text primary key default ('G-' || extract(epoch from now())::bigint || floor(random()*1000)::int),
  nip text unique not null,
  nama text not null,
  email text,
  kelas_diampu text,
  status text not null default 'aktif' check (status in ('aktif', 'tidak aktif')),
  foto text default ''
);

-- ----------------------------------------------------------------------------
-- 3. SISWA
-- ----------------------------------------------------------------------------
create table public.siswa (
  id text primary key default ('S-' || extract(epoch from now())::bigint || floor(random()*1000)::int),
  nis text unique not null,
  nisn text,
  nama text not null,
  kelas text not null,
  jenis_kelamin text check (jenis_kelamin in ('L', 'P')),
  nama_ayah text,
  nama_ibu text,
  alamat text,
  status text not null default 'aktif' check (status in ('aktif', 'tidak aktif')),
  foto text default ''
);

-- ----------------------------------------------------------------------------
-- 4. KELAS
-- ----------------------------------------------------------------------------
create table public.kelas (
  id text primary key,
  nama text not null,
  wali_kelas_id text references public.guru(id) on delete set null,
  wali_kelas_nama text,
  kapasitas int default 0
);

-- ----------------------------------------------------------------------------
-- 5. ABSENSI (satu baris per siswa per tanggal — unique constraint mencegah duplikat)
-- ----------------------------------------------------------------------------
create table public.absensi (
  id text primary key,
  tanggal date not null,
  nis text not null,
  nama_siswa text,
  kelas text,
  status text not null check (status in ('Hadir', 'Izin', 'Sakit', 'Alpha', 'Terlambat')),
  catatan text default '',
  dibuat_oleh text,
  "timestamp" timestamptz not null default now(),
  unique (tanggal, nis)
);
create index idx_absensi_tanggal_kelas on public.absensi (tanggal, kelas);

-- ----------------------------------------------------------------------------
-- 6. PENGUMUMAN
-- ----------------------------------------------------------------------------
create table public.pengumuman (
  id text primary key default ('ANN-' || extract(epoch from now())::bigint),
  judul text not null,
  isi text,
  tanggal date not null default current_date,
  dibuat_oleh text,
  target text default 'Semua'
);

-- ----------------------------------------------------------------------------
-- 7. KALENDER AKADEMIK
-- ----------------------------------------------------------------------------
create table public.kalender (
  id text primary key default ('CAL-' || extract(epoch from now())::bigint),
  tanggal date not null,
  kegiatan text not null,
  tipe text check (tipe in ('Libur', 'Ujian', 'Kegiatan Sekolah'))
);

-- ----------------------------------------------------------------------------
-- 8. LOGS / AUDIT TRAIL
-- ----------------------------------------------------------------------------
create table public.logs (
  id text primary key default ('LOG-' || extract(epoch from now())::bigint),
  "timestamp" timestamptz not null default now(),
  pengguna text,
  role text,
  aktivitas text,
  ip_address text default ''
);

-- Ditulis lewat fungsi security-definer supaya SEMUA role bisa menulis log,
-- tapi hanya admin yang bisa MEMBACA seluruh log (lihat policy di bawah).
create or replace function public.add_log(p_aktivitas text)
returns void
language plpgsql
security definer
as $$
declare
  v_nama text;
  v_role text;
begin
  select nama, role into v_nama, v_role from public.profiles where id = auth.uid();
  insert into public.logs (pengguna, role, aktivitas)
  values (coalesce(v_nama, 'system'), coalesce(v_role, 'system'), p_aktivitas);
end;
$$;
grant execute on function public.add_log(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 9. SETTINGS (single-row table)
-- ----------------------------------------------------------------------------
create table public.settings (
  id int primary key default 1 check (id = 1),
  nama_sekolah text,
  npsn text,
  alamat text,
  kepala_sekolah text,
  nip_kepala_sekolah text,
  logo_sekolah text,
  semester_aktif text,
  tahun_ajaran_aktif text
);
insert into public.settings (id, nama_sekolah, npsn, alamat, kepala_sekolah, nip_kepala_sekolah, semester_aktif, tahun_ajaran_aktif)
values (1, 'MI Sudajaya', '60712345', 'Kp. Sudajaya, Kec. Cimanggung, Kab. Sumedang, Jawa Barat', 'H. Ahmad Dahlan, S.Pd.I.', '196804121991031004', 'Ganjil', '2025/2026');

-- ----------------------------------------------------------------------------
-- 10. BACKUPS (metadata; file JSON asli disimpan di Supabase Storage)
-- ----------------------------------------------------------------------------
create table public.backups (
  id text primary key default ('B-' || extract(epoch from now())::bigint),
  nama_file text not null,
  storage_path text not null,
  tanggal_backup timestamptz not null default now(),
  ukuran text,
  status text default 'Sukses'
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.guru enable row level security;
alter table public.siswa enable row level security;
alter table public.kelas enable row level security;
alter table public.absensi enable row level security;
alter table public.pengumuman enable row level security;
alter table public.kalender enable row level security;
alter table public.logs enable row level security;
alter table public.settings enable row level security;
alter table public.backups enable row level security;
alter table public.username_email_map enable row level security;

-- profiles: setiap user boleh baca profilnya sendiri; admin boleh baca semua
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.current_role() = 'admin');
create policy "profiles_admin_write" on public.profiles
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- guru / siswa / kelas / kalender / settings: semua role login boleh baca,
-- hanya admin boleh tulis (guru boleh tambah siswa, meniru server.ts lama)
create policy "guru_select" on public.guru for select using (auth.role() = 'authenticated');
create policy "guru_admin_write" on public.guru for all
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "siswa_select" on public.siswa for select using (auth.role() = 'authenticated');
create policy "siswa_admin_guru_write" on public.siswa for insert
  with check (public.current_role() in ('admin', 'guru'));
create policy "siswa_admin_guru_update" on public.siswa for update
  using (public.current_role() in ('admin', 'guru'));
create policy "siswa_admin_delete" on public.siswa for delete
  using (public.current_role() = 'admin');

create policy "kelas_select" on public.kelas for select using (auth.role() = 'authenticated');
create policy "kelas_admin_write" on public.kelas for all
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "absensi_select" on public.absensi for select using (auth.role() = 'authenticated');
create policy "absensi_admin_guru_write" on public.absensi for insert
  with check (public.current_role() in ('admin', 'guru'));
create policy "absensi_admin_guru_update" on public.absensi for update
  using (public.current_role() in ('admin', 'guru'));
create policy "absensi_admin_delete" on public.absensi for delete
  using (public.current_role() = 'admin');

create policy "pengumuman_select" on public.pengumuman for select using (auth.role() = 'authenticated');
create policy "pengumuman_admin_guru_write" on public.pengumuman for insert
  with check (public.current_role() in ('admin', 'guru'));
create policy "pengumuman_admin_guru_delete" on public.pengumuman for delete
  using (public.current_role() in ('admin', 'guru'));

create policy "kalender_select" on public.kalender for select using (auth.role() = 'authenticated');
create policy "kalender_admin_write" on public.kalender for all
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "settings_select" on public.settings for select using (auth.role() = 'authenticated');
create policy "settings_admin_update" on public.settings for update
  using (public.current_role() = 'admin');

create policy "backups_admin_only" on public.backups for all
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- logs: tulis lewat fungsi add_log() (security definer, jadi tidak butuh policy insert),
-- baca hanya admin
create policy "logs_admin_select" on public.logs for select
  using (public.current_role() = 'admin');

-- username_email_map: tidak ada policy select untuk anon/authenticated —
-- akses HANYA lewat fungsi get_email_by_username() (security definer).
-- Hanya admin yang boleh menambah baris (saat membuat akun baru).
create policy "username_map_admin_write" on public.username_email_map for all
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- ============================================================================
-- STORAGE: bucket "avatars" untuk foto profil pengguna, foto guru & siswa.
-- Jalankan create bucket lewat Dashboard > Storage > New bucket ("avatars",
-- Public ON) TERLEBIH DAHULU, baru jalankan policy di bawah ini.
--
-- Konvensi path:
--   profil/{uid-auth}/avatar.<ext>   -> foto profil milik user sendiri
--   guru/{id-guru}/foto.<ext>        -> foto resmi guru (dikelola admin)
--   siswa/{id-siswa}/foto.<ext>      -> foto resmi siswa (dikelola admin/guru)
-- ============================================================================
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

-- Catatan: folder "profil/{uid}" boleh ditulis oleh pemilik akun sendiri
-- ATAUPUN oleh admin (dipakai halaman "Kelola Akun Pengguna" agar admin bisa
-- mengunggahkan foto untuk akun guru/kepsek/admin lain). Folder "sekolah"
-- (logo sekolah, satu file global) hanya boleh ditulis admin.
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

-- ============================================================================
-- SEED AKUN AWAL (jalankan SETELAH membuat user via Supabase Auth Dashboard
-- atau Admin API — lihat MIGRATION.md langkah 3). Contoh template:
--
-- Catatan: "misudajaya.sch.id" di bawah ini contoh domain email —
-- ganti dengan domain email resmi madrasah Anda kalau sudah ada
-- (atau tetap pakai domain contoh ini kalau belum punya domain sendiri,
-- karena email ini HANYA dipakai Supabase Auth secara internal untuk
-- login, tidak perlu benar-benar bisa menerima email).
-- ============================================================================
-- insert into public.username_email_map (username, email) values
--   ('admin', 'admin@misudajaya.sch.id'),
--   ('guru1', 'guru1@misudajaya.sch.id'),
--   ('kepsek', 'kepsek@misudajaya.sch.id');
--
-- insert into public.profiles (id, username, nama, role, status, nip) values
--   ('<uuid-dari-auth.users-admin>', 'admin', 'Administrator MI Sudajaya', 'admin', 'aktif', null),
--   ('<uuid-dari-auth.users-guru1>', 'guru1', 'Ahmad Fauzi, S.Pd.I.', 'guru', 'aktif', '198804122015031002'),
--   ('<uuid-dari-auth.users-kepsek>', 'kepsek', 'H. Ahmad Dahlan, S.Pd.I.', 'kepsek', 'aktif', null);
