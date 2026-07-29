import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api, toast } from "../utils/api";
import AnimatedCounter from "./AnimatedCounter";
import LiveClock from "./LiveClock";
import { 
  Users, 
  GraduationCap, 
  School, 
  Percent, 
  PlusCircle, 
  Calendar, 
  Megaphone, 
  History, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink
} from "lucide-react";

interface DashboardProps {
  user: any;
  setActiveTab: (tab: string) => void;
  schoolName: string;
}

export default function Dashboard({ user, setActiveTab, schoolName }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // Set formatted local date
    const d = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(d.toLocaleDateString('id-ID', options));

    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res);
    } catch (err: any) {
      toast.show("Gagal memuat statistik dashboard!", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-8 space-y-6">
        {/* Skeleton Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-5 w-48 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Skeleton KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl p-5 space-y-3 shadow-sm animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-8 w-8 bg-slate-200 rounded-xl" />
              </div>
              <div className="h-7 w-12 bg-slate-200 rounded" />
            </div>
          ))}
        </div>

        {/* Skeleton Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white border border-slate-100 rounded-3xl animate-pulse" />
          <div className="h-96 bg-white border border-slate-100 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { summary, chartData, logs, kalender, pengumuman } = stats;

  // Render SVG Line Chart manually for maximum cross-compatibility and gorgeous visual style
  const renderSVGChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-52 text-slate-400">
          <span className="material-symbols-outlined text-4xl mb-2">trending_down</span>
          <span className="text-xs font-medium">Belum ada riwayat absensi minggu ini</span>
        </div>
      );
    }

    // Chart Dimensions
    const width = 600;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    // Calculate maximum attendance value to scale the Y-axis
    const maxVal = Math.max(...chartData.map((d: any) => d.total), 10);
    const yGridLines = 4;

    // Helper coordinates calculators
    const getX = (index: number) => {
      const step = (width - paddingLeft - paddingRight) / Math.max(chartData.length - 1, 1);
      return paddingLeft + index * step;
    };

    const getY = (value: number) => {
      const chartHeight = height - paddingTop - paddingBottom;
      const pct = value / maxVal;
      return height - paddingBottom - pct * chartHeight;
    };

    // Build SVG Path points
    const hadirPoints = chartData.map((d: any, i: number) => `${getX(i)},${getY(d.hadir + d.terlambat)}`).join(" ");
    const alphaPoints = chartData.map((d: any, i: number) => `${getX(i)},${getY(d.alpha)}`).join(" ");

    return (
      <div className="relative w-full overflow-x-auto pb-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto select-none">
          {/* Y Axis Grid lines */}
          {Array.from({ length: yGridLines + 1 }).map((_, idx) => {
            const val = Math.round((maxVal / yGridLines) * idx);
            const y = getY(val);
            return (
              <g key={idx} className="opacity-40">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  fill="#94a3b8" 
                  fontSize="10" 
                  fontFamily="sans-serif" 
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {chartData.map((d: any, i: number) => {
            const x = getX(i);
            const rawDate = new Date(d.tanggal);
            const dayLabel = rawDate.toLocaleDateString("id-ID", { weekday: "short" });
            const dateLabel = rawDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
            return (
              <g key={i}>
                <text
                  x={x}
                  y={height - 15}
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="500"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {dayLabel}
                </text>
                <text
                  x={x}
                  y={height - 4}
                  fill="#cbd5e1"
                  fontSize="8"
                  fontFamily="sans-serif"
                  textAnchor="middle"
                >
                  {dateLabel}
                </text>
              </g>
            );
          })}

          {/* Glow Shadow Filter */}
          <defs>
            <filter id="glow-hadir" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-alpha" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Glow Effects */}
          <polyline
            fill="none"
            stroke="#2563EB"
            strokeWidth="4"
            opacity="0.15"
            points={hadirPoints}
            filter="url(#glow-hadir)"
          />
          <polyline
            fill="none"
            stroke="#EF4444"
            strokeWidth="4"
            opacity="0.15"
            points={alphaPoints}
            filter="url(#glow-alpha)"
          />

          {/* Main Line Paths */}
          <polyline
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={hadirPoints}
          />
          <polyline
            fill="none"
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={alphaPoints}
          />

          {/* Node Data Circles */}
          {chartData.map((d: any, i: number) => {
            const x = getX(i);
            const yHadir = getY(d.hadir + d.terlambat);
            const yAlpha = getY(d.alpha);
            return (
              <g key={i}>
                {/* Hadir point */}
                <circle
                  cx={x}
                  cy={yHadir}
                  r="4"
                  fill="#ffffff"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  className="cursor-pointer"
                />
                {/* Alpha point */}
                <circle
                  cx={x}
                  cy={yAlpha}
                  r="4"
                  fill="#ffffff"
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  className="cursor-pointer"
                />
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-slate-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-blue-600 inline-block" />
            <span>Siswa Hadir / Lambat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-rose-500 inline-block" />
            <span>Siswa Alpha (Mangkir)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Grid Decor */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
        
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30 mb-2">
            <span className="material-symbols-outlined text-xs">auto_awesome</span>
            <span>Dashboard Akademik</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Selamat Datang, {user.nama}!</h1>
          <p className="text-xs text-slate-400">
            Sistem Informasi Absensi Siswa ({schoolName}) aktif pada Tahun Ajaran {stats.settings?.tahunAjaranAktif} - Semester {stats.settings?.semesterAktif}.
          </p>
        </div>

        <div className="relative z-10 shrink-0 px-4 py-2 bg-slate-800/80 rounded-2xl border border-slate-700/50 flex flex-col items-start md:items-end font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Clock size={12} className="text-emerald-400" />
            <span>Waktu Lokal</span>
          </div>
          <span className="text-sm font-bold text-slate-200 mt-1">{currentDate}</span>
          <LiveClock className="text-lg font-bold text-emerald-300 mt-0.5" />
        </div>
      </div>

      {/* Main Stats KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stagger-item bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md card-hover transition duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Total Siswa Aktif</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              <AnimatedCounter value={summary.totalSiswa} />
            </h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition duration-300">
            <Users size={22} />
          </div>
        </div>

        <div className="stagger-item bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md card-hover transition duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Total Tenaga Pendidik</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              <AnimatedCounter value={summary.totalGuru} />
            </h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition duration-300">
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="stagger-item bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md card-hover transition duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Jumlah Rombel</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              <AnimatedCounter value={summary.totalKelas} />
            </h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition duration-300">
            <School size={22} />
          </div>
        </div>

        <div className="stagger-item bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md card-hover transition duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Kehadiran Hari Ini</span>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              <AnimatedCounter value={summary.hariIni.persentase} suffix="%" />
            </h3>
          </div>
          <div className="relative h-12 w-12 shrink-0">
            <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#EEF2FF" strokeWidth="5" />
              <circle
                cx="24" cy="24" r="20" fill="none" stroke="#6366F1" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - Math.min(100, Math.max(0, summary.hariIni.persentase)) / 100)}
                className="ring-progress-path"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition duration-300">
              <Percent size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Breakdowns & Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Presence Analytics */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-slate-900">Grafik Kehadiran Mingguan</h2>
              <p className="text-xs text-slate-400">Jumlah kehadiran siswa selama 7 hari kalender sekolah terakhir</p>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                Live Data
              </span>
            </div>
          </div>

          {/* Render manual high fidelity SVG line chart */}
          {renderSVGChart()}
        </div>

        {/* Right Column: Today's Absensi Breakdowns */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="space-y-0.5 mb-5">
              <h2 className="text-base font-bold text-slate-900">Presensi Hari Ini</h2>
              <p className="text-xs text-slate-400">Distribusi absensi seluruh siswa hari ini</p>
            </div>

            {/* Counters Stack */}
            <div className="space-y-3">
              <div className="stagger-item flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle size={18} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-700">Hadir</span>
                </div>
                <span className="text-sm font-bold text-emerald-700"><AnimatedCounter value={summary.hariIni.hadir} /></span>
              </div>

              <div className="stagger-item flex items-center justify-between p-2.5 rounded-2xl bg-blue-50 border border-blue-100 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-center gap-2.5">
                  <Clock size={18} className="text-blue-600" />
                  <span className="text-xs font-semibold text-slate-700">Terlambat</span>
                </div>
                <span className="text-sm font-bold text-blue-700"><AnimatedCounter value={summary.hariIni.terlambat} /></span>
              </div>

              <div className="stagger-item flex items-center justify-between p-2.5 rounded-2xl bg-amber-50 border border-amber-100 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-center gap-2.5">
                  <HelpCircle size={18} className="text-amber-600" />
                  <span className="text-xs font-semibold text-slate-700">Izin / Sakit</span>
                </div>
                <span className="text-sm font-bold text-amber-700"><AnimatedCounter value={summary.hariIni.izin + summary.hariIni.sakit} /></span>
              </div>

              <div className="stagger-item flex items-center justify-between p-2.5 rounded-2xl bg-rose-50 border border-rose-100 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={18} className="text-rose-600" />
                  <span className="text-xs font-semibold text-slate-700">Alpha (Mangkir)</span>
                </div>
                <span className="text-sm font-bold text-rose-700"><AnimatedCounter value={summary.hariIni.alpha} /></span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Siswa Belum Diabsen</span>
            <span className="font-bold text-slate-800">
              {Math.max(0, summary.totalSiswa - summary.hariIni.totalSiswaAbsen)} Siswa
            </span>
          </div>
        </div>
      </div>

      {/* Grid Bottom: Announcements & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: School Announcements */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Megaphone size={18} className="text-blue-600" />
              <span>Papan Pengumuman Sekolah</span>
            </h2>
            <button 
              onClick={() => setActiveTab("announcements")}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Semua</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3.5">
            {pengumuman && pengumuman.length > 0 ? (
              pengumuman.map((ann: any) => (
                <div key={ann.id} className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1.5 hover:bg-slate-50 transition duration-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800">{ann.judul}</h3>
                    <span className="text-[10px] text-slate-400 font-medium">{ann.tanggal}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {ann.isi}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[9px] text-slate-400">
                    <span>Oleh: <span className="font-semibold">{ann.dibuatOleh}</span></span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold">{ann.target}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Belum ada pengumuman hari ini.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Academic Calendar & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Menu Aksi Cepat</h2>
            <div className="grid grid-cols-2 gap-3">
              {(user.role === "admin" || user.role === "guru") && (
                <button 
                  onClick={() => setActiveTab("attendance")}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50/50 border border-blue-100 hover:bg-blue-100/50 hover:border-blue-200 transition duration-200 text-center"
                >
                  <CheckCircle size={20} className="text-blue-600 mb-1.5" />
                  <span className="text-[11px] font-semibold text-blue-900">Input Absensi</span>
                </button>
              )}

              {user.role === "admin" && (
                <button 
                  onClick={() => setActiveTab("students")}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-100/50 hover:border-emerald-200 transition duration-200 text-center"
                >
                  <PlusCircle size={20} className="text-emerald-600 mb-1.5" />
                  <span className="text-[11px] font-semibold text-emerald-900">Tambah Siswa</span>
                </button>
              )}

              <button 
                onClick={() => setActiveTab("reports")}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/50 border border-amber-100 hover:bg-amber-100/50 hover:border-amber-200 transition duration-200 text-center"
              >
                <Percent size={20} className="text-amber-600 mb-1.5" />
                <span className="text-[11px] font-semibold text-amber-900">Rekap Laporan</span>
              </button>

              <button 
                onClick={() => setActiveTab("calendar")}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 hover:bg-indigo-100/50 hover:border-indigo-200 transition duration-200 text-center"
              >
                <Calendar size={20} className="text-indigo-600 mb-1.5" />
                <span className="text-[11px] font-semibold text-indigo-900">Kalender SD</span>
              </button>
            </div>
          </div>

          {/* Upcoming Academic calendar events */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                <span>Kalender Akademik</span>
              </h2>
              <button 
                onClick={() => setActiveTab("calendar")}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-0.5"
              >
                <span>Detail</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {kalender && kalender.length > 0 ? (
                kalender.map((cal: any) => (
                  <div key={cal.id} className="flex items-start gap-3 text-xs">
                    <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-700 flex flex-col items-center justify-center rounded-xl font-mono leading-none shrink-0 font-bold">
                      <span className="text-[14px]">
                        {new Date(cal.tanggal).toLocaleDateString("id-ID", { day: "numeric" })}
                      </span>
                      <span className="text-[8px] uppercase font-bold mt-0.5">
                        {new Date(cal.tanggal).toLocaleDateString("id-ID", { month: "short" })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-800 leading-tight">{cal.kegiatan}</h4>
                      <span className="text-[9px] text-slate-400 mt-0.5 inline-block font-medium">
                        Tipe: <span className="font-semibold text-slate-500">{cal.tipe}</span>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  Tidak ada agenda sekolah terdekat.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Audit Logs Timeline Section */}
      {user.role === "admin" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History size={18} className="text-slate-600" />
              <span>Log Audit Keamanan & Aktivitas Sistem</span>
            </h2>
            <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <span>Status: </span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full">Tersinkron</span>
            </div>
          </div>

          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {logs && logs.map((log: any) => (
              <div key={log.id} className="flex gap-4 relative text-xs">
                {/* timeline node */}
                <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 relative z-10 font-mono text-[9px]">
                  •
                </div>
                <div className="space-y-0.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{log.pengguna}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-semibold uppercase">
                      {log.role}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString("id-ID")}
                    </span>
                  </div>
                  <p className="text-slate-600">{log.aktivitas}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
