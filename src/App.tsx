import React, { useState, useEffect } from "react";
import { api, toast } from "./utils/api";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";

// Submodules
import Dashboard from "./components/Dashboard";
import Attendance from "./components/Attendance";
import StudentManager from "./components/StudentManager";
import TeacherManager from "./components/TeacherManager";
import ClassManager from "./components/ClassManager";
import Reports from "./components/Reports";
import SpreadsheetDb from "./components/SpreadsheetDb";
import Announcements from "./components/Announcements";
import AcademicCalendar from "./components/AcademicCalendar";
import Settings from "./components/Settings";
import Profile from "./components/Profile";
import About from "./components/About";
import AccountManager from "./components/AccountManager";

// Icons
import { Menu, LogOut, User, Bell, ChevronDown, Info } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  useEffect(() => {
    // Verifikasi sesi yang SUNGGUHAN lewat Supabase Auth (bukan sekadar
    // percaya JSON di localStorage, yang sebelumnya bisa dimanipulasi lewat
    // devtools untuk memalsukan role tanpa login yang valid).
    const restoreSession = async () => {
      try {
        const { user: profile } = await api.get("/auth/me");
        setUser(profile);
      } catch (e) {
        // Belum login / sesi kedaluwarsa — biarkan tampil halaman Login.
      }
    };
    restoreSession();

    fetchSchoolSettings();
    fetchNoticeBoard();
  }, []);

  const fetchSchoolSettings = async () => {
    try {
      const data = await api.get("/settings");
      setSchoolSettings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNoticeBoard = async () => {
    try {
      const data = await api.get("/pengumuman");
      setNotifications(data.slice(0, 5)); // show latest 5 as notifications dropdown
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    // Catatan migrasi: versi lama menerima (userData, token) tapi diam-diam
    // MEMBUANG token itu — bug ini yang membuat setiap request terautentikasi
    // gagal setelah login. Sekarang sesi (termasuk token & refresh-nya)
    // disimpan otomatis oleh supabase-js, jadi tidak perlu localStorage manual.
    setUser(userData);
    setActiveTab("dashboard");
    toast.show(`Selamat datang kembali, ${userData.nama}!`, "success");
    fetchSchoolSettings();
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    toast.show("Sesi Anda telah berhasil diakhiri.", "info");
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render sub-components based on activeTab
  const renderActiveComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard user={user} setActiveTab={setActiveTab} schoolName={schoolSettings?.namaSekolah || "SD Negeri Sleman 1"} />;
      case "attendance":
        return <Attendance user={user} />;
      case "students":
        return <StudentManager user={user} />;
      case "teachers":
        return <TeacherManager user={user} />;
      case "classes":
        return <ClassManager user={user} />;
      case "reports":
        return <Reports user={user} />;
      case "database":
        return <SpreadsheetDb />;
      case "accounts":
        return <AccountManager user={user} />;
      case "announcements":
        return <Announcements user={user} />;
      case "calendar":
        return <AcademicCalendar user={user} />;
      case "settings":
        return <Settings />;
      case "profile":
        return <Profile user={user} onLogout={handleLogout} />;
      case "about":
        return <About />;
      default:
        return <Dashboard user={user} setActiveTab={setActiveTab} schoolName={schoolSettings?.namaSekolah || "SD Negeri Sleman 1"} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800 overflow-hidden">
      {/* Sidebar navigation panel */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={!sidebarOpen}
        setCollapsed={(val) => setSidebarOpen(!val)}
        onLogout={handleLogout}
        schoolName={schoolSettings?.namaSekolah || "SD Negeri Sleman 1"}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top bar header */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-6 shrink-0 relative z-40 shadow-sm shadow-slate-100/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Mobile: buka drawer off-canvas. Desktop: perkecil/perbesar sidebar.
                setMobileNavOpen((prev) => !prev);
                setSidebarOpen((prev) => !prev);
              }}
              className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-all duration-200 active:scale-90"
              title="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
            
            {/* School Brand info */}
            <div className="flex items-center gap-2">
              <img
                src={schoolSettings?.logoSekolah || "https://images.unsplash.com/photo-1594608661623-aa0bd3a69d28?w=100&h=100&fit=crop&q=80"}
                alt="Logo Sekolah"
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-lg object-cover bg-slate-50"
              />
              <div className="hidden sm:block">
                <h2 className="text-xs font-bold text-slate-800 tracking-tight leading-none">
                  {schoolSettings?.namaSekolah || "SD Negeri Sleman 1"}
                </h2>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                  T.A {schoolSettings?.tahunAjaranAktif || "2025/2026"} • Sem: {schoolSettings?.semesterAktif || "Ganjil"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action panel (Notifs, Profile drop) */}
          <div className="flex items-center gap-3 relative">
            
            {/* Announcements notification pill */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  setShowUserDropdown(false);
                }}
                className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition relative"
                title="Pemberitahuan"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-600 rounded-full ring-2 ring-white" />
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-zoom-in origin-top-right">
                  <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengumuman Terbaru</span>
                    <button 
                      onClick={() => {
                        setActiveTab("announcements");
                        setShowNotifDropdown(false);
                      }} 
                      className="text-[10px] text-blue-600 font-bold hover:underline"
                    >
                      Lihat Semua
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-3 hover:bg-slate-50 transition cursor-pointer" onClick={() => {
                          setActiveTab("announcements");
                          setShowNotifDropdown(false);
                        }}>
                          <span className="text-[9px] font-bold text-blue-600 block">{notif.tanggal}</span>
                          <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">{notif.judul}</h4>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{notif.isi}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                        Tidak ada pengumuman terbaru.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User credentials drop */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifDropdown(false);
                }}
                className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                  {user.nama.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <span className="text-xs font-bold text-slate-800 block max-w-[120px] truncate leading-none">{user.nama}</span>
                  <span className="text-[9px] text-slate-400 font-mono font-bold uppercase mt-0.5 block leading-none">{user.role}</span>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-zoom-in origin-top-right font-medium">
                  <button
                    onClick={() => {
                      setActiveTab("profile");
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 font-semibold flex items-center gap-2"
                  >
                    <User size={14} />
                    Profil Pengguna
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("about");
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 font-semibold flex items-center gap-2"
                  >
                    <Info size={14} />
                    Tentang Aplikasi
                  </button>

                  <hr className="my-1.5 border-slate-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-xs text-rose-600 font-bold flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    Keluar Sistem
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic component render viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div key={activeTab} className="page-transition">
            {renderActiveComponent()}
          </div>
        </main>
      </div>
    </div>
  );
}
