import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User } from "../types";
import { 
  Grid3X3, 
  UserCheck, 
  Users, 
  GraduationCap, 
  School, 
  FileSpreadsheet, 
  Megaphone, 
  CalendarDays, 
  Table2, 
  Settings, 
  UserCircle, 
  UserCog,
  ChevronLeft, 
  ChevronRight,
  LogOut,
  X
} from "lucide-react";

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  schoolName: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ 
  user, 
  activeTab, 
  setActiveTab, 
  collapsed, 
  setCollapsed, 
  onLogout,
  schoolName,
  mobileOpen = false,
  onCloseMobile
}: SidebarProps) {

  // Deteksi breakpoint mobile agar lebar sidebar tidak ikut menyusut (collapse)
  // saat tampil sebagai off-canvas drawer di layar kecil.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const effectiveCollapsed = isMobile ? false : collapsed;

  // Define sidebar items based on role.
  // Catatan: id di sini disamakan dengan kunci switch-case pada App.tsx
  // (sebelumnya tidak sinkron — mis. "absensi" vs "attendance" — sehingga
  // navigasi sidebar tidak pernah berpindah halaman kecuali Dashboard).
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Grid3X3, roles: ["admin", "guru", "kepsek"] },
    { id: "attendance", label: "Absensi Siswa", icon: UserCheck, roles: ["admin", "guru"] },
    { id: "students", label: "Data Siswa", icon: Users, roles: ["admin", "guru", "kepsek"] },
    { id: "teachers", label: "Data Guru", icon: GraduationCap, roles: ["admin", "kepsek"] },
    { id: "classes", label: "Data Kelas", icon: School, roles: ["admin", "kepsek"] },
    { id: "reports", label: "Rekap & Laporan", icon: FileSpreadsheet, roles: ["admin", "guru", "kepsek"] },
    { id: "announcements", label: "Pengumuman", icon: Megaphone, roles: ["admin", "guru", "kepsek"] },
    { id: "calendar", label: "Kalender Akademik", icon: CalendarDays, roles: ["admin", "guru", "kepsek"] },
    { id: "database", label: "Manajemen Data", icon: Table2, roles: ["admin"] },
    { id: "accounts", label: "Kelola Akun", icon: UserCog, roles: ["admin"] },
    { id: "settings", label: "Pengaturan", icon: Settings, roles: ["admin"] },
    { id: "profile", label: "Profil Pengguna", icon: UserCircle, roles: ["admin", "guru", "kepsek"] }
  ];

  const allowedItems = menuItems.filter((item) => item.roles.includes(user.role));

  return (
    <>
      {/* Backdrop overlay — hanya tampil di mobile saat drawer terbuka */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <motion.aside
        animate={{ width: effectiveCollapsed ? "80px" : "280px" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`bg-slate-900 text-slate-300 h-screen flex flex-col justify-between fixed md:sticky top-0 left-0 border-r border-slate-800 z-50 md:z-30 select-none shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
      {/* Header / Logo */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-slate-800/80 h-[72px]">
          {!effectiveCollapsed ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 overflow-hidden"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white shrink-0 shadow-lg shadow-blue-900/30">
                <span className="material-symbols-outlined text-xl">school</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-bold text-white text-sm leading-tight tracking-wider">SIA-MIS</span>
                <span className="text-[10px] text-slate-500 font-medium truncate">{schoolName}</span>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-600 text-white shadow-lg">
                <span className="material-symbols-outlined text-xl">school</span>
              </div>
            </div>
          )}

          {/* Collapse toggle button (desktop) */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center h-7 w-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Close button (mobile drawer) */}
          <button
            onClick={onCloseMobile}
            className="flex md:hidden items-center justify-center h-7 w-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            aria-label="Tutup menu"
          >
            <X size={14} />
          </button>
        </div>

        {/* User Badge Info */}
        <div className={`p-4 border-b border-slate-800/50 bg-slate-950/20 ${effectiveCollapsed ? "flex justify-center" : ""}`}>
          {effectiveCollapsed ? (
            <div className="h-9 w-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs border border-slate-700 shadow-sm">
              {user.nama.charAt(0)}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-sm border border-slate-700 shadow-sm shrink-0">
                {user.nama.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-white text-xs truncate leading-normal">{user.nama}</span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-0.5">
                  {user.role === "admin" ? "Administrator" : user.role === "guru" ? "Guru / Wali Kelas" : "Kepala Sekolah"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
          {allowedItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile?.();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative active:scale-[0.98] ${
                  isActive 
                    ? "bg-blue-600 text-white font-semibold shadow-lg shadow-blue-950/40" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
                title={effectiveCollapsed ? item.label : undefined}
              >
                <IconComponent 
                  size={18} 
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} 
                />
                {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
                
                {/* Active Indicator on Collapse */}
                {effectiveCollapsed && isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-md" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all duration-200 active:scale-[0.98]"
          title={effectiveCollapsed ? "Keluar Sistem" : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!effectiveCollapsed && <span className="truncate">Keluar Sistem</span>}
        </button>
      </div>
      </motion.aside>
    </>
  );
}
