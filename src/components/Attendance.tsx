import React, { useState, useEffect } from "react";
import { api, toast } from "../utils/api";
import AnimatedCounter from "./AnimatedCounter";
import { 
  Search, 
  Calendar, 
  School, 
  Save, 
  RotateCcw, 
  FileEdit, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  History
} from "lucide-react";

interface AttendanceProps {
  user: any;
}

export default function Attendance({ user }: AttendanceProps) {
  const [kelasOptions, setKelasOptions] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize filters
  useEffect(() => {
    // Default to today YMD
    const todayStr = new Date().toISOString().split("T")[0];
    setSelectedDate(todayStr);

    fetchKelasList();
  }, []);

  // Fetch class options to populate picker
  const fetchKelasList = async () => {
    try {
      const res = await api.get("/kelas");
      setKelasOptions(res);
      
      // Auto-select class based on teacher role or pick the first class
      if (res.length > 0) {
        if (user.role === "guru") {
          // If teacher, auto select the class they manage
          // Let's see if the class name matches teacher's assigned class
          const teacherClass = res.find((k: any) => k.waliKelasId === user.id || k.id === "IA"); // fallback IA
          setSelectedKelas(teacherClass ? teacherClass.id : res[0].id);
        } else {
          setSelectedKelas(res[0].id);
        }
      }
    } catch (e) {
      toast.show("Gagal memuat daftar kelas!", "error");
    }
  };

  // Fetch student attendance grid
  useEffect(() => {
    if (selectedKelas && selectedDate) {
      fetchAttendanceGrid();
    }
  }, [selectedKelas, selectedDate]);

  const fetchAttendanceGrid = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/absensi?kelas=${selectedKelas}&tanggal=${selectedDate}`);
      setStudents(data);
    } catch (e) {
      toast.show("Gagal memuat daftar presensi siswa!", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update status locally in state
  const handleStatusChange = (nis: string, newStatus: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.nis === nis ? { ...s, status: newStatus } : s))
    );
  };

  // Update notes locally in state
  const handleCatatanChange = (nis: string, note: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.nis === nis ? { ...s, catatan: note } : s))
    );
  };

  // Bulk Save attendance to spreadsheet DB
  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      await api.post("/absensi/bulk", {
        kelas: selectedKelas,
        tanggal: selectedDate,
        records: students.map((s) => ({
          nis: s.nis,
          nama: s.nama,
          status: s.status,
          catatan: s.catatan
        }))
      });
      toast.show(`Absensi kelas ${selectedKelas} tanggal ${selectedDate} berhasil disimpan!`, "success");
      // Refresh list to pull updated status
      fetchAttendanceGrid();
    } catch (e: any) {
      toast.show(e.message || "Gagal menyimpan absensi!", "error");
    } finally {
      setSaving(false);
    }
  };

  // Set all students to Hadir quickly
  const handleMarkAllHadir = () => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status: "Hadir" }))
    );
    toast.show("Status semua siswa diatur ke Hadir", "info");
  };

  // Filter students based on search query
  const filteredStudents = students.filter((s) =>
    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery)
  );

  // Ringkasan langsung (live) dari status yang sedang dipilih — ikut berubah
  // real-time saat guru mengklik status, sebelum sempat disimpan ke server.
  const liveCounts = students.reduce(
    (acc, s) => {
      const key = s.status as keyof typeof acc;
      if (key in acc) acc[key]++;
      return acc;
    },
    { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Terlambat: 0 }
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <CheckCircle2 size={14} />
            <span>Sistem Manual Presensi Guru</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Input Absensi Siswa</h1>
          <p className="text-xs text-slate-400">Pilih rombongan belajar (kelas) dan tanggal pelajaran untuk mengabsen siswa di kelas.</p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleMarkAllHadir}
            disabled={students.length === 0 || loading}
            className="px-3.5 py-2 border border-slate-200 text-xs font-semibold text-slate-600 bg-white rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Set Semua Hadir
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={students.length === 0 || saving || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-100 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Save size={14} />
            )}
            Simpan Absensi
          </button>
        </div>
      </div>

      {/* Filters Bento Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-100 shadow-sm rounded-3xl p-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            <School size={14} className="text-blue-500" />
            <span>Pilih Kelas / Rombel</span>
          </label>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
          >
            {kelasOptions.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} (Wali: {k.waliKelasNama})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            <Calendar size={14} className="text-indigo-500" />
            <span>Pilih Tanggal</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            <Search size={14} className="text-amber-500" />
            <span>Cari Nama Siswa</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Ketik nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 text-xs font-medium">Menyinkronkan data presensi terbaru...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak ada siswa ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Pastikan kelas telah memiliki siswa aktif atau periksa kata kunci pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Live Summary Banner */}
          <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 text-[11px]">
              {[
                { label: "Hadir", val: liveCounts.Hadir, dot: "bg-emerald-500", text: "text-emerald-700" },
                { label: "Izin", val: liveCounts.Izin, dot: "bg-blue-500", text: "text-blue-700" },
                { label: "Sakit", val: liveCounts.Sakit, dot: "bg-amber-500", text: "text-amber-700" },
                { label: "Alpha", val: liveCounts.Alpha, dot: "bg-rose-500", text: "text-rose-700" },
                { label: "Terlambat", val: liveCounts.Terlambat, dot: "bg-orange-500", text: "text-orange-700" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-100 rounded-full shadow-sm">
                  <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                  <span className="text-slate-500 font-medium">{c.label}</span>
                  <span className={`font-bold ${c.text}`}><AnimatedCounter value={c.val} duration={400} /></span>
                </div>
              ))}
            </div>
            <div>
              <span className="text-[11px] text-slate-500">Menampilkan <span className="font-bold text-slate-700">{filteredStudents.length}</span> Siswa</span>
            </div>
          </div>

          {/* Student Presence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((student, idx) => {
              const initial = student.nama.charAt(0);
              const isSaved = student.isRecorded;

              return (
                <div 
                  key={student.nis} 
                  style={{ animationDelay: `${Math.min(idx, 11) * 0.04}s` }}
                  className={`stagger-item bg-white border p-5 shadow-sm rounded-3xl transition-all duration-300 relative flex flex-col justify-between ${
                    student.status === "Hadir" ? "hover:border-emerald-200 hover:shadow-emerald-50/50 border-slate-100" :
                    student.status === "Izin" ? "hover:border-blue-200 hover:shadow-blue-50/50 border-slate-100" :
                    student.status === "Sakit" ? "hover:border-amber-200 hover:shadow-amber-50/50 border-slate-100" :
                    student.status === "Alpha" ? "border-rose-100 shadow-rose-50/10 hover:border-rose-200" :
                    "hover:border-orange-200 hover:shadow-orange-50/50 border-slate-100"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Student Info Bar */}
                    <div className="flex items-start gap-3">
                      {/* Avatar initial fallback */}
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border uppercase overflow-hidden ${
                        student.jenisKelamin === "L" 
                          ? "bg-sky-50 text-sky-700 border-sky-100" 
                          : "bg-pink-50 text-pink-700 border-pink-100"
                      }`}>
                        {student.foto ? (
                          <img src={student.foto} alt={student.nama} className="w-full h-full object-cover" />
                        ) : (
                          initial
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-800 text-xs leading-snug truncate">{student.nama}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            student.jenisKelamin === "L" 
                              ? "bg-sky-50 text-sky-700" 
                              : "bg-pink-50 text-pink-700"
                          }`}>
                            {student.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">NIS: <span className="font-mono font-medium text-slate-600">{student.nis}</span></p>
                      </div>

                      {/* Presence State Tag */}
                      <div className="ml-auto">
                        {isSaved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[8px] font-bold border border-emerald-100">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            Tercatat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[8px] font-bold border border-slate-200">
                            <span className="w-1 h-1 rounded-full bg-slate-400" />
                            Belum Disimpan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Radio Options Grid */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { val: "Hadir", label: "H", color: "peer-checked:bg-emerald-600 peer-checked:text-white bg-emerald-50/50 text-emerald-700 hover:bg-emerald-50 border-emerald-100" },
                        { val: "Izin", label: "I", color: "peer-checked:bg-blue-600 peer-checked:text-white bg-blue-50/50 text-blue-700 hover:bg-blue-50 border-blue-100" },
                        { val: "Sakit", label: "S", color: "peer-checked:bg-amber-500 peer-checked:text-white bg-amber-50/50 text-amber-700 hover:bg-amber-50 border-amber-100" },
                        { val: "Alpha", label: "A", color: "peer-checked:bg-rose-600 peer-checked:text-white bg-rose-50/50 text-rose-700 hover:bg-rose-50 border-rose-100" },
                        { val: "Terlambat", label: "T", color: "peer-checked:bg-orange-500 peer-checked:text-white bg-orange-50/50 text-orange-700 hover:bg-orange-50 border-orange-100" }
                      ].map((opt) => (
                        <label key={opt.val} className="status-option cursor-pointer text-center relative select-none">
                          <input
                            type="radio"
                            name={`status-${student.nis}`}
                            checked={student.status === opt.val}
                            onChange={() => handleStatusChange(student.nis, opt.val)}
                            className="sr-only peer"
                          />
                          <div className={`status-pill py-1.5 rounded-xl text-xs font-bold border transition duration-200 hover:scale-105 active:scale-95 ${opt.color}`}>
                            {opt.label}
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Teacher Notes Input */}
                    <div className="relative mt-2">
                      <input
                        type="text"
                        value={student.catatan || ""}
                        onChange={(e) => handleCatatanChange(student.nis, e.target.value)}
                        placeholder="Tambahkan catatan khusus..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-slate-50/50 focus:bg-white border border-slate-100 focus:border-slate-300 rounded-xl text-[10px] text-slate-600 focus:outline-none transition duration-150"
                      />
                    </div>
                  </div>

                  {/* Footer Log tracker */}
                  {student.lastUpdated && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        Update: {new Date(student.lastUpdated).toLocaleTimeString("id-ID")}
                      </span>
                      <span>Oleh: {student.dibuatOleh}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Floater Bottom Bar */}
          <div className="fixed bottom-6 right-6 md:right-8 z-20">
            <button
              onClick={handleSaveAttendance}
              disabled={students.length === 0 || saving || loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-full shadow-xl hover:shadow-2xl hover:shadow-blue-200 transition flex items-center gap-2 group disabled:opacity-50"
            >
              <Save size={16} className="group-hover:scale-115 transition" />
              <span>Simpan Rekap Siswa</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
