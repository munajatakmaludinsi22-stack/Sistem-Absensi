// ============================================================================
// api.ts — lapisan kompatibilitas di atas Supabase.
//
// Semua komponen (StudentManager, TeacherManager, Attendance, dst) tetap
// memanggil api.get("/siswa"), api.post("/guru", payload), dst — persis
// seperti sebelumnya. Yang berubah HANYA implementasi di balik layar:
// dari fetch() ke Express, menjadi query langsung ke Supabase/Postgres.
//
// Ini menghilangkan seluruh kelas masalah lama:
//  - Tidak ada lagi server Express / db.json lokal / server yang harus
//    dijalankan terpisah (jadi juga tidak relevan lagi masalah
//    ketidakcocokan REST-routing dengan Google Apps Script).
//  - Tidak ada lagi Bearer-token manual yang gampang lupa dipasang
//    (bug lama: token dari login tidak pernah disimpan — lihat MIGRATION.md).
//  - Sesi & password dikelola Supabase Auth (hashing, expiry, refresh token),
//    bukan disimpan plaintext.
//  - Otorisasi per-role ditegakkan oleh Row Level Security di database,
//    bukan hanya oleh pengecekan `if (req.user.role !== 'admin')` di server
//    yang bisa saja lupa ditambahkan di endpoint baru.
// ============================================================================
import { supabase } from "./supabaseClient";

export function getAuthToken(): string | null {
  return null; // sudah tidak dipakai — sesi ditangani otomatis oleh supabase-js
}
export function setAuthToken(_token: string) {
  /* no-op: dipertahankan agar tidak merusak import lama */
}
export function removeAuthToken() {
  /* no-op */
}

export const toast = {
  show: (message: string, type: "success" | "error" | "info" = "success") => {
    window.dispatchEvent(new CustomEvent("sia-toast", { detail: { message, type } }));
  },
};

function must<T>(data: T | null, error: any): T {
  if (error) throw new Error(error.message || "Terjadi kesalahan pada Supabase");
  return data as T;
}

// ----------------------------------------------------------------------------
// Edge Function "admin-users" — satu-satunya tempat yang boleh menyentuh
// Supabase Admin API (service_role key), dijalankan di server (Deno), bukan
// di browser. Dipakai untuk: membuat akun login baru, reset password akun
// lain, dan menghapus akun. Lihat supabase/functions/admin-users/index.ts.
// ----------------------------------------------------------------------------
async function invokeAdminUsers(action: string, payload: Record<string, any>): Promise<any> {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action, ...payload },
  });
  if (error) {
    let message = error.message || "Gagal menghubungi fungsi admin (admin-users)!";
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === "function") {
        const parsed = await ctx.json();
        if (parsed?.error) message = parsed.error;
      }
    } catch {
      /* fallback ke pesan default di atas */
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

async function requireProfile() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error("Sesi tidak valid / belum login!");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();
  if (error || !profile) throw new Error("Profil pengguna tidak ditemukan!");
  return profile as any;
}

// snake_case (Postgres) <-> camelCase (frontend) konversi ringan per tabel
const toCamel = {
  guru: (r: any) => ({ id: r.id, nip: r.nip, nama: r.nama, email: r.email, kelasDiampu: r.kelas_diampu, status: r.status, foto: r.foto }),
  siswa: (r: any) => ({ id: r.id, nis: r.nis, nisn: r.nisn, nama: r.nama, kelas: r.kelas, jenisKelamin: r.jenis_kelamin, namaAyah: r.nama_ayah, namaIbu: r.nama_ibu, alamat: r.alamat, status: r.status, foto: r.foto }),
  kelas: (r: any) => ({ id: r.id, nama: r.nama, waliKelasId: r.wali_kelas_id, waliKelasNama: r.wali_kelas_nama, kapasitas: r.kapasitas }),
  absensi: (r: any) => ({ id: r.id, tanggal: r.tanggal, nis: r.nis, namaSiswa: r.nama_siswa, kelas: r.kelas, status: r.status, catatan: r.catatan, dibuatOleh: r.dibuat_oleh, timestamp: r.timestamp }),
  pengumuman: (r: any) => ({ id: r.id, judul: r.judul, isi: r.isi, tanggal: r.tanggal, dibuatOleh: r.dibuat_oleh, target: r.target }),
  kalender: (r: any) => ({ id: r.id, tanggal: r.tanggal, kegiatan: r.kegiatan, tipe: r.tipe }),
  logs: (r: any) => ({ id: r.id, timestamp: r.timestamp, pengguna: r.pengguna, role: r.role, aktivitas: r.aktivitas, ipAddress: r.ip_address }),
  settings: (r: any) => ({ namaSekolah: r.nama_sekolah, npsn: r.npsn, alamat: r.alamat, kepalaSekolah: r.kepala_sekolah, nipKepalaSekolah: r.nip_kepala_sekolah, logoSekolah: r.logo_sekolah, semesterAktif: r.semester_aktif, tahunAjaranAktif: r.tahun_ajaran_aktif }),
  profile: (r: any) => ({ id: r.id, username: r.username, nama: r.nama, role: r.role, status: r.status, nip: r.nip, foto: r.foto, createdAt: r.created_at }),
};

