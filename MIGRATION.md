# Migrasi Backend: Express + db.json → Supabase

## Ringkasan perbaikan
| # | Temuan lama | Status setelah migrasi |
|---|---|---|
| 1 | Metadata bilang "berbasis Google Apps Script + Spreadsheet", padahal backend-nya Express + `db.json` lokal | Diganti total ke Supabase (Postgres asli) |
| 2 | Tidak kompatibel dengan `doGet`/`doPost` GAS (routing REST + path param) | Tidak relevan lagi — Supabase punya REST API (PostgREST) & client SDK sendiri |
| 3 | Header `Authorization: Bearer` akan kena masalah CORS preflight di GAS | Tidak relevan lagi — supabase-js menangani auth dengan benar dari browser |
| 4 | **Bug: token hasil login dibuang, `setAuthToken()` tak pernah dipanggil** | Diperbaiki — sesi kini ditangani otomatis oleh supabase-js (`persistSession`) |
| 5 | Password disimpan **plaintext** di `db.json` | Ditangani Supabase Auth (hashing, expiry, refresh token) |
| 6 | Sesi login disimpan di in-memory `Map`, hilang tiap server restart | Diganti sesi JWT Supabase Auth, persisten & valid lintas request |
| 7 | Otorisasi hanya dicek manual per-route (`if role !== 'admin'`) | Ditegakkan di level database lewat Row Level Security (RLS) — tidak bisa dilewati walau ada bug di frontend |
| 8 | `App.tsx` mempercayai mentah-mentah JSON `user` di localStorage (bisa dipalsukan lewat devtools) | Diganti verifikasi sesi asli via `supabase.auth` + query `profiles` yang dibatasi RLS |
| 9 | Endpoint `/change-password` dipanggil `Profile.tsx` tapi tidak pernah diimplementasikan di server | Diimplementasikan via `supabase.auth.updateUser()` |
| 10 | Backup/restore pakai filesystem lokal (`fs.writeFileSync`) | Diganti Supabase Storage (bucket `backups`) |
| 11 | Kredensial guru baru dikirim polos di response API | Masih ada di respons `api.post('/guru', ...)` untuk kompatibilitas UI — **rekomendasi**: pindahkan pembuatan akun guru ke Supabase Admin API di sisi server (lihat langkah 5) supaya tidak lewat browser sama sekali |

## Langkah setup

### 1. Buat project Supabase
Buka https://supabase.com → New Project → catat **Project URL** dan **anon public key** (Settings > API).

### 2. Jalankan skema database
Buka **SQL Editor** di dashboard Supabase → tempel isi `supabase/schema.sql` → **Run**.

### 3. Buat akun login awal
Supabase Auth butuh *email*, sedangkan form login di aplikasi ini pakai *username*. Solusinya: buat user di Supabase Auth dengan email sintetis, lalu petakan di `username_email_map`.

Di **Authentication > Users > Add user**, buat 3 akun (atau sesuai kebutuhan):
- `admin@sia-sd.internal` / password admin
- `guru1@sia-sd.internal` / password guru
- `kepsek@sia-sd.internal` / password kepsek

Salin masing-masing **User UID**, lalu jalankan di SQL Editor:
```sql
insert into public.username_email_map (username, email) values
  ('admin', 'admin@sia-sd.internal'),
  ('guru1', 'guru1@sia-sd.internal'),
  ('kepsek', 'kepsek@sia-sd.internal');

insert into public.profiles (id, username, nama, role, status, nip) values
  ('<UID-admin>', 'admin', 'Administrator SIA-SD', 'admin', 'aktif', null),
  ('<UID-guru1>', 'guru1', 'Ahmad Fauzi, S.Pd.', 'guru', 'aktif', '198804122015031002'),
  ('<UID-kepsek>', 'kepsek', 'Drs. H. Mulyadi, M.Pd.', 'kepsek', 'aktif', null);
```

### 4. Buat Storage bucket untuk backup
**Storage > New bucket** → nama `backups` → Private (bukan public).

