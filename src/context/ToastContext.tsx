"use client";
import { createContext, useContext, useCallback } from "react";
import toast from "react-hot-toast";

export type ToastType = "success" | "error" | "warning";

interface ToastContextType {
  // `id` opcional: llamar showToast de nuevo con el mismo id actualiza ese toast en vez
  // de apilar uno nuevo — para casos como "reintentó la misma acción inválida varias
  // veces seguidas" (ej. click repetido en un submit con campos faltantes), donde sin id
  // cada click agrega un toast idéntico más arriba del anterior.
  showToast: (type: ToastType, message: string, id?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((type: ToastType, message: string, id?: string) => {
    if (type === "success") {
      toast.success(message, ...(id ? [{ id }] : []));
    } else if (type === "error") {
      toast.error(message, ...(id ? [{ id }] : []));
    } else {
      toast(message, {
        ...(id ? { id } : {}),
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
