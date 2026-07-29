import React, { useState, useEffect } from "react";
import { api, toast } from "../utils/api";
import { confirmDialog } from "./ConfirmModal";
import { uploadAccountAvatar } from "../utils/storage";
import AvatarUpload from "./AvatarUpload";
import {
  Search,
  Plus,
  Trash2,
  X,
  Key,
  KeyRound,
  ShieldAlert,
  UserCog,
  Power,
  Copy,
  Check,
} from "lucide-react";

interface AccountManagerProps {
  user: any;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  guru: "Guru",
  kepsek: "Kepala Sekolah",
};

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700 border-purple-100",
  guru: "bg-blue-50 text-blue-700 border-blue-100",
  kepsek: "bg-amber-50 text-amber-700 border-amber-100",
};

export default function AccountManager({ user }: AccountManagerProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("semua");

  // Modal create
  const [showFormModal, setShowFormModal] = useState(false);
  const [formUsername, setFormUsername] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "guru" | "kepsek">("guru");
  const [formEmail, setFormEmail] = useState("");
  const [formNip, setFormNip] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal credentials hasil buat akun / reset password
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.get("/accounts");
      setAccounts(data);
    } catch (e: any) {
      toast.show(e.message || "Gagal memuat daftar akun pengguna!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormUsername("");
    setFormNama("");
    setFormRole("guru");
    setFormEmail("");
    setFormNip("");
    setShowFormModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formNama.trim()) {
      toast.show("Username dan nama wajib diisi!", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/accounts", {
        username: formUsername.trim(),
        nama: formNama.trim(),
        role: formRole,
        email: formEmail.trim() || undefined,
        nip: formNip.trim() || undefined,
      });
      toast.show("Akun pengguna baru berhasil dibuat!", "success");
      setShowFormModal(false);
      fetchAccounts();
      setGeneratedCreds({ nama: formNama, username: res.username, password: res.password, mode: "create" });
      setCopied(false);
      setShowCredsModal(true);
    } catch (err: any) {
      toast.show(err.message || "Gagal membuat akun pengguna!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (acc: any) => {
    const confirmed = await confirmDialog(
      `Reset kata sandi untuk akun [ ${acc.nama} ]? Kata sandi baru akan dibuat otomatis.`,
      { title: "Reset Kata Sandi", confirmLabel: "Ya, Reset", danger: false }
    );
    if (!confirmed) return;
    try {
      const res = await api.post(`/accounts/${acc.id}/reset-password`, {});
      setGeneratedCreds({ nama: acc.nama, username: acc.username, password: res.password, mode: "reset" });
      setCopied(false);
      setShowCredsModal(true);
    } catch (err: any) {
      toast.show(err.message || "Gagal mereset kata sandi!", "error");
    }
  };

  const handleToggleStatus = async (acc: any) => {
    const newStatus = acc.status === "aktif" ? "nonaktif" : "aktif";
    if (acc.id === user.id) {
      toast.show("Anda tidak dapat menonaktifkan akun Anda sendiri!", "error");
      return;
    }
    try {
      await api.put(`/accounts/${acc.id}`, { status: newStatus });
      toast.show(`Akun berhasil di${newStatus === "aktif" ? "aktifkan" : "nonaktifkan"}.`, "success");
      fetchAccounts();
    } catch (err: any) {
      toast.show(err.message || "Gagal mengubah status akun!", "error");
    }
  };

  const handleDeleteAccount = async (acc: any) => {
    if (acc.id === user.id) {
      toast.show("Anda tidak dapat menghapus akun Anda sendiri!", "error");
      return;
    }
    const confirmed = await confirmDialog(
      `Hapus akun login [ ${acc.nama} ] secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      { title: "Hapus Akun Pengguna", confirmLabel: "Ya, Hapus", danger: true }
    );
    if (!confirmed) return;
    try {
      await api.delete(`/accounts/${acc.id}`);
      toast.show("Akun pengguna berhasil dihapus.", "success");
      fetchAccounts();
    } catch (err: any) {
      toast.show(err.message || "Gagal menghapus akun!", "error");
    }
  };

  const handleUploadAvatar = async (acc: any, file: File) => {
    const url = await uploadAccountAvatar(file, acc.id);
    await api.put(`/accounts/${acc.id}`, { foto: url });
    setAccounts((prev) => prev.map((a) => (a.id === acc.id ? { ...a, foto: url } : a)));
  };

  const handleCopyCreds = () => {
    if (!generatedCreds) return;
    navigator.clipboard
      .writeText(`Username: ${generatedCreds.username}\nPassword: ${generatedCreds.password}`)
      .then(() => setCopied(true))
      .catch(() => toast.show("Gagal menyalin ke clipboard.", "error"));
  };

  const filteredAccounts = accounts.filter((a) => {
    const matchSearch =
      a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === "semua" || a.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
            <UserCog size={14} />
            <span>Administrasi Sistem</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Kelola Akun Pengguna</h1>
          <p className="text-xs text-slate-400">Kelola akun login Admin, Guru, dan Kepala Sekolah — foto profil, status, dan kata sandi.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-100 transition flex items-center gap-1.5 shrink-0"
        >
          <Plus size={14} />
          Buat Akun Baru
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Cari akun berdasarkan nama atau username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-medium"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["semua", "admin", "guru", "kepsek"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition ${
                roleFilter === r
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {r === "semua" ? "Semua" : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {/* List Section */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 text-xs font-medium">Memuat daftar akun...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Akun tidak ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1">Ubah kata kunci pencarian atau filter peran.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc, idx) => (
            <div
              key={acc.id}
              style={{ animationDelay: `${Math.min(idx, 11) * 0.04}s` }}
              className="stagger-item card-hover bg-white border border-slate-100 shadow-sm rounded-3xl p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <AvatarUpload
                  photoUrl={acc.foto}
                  fallbackText={acc.nama}
                  size={56}
                  onUpload={(file) => handleUploadAvatar(acc, file)}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{acc.nama}</h3>
                  <span className="text-[10px] text-slate-400 font-mono font-bold block truncate">@{acc.username}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${ROLE_BADGE[acc.role]}`}>
                      {ROLE_LABEL[acc.role] || acc.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      acc.status === "aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                    }`}>
                      {acc.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-3 border-t border-slate-50">
                <button
                  onClick={() => handleResetPassword(acc)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                  title="Reset Kata Sandi"
                >
                  <KeyRound size={12} />
                  Reset Sandi
                </button>
                <button
                  onClick={() => handleToggleStatus(acc)}
                  disabled={acc.id === user.id}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title={acc.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                >
                  <Power size={12} />
                  {acc.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  onClick={() => handleDeleteAccount(acc)}
                  disabled={acc.id === user.id}
                  className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Hapus Akun"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create Account */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Buat Akun Pengguna Baru</h3>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Peran (Role)*</label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(["admin", "guru", "kepsek"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormRole(r)}
                      className={`px-2 py-2 rounded-xl text-[11px] font-bold border transition ${
                        formRole === r ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Nama Lengkap*</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Drs. H. Mulyadi, M.Pd."
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Username Login*</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value.trim())}
                  placeholder="Contoh: kepsek atau mulyadi"
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Email (opsional)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Kosongkan untuk dibuat otomatis"
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">NIP (opsional)</label>
                <input
                  type="text"
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  placeholder="Nomor Induk Pegawai"
                  className="mt-1.5 w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-[10px] text-blue-800">
                Kata sandi akan dibuat otomatis secara acak dan ditampilkan setelah akun berhasil dibuat.
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl transition shadow-md shadow-blue-50 disabled:opacity-60"
                >
                  {saving ? "Membuat..." : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Credentials Display */}
      {showCredsModal && generatedCreds && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center gap-2">
                <Key size={18} />
                <h3 className="text-sm font-bold">
                  {generatedCreds.mode === "reset" ? "Kata Sandi Berhasil Direset!" : "Akun Berhasil Dibuat!"}
                </h3>
              </div>
              <button onClick={() => setShowCredsModal(false)} className="p-1.5 text-emerald-200 hover:text-white rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Kredensial login untuk [ <span className="font-bold text-slate-800">{generatedCreds.nama}</span> ]:
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

              <button
                onClick={handleCopyCreds}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copied ? "Tersalin!" : "Salin Kredensial"}
              </button>

              <div className="bg-amber-50 border border-amber-100 text-[10px] text-amber-800 p-3 rounded-xl">
                ⚠️ <span className="font-bold">PENTING:</span> Catat dan bagikan kredensial di atas segera — kata sandi tidak akan ditampilkan lagi setelah jendela ini ditutup.
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
