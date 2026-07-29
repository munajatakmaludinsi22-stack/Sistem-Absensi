import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

// ============================================================================
// ConfirmModal.tsx — Pengganti window.confirm() bawaan browser yang usang.
//
// Menyediakan helper `confirmDialog(message, options)` yang mengembalikan
// Promise<boolean>, dipakai persis seperti pola lama:
//   const ok = await confirmDialog("Hapus data ini?");
//   if (!ok) return;
// Tidak ada perubahan pada alur/logika penghapusan/API — hanya mekanisme
// konfirmasi yang sebelumnya berupa dialog bawaan browser (window.confirm)
// kini digantikan modal yang konsisten dengan desain aplikasi.
// ============================================================================

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  message: string;
  resolve: (value: boolean) => void;
}

let triggerConfirm: ((state: ConfirmState) => void) | null = null;

export function confirmDialog(message: string, options: ConfirmOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    if (!triggerConfirm) {
      // Fallback aman jika host belum ter-mount (seharusnya tidak pernah terjadi)
      resolve(window.confirm(message));
      return;
    }
    triggerConfirm({ message, resolve, ...options });
  });
}

export default function ConfirmModalHost() {
  const [state, setState] = useState<ConfirmState | null>(null);

  useEffect(() => {
    triggerConfirm = (s: ConfirmState) => setState(s);
    return () => {
      triggerConfirm = null;
    };
  }, []);

  const close = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]"
          onClick={() => close(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${state.danger !== false ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
              {state.danger !== false ? <ShieldAlert size={22} /> : <AlertTriangle size={22} />}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                {state.title || "Konfirmasi Tindakan"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {state.message}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => close(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all duration-150 active:scale-95"
              >
                {state.cancelLabel || "Batal"}
              </button>
              <button
                onClick={() => close(true)}
                autoFocus
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all duration-150 active:scale-95 ${
                  state.danger !== false
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                }`}
              >
                {state.confirmLabel || "Ya, Lanjutkan"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