const toSnake = {
  guru: (b: any) => ({ nip: b.nip, nama: b.nama, email: b.email, kelas_diampu: b.kelasDiampu, status: b.status ?? "aktif", foto: b.foto ?? "" }),
  siswa: (b: any) => ({ nis: b.nis, nisn: b.nisn, nama: b.nama, kelas: b.kelas, jenis_kelamin: b.jenisKelamin, nama_ayah: b.namaAyah, nama_ibu: b.namaIbu, alamat: b.alamat, status: b.status ?? "aktif", foto: b.foto ?? "" }),
  kelas: (b: any) => ({ id: b.id, nama: b.nama, wali_kelas_id: b.waliKelasId, kapasitas: b.kapasitas }),
  pengumuman: (b: any) => ({ judul: b.judul, isi: b.isi, target: b.target }),
  kalender: (b: any) => ({ tanggal: b.tanggal, kegiatan: b.kegiatan, tipe: b.tipe }),
  settings: (b: any) => ({
    nama_sekolah: b.namaSekolah, npsn: b.npsn, alamat: b.alamat, kepala_sekolah: b.kepalaSekolah,
    nip_kepala_sekolah: b.nipKepalaSekolah, logo_sekolah: b.logoSekolah,
    semester_aktif: b.semesterAktif, tahun_ajaran_aktif: b.tahunAjaranAktif,
  }),
};

