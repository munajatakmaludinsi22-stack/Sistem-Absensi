import React, { useState, useEffect } from "react";
import { api, toast } from "../utils/api";
import { confirmDialog } from "./ConfirmModal";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  X, 
  CalendarDays,
  AlertCircle
} from "lucide-react";

interface CalendarProps {
  user: any;
}

export default function AcademicCalendar({ user }: CalendarProps) {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [formTanggal, setFormTanggal] = useState("");
  const [formKegiatan, setFormKegiatan] = useState("");
  const [formTipe, setFormTipe] = useState("Kegiatan Sekolah");

  useEffect(() => {
    fetchAgendas();
  }, []);

  const fetchAgendas = async () => {
    setLoading(true);
    try {
      const data = await api.get("/kalender");
      setAgendas(data);
    } catch (e) {
      toast.show("Gagal memuat kalender akademik!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTanggal || !formKegiatan) {
      toast.show("Tanggal dan Kegiatan wajib diisi!", "error");
      return;
    }

    try {
      await api.post("/kalender", {
        tanggal: formTanggal,
        kegiatan: formKegiatan,
        tipe: formTipe
      });
      toast.show("Agenda kalender baru berhasil disimpan!", "success");
      setShowFormModal(false);
      setFormTanggal("");
      setFormKegiatan("");
      fetchAgendas();
    } catch (err: any) {
      toast.show(err.message || "Gagal menyimpan agenda!", "error");
    }
  };

  const handleDeleteAgenda = async (id: string) => {
    const confirmed = await confirmDialog(
      "Hapus agenda kalender ini dari jadwal tahunan?",
      { title: "Hapus Agenda Kalender", confirmLabel: "Ya, Hapus", danger: true }
    );
    if (!confirmed) return;

    try {
      await api.delete(`/kalender/${id}`);
      toast.show("Agenda kalender dihapus.", "success");
      fetchAgendas();
    } catch (e) {
      toast.show("Gagal menghapus agenda!", "error");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <CalendarDays size={14} />
            <span>Agenda & Rencana Belajar</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Kalender Akademik</h1>
          <p className="text-xs text-slate-400">Atur kalender kegiatan sekolah dasar, jadwal ujian semester, libur nasional, serta agenda wali murid.</p>
        </div>

        {/* Action Panel */}
        {user.role === "admin" && (
          <button
            onClick={() => setShowFormModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-100 transition flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} />
            Tambah Agenda
          </button>
        )}
      </div>

      {/* Main timeline listing */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 text-xs font-medium">Memuat agenda kalender...</p>
        </div>
      ) : agendas.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <Calendar size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Kalender Akademik Kosong</h3>
          <p className="text-xs text-slate-400 mt-1">Belum ada agenda sekolah terdaftar.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
          <div className="space-y-4 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {agendas.map((cal) => (
              <div key={cal.id} className="flex gap-4 items-start relative text-xs">
                {/* Timeline node */}
                <div className={`h-10 w-10 bg-slate-50 border border-slate-200 flex flex-col items-center justify-center rounded-xl font-mono leading-none shrink-0 font-bold relative z-10 ${
                  cal.tipe === "Libur" ? "bg-rose-50 border-rose-100 text-rose-700" :
                  cal.tipe === "Ujian" ? "bg-amber-50 border-amber-100 text-amber-700" :
                  "bg-indigo-50 border-indigo-100 text-indigo-700"
                }`}>
                  <span className="text-[14px]">
                    {new Date(cal.tanggal).toLocaleDateString("id-ID", { day: "numeric" })}
                  </span>
                  <span className="text-[8px] uppercase font-bold mt-0.5">
                    {new Date(cal.tanggal).toLocaleDateString("id-ID", { month: "short" })}
                  </span>
                </div>

                <div className="flex-grow pt-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 leading-tight text-sm">{cal.kegiatan}</h4>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      cal.tipe === "Libur" ? "bg-rose-50 text-rose-700" :
                      cal.tipe === "Ujian" ? "bg-amber-50 text-amber-700" :
                      "bg-indigo-50 text-indigo-700"
                    }`}>
                      {cal.tipe}
                    </span>
                  </div>
                  <p className="text-slate-400 font-semibold">{cal.tanggal}</p>
                </div>

                {user.role === "admin" && (
                  <button
                    onClick={() => handleDeleteAgenda(cal.id)}
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition self-center"
                    title="Hapus Agenda"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Calendar Event */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Tambah Agenda Kalender</h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAgenda} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Pilih Tanggal Kegiatan*</label>
                <input
                  type="date"
                  required
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Kegiatan / Agenda*</label>
                <input
                  type="text"
                  required
                  value={formKegiatan}
                  onChange={(e) => setFormKegiatan(e.target.value)}
                  placeholder="Contoh: Rapat Komite Akhir Tahun"
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-sans">Kategori Kegiatan</label>
                <select
                  value={formTipe}
                  onChange={(e) => setFormTipe(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white font-medium"
                >
                  <option value="Kegiatan Sekolah">Kegiatan Sekolah (Akademik/Umum)</option>
                  <option value="Ujian">Pelaksanaan Ujian / UTS / UAS</option>
                  <option value="Libur">Hari Libur Sekolah / Nasional</option>
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
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
