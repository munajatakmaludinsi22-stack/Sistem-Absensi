import React, { useState } from "react";
import { api, toast } from "../utils/api";
import { supabase } from "../utils/supabaseClient";
import { uploadOwnAvatar } from "../utils/storage";
import AvatarUpload from "./AvatarUpload";
import { 
  Key, 
  Eye, 
  EyeOff,
  UserCheck2,
  Save
} from "lucide-react";

interface ProfileProps {
  user: any;
  onLogout: () => void;
}

export default function Profile({ user, onLogout }: ProfileProps) {
  const [foto, setFoto] = useState<string | null>(user.foto || null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Toggle visibility flags
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUploadAvatar = async (file: File) => {
    const url = await uploadOwnAvatar(file, user.id);
    const { error } = await supabase.rpc("update_own_avatar", { p_foto_url: url });
    if (error) throw new Error(error.message || "Gagal menyimpan foto profil!");
    setFoto(url);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.show("Semua kolom kata sandi wajib diisi!", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.show("Konfirmasi kata sandi baru tidak sesuai!", "error");
      return;
    }

    if (newPassword.length < 5) {
      toast.show("Kata sandi baru minimal terdiri dari 5 karakter!", "error");
      return;
    }

    setSaving(true);
    try {
      await api.post("/change-password", {
        oldPassword,
        newPassword
      });
      toast.show("Kata sandi berhasil diubah! Silakan login kembali dengan sandi baru.", "success");
      
      // Delay logout so they can see success toast
      setTimeout(() => {
        onLogout();
      }, 1500);
    } catch (err: any) {
      toast.show(err.message || "Gagal mengubah kata sandi!", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      {/* Title section */}
      <div className="border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <UserCheck2 size={14} />
            <span>Pengaturan Akun Personal</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Profil Saya</h1>
          <p className="text-xs text-slate-400">Kelola preferensi akun Anda, periksa tingkat hak akses sistem, serta perbarui sandi login.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Specs */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4">
          <AvatarUpload
            photoUrl={foto}
            fallbackText={user.nama}
            size={80}
            onUpload={handleUploadAvatar}
          />
          <p className="text-[10px] text-slate-400 -mt-2">Klik ikon kamera untuk mengubah foto profil (maks. 2MB)</p>

          <div>
            <h3 className="font-bold text-slate-800 text-base leading-tight">{user.nama}</h3>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mt-1">Username: @{user.username}</span>
          </div>

          <div className="pt-3 border-t border-slate-50 w-full space-y-1 text-xs">
            <span className="text-slate-400 font-semibold block">Tingkat Hak Akses</span>
            <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
              user.role === "admin" 
                ? "bg-purple-50 text-purple-700 border-purple-100" 
                : user.role === "guru"
                ? "bg-blue-50 text-blue-700 border-blue-100"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}>
              {user.role === "admin" ? "🏫 Administrator Utama" : `🎓 Wali Kelas ${user.kelasDiampu || ""}`}
            </span>
          </div>
        </div>

        {/* Right Column: Change Password Form */}
        <div className="md:col-span-2 bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-3 border-slate-50">
            <Key size={16} className="text-blue-600" />
            <span>Ubah Kata Sandi (Password)</span>
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Kata Sandi Lama</label>
              <div className="relative mt-1.5">
                <input
                  type={showOld ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Ketik kata sandi Anda saat ini"
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Kata Sandi Baru</label>
              <div className="relative mt-1.5">
                <input
                  type={showNew ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 5 karakter"
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase">Konfirmasi Kata Sandi Baru</label>
              <div className="relative mt-1.5">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition shadow-md shadow-blue-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Save size={14} />
                )}
                Perbarui Kata Sandi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
