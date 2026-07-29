import React, { useState, useEffect } from "react";
import { api, toast } from "../utils/api";
import { confirmDialog } from "./ConfirmModal";
import { uploadSekolahLogo } from "../utils/storage";
import AvatarUpload from "./AvatarUpload";
import { 
  Settings as SettingsIcon, 
  HardDrive, 
  RotateCcw, 
  Upload, 
  Clock, 
  ShieldAlert,
  Save,
  CheckCircle2,
  Download
} from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  // Form State
  const [namaSekolah, setNamaSekolah] = useState("");
  const [npsn, setNpsn] = useState("");
  const [alamat, setAlamat] = useState("");
  const [kepalaSekolah, setKepalaSekolah] = useState("");
  const [nipKepalaSekolah, setNipKepalaSekolah] = useState("");
  const [logoSekolah, setLogoSekolah] = useState("");
  const [semesterAktif, setSemesterAktif] = useState("Ganjil");
  const [tahunAjaranAktif, setTahunAjaranAktif] = useState("2025/2026");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const s = await api.get("/settings");
      const b = await api.get("/backup");
      setSettings(s);
      setBackups(b);

      // Populate form
      setNamaSekolah(s.namaSekolah || "");
      setNpsn(s.npsn || "");
      setAlamat(s.alamat || "");
      setKepalaSekolah(s.kepalaSekolah || "");
      setNipKepalaSekolah(s.nipKepalaSekolah || "");
      setLogoSekolah(s.logoSekolah || "");
      setSemesterAktif(s.semesterAktif || "Ganjil");
      setTahunAjaranAktif(s.tahunAjaranAktif || "2025/2026");
    } catch (e) {
      toast.show("Gagal memuat pengaturan!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        namaSekolah,
        npsn,
        alamat,
        kepalaSekolah,
        nipKepalaSekolah,
        logoSekolah,
        semesterAktif,
        tahunAjaranAktif
      };
      await api.put("/settings", payload);
      toast.show("Pengaturan umum berhasil disimpan!", "success");
      fetchData();
    } catch (err) {
      toast.show("Gagal memperbarui pengaturan!", "error");
    } finally {
      setSaving(false);
    }
  };

  // Perform a new database backup snapshot
  const handleCreateBackup = async () => {
    setBackingUp(true);
    try {
      await api.post("/backup", {});
      toast.show("Snapshot pencadangan data berhasil dibuat!", "success");
      fetchData();
    } catch (err) {
      toast.show("Gagal membuat cadangan data!", "error");
    } finally {
      setBackingUp(false);
    }
  };

  // Restore database state from a backup ID
  const handleRestoreBackup = async (id: string, fileName: string) => {
    const confirmed = await confirmDialog(
      `Apakah Anda yakin ingin memulihkan data dari cadangan [ ${fileName} ]? Data saat ini akan sepenuhnya ditimpa!`,
      { title: "Pulihkan Data Cadangan", confirmLabel: "Ya, Pulihkan", danger: true }
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await api.post(`/backup/restore/${id}`, {});
      toast.show("Data berhasil dipulihkan dari cadangan!", "success");
      fetchData();
    } catch (err: any) {
      toast.show(err.message || "Gagal memulihkan data!", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-96 bg-white border rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Title Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <SettingsIcon size={14} />
            <span>Pusat Kontrol & Utilitas</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Pengaturan Sistem</h1>
          <p className="text-xs text-slate-400">Atur profil sekolah, tahun ajaran aktif, semester, penandatangan surat, serta backup/restore data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: School Profiling & Year Settings Form */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-6">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-3 border-slate-50">
            <SettingsIcon size={18} className="text-blue-600" />
            <span>Profil Sekolah & Variabel Sistem</span>
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Sekolah Dasar / MI*</label>
                <input
                  type="text"
                  required
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">NPSN Sekolah*</label>
                <input
                  type="text"
                  required
                  value={npsn}
                  onChange={(e) => setNpsn(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Alamat Lengkap Sekolah*</label>
              <textarea
                required
                rows={2}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="mt-1.5 w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Kepala Sekolah*</label>
                <input
                  type="text"
                  required
                  value={kepalaSekolah}
                  onChange={(e) => setKepalaSekolah(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">NIP Kepala Sekolah*</label>
                <input
                  type="text"
                  required
                  value={nipKepalaSekolah}
                  onChange={(e) => setNipKepalaSekolah(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-sans">Tahun Ajaran Aktif</label>
                <select
                  value={tahunAjaranAktif}
                  onChange={(e) => setTahunAjaranAktif(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white font-medium"
                >
                  <option value="2025/2026">2025/2026</option>
                  <option value="2026/2027">2026/2027</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-sans">Semester Aktif</label>
                <select
                  value={semesterAktif}
                  onChange={(e) => setSemesterAktif(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white font-medium"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Logo Sekolah</label>
              <div className="mt-2 flex items-center gap-4">
                <AvatarUpload
                  photoUrl={logoSekolah}
                  fallbackText={namaSekolah || "S"}
                  size={72}
                  ringClassName="border-slate-100"
                  badgeClassName="bg-slate-800 hover:bg-slate-900"
                  onUpload={async (file) => {
                    const url = await uploadSekolahLogo(file);
                    setLogoSekolah(url);
                  }}
                />
                <div className="flex-1 space-y-1.5">
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Klik ikon kamera untuk unggah logo langsung (disarankan gambar persegi, minimal <span className="font-bold text-slate-700">256×256px</span>, format PNG latar transparan, maks. 2MB) — supaya tidak pecah/buram saat ditampilkan.
                  </p>
                  <details className="text-[10px] text-slate-400">
                    <summary className="cursor-pointer font-semibold hover:text-slate-600 select-none">Atau tempel link gambar manual</summary>
                    <input
                      type="text"
                      value={logoSekolah}
                      onChange={(e) => setLogoSekolah(e.target.value)}
                      placeholder="https://link-gambar-logo.png"
                      className="mt-1.5 w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white"
                    />
                  </details>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-slate-400">
                Jangan lupa klik <span className="font-bold">Simpan Pengaturan</span> di bawah setelah mengganti logo.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition shadow-md shadow-blue-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Save size={14} />
                )}
                Simpan Konfigurasi
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Backup & Restore Operations */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b pb-3 border-slate-50">
              <HardDrive size={18} className="text-emerald-600" />
              <span>Utilitas Cadangan (Backup)</span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              Buat cadangan seluruh data sistem secara instan. File cadangan disimpan aman di penyimpanan terenkripsi untuk mencegah kehilangan data akibat kesalahan input atau hapus massal yang tidak disengaja.
            </p>

            {/* Backups List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {backups && backups.length > 0 ? (
                backups.map((b) => (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-700 truncate max-w-[150px]" title={b.namaFile}>
                        {b.namaFile}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded">
                        {b.ukuran}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(b.tanggalBackup).toLocaleDateString("id-ID")}
                      </span>

                      <button
                        onClick={() => handleRestoreBackup(b.id, b.namaFile)}
                        className="px-2.5 py-1 text-[9px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition"
                      >
                        Pulihkan ↩️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  Belum ada riwayat pencadangan data.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleCreateBackup}
              disabled={backingUp}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              {backingUp ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <HardDrive size={14} />
              )}
              Cadangkan Data Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
