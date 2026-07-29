import React, { useState, useEffect } from "react";
import { api, toast } from "../utils/api";
import { confirmDialog } from "./ConfirmModal";
import { uploadGuruFoto } from "../utils/storage";
import AvatarUpload from "./AvatarUpload";
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Key,
  ShieldAlert,
  Contact2,
  UserPlus
} from "lucide-react";

interface TeacherProps {
  user: any;
}

export default function TeacherManager({ user }: TeacherProps) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [kelasOptions, setKelasOptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<any>(null);

  // Form edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNip, setFormNip] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formKelas, setFormKelas] = useState("");
  const [formStatus, setFormStatus] = useState("aktif");
  const [formFoto, setFormFoto] = useState("");
  const [pendingFotoFile, setPendingFotoFile] = useState<File | null>(null);
  const [formBuatAkun, setFormBuatAkun] = useState(true);
  const [formUsername, setFormUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchKelasOptions();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await api.get("/guru");
      setTeachers(data);
    } catch (e) {
      toast.show("Gagal memuat data guru!", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchKelasOptions = async () => {
    try {
      const data = await api.get("/kelas");
      setKelasOptions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormNip("");
    setFormNama("");
    setFormEmail("");
    setFormKelas(kelasOptions.length > 0 ? kelasOptions[0].id : "IA");
    setFormStatus("aktif");
    setFormFoto("");
    setPendingFotoFile(null);
    setFormBuatAkun(true);
    setFormUsername("");
    setShowFormModal(true);
  };

  const handleOpenEdit = (teacher: any) => {
    setEditingId(teacher.id);
    setFormNip(teacher.nip);
    setFormNama(teacher.nama);
    setFormEmail(teacher.email);
    setFormKelas(teacher.kelasDiampu);
    setFormStatus(teacher.status);
    setFormFoto(teacher.foto || "");
    setPendingFotoFile(null);
    setFormBuatAkun(false);
    setFormUsername("");
    setShowFormModal(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNip || !formNama || !formEmail) {
      toast.show("Semua kolom bertanda bintang wajib diisi!", "error");
      return;
    }
    if (!editingId && formBuatAkun && !formUsername.trim()) {
      toast.show("Username akun login wajib diisi (atau matikan opsi buat akun)!", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        let foto = formFoto;
        if (pendingFotoFile) {
          foto = await uploadGuruFoto(pendingFotoFile, editingId);
        }
        const payload = { nip: formNip, nama: formNama, email: formEmail, kelasDiampu: formKelas, status: formStatus, foto };
        await api.put(`/guru/${editingId}`, payload);
        toast.show("Data guru berhasil diperbarui!", "success");
        setShowFormModal(false);
        fetchTeachers();
      } else {
        // 1. Buat baris data guru dulu (butuh id untuk path foto)
        const createPayload = {
          nip: formNip, nama: formNama, email: formEmail, kelasDiampu: formKelas, status: formStatus,
          buatAkun: formBuatAkun, akunUsername: formUsername.trim(),
        };
        const res = await api.post("/guru", createPayload);

        // 2. Kalau ada foto yang dipilih, upload sekarang lalu simpan ke baris guru yang baru dibuat
        if (pendingFotoFile && res.guru?.id) {
          try {
            const foto = await uploadGuruFoto(pendingFotoFile, res.guru.id);
            await api.put(`/guru/${res.guru.id}`, { ...createPayload, foto });
          } catch (fotoErr: any) {
            toast.show(fotoErr.message || "Guru tersimpan, tapi foto gagal diunggah.", "error");
          }
        }

        toast.show("Pendidik baru berhasil didaftarkan!", "success");
        setShowFormModal(false);
        fetchTeachers();

        // Tampilkan kredensial login supaya admin bisa langsung menyerahkan ke guru
        if (res.creds) {
          setGeneratedCreds({
            nama: formNama,
            username: res.creds.username,
            password: res.creds.password
          });
          setShowCredsModal(true);
        }
      }
    } catch (err: any) {
      toast.show(err.message || "Gagal menyimpan data guru!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (id: string, nama: string) => {
    const confirmed = await confirmDialog(
      `Hapus data guru [ ${nama} ]? Akun login guru ini juga akan segera dinonaktifkan secara otomatis.`,
      { title: "Hapus Data Guru", confirmLabel: "Ya, Hapus", danger: true }
    );
    if (!confirmed) return;

    try {
      await api.delete(`/guru/${id}`);
      toast.show("Data guru berhasil dihapus dari sistem sekolah.", "success");
      fetchTeachers();
    } catch (err: any) {
      toast.show(err.message || "Gagal menghapus guru!", "error");
    }
  };

  const filteredTeachers = teachers.filter((t) =>
    t.nama.toLowerCase().includes(searchQuery.toLowerCase()) || t.nip.includes(searchQuery)
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <Contact2 size={14} />
            <span>Master Pendidik & Staf</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Kelola Data Guru</h1>
          <p className="text-xs text-slate-400">Kelola tenaga pendidik, wali kelas, informasi kontak, serta pembuatan akun login otomatis.</p>
        </div>

        {/* Action Panel */}
        {user.role === "admin" && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-100 transition flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} />
            Daftar Guru Baru
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Cari guru berdasarkan nama atau NIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
          />
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 text-xs font-medium">Memuat data guru...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Guru tidak ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1">Ubah kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100/50">
                  <th className="p-4">NIP / Identitas</th>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Wali Kelas</th>
                  <th className="p-4">Status</th>
                  {user.role === "admin" && <th className="p-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono font-medium text-slate-600">
                      {t.nip}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                          {t.foto ? (
                            <img src={t.foto} alt={t.nama} className="w-full h-full object-cover" />
                          ) : (
                            t.nama.charAt(0)
                          )}
                        </div>
                        <span className="font-bold text-slate-800">{t.nama}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{t.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold">
                        Kelas {t.kelasDiampu || "Belum diatur"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        t.status === "aktif" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>
                        {t.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    {user.role === "admin" && (
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(t.id, t.nama)}
                            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Teacher */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? "Edit Data Pendidik" : "Daftarkan Guru Baru"}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col items-center gap-2 pb-2">
                <AvatarUpload
                  photoUrl={pendingFotoFile ? URL.createObjectURL(pendingFotoFile) : formFoto}
                  fallbackText={formNama || "G"}
                  size={72}
                  onUpload={async (file) => {
                    // Simpan file dulu; benar-benar diunggah saat form disimpan
                    // (guru baru butuh id yang baru terbentuk setelah insert).
                    setPendingFotoFile(file);
                  }}
                />
                <span className="text-[10px] text-slate-400">Foto Guru (opsional, maks. 2MB)</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Nomor Induk Pegawai (NIP)*</label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={formNip}
                  onChange={(e) => {
                    setFormNip(e.target.value);
                    if (!editingId) setFormUsername((prev) => (prev === "" || prev === formNip ? e.target.value : prev));
                  }}
                  placeholder="Contoh: 198804122015031002"
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Lengkap & Gelar*</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi, S.Pd."
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Alamat Email*</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Contoh: ahmad.fauzi@sekolah.sch.id"
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Wali Kelas Diampu</label>
                  <select
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    {kelasOptions.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Status Kepegawaian</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="aktif">Aktif Mengajar</option>
                    <option value="tidak aktif">Nonaktif / Cuti</option>
                  </select>
                </div>
              </div>

              {!editingId && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formBuatAkun}
                      onChange={(e) => setFormBuatAkun(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                      <UserPlus size={14} />
                      Buatkan juga akun login untuk guru ini
                    </span>
                  </label>

                  {formBuatAkun && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase">Username Login*</label>
                      <input
                        type="text"
                        required={formBuatAkun}
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                        placeholder="Contoh: ahmad.fauzi (default: NIP)"
                        className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <p className="mt-1.5 text-[10px] text-slate-500">Password akan dibuat otomatis dan ditampilkan setelah disimpan.</p>
                    </div>
                  )}
                </div>
              )}

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
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition shadow-md shadow-blue-50 disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan Guru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Account Credentials Display */}
      {showCredsModal && generatedCreds && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center gap-2">
                <Key size={18} />
                <h3 className="text-sm font-bold">Kredensial Login Terbuat!</h3>
              </div>
              <button onClick={() => setShowCredsModal(false)} className="p-1.5 text-emerald-200 hover:text-white rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Akun login untuk Guru [ <span className="font-bold text-slate-800">{generatedCreds.nama}</span> ] telah berhasil dibuat secara otomatis dengan hak akses sesuai peran (role) yang ditentukan.
              </p>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Username</span>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 border border-slate-100 rounded inline-block mt-0.5 select-all">
                    {generatedCreds.username}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Password (Kata Sandi)</span>
                  <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 border border-slate-100 rounded inline-block mt-0.5 select-all">
                    {generatedCreds.password}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 text-[10px] text-amber-800 p-3 rounded-xl">
                ⚠️ <span className="font-bold">PENTING:</span> Harap segera catat dan bagikan kredensial di atas kepada guru yang bersangkutan. Password ini dapat diubah mandiri nantinya di modul Profil Pengguna.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowCredsModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded-xl transition"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
