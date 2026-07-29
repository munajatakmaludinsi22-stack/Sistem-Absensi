// ============================================================================
// storage.ts — helper upload foto (avatar) ke Supabase Storage bucket "avatars".
//
// Konvensi path mengikuti kebijakan RLS di supabase/schema.sql:
//   profil/{uid}/avatar.<ext>   -> foto akun (admin, guru, kepsek) — dipakai
//                                   baik oleh pemilik akun sendiri (Profil Saya)
//                                   maupun oleh admin (Kelola Akun Pengguna)
//   guru/{id-guru}/foto.<ext>   -> foto resmi guru (dikelola admin)
//   siswa/{id-siswa}/foto.<ext> -> foto resmi siswa (dikelola admin/guru)
//
// Sebelum bisa dipakai, bucket "avatars" (Public ON) harus sudah dibuat di
// Supabase Storage, dan kebijakan RLS di supabase/schema.sql (atau
// supabase/migration_v2_accounts.sql untuk project yang sudah lama jalan)
// sudah dijalankan.
// ============================================================================
import { supabase } from "./supabaseClient";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateImageFile(file: File) {
  if (!ALLOWED_MIME[file.type]) {
    throw new Error("Format foto harus JPG, PNG, atau WebP!");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Ukuran foto maksimal 2MB!");
  }
}

async function uploadAvatarFile(folder: string, id: string, filenameBase: string, file: File): Promise<string> {
  validateImageFile(file);
  const ext = ALLOWED_MIME[file.type];
  const dirPath = `${folder}/${id}`;

  // Bersihkan file lama di folder ini dulu supaya bucket tidak menumpuk file
  // yatim setiap kali foto diganti (mis. avatar.jpg -> avatar.png).
  try {
    const { data: existing } = await supabase.storage.from("avatars").list(dirPath);
    if (existing?.length) {
      await supabase.storage.from("avatars").remove(existing.map((f) => `${dirPath}/${f.name}`));
    }
  } catch {
    /* abaikan — kalau folder belum ada, list() akan gagal senyap, tidak masalah */
  }

  const path = `${dirPath}/${filenameBase}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) {
    throw new Error(
      error.message?.includes("not found")
        ? 'Bucket Storage "avatars" belum dibuat di Supabase Dashboard!'
        : error.message || "Gagal mengunggah foto!"
    );
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust supaya foto baru langsung tampil (browser tidak memakai versi lama)
  return `${data.publicUrl}?t=${Date.now()}`;
}

/** Upload foto profil milik sendiri (admin/guru/kepsek yang sedang login). */
export const uploadOwnAvatar = (file: File, userId: string) => uploadAvatarFile("profil", userId, "avatar", file);

/** Upload foto profil akun lain — hanya admin yang punya izin RLS untuk ini (Kelola Akun Pengguna). */
export const uploadAccountAvatar = (file: File, targetUserId: string) => uploadAvatarFile("profil", targetUserId, "avatar", file);

/** Upload foto resmi guru (data master guru — bukan foto akun login). */
export const uploadGuruFoto = (file: File, guruId: string) => uploadAvatarFile("guru", guruId, "foto", file);

/** Upload foto resmi siswa. */
export const uploadSiswaFoto = (file: File, siswaId: string) => uploadAvatarFile("siswa", siswaId, "foto", file);

/**
 * Upload logo sekolah (satu file global untuk seluruh sistem, dikelola admin
 * lewat halaman Pengaturan). Disimpan di folder "sekolah/logo.<ext>" pada
 * bucket "avatars" yang sama — beresolusi asli (tidak dikompres paksa),
 * jadi tidak pecah selama file sumber yang diunggah memang berkualitas baik
 * (disarankan minimal 256×256px, format PNG transparan untuk hasil terbaik).
 */
export const uploadSekolahLogo = (file: File) => uploadAvatarFile("sekolah", "logo", "logo", file);
