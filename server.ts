// ============================================================================
// server.ts — SETELAH migrasi ke Supabase, file ini HANYA bertugas menyajikan
// aplikasi React (dev server / static hosting untuk hasil build).
//
// Sebelumnya file ini juga berisi ~500 baris logika REST API (Express) yang
// membaca/menulis db.json secara lokal, menyimpan sesi login di in-memory
// Map, dan menyimpan password dalam bentuk plaintext. Semua itu sudah
// digantikan oleh Supabase (Postgres + Auth + Row Level Security) dan
// dipanggil langsung dari browser lewat src/utils/api.ts + supabaseClient.ts.
//
// Jika Anda hanya deploy sebagai static site (Vercel/Netlify/Cloud Run static),
// file ini pun sebenarnya tidak wajib dipakai lagi — cukup `vite build` lalu
// serve folder `dist/`. Dipertahankan di sini agar alur `npm run dev` yang
// sudah biasa dipakai tetap jalan tanpa perubahan.
// ============================================================================
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = 3000;

async function startServer() {
  const app = express();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SIA-SD] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server error:", err);
});
