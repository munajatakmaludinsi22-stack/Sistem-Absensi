import React, { useState, useEffect } from "react";
import { api, toast } from "../utils/api";
import { 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  School, 
  Filter, 
  Award, 
  AlertTriangle,
  UserCheck,
  TrendingUp,
  Download
} from "lucide-react";

interface ReportsProps {
  user: any;
}

export default function Reports({ user }: ReportsProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Filters State
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [filterMonth, setFilterMonth] = useState("Semua");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const cls = await api.get("/kelas");
      const std = await api.get("/siswa");
      const db = await api.get("/spreadsheet"); // pull raw logs and attendance
      setClasses(cls);
      setStudents(std);
      setAttendance(db.absensi || []);
      setSettings(db.settings);

      if (cls.length > 0) {
        setFilterKelas(cls[0].id);
      }
    } catch (e) {
      toast.show("Gagal memuat data rekap absensi!", "error");
    }
  };

  // Filter attendance records based on current selections
  const getFilteredAttendance = () => {
    return attendance.filter((a) => {
      const matchKelas = filterKelas === "Semua" || a.kelas === filterKelas;
      let matchMonth = true;
      if (filterMonth !== "Semua") {
        const recordMonth = new Date(a.tanggal).getMonth() + 1; // 1-12
        matchMonth = recordMonth === Number(filterMonth);
      }
      return matchKelas && matchMonth;
    });
  };

  const filteredAttendance = getFilteredAttendance();

  // Calculate Student Summary statistics
  const getStudentSummaries = () => {
    // Get list of active students in the filtered class
    const classStudents = students.filter(
      (s) => (filterKelas === "Semua" || s.kelas === filterKelas) && s.status === "aktif"
    );

    return classStudents.map((s) => {
      const records = attendance.filter((a) => a.nis === s.nis);
      let hadir = 0, izin = 0, sakit = 0, alpha = 0, terlambat = 0;

      records.forEach((r) => {
        // filter by month if selected
        if (filterMonth !== "Semua") {
          const m = new Date(r.tanggal).getMonth() + 1;
          if (m !== Number(filterMonth)) return;
        }

        if (r.status === "Hadir") hadir++;
        else if (r.status === "Izin") izin++;
        else if (r.status === "Sakit") sakit++;
        else if (r.status === "Alpha") alpha++;
        else if (r.status === "Terlambat") terlambat++;
      });

      const totalActiveDays = hadir + izin + sakit + alpha + terlambat;
      const hadirOrTerlambat = hadir + terlambat;
      const rate = totalActiveDays > 0 ? Math.round((hadirOrTerlambat / totalActiveDays) * 100) : 100;

      return {
        nis: s.nis,
        nama: s.nama,
        kelas: s.kelas,
        hadir,
        izin,
        sakit,
        alpha,
        terlambat,
        rate,
        totalActiveDays
      };
    });
  };

  const studentSummaries = getStudentSummaries();

  // Insights Calculations
  // 1. Best presence (100% rate or high rate with most days)
  const bestStudents = [...studentSummaries]
    .filter((s) => s.totalActiveDays > 0)
    .sort((a, b) => b.rate - a.rate || b.hadir - a.hadir)
    .slice(0, 3);

  // 2. Most Absent (highest Alpha count or lowest presence rate)
  const atRiskStudents = [...studentSummaries]
    .filter((s) => s.totalActiveDays > 0 && s.alpha > 0)
    .sort((a, b) => b.alpha - a.alpha || a.rate - b.rate)
    .slice(0, 3);

  // Calculate overall metrics
  const totalHadir = filteredAttendance.filter((a) => a.status === "Hadir").length;
  const totalIzin = filteredAttendance.filter((a) => a.status === "Izin").length;
  const totalSakit = filteredAttendance.filter((a) => a.status === "Sakit").length;
  const totalAlpha = filteredAttendance.filter((a) => a.status === "Alpha").length;
  const totalTerlambat = filteredAttendance.filter((a) => a.status === "Terlambat").length;
  const totalAll = filteredAttendance.length;

  const avgPresenceRate = totalAll > 0 
    ? Math.round(((totalHadir + totalTerlambat) / totalAll) * 100) 
    : 0;

  // Print PDF Helper
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.show("Gagal membuka jendela cetak, periksa pop-up blocker!", "error");
      return;
    }

    const schoolLogo = settings?.logoSekolah || "https://images.unsplash.com/photo-1594608661623-aa0bd3a69d28?w=100&h=100&fit=crop&q=80";
    const selectedClassObj = classes.find(c => c.id === filterKelas);
    const classNameLabel = selectedClassObj ? selectedClassObj.nama : "Semua Kelas";

    // Generate formal Kop Surat & rows
    const rowsHtml = studentSummaries.map((s, index) => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${index + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-family: monospace;">${s.nis}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${s.nama}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #16a34a;">${s.hadir}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #2563eb;">${s.izin}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #d97706;">${s.sakit}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #dc2626;">${s.alpha}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; color: #ea580c;">${s.terlambat}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${s.rate}%</td>
      </tr>
    `).join("");

    const monthLabel = filterMonth === "Semua" ? "Semester Ini" : `Bulan ke-${filterMonth}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Absensi Siswa</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; margin: 40px; }
            .kop-surat { display: flex; align-items: center; border-bottom: 3px double #334155; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { height: 75px; width: 75px; object-fit: cover; border-radius: 8px; margin-right: 20px; }
            .kop-text { flex-grow: 1; }
            .kop-text h2 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; }
            .kop-text p { margin: 4px 0 0; font-size: 11px; color: #64748b; font-weight: 500; }
            .report-title { text-align: center; text-transform: uppercase; margin-bottom: 25px; font-size: 16px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
            th { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; text-align: left; text-transform: uppercase; color: #475569; font-weight: bold; }
            .sign-panel { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; }
            .sign-box { text-align: center; width: 200px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="kop-surat">
            <img class="logo" src="${schoolLogo}" />
            <div class="kop-text">
              <h2>${settings?.namaSekolah || "SD Negeri Sleman 1"}</h2>
              <p>NPSN: ${settings?.npsn || "20401234"} • Alamat: ${settings?.alamat || "Jl. Baros No. 5 Km.4, Kelurahan Jayaraksa, Kecamatan Baros, Kota Sukabumi, Jawa Barat"}</p>
              <p>Sistem Informasi Absensi Siswa (SIA-MIS)</p>
            </div>
          </div>

          <div class="report-title">
            LAPORAN REKAPITULASI KEHADIRAN SISWA<br/>
            <span style="font-size: 12px; font-weight: normal; color: #64748b;">
              Kelas: <b>${classNameLabel}</b> | Rentang: <b>${monthLabel}</b> | TA: <b>${settings?.tahunAjaranAktif}</b>
            </span>
          </div>

          <table style="width: 100%; font-size: 11px; margin-bottom: 20px;">
            <tr>
              <td><b>Rata-rata Kehadiran:</b> ${avgPresenceRate}%</td>
              <td><b>Total Alpha:</b> ${totalAlpha} Hari</td>
              <td><b>Total Sakit:</b> ${totalSakit} Hari</td>
              <td><b>Total Izin:</b> ${totalIzin} Hari</td>
            </tr>
          </table>

          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 40px;">No</th>
                <th style="width: 80px;">NIS</th>
                <th>Nama Lengkap Siswa</th>
                <th style="text-align: center; width: 50px;">Hadir</th>
                <th style="text-align: center; width: 50px;">Izin</th>
                <th style="text-align: center; width: 50px;">Sakit</th>
                <th style="text-align: center; width: 50px;">Alpha</th>
                <th style="text-align: center; width: 50px;">Lambat</th>
                <th style="text-align: center; width: 60px;">Persentase</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="sign-panel">
            <div class="sign-box">
              Mengetahui,<br/>
              Wali Kelas ${classNameLabel}
              <br/><br/><br/><br/>
              <b>_________________________</b><br/>
              NIP.
            </div>
            <div class="sign-box">
              Sukabumi, ${new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
              Kepala Sekolah
              <br/><br/><br/><br/>
              <b>${settings?.kepalaSekolah || "Ade Saepudin, S.Pd."}</b><br/>
              NIP. ${settings?.nipKepalaSekolah || "196711041991021001"}
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    toast.show("Laporan PDF berhasil disiapkan dan dikirim ke printer browser", "success");
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <TrendingUp size={14} />
            <span>Pusat Laporan & Rekapitulasi</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Rekapitulasi Kehadiran Siswa</h1>
          <p className="text-xs text-slate-400">Analisis statistik kehadiran harian, mingguan, bulanan, semester, cetak dokumen KOP resmi, dan monitoring siswa at-risk.</p>
        </div>

        {/* Action button */}
        <div className="shrink-0">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded-xl shadow-lg transition flex items-center gap-1.5"
          >
            <Printer size={14} />
            Cetak Laporan KOP Resmi (PDF)
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-100 shadow-sm rounded-3xl p-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            <School size={14} className="text-blue-500" />
            <span>Pilih Kelas</span>
          </label>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
          >
            <option value="Semua">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.nama}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
            <Calendar size={14} className="text-indigo-500" />
            <span>Pilih Bulan</span>
          </label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
          >
            <option value="Semua">Semester Ini (Semua Bulan)</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktobers</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>
      </div>

      {/* Statistics KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Rata-rata Kehadiran</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{avgPresenceRate}%</h3>
          <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${avgPresenceRate}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Hari Izin / Sakit</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalIzin + totalSakit} Hari</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Izin: <span className="text-blue-600 font-bold">{totalIzin}</span>, Sakit: <span className="text-amber-500 font-bold">{totalSakit}</span></p>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Siswa Alpha (Mangkir)</span>
          <h3 className="text-2xl font-bold text-slate-900 text-rose-600 mt-1">{totalAlpha} Hari</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Mangkir tanpa keterangan sah</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Siswa Terlambat</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalTerlambat} Hari</h3>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Datang terlambat masuk kelas</p>
        </div>
      </div>

      {/* Insights Row (Best Attendance vs At Risk) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best presence */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Award className="text-emerald-500" size={18} />
            <span>Siswa Tingkat Kehadiran Terbaik (100%)</span>
          </h3>

          <div className="space-y-3">
            {bestStudents.length > 0 ? (
              bestStudents.map((s) => (
                <div key={s.nis} className="flex items-center justify-between p-3 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block leading-tight">{s.nama}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">NIS: {s.nis} • Kelas {s.kelas}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700 block">{s.rate}%</span>
                    <span className="text-[8px] text-slate-400 block">Hadir: {s.hadir} Hari</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Belum ada rekap data kehadiran.
              </div>
            )}
          </div>
        </div>

        {/* At risk / Alpha */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-rose-500" size={18} />
            <span>Siswa Dengan Alpha Tertinggi (Risiko Tinggi)</span>
          </h3>

          <div className="space-y-3">
            {atRiskStudents.length > 0 ? (
              atRiskStudents.map((s) => (
                <div key={s.nis} className="flex items-center justify-between p-3 bg-rose-50/40 border border-rose-100 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block leading-tight">{s.nama}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">NIS: {s.nis} • Kelas {s.kelas}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-700 block">{s.alpha} Alpha</span>
                    <span className="text-[8px] text-slate-400 block">Tingkat Kehadiran: {s.rate}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Luar biasa! Tidak ada siswa dengan status Alpha bulan ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Student Summaries Table */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Daftar Rekapitulasi Presensi per Siswa</h3>
          <span className="px-2.5 py-1 text-[10px] bg-slate-50 text-slate-500 border border-slate-100 rounded-full font-bold">
            TA: {settings?.tahunAjaranAktif} • Sem: {settings?.semesterAktif}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100/50">
                <th className="p-4">NIS</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4 text-center">Hadir</th>
                <th className="p-4 text-center">Izin</th>
                <th className="p-4 text-center">Sakit</th>
                <th className="p-4 text-center">Alpha</th>
                <th className="p-4 text-center">Terlambat</th>
                <th className="p-4 text-center">Rasio Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {studentSummaries.map((s) => (
                <tr key={s.nis} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-mono font-bold text-slate-600">{s.nis}</td>
                  <td className="p-4 font-bold text-slate-800">{s.nama}</td>
                  <td className="p-4 text-center font-semibold text-emerald-600">{s.hadir}</td>
                  <td className="p-4 text-center font-semibold text-blue-600">{s.izin}</td>
                  <td className="p-4 text-center font-semibold text-amber-500">{s.sakit}</td>
                  <td className="p-4 text-center font-semibold text-rose-600">{s.alpha}</td>
                  <td className="p-4 text-center font-semibold text-orange-600">{s.terlambat}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      s.rate >= 95 ? "bg-emerald-50 text-emerald-700" :
                      s.rate >= 80 ? "bg-amber-50 text-amber-700" :
                      "bg-rose-50 text-rose-700"
                    }`}>
                      {s.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
