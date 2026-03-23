"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastRecord = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3600;

function toastStylesByVariant(variant: ToastVariant): string {
  if (variant === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (variant === "error") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  return "border-slate-200 bg-white text-slate-800";
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    const id = idRef.current + 1;
    idRef.current = id;

    setToasts((current) => [...current, { id, message, variant }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      success: (message) => showToast(message, "success"),
      error: (message) => showToast(message, "error"),
      info: (message) => showToast(message, "info"),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed right-3 top-3 z-120 flex w-[min(28rem,calc(100vw-1.5rem))] flex-col gap-2 sm:right-4 sm:top-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${toastStylesByVariant(
              toast.variant,
            )}`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
