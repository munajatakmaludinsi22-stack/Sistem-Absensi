import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

// ============================================================================
// Toast.tsx — Pusat notifikasi modern untuk seluruh aplikasi.
//
// Komponen ini HANYA menambahkan lapisan tampilan (UI) di atas mekanisme
// yang sudah ada di src/utils/api.ts (`toast.show(message, type)` yang
// men-dispatch CustomEvent "sia-toast"). Tidak ada satupun logika bisnis,
// endpoint, atau alur data yang diubah — komponen ini murni "mendengarkan"
// event yang sebelumnya sudah dipanggil di setiap proses (login, logout,
// simpan, hapus, validasi form, error sistem, dll) namun belum pernah
// benar-benar ditampilkan ke pengguna.
// ============================================================================

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

const TOAST_STYLES: Record<ToastType, { icon: React.ElementType; iconClass: string; barClass: string; ringClass: string }> = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600 bg-emerald-50",
    barClass: "bg-emerald-500",
    ringClass: "ring-emerald-100",
  },
  error: {
    icon: XCircle,
    iconClass: "text-rose-600 bg-rose-50",
    barClass: "bg-rose-500",
    ringClass: "ring-rose-100",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-600 bg-blue-50",
    barClass: "bg-blue-500",
    ringClass: "ring-blue-100",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-600 bg-amber-50",
    barClass: "bg-amber-500",
    ringClass: "ring-amber-100",
  },
};

let toastCounter = 0;

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const type: ToastType = ["success", "error", "info", "warning"].includes(detail.type) ? detail.type : "info";
      const duration = detail.duration || (type === "error" ? 5500 : 3800);
      const id = ++toastCounter;

      setToasts((prev) => {
        // Batasi maksimal 4 toast bertumpuk agar tidak memenuhi layar
        const next = [...prev, { id, message: String(detail.message || ""), type, duration }];
        return next.slice(-4);
      });

      timers.current[id] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timers.current[id];
      }, duration);
    };

    window.addEventListener("sia-toast", handler);
    return () => {
      window.removeEventListener("sia-toast", handler);
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      className="fixed z-[9999] top-4 right-4 left-4 sm:left-auto flex flex-col gap-2.5 sm:w-96 max-w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.type];
          const Icon = style.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`pointer-events-auto relative overflow-hidden bg-white border border-slate-100 shadow-xl shadow-slate-200/60 rounded-2xl ring-1 ${style.ringClass} pl-4 pr-3 py-3.5 flex items-start gap-3`}
              role="alert"
            >
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${style.iconClass}`}>
                <Icon size={17} strokeWidth={2.4} />
              </div>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed pt-1.5 pr-1 break-words">
                {t.message}
              </p>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-auto shrink-0 p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition"
                aria-label="Tutup notifikasi"
              >
                <X size={14} />
              </button>

              {/* Progress bar countdown */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: t.duration / 1000, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-[3px] w-full origin-left ${style.barClass}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