// ----------------------------------------------------------------------------
// GET
// ----------------------------------------------------------------------------
async function handleGet(endpoint: string): Promise<any> {
  if (endpoint === "/auth/me") {
    const profile = await requireProfile();
    return { user: profile };
  }

  if (endpoint === "/guru") {
    const { data, error } = await supabase.from("guru").select("*").order("nama");
    return must(data, error).map(toCamel.guru);
  }

  if (endpoint === "/siswa") {
    const { data, error } = await supabase.from("siswa").select("*").order("nama");
    return must(data, error).map(toCamel.siswa);
  }

  if (endpoint === "/kelas") {
    const { data, error } = await supabase.from("kelas").select("*").order("nama");
    return must(data, error).map(toCamel.kelas);
  }

  if (endpoint === "/pengumuman") {
    const { data, error } = await supabase.from("pengumuman").select("*").order("tanggal", { ascending: false });
    return must(data, error).map(toCamel.pengumuman);
  }

  if (endpoint === "/kalender") {
    const { data, error } = await supabase.from("kalender").select("*").order("tanggal");
    return must(data, error).map(toCamel.kalender);
  }

  if (endpoint === "/settings") {
    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
    return toCamel.settings(must(data, error));
  }

  if (endpoint === "/logs") {
    const { data, error } = await supabase.from("logs").select("*").order("timestamp", { ascending: false }).limit(200);
    return must(data, error).map(toCamel.logs);
  }

  if (endpoint === "/backup") {
    const { data, error } = await supabase.from("backups").select("*").order("tanggal_backup", { ascending: false });
    return must(data, error).map((r: any) => ({ id: r.id, namaFile: r.nama_file, tanggalBackup: r.tanggal_backup, ukuran: r.ukuran, status: r.status }));
  }

  if (endpoint === "/spreadsheet") {
    const [guru, siswa, kelas, absensi, pengumuman, kalender, logs, settingsRow, backups] = await Promise.all([
      supabase.from("guru").select("*"),
      supabase.from("siswa").select("*"),
      supabase.from("kelas").select("*"),
      supabase.from("absensi").select("*"),
      supabase.from("pengumuman").select("*"),
      supabase.from("kalender").select("*"),
      supabase.from("logs").select("*").order("timestamp", { ascending: false }).limit(200),
      supabase.from("settings").select("*").eq("id", 1).single(),
      supabase.from("backups").select("*"),
    ]);
    return {
      guru: must(guru.data, guru.error).map(toCamel.guru),
      siswa: must(siswa.data, siswa.error).map(toCamel.siswa),
      kelas: must(kelas.data, kelas.error).map(toCamel.kelas),
      absensi: must(absensi.data, absensi.error).map(toCamel.absensi),
      pengumuman: must(pengumuman.data, pengumuman.error).map(toCamel.pengumuman),
      kalender: must(kalender.data, kalender.error).map(toCamel.kalender),
      logs: must(logs.data, logs.error).map(toCamel.logs),
      settings: toCamel.settings(must(settingsRow.data, settingsRow.error)),
      backups: must(backups.data, backups.error),
    };
  }

  if (endpoint.startsWith("/absensi?")) {
    const params = new URLSearchParams(endpoint.split("?")[1]);
    const kelas = params.get("kelas");
    const tanggal = params.get("tanggal");
    const [{ data: siswaKelas, error: e1 }, { data: existing, error: e2 }] = await Promise.all([
      supabase.from("siswa").select("*").eq("kelas", kelas).eq("status", "aktif"),
      supabase.from("absensi").select("*").eq("kelas", kelas).eq("tanggal", tanggal),
    ]);
    must(siswaKelas, e1);
    must(existing, e2);
    return (siswaKelas as any[]).map((s) => {
      const match = (existing as any[]).find((a) => a.nis === s.nis);
      return {
        studentId: s.id,
        nis: s.nis,
        nama: s.nama,
        jenisKelamin: s.jenis_kelamin,
        kelas: s.kelas,
        foto: s.foto,
        status: match ? match.status : "Hadir",
        catatan: match ? match.catatan : "",
        isRecorded: !!match,
        lastUpdated: match ? match.timestamp : null,
        dibuatOleh: match ? match.dibuat_oleh : null,
      };
    });
  }

  if (endpoint === "/accounts") {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator yang dapat mengelola akun pengguna!");
    const { data, error } = await supabase.from("profiles").select("*").order("nama");
    return must(data, error).map(toCamel.profile);
  }

  if (endpoint === "/dashboard/stats") {
    const todayStr = new Date().toISOString().split("T")[0];
    const [{ data: siswa, error: e1 }, { data: guru, error: e2 }, { data: kelas, error: e3 }, { data: absensi, error: e4 }, { data: logs, error: e5 }, { data: kalender, error: e6 }, { data: pengumuman, error: e7 }, { data: settingsRow, error: e8 }] =
      await Promise.all([
        supabase.from("siswa").select("*").eq("status", "aktif"),
        supabase.from("guru").select("*").eq("status", "aktif"),
        supabase.from("kelas").select("*"),
        supabase.from("absensi").select("*"),
        supabase.from("logs").select("*").order("timestamp", { ascending: false }).limit(5),
        supabase.from("kalender").select("*").order("tanggal").limit(5),
        supabase.from("pengumuman").select("*").order("tanggal", { ascending: false }).limit(3),
        supabase.from("settings").select("*").eq("id", 1).single(),
      ]);
    must(siswa, e1); must(guru, e2); must(kelas, e3); must(absensi, e4);
    must(logs, e5); must(kalender, e6); must(pengumuman, e7); must(settingsRow, e8);

    const todayAbsen = (absensi as any[]).filter((a) => a.tanggal === todayStr);
    const counts = { hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0 };
    todayAbsen.forEach((a) => {
      if (a.status === "Hadir") counts.hadir++;
      else if (a.status === "Izin") counts.izin++;
      else if (a.status === "Sakit") counts.sakit++;
      else if (a.status === "Alpha") counts.alpha++;
      else if (a.status === "Terlambat") counts.terlambat++;
    });
    const totalAbsenRecorded = todayAbsen.length;
    const persentase = totalAbsenRecorded > 0 ? Math.round(((counts.hadir + counts.terlambat) / totalAbsenRecorded) * 100) : 0;

    const uniqueDates = Array.from(new Set((absensi as any[]).map((a) => a.tanggal))).sort().slice(-7);
    const chartData = uniqueDates.map((tgl) => {
      const records = (absensi as any[]).filter((a) => a.tanggal === tgl);
      const c = { hadir: 0, izin: 0, sakit: 0, alpha: 0, terlambat: 0 };
      records.forEach((r) => {
        if (r.status === "Hadir") c.hadir++;
        else if (r.status === "Izin") c.izin++;
        else if (r.status === "Sakit") c.sakit++;
        else if (r.status === "Alpha") c.alpha++;
        else if (r.status === "Terlambat") c.terlambat++;
      });
      return { tanggal: tgl, ...c, total: records.length };
    });

    return {
      summary: {
        totalSiswa: (siswa as any[]).length,
        totalGuru: (guru as any[]).length,
        totalKelas: (kelas as any[]).length,
        hariIni: { ...counts, totalSiswaAbsen: totalAbsenRecorded, persentase },
      },
      chartData,
      logs: (logs as any[]).map(toCamel.logs),
      kalender: (kalender as any[]).map(toCamel.kalender),
      pengumuman: (pengumuman as any[]).map(toCamel.pengumuman),
      settings: toCamel.settings(settingsRow),
    };
  }

  throw new Error(`Endpoint GET tidak dikenal: ${endpoint}`);
}