### 5. Deploy Edge Function `admin-users` (WAJIB untuk fitur Kelola Akun)
Pembuatan akun login (admin/guru/kepsek), reset password, dan hapus akun butuh Supabase Admin API (`service_role key`), yang **tidak boleh** ada di kode frontend/browser. Fungsi ini sudah dibuatkan di `supabase/functions/admin-users/index.ts` dan berjalan di server (Deno) — deploy dengan Supabase CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <PROJECT_REF>      # lihat di Project Settings > General
supabase functions deploy admin-users
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` otomatis tersedia sebagai environment variable di setiap Edge Function Supabase — **tidak perlu** diatur manual sebagai secret. Setelah deploy, tombol "Buat Akun Baru", "Reset Sandi", dan "Hapus Akun" di halaman **Kelola Akun Pengguna** (menu sidebar, khusus admin) akan langsung berfungsi.

### 5b. Jalankan migrasi kebijakan Storage untuk foto akun
Jika Supabase project Anda sudah lebih dulu menjalankan `supabase/schema.sql` versi sebelumnya (sebelum kebijakan Storage admin ditambahkan), jalankan tambahan berikut sekali saja di **SQL Editor**:

```
supabase/migration_v2_accounts.sql
```

Ini memperluas kebijakan bucket `avatars` supaya admin bisa mengunggah foto ke folder `profil/{uid}` milik akun **lain** (guru/kepsek/admin lain), bukan cuma foto profilnya sendiri. Untuk project baru yang menjalankan `schema.sql` versi terbaru, migrasi ini sudah otomatis termasuk — tidak perlu dijalankan lagi.

Kalau Anda juga ingin fitur **upload logo sekolah** (menggantikan input link URL yang gampang pecah), jalankan tambahan berikut sekali saja:

```
supabase/migration_v3_logo.sql
```

Ini menambah izin folder `sekolah/` (khusus admin) di bucket `avatars` yang sama, dipakai halaman Pengaturan untuk mengunggah logo sekolah langsung dari perangkat (bukan tempel link eksternal).

Pastikan juga bucket Storage `avatars` sudah dibuat (**Storage > New bucket** → nama `avatars` → **Public ON**) sebelum fitur upload foto/logo dipakai.

### 6. Set environment variable
Salin `.env.example` → `.env.local`, isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari langkah 1.

### 7. Install & jalankan
```bash
npm install
npm run dev
```

## Yang perlu diuji ulang (checklist QA)
- [ ] Login dengan masing-masing role (admin/guru/kepsek) dan pastikan sesi bertahan setelah refresh halaman
- [ ] Logout benar-benar menghapus sesi (coba akses halaman setelah logout)
- [ ] Guru **tidak bisa** menghapus data siswa (harus admin) — uji lewat UI, dan idealnya uji langsung lewat SQL/API untuk pastikan RLS yang menahan, bukan cuma UI
- [ ] Import massal siswa via Excel — duplikat NIS harus di-skip
- [ ] Backup lalu restore — data harus kembali persis sama
- [ ] Ganti password lewat halaman Profile, lalu login ulang pakai password baru
- [ ] Upload foto profil sendiri di halaman Profil Saya (semua role: admin/guru/kepsek)
- [ ] Admin: buat akun baru (role guru & kepsek) di halaman Kelola Akun Pengguna, lalu login pakai kredensial yang muncul
- [ ] Admin: upload foto untuk akun guru/kepsek lain di halaman Kelola Akun Pengguna
- [ ] Admin: reset password sebuah akun, lalu login pakai password baru tersebut
- [ ] Admin: nonaktifkan sebuah akun lalu pastikan akun itu tidak bisa login ("Akun Anda dinonaktifkan!")
- [ ] Admin: hapus sebuah akun, pastikan tidak bisa login lagi & tidak muncul di daftar
- [ ] Admin: coba nonaktifkan/hapus akun sendiri — harus ditolak oleh UI
- [ ] Daftarkan guru baru dengan opsi "Buatkan juga akun login" dicentang & dimatikan — pastikan kedua alur bekerja
- [ ] Upload foto guru dari halaman Data Guru
- [ ] Upload foto siswa dari halaman Data Siswa (tampil di kartu Absensi & detail siswa)
- [ ] Upload logo sekolah dari halaman Pengaturan (pastikan gambar sumber minimal 256×256px persegi agar tidak pecah), lalu cek logo tampil tajam di header sidebar
