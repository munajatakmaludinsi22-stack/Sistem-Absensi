import React, { useState, useEffect } from "react";
import { api, toast } from "../utils/api";
import { confirmDialog } from "./ConfirmModal";
import { 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  School, 
  Users,
  Award
} from "lucide-react";

interface ClassProps {
  user: any;
}

export default function ClassManager({ user }: ClassProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formId, setFormId] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formWaliKelas, setFormWaliKelas] = useState("");
  const [formKapasitas, setFormKapasitas] = useState(28);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cls = await api.get("/kelas");
      const tch = await api.get("/guru");
      const std = await api.get("/siswa");

      // Count students in each class
      const counts: Record<string, number> = {};
      cls.forEach((c: any) => {
        counts[c.id] = std.filter((s: any) => s.kelas === c.id && s.status === "aktif").length;
      });

      setClasses(cls);
      setTeachers(tch.filter((t: any) => t.status === "aktif"));
      setStudentCounts(counts);
    } catch (e) {
      toast.show("Gagal memuat data kelas!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormId("");
    setFormNama("");
    setFormWaliKelas(teachers.length > 0 ? teachers[0].id : "");
    setFormKapasitas(28);
    setShowFormModal(true);
  };

  const handleOpenEdit = (cls: any) => {
    setEditingId(cls.id);
    setFormId(cls.id);
    setFormNama(cls.nama);
    setFormWaliKelas(cls.waliKelasId);
    setFormKapasitas(cls.kapasitas);
    setShowFormModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId || !formNama || !formWaliKelas) {
      toast.show("Semua kolom bertanda bintang wajib diisi!", "error");
      return;
    }

    const payload = {
      id: formId,
      nama: formNama,
      waliKelasId: formWaliKelas,
      kapasitas: formKapasitas
    };

    try {
      if (editingId) {
        await api.put(`/kelas/${editingId}`, payload);
        toast.show("Data rombel/kelas berhasil diperbarui!", "success");
      } else {
        await api.post("/kelas", payload);
        toast.show("Rombel/kelas baru berhasil ditambahkan!", "success");
      }
      setShowFormModal(false);
      fetchData();
    } catch (err: any) {
      toast.show(err.message || "Gagal menyimpan kelas!", "error");
    }
  };

  const handleDeleteClass = async (id: string, nama: string) => {
    const confirmed = await confirmDialog(
      `Hapus kelas [ ${nama} ] dari sistem? Tindakan ini bersifat permanen.`,
      { title: "Hapus Data Kelas", confirmLabel: "Ya, Hapus", danger: true }
    );
    if (!confirmed) return;

    try {
      await api.delete(`/kelas/${id}`);
      toast.show("Kelas berhasil dihapus.", "success");
      fetchData();
    } catch (err: any) {
      toast.show(err.message || "Gagal menghapus kelas!", "error");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <School size={14} />
            <span>Master Struktur Akademik</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Kelola Rombongan Belajar (Kelas)</h1>
          <p className="text-xs text-slate-400">Kelola daftar kelas, penunjukan Wali Kelas (guru pengampu), kuota tampung, serta jumlah siswa aktif.</p>
        </div>

        {user.role === "admin" && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-100 transition flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} />
            Tambah Kelas Baru
          </button>
        )}
      </div>

      {/* Rombel Cards Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 text-xs font-medium">Memuat rombel...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <School size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Rombongan Belajar Kosong</h3>
          <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Tambah Kelas Baru" untuk mendaftarkan kelas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const numSiswa = studentCounts[cls.id] || 0;
            const utilization = Math.round((numSiswa / cls.kapasitas) * 100);

            return (
              <div key={cls.id} className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-24 w-24 bg-blue-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition duration-300 z-0" />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                      <School size={20} />
                    </div>
                    {user.role === "admin" && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEdit(cls)}
                          className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id, cls.nama)}
                          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">ID Rombel: {cls.id}</span>
                    <h3 className="text-base font-bold text-slate-800 mt-0.5">{cls.nama}</h3>
                  </div>

                  <div className="space-y-2 border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Award size={14} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium truncate">
                        Wali Kelas: <span className="font-bold text-slate-800">{cls.waliKelasNama}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Users size={14} className="text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-medium">
                        Kapasitas Kelas: <span className="font-bold text-slate-800">{numSiswa} / {cls.kapasitas} Siswa</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-5 space-y-1 relative z-10">
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>Utilitas Kelas</span>
                    <span>{utilization}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        utilization > 90 ? "bg-rose-500" : utilization > 60 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Class */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? "Edit Kelas / Rombel" : "Tambah Rombel Baru"}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Kode Rombel (ID Kelas)*</label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="Contoh: IA, IIA, IIB"
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Rombel / Kelas*</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Kelas I-A"
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-sans">Wali Kelas Pengampu*</label>
                <select
                  value={formWaliKelas}
                  onChange={(e) => setFormWaliKelas(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="">-- Pilih Guru Wali Kelas --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.nama} (NIP: {t.nip})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Kuota Kapasitas Tampung Siswa*</label>
                <input
                  type="number"
                  required
                  value={formKapasitas}
                  onChange={(e) => setFormKapasitas(Number(e.target.value))}
                  placeholder="Contoh: 28"
                  min={5}
                  max={50}
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
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
                  Simpan Rombel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