// ----------------------------------------------------------------------------
// POST
// ----------------------------------------------------------------------------
async function handlePost(endpoint: string, body: any): Promise<any> {
  if (endpoint === "/auth/login") {
    const { username, password } = body;
    const { data: email, error: mapErr } = await supabase.rpc("get_email_by_username", { p_username: username });
    if (mapErr || !email) throw new Error("Username atau password salah!");
    const { data: sessionData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr || !sessionData.session) throw new Error("Username atau password salah!");
    const { data: profile, error: profErr } = await supabase
      .from("profiles").select("*").eq("id", sessionData.user!.id).single();
    if (profErr || !profile) throw new Error("Profil pengguna tidak ditemukan!");
    if (profile.status !== "aktif") { await supabase.auth.signOut(); throw new Error("Akun Anda dinonaktifkan!"); }
    await supabase.rpc("add_log", { p_aktivitas: "Berhasil masuk ke dalam sistem." });
    return { token: sessionData.session.access_token, user: profile };
  }

  if (endpoint === "/auth/logout") {
    try {
      await supabase.rpc("add_log", { p_aktivitas: "Keluar dari sistem." });
    } catch (e) {
      /* abaikan jika sesi sudah tidak valid */
    }
    await supabase.auth.signOut();
    return { success: true, message: "Berhasil keluar dari sistem." };
  }

  if (endpoint === "/change-password") {
    const { newPassword } = body;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    await supabase.rpc("add_log", { p_aktivitas: "Mengubah password akun." });
    return { success: true };
  }

  if (endpoint === "/guru") {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator yang diperbolehkan!");
    const { data, error } = await supabase.from("guru").insert(toSnake.guru(body)).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: `Menambahkan guru baru: ${body.nama}.` });

    // Jika admin mencentang "Buatkan juga akun login", buat akun Supabase Auth
    // untuk guru ini lewat Edge Function admin-users (service_role key aman
    // di server, tidak pernah ada di kode frontend). Lihat MIGRATION.md.
    let creds: any = null;
    if (body.buatAkun) {
      const result = await invokeAdminUsers("create", {
        username: (body.akunUsername || body.nip || "").trim(),
        nama: body.nama,
        role: "guru",
        email: body.email,
        nip: body.nip,
      });
      creds = { username: result.username, password: result.password };
      await supabase.rpc("add_log", { p_aktivitas: `Membuat akun login untuk guru: ${body.nama}.` });
    }
    return { success: true, guru: toCamel.guru(data), creds };
  }

  if (endpoint === "/accounts") {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator yang diperbolehkan!");
    const result = await invokeAdminUsers("create", {
      username: (body.username || "").trim(),
      nama: body.nama,
      role: body.role,
      email: body.email,
      password: body.password,
      nip: body.nip,
    });
    await supabase.rpc("add_log", { p_aktivitas: `Membuat akun pengguna baru: ${body.nama} (${body.role}).` });
    return { success: true, ...result };
  }

  if (endpoint.startsWith("/accounts/") && endpoint.endsWith("/reset-password")) {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator yang diperbolehkan!");
    const id = endpoint.split("/")[2];
    const result = await invokeAdminUsers("reset-password", { id, password: body.password });
    await supabase.rpc("add_log", { p_aktivitas: "Mereset kata sandi sebuah akun pengguna." });
    return { success: true, ...result };
  }

  if (endpoint === "/siswa") {
    const profile = await requireProfile();
    if (!["admin", "guru"].includes(profile.role)) throw new Error("Akses ditolak!");
    const { data, error } = await supabase.from("siswa").insert(toSnake.siswa(body)).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: `Menambahkan siswa baru: ${body.nama} (Kelas ${body.kelas}).` });
    return { success: true, siswa: toCamel.siswa(data) };
  }

  if (endpoint === "/siswa/import") {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator yang dapat mengimpor data!");
    const rows = (body.data as any[]).filter((r) => r.nis && r.nama && r.kelas);
    const { data, error } = await supabase.from("siswa").upsert(
      rows.map((r) => ({
        nis: String(r.nis), nisn: String(r.nisn || ""), nama: r.nama, kelas: r.kelas,
        jenis_kelamin: r.jenisKelamin === "P" || r.jenisKelamin === "Perempuan" ? "P" : "L",
        nama_ayah: r.namaAyah || "", nama_ibu: r.namaIbu || "", alamat: r.alamat || "Alamat belum diatur", status: "aktif", foto: "",
      })),
      { onConflict: "nis", ignoreDuplicates: true }
    ).select();
    if (error) throw new Error(error.message);
    const importedCount = data?.length || 0;
    await supabase.rpc("add_log", { p_aktivitas: `Berhasil mengimpor ${importedCount} data siswa.` });
    return { success: true, importedCount, skippedCount: rows.length - importedCount };
  }

  if (endpoint === "/kelas") {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator!");
    let waliKelasNama = "Belum diatur";
    if (body.waliKelasId) {
      const { data: wl } = await supabase.from("guru").select("nama").eq("id", body.waliKelasId).single();
      if (wl) waliKelasNama = wl.nama;
    }
    const { data, error } = await supabase.from("kelas").insert({ ...toSnake.kelas(body), wali_kelas_nama: waliKelasNama }).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: `Membuat kelas baru: ${body.nama}.` });
    return { success: true, kelas: toCamel.kelas(data) };
  }

  if (endpoint === "/absensi/bulk") {
    const profile = await requireProfile();
    if (!["admin", "guru"].includes(profile.role)) throw new Error("Hanya Guru / Administrator yang dapat memasukkan absensi!");
    const { kelas, tanggal, records } = body;
    const rows = (records as any[]).map((rec) => ({
      id: `ABS-${tanggal}-${rec.nis}`,
      tanggal, nis: rec.nis, nama_siswa: rec.nama, kelas,
      status: rec.status || "Hadir", catatan: rec.catatan || "",
      dibuat_oleh: profile.nama, timestamp: new Date().toISOString(),
    }));
    const { error } = await supabase.from("absensi").upsert(rows, { onConflict: "tanggal,nis" });
    if (error) throw new Error(error.message);
    await supabase.rpc("add_log", { p_aktivitas: `Melakukan rekap absensi kelas ${kelas} pada tanggal ${tanggal}.` });
    return { success: true, message: "Absensi berhasil disimpan!" };
  }

  if (endpoint === "/pengumuman") {
    const profile = await requireProfile();
    if (!["admin", "guru"].includes(profile.role)) throw new Error("Akses ditolak!");
    const { data, error } = await supabase.from("pengumuman").insert({ ...toSnake.pengumuman(body), dibuat_oleh: profile.nama }).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: `Membuat pengumuman baru: ${body.judul}.` });
    return { success: true, pengumuman: toCamel.pengumuman(data) };
  }

  if (endpoint === "/kalender") {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Akses ditolak!");
    const { data, error } = await supabase.from("kalender").insert(toSnake.kalender(body)).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: `Menambahkan agenda kalender akademik: ${body.kegiatan}.` });
    return { success: true, kalender: toCamel.kalender(data) };
  }

  if (endpoint === "/backup") {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator!");
    const dump = await handleGet("/spreadsheet");
    const fileName = `sia_sd_backup_${Date.now()}.json`;
    const path = `dumps/${fileName}`;
    const { error: upErr } = await supabase.storage.from("backups").upload(path, new Blob([JSON.stringify(dump)], { type: "application/json" }));
    if (upErr) throw new Error(`Gagal mengunggah backup ke Storage: ${upErr.message}. Pastikan bucket "backups" sudah dibuat.`);
    const { data, error } = await supabase.from("backups").insert({
      nama_file: fileName, storage_path: path, ukuran: Math.round(JSON.stringify(dump).length / 1024) + " KB", status: "Sukses",
    }).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: "Melakukan pencadangan database manual." });
    return { success: true, backup: data };
  }

  if (endpoint.startsWith("/backup/restore/")) {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator!");
    const id = endpoint.split("/").pop();
    const { data: backupInfo, error } = await supabase.from("backups").select("*").eq("id", id).single();
    if (error || !backupInfo) throw new Error("Pencadangan tidak ditemukan!");
    const { data: file, error: dlErr } = await supabase.storage.from("backups").download(backupInfo.storage_path);
    if (dlErr || !file) throw new Error("File backup tidak ditemukan di Storage!");
    const dump = JSON.parse(await file.text());
    for (const table of ["guru", "siswa", "kelas", "absensi", "pengumuman", "kalender"] as const) {
      await supabase.from(table).delete().neq("id", "___never___");
      if (dump[table]?.length) await supabase.from(table).insert(dump[table]);
    }
    await supabase.rpc("add_log", { p_aktivitas: `Berhasil memulihkan database dari backup ${backupInfo.nama_file}.` });
    return { success: true, message: "Database berhasil dipulihkan!" };
  }

  throw new Error(`Endpoint POST tidak dikenal: ${endpoint}`);
}

