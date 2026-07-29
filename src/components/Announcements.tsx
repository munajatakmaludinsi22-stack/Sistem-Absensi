import React, { useState, useEffect } from "react";
import { api, toast } from "../utils/api";
import { confirmDialog } from "./ConfirmModal";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  X, 
  AlertCircle 
} from "lucide-react";

interface AnnouncementsProps {
  user: any;
}

export default function Announcements({ user }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [formJudul, setFormJudul] = useState("");
  const [formIsi, setFormIsi] = useState("");
  const [formTarget, setFormTarget] = useState("Semua");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await api.get("/pengumuman");
      setAnnouncements(data);
    } catch (e) {
      toast.show("Gagal memuat papan pengumuman!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul || !formIsi) {
      toast.show("Judul dan isi pengumuman wajib diisi!", "error");
      return;
    }

    try {
      await api.post("/pengumuman", {
        judul: formJudul,
        isi: formIsi,
        target: formTarget
      });
      toast.show("Pengumuman baru berhasil diterbitkan!", "success");
      setShowFormModal(false);
      setFormJudul("");
      setFormIsi("");
      fetchAnnouncements();
    } catch (err: any) {
      toast.show(err.message || "Gagal menerbitkan pengumuman!", "error");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const confirmed = await confirmDialog(
      "Hapus pengumuman ini dari mading sekolah?",
      { title: "Hapus Pengumuman", confirmLabel: "Ya, Hapus", danger: true }
    );
    if (!confirmed) return;

    try {
      await api.delete(`/pengumuman/${id}`);
      toast.show("Pengumuman berhasil ditarik.", "success");
      fetchAnnouncements();
    } catch (e) {
      toast.show("Gagal menghapus pengumuman!", "error");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <Megaphone size={14} />
            <span>Mading & Pengumuman Sekolah</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Pengumuman Sekolah</h1>
          <p className="text-xs text-slate-400">Terbitkan pengumuman resmi sekolah, imbauan kesiswaan, atau pemberitahuan wali murid.</p>
        </div>

        {/* Action Panel */}
        {(user.role === "admin" || user.role === "guru") && (
          <button
            onClick={() => setShowFormModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-100 transition flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} />
            Terbitkan Pengumuman
          </button>
        )}
      </div>

      {/* Main notice board stack */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 text-xs font-medium">Menyinkronkan mading...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <Megaphone size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Mading Kosong</h3>
          <p className="text-xs text-slate-400 mt-1">Belum ada pengumuman baru yang diterbitkan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition duration-300 relative">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full text-[9px] uppercase tracking-wider">
                    Target: {ann.target}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">{ann.tanggal}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 leading-snug">{ann.judul}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.isi}</p>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4 mt-5 flex items-center justify-between text-[10px] text-slate-400">
                <span>Diterbitkan Oleh: <span className="font-bold text-slate-600">{ann.dibuatOleh}</span></span>
                
                {(user.role === "admin" || ann.dibuatOleh === user.nama) && (
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition"
                    title="Tarik Pengumuman"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Announcement */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Tulis Pengumuman Baru</h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Judul Pengumuman*</label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: Jadwal Libur Sekolah Idul Adha"
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Isi Informasi Pengumuman*</label>
                <textarea
                  required
                  rows={5}
                  value={formIsi}
                  onChange={(e) => setFormIsi(e.target.value)}
                  placeholder="Ketikkan pesan lengkap pengumuman di sini..."
                  className="mt-1.5 w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-sans">Target Penerima Informasi</label>
                <select
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white font-medium"
                >
                  <option value="Semua">Semua Pihak (Umum)</option>
                  <option value="Guru">Tenaga Pendidik (Guru)</option>
                  <option value="Wali Kelas">Khusus Wali Kelas</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 bg-white hover:bg-slate-50 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition shadow-md"
                >
                  Terbitkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
