# SIA-SD — Sistem Informasi Absensi Siswa SD/MI

Aplikasi web untuk mengelola data siswa, guru, kelas, absensi harian, pengumuman, dan kalender akademik sekolah dasar/madrasah ibtidaiyah — dengan backend **Supabase** (PostgreSQL + Auth + Row Level Security + Storage + Edge Functions).

Studi kasus contoh: **MI Sudajaya**.

---

## Daftar Isi
1. [Tumpukan Teknologi](#tumpukan-teknologi)
2. [Struktur Proyek](#struktur-proyek)
3. [Arsitektur & Alur Data](#arsitektur--alur-data)
4. [Skema Database](#skema-database)
5. [Keamanan (RLS & Edge Function)](#keamanan-rls--edge-function)
6. [Penjelasan Tiap Berkas Kode](#penjelasan-tiap-berkas-kode)
7. [Cara Menjalankan](#cara-menjalankan)
8. [Deploy ke GitHub Pages](#deploy-ke-github-pages)
9. [Keterbatasan yang Diketahui](#keterbatasan-yang-diketahui)

---

## Tumpukan Teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS |
| Backend / Database | Supabase (PostgreSQL, Auth, Row Level Security, Storage, Edge Functions) |
| Autentikasi | Supabase Auth (email/password, sesi JWT dikelola otomatis oleh `supabase-js`) |
| Ikon & Animasi | lucide-react, motion (Framer Motion) |
| Hosting (opsional) | GitHub Pages, lewat GitHub Actions (`.github/workflows/deploy.yml`) |

Proyek ini **tidak lagi punya backend REST kustom**. Semua query database dilakukan langsung dari browser lewat SDK `supabase-js`, dilindungi oleh Row Level Security di level database — bukan lewat server Express/Node yang harus dijaga terpisah.

---

## Struktur Proyek

```
├── src/
│   ├── main.tsx                  # Entry point React
│   ├── App.tsx                   # Routing antar halaman, autentikasi, layout utama
│   ├── types.ts                  # Definisi TypeScript untuk semua entitas data
│   ├── vite-env.d.ts             # Deklarasi tipe environment variable Vite
│   ├── utils/
│   │   ├── supabaseClient.ts     # Inisialisasi client Supabase
│   │   └── api.ts                # Lapisan akses data (menggantikan REST API lama)
│   └── components/
│       ├── Login.tsx             # Halaman login
│       ├── Sidebar.tsx           # Navigasi sisi kiri (menu berbeda per role)
│       ├── Dashboard.tsx         # Ringkasan statistik & grafik kehadiran
│       ├── Attendance.tsx        # Input absensi harian per kelas
│       ├── StudentManager.tsx    # CRUD data siswa + import Excel + foto
│       ├── TeacherManager.tsx    # CRUD data guru + foto
│       ├── ClassManager.tsx      # CRUD data kelas & wali kelas
│       ├── Reports.tsx           # Rekap & cetak laporan absensi
│       ├── Announcements.tsx     # Papan pengumuman
│       ├── AcademicCalendar.tsx  # Kalender akademik (libur, ujian, kegiatan)
│       ├── SpreadsheetDb.tsx     # Editor tabel mentah (khusus admin)
│       ├── AccountManager.tsx    # Kelola akun login guru/kepsek (khusus admin)
│       ├── Settings.tsx          # Pengaturan identitas sekolah + backup/restore
│       ├── Profile.tsx           # Profil pengguna + ubah password + upload foto
│       └── About.tsx             # Dokumentasi arsitektur (halaman "Tentang")
│
├── supabase/
│   ├── schema.sql                 # Seluruh skema tabel, RLS, & fungsi database
│   └── functions/
│       └── manage-account/
│           └── index.ts           # Edge Function: admin membuat/hapus akun
│
├── .github/workflows/deploy.yml   # CI/CD otomatis ke GitHub Pages
├── server.ts                      # Server statis untuk `npm run dev` / build
├── vite.config.ts                 # Konfigurasi Vite (base path, alias, dsb)
├── MIGRATION.md                   # Panduan setup Supabase langkah-demi-langkah
└── .env.example                   # Contoh environment variable yang dibutuhkan
```

---

## Arsitektur & Alur Data

```
React SPA (browser)
      │
      │  supabase-js SDK (query, auth, storage, functions.invoke)
      ▼
Supabase Auth ──► PostgreSQL (dijaga Row Level Security per role)
      │
      └──► Supabase Storage (bucket "avatars", "backups")
      │
      └──► Edge Function "manage-account" (pakai service_role key,
           HANYA untuk aksi admin yang butuh hak istimewa: membuat/
           menghapus akun login)
```

**Kenapa tidak ada backend Express/Node kustom lagi?**
Supabase sudah menyediakan REST API otomatis (PostgREST) di atas PostgreSQL, ditambah Auth dan Storage bawaan. Menulis backend Express terpisah hanya akan menduplikasi apa yang sudah disediakan Supabase, sekaligus menambah satu lapisan yang harus di-hosting dan dijaga keamanannya sendiri. Satu-satunya kasus yang tetap butuh kode "server" adalah aksi yang butuh `service_role key` (kunci penuh, harus dirahasiakan) — itu sebabnya `manage-account` dibuat sebagai Edge Function, bukan kode yang berjalan di browser.

---

## Skema Database

Semua tabel didefinisikan di `supabase/schema.sql`. Ringkasan:

| Tabel | Fungsi |
|---|---|
| `profiles` | Data pengguna login (terhubung ke `auth.users` Supabase Auth): nama, role, status, foto |
| `username_email_map` | Pemetaan username → email, supaya form login bisa pakai username (Supabase Auth aslinya butuh email) |
| `guru` | Data guru: NIP, nama, kelas yang diampu, status, foto |
| `siswa` | Data siswa: NIS, NISN, nama, kelas, jenis kelamin, data orang tua, status, foto |
| `kelas` | Data kelas & wali kelasnya |
| `absensi` | Catatan kehadiran harian per siswa (unique per tanggal+NIS agar tidak dobel) |
| `pengumuman` | Papan pengumuman sekolah |
| `kalender` | Kalender akademik (libur, ujian, kegiatan) |
| `logs` | Jejak audit aktivitas pengguna |
| `settings` | Identitas sekolah (nama, NPSN, alamat, kepala sekolah, tahun ajaran aktif) — hanya 1 baris |
| `backups` | Metadata pencadangan database (file JSON asli disimpan di Supabase Storage) |

---

## Keamanan (RLS & Edge Function)

Aplikasi ini punya 3 peran: **admin**, **guru**, **kepsek** (kepala sekolah). Aturan akses **tidak** hanya dicek di kode React (yang bisa dilewati siapapun lewat DevTools), tapi ditegakkan langsung di database lewat **Row Level Security (RLS)** PostgreSQL. Contoh:

- Semua peran yang login (`authenticated`) boleh **membaca** data siswa/guru/kelas/absensi.
- Hanya **admin** dan **guru** yang boleh **menulis** data siswa & absensi.
- Hanya **admin** yang boleh menghapus data siswa/guru/kelas, mengubah pengaturan sekolah, atau mengelola akun login.
- Setiap pengguna hanya boleh membaca profilnya sendiri, kecuali admin yang boleh melihat semua profil.

**Kenapa ada Edge Function `manage-account`?**
Membuat akun login baru (guru/kepsek) lewat Supabase Auth butuh `service_role key` — kunci "master" yang kalau bocor bisa dipakai siapapun untuk mem-bypass semua RLS dan mengambil alih seluruh database. Kunci ini **tidak boleh** pernah ada di kode yang berjalan di browser. Solusinya: logika pembuatan akun dijalankan di Edge Function (server Supabase), yang lebih dulu memverifikasi bahwa pemanggilnya benar admin sebelum menjalankan aksi apapun.

---

## Penjelasan Tiap Berkas Kode

### `src/utils/supabaseClient.ts`
Inisialisasi satu instance `supabase-js` yang dipakai di seluruh aplikasi. Sesi login (access token + refresh token) disimpan & di-refresh otomatis oleh library ini — kode aplikasi tidak perlu mengelola token secara manual.

### `src/utils/api.ts`
Lapisan kompatibilitas: menyediakan fungsi `api.get()`, `api.post()`, `api.put()`, `api.delete()` dengan tanda tangan (signature) yang sama seperti versi lama yang memanggil REST API. Di baliknya, setiap panggilan diterjemahkan menjadi query Supabase (`.from(table).select()/.insert()/.update()/.delete()`, `.rpc()` untuk fungsi database, atau `.storage` untuk file). Pendekatan ini membuat seluruh 12+ komponen React tidak perlu diubah cara pemanggilannya, meski backend-nya berubah total.

Berkas ini juga berisi:
- `uploadAvatar()` — mengunggah foto ke Supabase Storage (bucket `avatars`), dengan validasi tipe file & ukuran maksimal 2MB.
- `adminManageAccount()` — memanggil Edge Function `manage-account`.

### `src/App.tsx`
Mengatur:
- Pemulihan sesi login saat halaman dibuka (`/auth/me`), bukan sekadar mempercayai `localStorage`.
- Routing antar halaman berdasarkan `activeTab` — **penting:** nilai `activeTab` (mis. `"siswa"`, `"absensi"`) harus sama persis dengan `id` di `Sidebar.tsx` dan tempat lain yang memanggil `setActiveTab(...)` (mis. tombol aksi cepat di `Dashboard.tsx`). Ketidakcocokan ini adalah bug yang ditemukan & diperbaiki selama migrasi.
- Topbar (notifikasi pengumuman, menu profil, tombol logout).

### `src/components/Sidebar.tsx`
Daftar menu navigasi, difilter berdasarkan `roles` yang diizinkan untuk tiap item. Menampilkan foto profil pengguna jika ada (`user.foto`), atau inisial nama sebagai fallback.

### `src/components/AccountManager.tsx` *(baru)*
Halaman khusus admin untuk:
- Melihat semua akun (nama, username, role, status).
- Membuat akun guru/kepsek baru (memanggil Edge Function `manage-account`), lalu menampilkan username & password sekali (harus disalin saat itu juga).
- Reset password akun manapun.
- Mengaktifkan/menonaktifkan akun (update langsung ke tabel `profiles`, aman karena dijaga RLS admin-only).

### `src/components/Profile.tsx`
Halaman profil pribadi: ganti password, dan **upload foto profil sendiri** — foto diunggah ke Storage lalu disimpan ke `profiles.foto` lewat fungsi database `update_own_avatar()` (supaya pengguna hanya bisa mengubah foto miliknya sendiri, bukan kolom lain seperti `role`).

### `src/components/StudentManager.tsx` & `TeacherManager.tsx`
CRUD data siswa/guru, termasuk **upload foto** (khusus saat mode edit, karena upload butuh ID data yang sudah tersimpan) dan tampilan foto di tabel & modal detail.

### `server.ts`
Hanya menyajikan aplikasi React (mode dev via Vite middleware, atau static file di mode production). Tidak lagi berisi logika API apapun.

---

## Cara Menjalankan

Panduan lengkap ada di **[MIGRATION.md](./MIGRATION.md)**. Ringkasnya:

```bash
# 1. Install dependencies
npm install

# 2. Salin & isi environment variable
cp .env.example .env.local
# isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dari project Supabase Anda

# 3. Jalankan skema database (lihat MIGRATION.md langkah 2-5 untuk detail:
#    schema.sql, bucket Storage, seed akun awal, deploy Edge Function)

# 4. Jalankan aplikasi
npm run dev
```

---

## Deploy ke GitHub Pages

Workflow `.github/workflows/deploy.yml` sudah tersedia untuk build & deploy otomatis setiap push ke branch `main`. Yang perlu disiapkan:
1. Tambahkan repository secret `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
2. Di **Settings > Pages**, ubah **Source** menjadi **GitHub Actions**.
3. Sesuaikan `base` di `vite.config.ts` dengan nama repository Anda.

---

## Keterbatasan yang Diketahui

- **Tidak ada portal khusus wali murid.** Hanya ada 3 peran login: admin, guru, kepala sekolah. Field "target audiens" di Pengumuman saat ini berupa label kategori, bukan penyaring visibilitas sesungguhnya, karena memang belum ada akun login untuk wali murid.
- **Bundle JavaScript > 500KB.** Vite memberi peringatan (bukan error) karena semua halaman digabung dalam satu file. Bisa dioptimasi dengan code-splitting (`React.lazy`) bila performa muat awal jadi masalah.
- **Pembuatan akun via `AccountManager` memakai password yang di-generate lalu ditampilkan sekali.** Sebaiknya sampaikan ke pengguna terkait lewat jalur aman (bukan screenshot/chat tidak terenkripsi), dan minta mereka segera mengganti password lewat halaman Profil.