// ----------------------------------------------------------------------------
// PUT
// ----------------------------------------------------------------------------
async function handlePut(endpoint: string, body: any): Promise<any> {
  if (endpoint === "/settings") {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator!");
    const { data, error } = await supabase.from("settings").update(toSnake.settings(body)).eq("id", 1).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: "Mengubah pengaturan umum aplikasi." });
    return { success: true, settings: toCamel.settings(data) };
  }

  if (endpoint.startsWith("/accounts/")) {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator yang diperbolehkan!");
    const id = endpoint.split("/")[2];
    const patch: Record<string, any> = {};
    if (body.nama !== undefined) patch.nama = body.nama;
    if (body.status !== undefined) patch.status = body.status;
    if (body.nip !== undefined) patch.nip = body.nip;
    if (body.foto !== undefined) patch.foto = body.foto;
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", id).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: `Memperbarui akun pengguna: ${data.nama}.` });
    return { success: true, account: toCamel.profile(data) };
  }

  if (endpoint.startsWith("/siswa/")) {
    const profile = await requireProfile();
    if (!["admin", "guru"].includes(profile.role)) throw new Error("Akses ditolak!");
    const id = endpoint.split("/").pop();
    const { data, error } = await supabase.from("siswa").update(toSnake.siswa(body)).eq("id", id).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: `Memperbarui data siswa: ${body.nama}.` });
    return { success: true, siswa: toCamel.siswa(data) };
  }

  if (endpoint.startsWith("/guru/")) {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator yang diperbolehkan!");
    const id = endpoint.split("/").pop();
    const { data, error } = await supabase.from("guru").update(toSnake.guru(body)).eq("id", id).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: `Memperbarui data guru: ${body.nama}.` });
    return { success: true, guru: toCamel.guru(data) };
  }

  if (endpoint.startsWith("/kelas/")) {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Akses ditolak!");
    const id = endpoint.split("/").pop();
    let waliKelasNama = "Belum diatur";
    if (body.waliKelasId) {
      const { data: wl } = await supabase.from("guru").select("nama").eq("id", body.waliKelasId).single();
      if (wl) waliKelasNama = wl.nama;
    }
    const { data, error } = await supabase.from("kelas").update({ ...toSnake.kelas(body), wali_kelas_nama: waliKelasNama }).eq("id", id).select().single();
    must(data, error);
    await supabase.rpc("add_log", { p_aktivitas: `Memperbarui kelas: ${body.nama}.` });
    return { success: true, kelas: toCamel.kelas(data) };
  }

  if (endpoint.startsWith("/spreadsheet/")) {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Akses ditolak!");
    const table = endpoint.split("/").pop() as string;
    const allowed = ["guru", "siswa", "kelas", "absensi", "pengumuman", "kalender"];
    if (!allowed.includes(table)) throw new Error(`Tabel ${table} tidak didukung untuk pengeditan langsung!`);
    await supabase.from(table).delete().neq("id", "___never___");
    if (body.rows?.length) {
      const { error } = await supabase.from(table).insert(body.rows);
      if (error) throw new Error(error.message);
    }
    await supabase.rpc("add_log", { p_aktivitas: `Melakukan pengeditan langsung pada tabel: [${table}].` });
    return { success: true, message: `Berhasil memperbarui tabel ${table}!` };
  }

  throw new Error(`Endpoint PUT tidak dikenal: ${endpoint}`);
}

