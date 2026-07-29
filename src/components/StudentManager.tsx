import React, { useState, useEffect } from "react";
import { api, toast } from "../utils/api";
import { confirmDialog } from "./ConfirmModal";
import { uploadSiswaFoto } from "../utils/storage";
import AvatarUpload from "./AvatarUpload";
import { 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Edit, 
  Eye, 
  UserPlus, 
  UserCheck, 
  Upload, 
  X, 
  Info,
  Calendar,
  AlertCircle
} from "lucide-react";

interface StudentProps {
  user: any;
}

export default function StudentManager({ user }: StudentProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [kelasOptions, setKelasOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [selectedGender, setSelectedGender] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNis, setFormNis] = useState("");
  const [formNisn, setFormNisn] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formKelas, setFormKelas] = useState("");
  const [formGender, setFormGender] = useState("L");
  const [formAyah, setFormAyah] = useState("");
  const [formIbu, setFormIbu] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [formStatus, setFormStatus] = useState("aktif");
  const [formFoto, setFormFoto] = useState("");
  const [pendingFotoFile, setPendingFotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Selected student details state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);

  // Raw copy paste data for importer
  const [importText, setImportText] = useState("");

  useEffect(() => {
    fetchStudents();
    fetchKelasOptions();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.get("/siswa");
      setStudents(data);
    } catch (e) {
      toast.show("Gagal memuat data siswa!", "error");
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

  // Open Add Student
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormNis("");
    setFormNisn("");
    setFormNama("");
    setFormKelas(kelasOptions.length > 0 ? kelasOptions[0].id : "IA");
    setFormGender("L");
    setFormAyah("");
    setFormIbu("");
    setFormAlamat("");
    setFormStatus("aktif");
    setFormFoto("");
    setPendingFotoFile(null);
    setShowFormModal(true);
  };

  // Open Edit Student
  const handleOpenEdit = (student: any) => {
    setEditingId(student.id);
    setFormNis(student.nis);
    setFormNisn(student.nisn);
    setFormNama(student.nama);
    setFormKelas(student.kelas);
    setFormGender(student.jenisKelamin);
    setFormAyah(student.namaAyah);
    setFormIbu(student.namaIbu);
    setFormAlamat(student.alamat);
    setFormStatus(student.status);
    setFormFoto(student.foto || "");
    setPendingFotoFile(null);
    setShowFormModal(true);
  };

  // Open Student Details & Load Attendance logs
  const handleOpenDetails = async (student: any) => {
    setSelectedStudent(student);
    setStudentHistory([]);
    setShowDetailModal(true);

    try {
      // Fetch full history logs and filter client side
      const res = await api.get("/dashboard/stats");
      // Find all absensi matching student NIS in the whole database
      const dbRes = await api.get("/spreadsheet");
      const matched = dbRes.absensi
        .filter((a: any) => a.nis === student.nis)
        .sort((a: any, b: any) => b.tanggal.localeCompare(a.tanggal));
      setStudentHistory(matched);
    } catch (e) {
      console.error("Gagal memuat riwayat kehadiran siswa:", e);
    }
  };

  // Save Add/Edit
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNis || !formNama || !formKelas) {
      toast.show("NIS, Nama Lengkap, dan Kelas wajib diisi!", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        let foto = formFoto;
        if (pendingFotoFile) {
          foto = await uploadSiswaFoto(pendingFotoFile, editingId);
        }
        const payload = {
          nis: formNis, nisn: formNisn, nama: formNama, kelas: formKelas, jenisKelamin: formGender,
          namaAyah: formAyah, namaIbu: formIbu, alamat: formAlamat, status: formStatus, foto,
        };
        await api.put(`/siswa/${editingId}`, payload);
        toast.show("Profil siswa berhasil diperbarui!", "success");
        setShowFormModal(false);
        fetchStudents();
      } else {
        const createPayload = {
          nis: formNis, nisn: formNisn, nama: formNama, kelas: formKelas, jenisKelamin: formGender,
          namaAyah: formAyah, namaIbu: formIbu, alamat: formAlamat, status: formStatus,
        };
        const res = await api.post("/siswa", createPayload);

        if (pendingFotoFile && res.siswa?.id) {
          try {
            const foto = await uploadSiswaFoto(pendingFotoFile, res.siswa.id);
            await api.put(`/siswa/${res.siswa.id}`, { ...createPayload, foto });
          } catch (fotoErr: any) {
            toast.show(fotoErr.message || "Siswa tersimpan, tapi foto gagal diunggah.", "error");
          }
        }

        toast.show("Siswa baru berhasil didaftarkan!", "success");
        setShowFormModal(false);
        fetchStudents();
      }
    } catch (err: any) {
      toast.show(err.message || "Gagal menyimpan data siswa!", "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (id: string, nama: string) => {
    const confirmed = await confirmDialog(
      `Apakah Anda yakin ingin menghapus data siswa [ ${nama} ]? Semua riwayat absensi siswa ini juga akan dibersihkan.`,
      { title: "Hapus Data Siswa", confirmLabel: "Ya, Hapus", danger: true }
    );
    if (!confirmed) return;

    try {
      await api.delete(`/siswa/${id}`);
      toast.show("Data siswa berhasil dihapus.", "success");
      fetchStudents();
    } catch (err: any) {
      toast.show(err.message || "Gagal menghapus siswa!", "error");
    }
  };

  // Handle direct paste import
  const handleImportSiswa = async () => {
    if (!importText.trim()) {
      toast.show("Tempelkan data siswa terlebih dahulu!", "error");
      return;
    }

    // Split text into lines, then tab or comma delimited cells
    const lines = importText.trim().split("\n");
    const parsedData: any[] = [];

    lines.forEach((line) => {
      // Support TSV (tab) or CSV (comma) separation
      const cells = line.split(/\t|,/);
      if (cells.length >= 3) {
        parsedData.push({
          nis: cells[0]?.trim(),
          nisn: cells[1]?.trim() || "",
          nama: cells[2]?.trim(),
          kelas: cells[3]?.trim() || "IA",
          jenisKelamin: cells[4]?.trim() === "P" || cells[4]?.trim() === "Perempuan" ? "P" : "L",
          namaAyah: cells[5]?.trim() || "",
          namaIbu: cells[6]?.trim() || "",
          alamat: cells[7]?.trim() || ""
        });
      }
    });

    if (parsedData.length === 0) {
      toast.show("Format teks tidak terbaca! Gunakan pemisah Tab atau Koma.", "error");
      return;
    }

    try {
      const res = await api.post("/siswa/import", { data: parsedData });
      toast.show(`Sukses mengimpor ${res.importedCount} siswa! (Dilewati: ${res.skippedCount})`, "success");
      setShowImportModal(false);
      setImportText("");
      fetchStudents();
    } catch (err: any) {
      toast.show(err.message || "Gagal mengimpor data siswa!", "error");
    }
  };

  // Export current list to JSON file (Excel / Spreadsheet compatible copy)
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "rekap_siswa_sia_sd.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.show("Data siswa berhasil diekspor ke file JSON", "success");
  };

  // Client side filters
  const filteredStudents = students.filter((s) => {
    const matchSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery);
    const matchKelas = selectedKelas === "Semua" || s.kelas === selectedKelas;
    const matchGender = selectedGender === "Semua" || s.jenisKelamin === selectedGender;
    return matchSearch && matchKelas && matchGender;
  });

  // Pagination calculation
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Top Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold uppercase tracking-wider">
            <UserCheck size={14} />
            <span>Master Data Akademik</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 font-sans">Kelola Data Siswa</h1>
          <p className="text-xs text-slate-400">Kelola informasi murid, data wali murid, detail profil, riwayat presensi harian, serta backup/import eksternal.</p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap gap-2">
          {user.role === "admin" && (
            <>
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-100 transition flex items-center gap-1.5"
              >
                <Plus size={14} />
                Daftar Siswa
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="px-3.5 py-2 border border-blue-200 text-xs font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-100/50 rounded-xl transition flex items-center gap-1.5"
              >
                <FileSpreadsheet size={14} />
                Impor CSV/Teks
              </button>
            </>
          )}

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 border border-slate-200 text-xs font-semibold text-slate-600 bg-white rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
          >
            <Download size={14} />
            Ekspor JSON
          </button>
        </div>
      </div>

      {/* Filter Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-slate-100 shadow-sm rounded-3xl p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Cari nama atau NIS siswa..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
          />
        </div>

        <div>
          <select
            value={selectedKelas}
            onChange={(e) => { setSelectedKelas(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
          >
            <option value="Semua">Semua Kelas</option>
            {kelasOptions.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedGender}
            onChange={(e) => { setSelectedGender(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
          >
            <option value="Semua">Semua Jenis Kelamin</option>
            <option value="L">Laki-laki (L)</option>
            <option value="P">Perempuan (P)</option>
          </select>
        </div>
      </div>

      {/* Main Students Table */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 text-xs font-medium">Melakukan query ke spreadsheet db...</p>
        </div>
      ) : paginatedStudents.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Siswa tidak ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1">Ubah kata kunci pencarian atau bersihkan filter di atas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100/50">
                    <th className="p-4">NIS / NISN</th>
                    <th className="p-4">Nama Lengkap</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4">L/P</th>
                    <th className="p-4">Wali Murid</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {paginatedStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-mono font-medium text-slate-600">
                        {s.nis} <span className="text-[10px] text-slate-400 block">{s.nisn || "-"}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs uppercase border overflow-hidden shrink-0 ${
                            s.jenisKelamin === "L" ? "bg-sky-50 text-sky-700 border-sky-100" : "bg-pink-50 text-pink-700 border-pink-100"
                          }`}>
                            {s.foto ? (
                              <img src={s.foto} alt={s.nama} className="w-full h-full object-cover" />
                            ) : (
                              s.nama.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block leading-tight">{s.nama}</span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[200px] mt-0.5">{s.alamat}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold">
                          {s.kelas}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-600">{s.jenisKelamin}</td>
                      <td className="p-4 text-slate-600">
                        <div className="text-[11px] leading-snug">
                          <span className="block font-medium">A: {s.namaAyah || "-"}</span>
                          <span className="block text-slate-400">I: {s.namaIbu || "-"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          s.status === "aktif" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>
                          {s.status === "aktif" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenDetails(s)}
                            className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded-lg transition"
                            title="Detail Profil & Riwayat"
                          >
                            <Eye size={15} />
                          </button>

                          {user.role === "admin" && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(s)}
                                className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-slate-400 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.id, s.nama)}
                                className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition"
                                title="Hapus"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-1 text-xs text-slate-500">
              <span>Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} Siswa</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-1 bg-slate-100 rounded-lg font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal ADD / EDIT student */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? "Edit Profil Siswa" : "Pendaftaran Murid Baru"}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex flex-col items-center gap-2 pb-2">
                <AvatarUpload
                  photoUrl={pendingFotoFile ? URL.createObjectURL(pendingFotoFile) : formFoto}
                  fallbackText={formNama || "S"}
                  size={72}
                  ringClassName={formGender === "P" ? "border-pink-100" : "border-sky-100"}
                  onUpload={async (file) => {
                    // Simpan file dulu; benar-benar diunggah saat form disimpan
                    // (siswa baru butuh id yang baru terbentuk setelah insert).
                    setPendingFotoFile(file);
                  }}
                />
                <span className="text-[10px] text-slate-400">Foto Siswa (opsional, maks. 2MB)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Nomor Induk Siswa (NIS)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingId}
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    placeholder="Contoh: 1011"
                    className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">NISN (Nasional)</label>
                  <input
                    type="text"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    placeholder="Contoh: 31556021"
                    className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Nama Lengkap sesuai Akta Lahir"
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Rombongan Belajar (Kelas)</label>
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
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Ayah</label>
                  <input
                    type="text"
                    value={formAyah}
                    onChange={(e) => setFormAyah(e.target.value)}
                    placeholder="Nama lengkap Ayah"
                    className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Ibu</label>
                  <input
                    type="text"
                    value={formIbu}
                    onChange={(e) => setFormIbu(e.target.value)}
                    placeholder="Nama lengkap Ibu"
                    className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Alamat Domisili</label>
                <textarea
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  placeholder="Alamat lengkap RT/RW, Dusun, Kelurahan, Kecamatan"
                  rows={2}
                  className="mt-1.5 w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase font-sans">Status Keaktifan Siswa</label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="form-status"
                      value="aktif"
                      checked={formStatus === "aktif"}
                      onChange={() => setFormStatus("aktif")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Aktif Belajar
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="form-status"
                      value="tidak aktif"
                      checked={formStatus === "tidak aktif"}
                      onChange={() => setFormStatus("tidak aktif")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Keluar / Lulus
                  </label>
                </div>
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
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition shadow-md hover:shadow-lg shadow-blue-50 disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan Data Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal DETAIL PROFIL & RIWAYAT ABSENSI */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white relative">
              <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px)] bg-[size:1.5rem] opacity-20" />
              <div className="relative z-10">
                <h3 className="text-sm font-bold">Detail Profil Siswa</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Informasi kependudukan dan riwayat akademis</p>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg relative z-10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Profile Card Header */}
              <div className="flex gap-4 items-center border-b border-slate-100 pb-4">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center font-bold text-xl uppercase border overflow-hidden shrink-0 ${
                  selectedStudent.jenisKelamin === "L" ? "bg-sky-50 text-sky-700 border-sky-100" : "bg-pink-50 text-pink-700 border-pink-100"
                }`}>
                  {selectedStudent.foto ? (
                    <img src={selectedStudent.foto} alt={selectedStudent.nama} className="w-full h-full object-cover" />
                  ) : (
                    selectedStudent.nama.charAt(0)
                  )}
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-800 text-sm">{selectedStudent.nama}</h4>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold text-[9px]">
                      Kelas {selectedStudent.kelas}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[9px] uppercase">
                      {selectedStudent.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Demographics details info */}
              <div className="space-y-3 text-xs">
                <h5 className="font-bold text-slate-800 border-l-2 border-blue-500 pl-2">Informasi Umum</h5>
                <div className="grid grid-cols-2 gap-y-2.5 pt-1 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">NIS</span>
                    <span className="font-mono font-bold text-slate-700">{selectedStudent.nis}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">NISN</span>
                    <span className="font-mono font-bold text-slate-700">{selectedStudent.nisn || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Nama Ayah</span>
                    <span className="font-semibold text-slate-700">{selectedStudent.namaAyah || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Nama Ibu</span>
                    <span className="font-semibold text-slate-700">{selectedStudent.namaIbu || "-"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Alamat Domisili</span>
                    <span className="font-medium text-slate-700 leading-relaxed block">{selectedStudent.alamat || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Attendance logs timeline */}
              <div className="space-y-3 pt-2">
                <h5 className="font-bold text-slate-800 border-l-2 border-emerald-500 pl-2">Riwayat Presensi</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pt-1 pr-1">
                  {studentHistory.length > 0 ? (
                    studentHistory.map((h: any) => (
                      <div key={h.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="font-medium text-slate-600">{h.tanggal}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {h.catatan && (
                            <span className="text-[10px] text-slate-400 italic font-medium max-w-[120px] truncate" title={h.catatan}>
                              "{h.catatan}"
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            h.status === "Hadir" ? "bg-emerald-50 text-emerald-700" :
                            h.status === "Izin" ? "bg-blue-50 text-blue-700" :
                            h.status === "Sakit" ? "bg-amber-50 text-amber-700" :
                            h.status === "Alpha" ? "bg-rose-50 text-rose-700" :
                            "bg-orange-50 text-orange-700"
                          }`}>
                            {h.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      Belum ada catatan kehadiran siswa untuk semester ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal BULK IMPORT (Excel / TSV spreadsheet parser) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <div>
                <h3 className="text-sm font-bold">Impor Massal Data Siswa</h3>
                <p className="text-[10px] text-blue-100 mt-0.5">Salin dan tempel baris data siswa langsung dari file spreadsheet (Excel, dll)</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-2xl text-[11px] text-blue-700 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Info size={13} />
                  <span>Petunjuk Format Salin Tempel (Format Kolom)</span>
                </div>
                <p>Salin baris di Excel dengan urutan kolom persis berikut:</p>
                <div className="p-2 bg-white rounded-xl border border-blue-100 font-mono text-[9px] text-slate-600 mt-1 select-all overflow-x-auto">
                  NIS [tab] NISN [tab] NAMA_SISWA [tab] KODE_KELAS [tab] L/P [tab] NAMA_AYAH [tab] NAMA_IBU [tab] ALAMAT
                </div>
                <p className="pt-1 italic">Contoh: 1012 [tab] 31556022 [tab] Gilang Pratama [tab] IA [tab] L [tab] Hendri [tab] Sarah [tab] Sukabumi</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Tempelkan Data Excel/Spreadsheet</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Tempel data di sini (gunakan Ctrl+V dari baris Excel)..."
                  rows={6}
                  className="w-full p-3 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-500 bg-white hover:bg-slate-50 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleImportSiswa}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition shadow-md flex items-center gap-1.5"
                >
                  <Upload size={14} />
                  Proses Impor Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
