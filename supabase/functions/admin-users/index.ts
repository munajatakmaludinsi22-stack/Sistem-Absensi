// ============================================================================
// Edge Function: admin-users
//
// Satu-satunya tempat di seluruh aplikasi yang boleh memanggil Supabase Admin
// API (auth.admin.*), karena itu butuh service_role key — kunci yang TIDAK
// BOLEH pernah dikirim ke browser. Fungsi ini berjalan di server (Deno),
// dipanggil dari frontend lewat `supabase.functions.invoke("admin-users", ...)`
// dan token JWT milik pemanggil (dari header Authorization) dipakai untuk
// memverifikasi bahwa yang memanggil benar admin — BUKAN dipercaya dari body.
//
// Deploy:
//   supabase functions deploy admin-users --project-ref <PROJECT_REF>
//
// SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY otomatis
// tersedia sebagai environment variable di setiap Edge Function Supabase —
// tidak perlu diatur manual sebagai secret.
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// Password acak yang mudah dibacakan lewat telepon: 3 suku kata + 3 angka.
function generatePassword(): string {
  const syllables = ["ba", "di", "ku", "me", "ro", "si", "ta", "wu", "ny", "ga"];
  let word = "";
  for (let i = 0; i < 4; i++) word += syllables[Math.floor(Math.random() * syllables.length)];
  const digits = Math.floor(100 + Math.random() * 900);
  return `${word}${digits}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method tidak diizinkan." }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sesi tidak valid — header Authorization tidak ditemukan.");

    // Klien yang bertindak sebagai si pemanggil (pakai JWT-nya), untuk verifikasi identitas.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerData, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerData?.user) throw new Error("Sesi tidak valid / sudah kedaluwarsa.");

    // Klien dengan service_role — bisa bypass RLS & memanggil Admin API.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerProfile, error: profErr } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", callerData.user.id)
      .single();
    if (profErr || !callerProfile || callerProfile.role !== "admin") {
      throw new Error("Hanya Administrator yang diperbolehkan mengelola akun pengguna!");
    }

    const body = await req.json();
    const { action } = body;

    // ------------------------------------------------------------------
    // CREATE — buat akun login baru (admin / guru / kepsek)
    // ------------------------------------------------------------------
    if (action === "create") {
      const username = String(body.username || "").trim().toLowerCase();
      const nama = String(body.nama || "").trim();
      const role = String(body.role || "").trim();
      const nip = body.nip ? String(body.nip).trim() : null;

      if (!username) throw new Error("Username wajib diisi!");
      if (!nama) throw new Error("Nama wajib diisi!");
      if (!["admin", "guru", "kepsek"].includes(role)) throw new Error("Peran (role) tidak valid!");
      if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
        throw new Error("Username hanya boleh huruf kecil, angka, titik, garis bawah/hubung (3-32 karakter)!");
      }

      const { data: existingUsername } = await adminClient
        .from("username_email_map")
        .select("username")
        .eq("username", username)
        .maybeSingle();
      if (existingUsername) throw new Error(`Username "${username}" sudah digunakan!`);

      const email = (body.email && String(body.email).trim()) || `${username}@sia-mis.local`;
      const password = (body.password && String(body.password).trim()) || generatePassword();
      if (password.length < 6) throw new Error("Kata sandi minimal 6 karakter!");

      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr || !created?.user) {
        throw new Error(createErr?.message || "Gagal membuat akun di Supabase Auth.");
      }

      const { error: mapErr } = await adminClient.from("username_email_map").insert({ username, email });
      if (mapErr) {
        await adminClient.auth.admin.deleteUser(created.user.id);
        throw new Error(`Gagal memetakan username: ${mapErr.message}`);
      }

      const { error: profileErr } = await adminClient.from("profiles").insert({
        id: created.user.id,
        username,
        nama,
        role,
        status: "aktif",
        nip,
      });
      if (profileErr) {
        await adminClient.from("username_email_map").delete().eq("username", username);
        await adminClient.auth.admin.deleteUser(created.user.id);
        throw new Error(`Gagal membuat profil pengguna: ${profileErr.message}`);
      }

      return json({ success: true, id: created.user.id, username, email, password });
    }

    // ------------------------------------------------------------------
    // RESET-PASSWORD — buat kata sandi baru untuk akun yang sudah ada
    // ------------------------------------------------------------------
    if (action === "reset-password") {
      const id = String(body.id || "");
      if (!id) throw new Error("ID akun wajib diisi!");
      const password = (body.password && String(body.password).trim()) || generatePassword();
      if (password.length < 6) throw new Error("Kata sandi minimal 6 karakter!");

      const { error } = await adminClient.auth.admin.updateUserById(id, { password });
      if (error) throw new Error(error.message || "Gagal mereset kata sandi.");

      return json({ success: true, password });
    }

    // ------------------------------------------------------------------
    // DELETE — hapus akun login secara permanen
    // ------------------------------------------------------------------
    if (action === "delete") {
      const id = String(body.id || "");
      if (!id) throw new Error("ID akun wajib diisi!");
      if (id === callerData.user.id) throw new Error("Anda tidak dapat menghapus akun Anda sendiri!");

      const { data: target } = await adminClient.from("profiles").select("username").eq("id", id).single();

      await adminClient.from("profiles").delete().eq("id", id);
      if (target?.username) {
        await adminClient.from("username_email_map").delete().eq("username", target.username);
      }
      const { error } = await adminClient.auth.admin.deleteUser(id);
      if (error) throw new Error(error.message || "Gagal menghapus akun dari Supabase Auth.");

      return json({ success: true });
    }

    throw new Error(`Aksi "${action}" tidak dikenal.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 400);
  }
});