// ----------------------------------------------------------------------------
// DELETE
// ----------------------------------------------------------------------------
async function handleDelete(endpoint: string): Promise<any> {
  const [, resource, id] = endpoint.split("/");

  if (resource === "accounts") {
    const profile = await requireProfile();
    if (profile.role !== "admin") throw new Error("Hanya Administrator yang diperbolehkan!");
    if (id === profile.id) throw new Error("Anda tidak dapat menghapus akun Anda sendiri!");
    const { data: target } = await supabase.from("profiles").select("nama").eq("id", id).single();
    await invokeAdminUsers("delete", { id });
    await supabase.rpc("add_log", { p_aktivitas: `Menghapus akun pengguna: ${target?.nama || id}.` });
    return { success: true, message: "Akun pengguna berhasil dihapus." };
  }

  const rolesByResource: Record<string, string[]> = {
    siswa: ["admin"], guru: ["admin"], kelas: ["admin"], kalender: ["admin"], pengumuman: ["admin", "guru"],
  };
  const profile = await requireProfile();
  const allowedRoles = rolesByResource[resource];
  if (!allowedRoles || !allowedRoles.includes(profile.role)) throw new Error("Akses ditolak!");

  if (resource === "siswa") {
    const { data: student } = await supabase.from("siswa").select("nis, nama").eq("id", id).single();
    await supabase.from("siswa").delete().eq("id", id);
    if (student) await supabase.from("absensi").delete().eq("nis", student.nis);
    await supabase.rpc("add_log", { p_aktivitas: `Menghapus data siswa: ${student?.nama}.` });
    return { success: true, message: "Data siswa berhasil dihapus." };
  }

  const { data: row } = await supabase.from(resource).select("*").eq("id", id).single();
  const { error } = await supabase.from(resource).delete().eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.rpc("add_log", { p_aktivitas: `Menghapus data dari ${resource}: ${row?.nama || row?.judul || row?.kegiatan || id}.` });
  return { success: true };
}

// ----------------------------------------------------------------------------
// Public API (signature sama seperti versi lama)
// ----------------------------------------------------------------------------
export const api = {
  get: (endpoint: string) => handleGet(endpoint),
  post: (endpoint: string, body: any = {}) => handlePost(endpoint, body),
  put: (endpoint: string, body: any = {}) => handlePut(endpoint, body),
  delete: (endpoint: string) => handleDelete(endpoint),
};
