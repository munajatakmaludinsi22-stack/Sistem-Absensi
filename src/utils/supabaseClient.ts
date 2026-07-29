import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly during development instead of silently sending broken requests.
  console.error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diatur. Cek file .env.local Anda."
  );
}

// supabase-js sudah menangani penyimpanan sesi (access token + refresh token)
// secara aman di localStorage miliknya sendiri, dan otomatis me-refresh token
// yang kedaluwarsa. Ini menggantikan mekanisme Bearer-token manual yang lama
// (yang ternyata tidak pernah benar-benar tersambung — lihat catatan migrasi).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
