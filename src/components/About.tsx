import React from "react";
import { motion } from "motion/react";
import { 
  Info, 
  ShieldCheck, 
  UserCog,
  Users,
  ClipboardCheck,
  BarChart3,
  Bell,
  CalendarClock,
  Sparkles
} from "lucide-react";

const FEATURES = [
  {
    icon: ClipboardCheck,
    color: "blue",
    title: "Absensi Digital Harian",
    desc: "Pencatatan kehadiran siswa (Hadir/Izin/Sakit/Alpha/Terlambat) yang cepat, akurat, dan dapat diakses kapan saja.",
  },
  {
    icon: Users,
    color: "emerald",
    title: "Manajemen Data Terpadu",
    desc: "Kelola data siswa, guru, dan kelas dalam satu tempat yang rapi dan mudah dicari.",
  },
  {
    icon: BarChart3,
    color: "indigo",
    title: "Laporan & Rekapitulasi",
    desc: "Statistik kehadiran otomatis lengkap dengan cetak dokumen resmi berkop surat sekolah.",
  },
  {
    icon: Bell,
    color: "amber",
    title: "Pengumuman & Notifikasi",
    desc: "Papan pengumuman digital serta notifikasi modern di setiap proses penting sistem.",
  },
  {
    icon: CalendarClock,
    color: "rose",
    title: "Kalender Akademik",
    desc: "Agenda dan jadwal penting tahun ajaran yang selalu terlihat oleh seluruh warga sekolah.",
  },
  {
    icon: ShieldCheck,
    color: "slate",
    title: "Keamanan & Hak Akses",
    desc: "Akses dipisahkan berdasarkan peran pengguna secara ketat demi menjaga integritas data sekolah.",
  },
];

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

export default function About() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl page-transition">
      {/* Title section */}
      <div className="border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <Info size={14} />
            <span>Tentang Aplikasi</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Tentang SIA-MIS</h1>
          <p className="text-xs text-slate-400">
            Sistem Informasi Absensi Siswa untuk Madrasah Ibtidaiyah — membantu sekolah mengelola presensi, data siswa/guru, dan laporan secara modern, cepat, dan aman.
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {FEATURES.map((f, idx) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3 card-hover"
            >
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${COLOR_MAP[f.color]}`}>
                <Icon size={18} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Peran Pengguna */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-6">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3 border-slate-50">
          <UserCog size={16} className="text-blue-600" />
          <span>Peran & Hak Akses Pengguna</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-slate-100 rounded-2xl space-y-2">
            <h4 className="font-bold text-xs text-blue-700 uppercase tracking-wider">Administrator</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kendali penuh atas seluruh data sekolah: siswa, guru, kelas, pengaturan, dan pencadangan data.
            </p>
          </div>
          <div className="p-4 border border-slate-100 rounded-2xl space-y-2">
            <h4 className="font-bold text-xs text-emerald-700 uppercase tracking-wider">Guru / Wali Kelas</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mengelola absensi harian dan melihat data siswa pada rombongan belajar yang diampu.
            </p>
          </div>
          <div className="p-4 border border-slate-100 rounded-2xl space-y-2">
            <h4 className="font-bold text-xs text-amber-700 uppercase tracking-wider">Kepala Sekolah</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Memantau ringkasan kehadiran, laporan, dan perkembangan sekolah secara menyeluruh.
            </p>
          </div>
        </div>
      </div>

      {/* Penutup */}
      <div className="bg-gradient-brand text-white rounded-3xl p-6 flex items-center gap-4 shadow-lg shadow-blue-200/50">
        <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
          <Sparkles size={22} />
        </div>
        <div>
          <h3 className="font-bold text-sm">Terus Diperbarui untuk Anda</h3>
          <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">
            SIA-MIS dikembangkan secara berkelanjutan agar semakin cepat, aman, dan nyaman digunakan oleh seluruh warga sekolah.
          </p>
        </div>
      </div>
    </div>
  );
}
