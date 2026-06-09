"use client";
import { createContext, useContext, useCallback } from "react";
import toast from "react-hot-toast";

export type ToastType = "success" | "error" | "warning";

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((type: ToastType, message: string) => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else {
      toast(message, {
        icon: "⚠️",
        style: {
          borderLeft: "4px solid #f59e0b",
        },
      });
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
