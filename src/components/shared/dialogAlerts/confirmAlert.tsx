'use client'
import { useState } from "react";
import { ClipLoader } from "react-spinners";

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmAlert({
  open,
  setOpen,
  title,
  description,
  onConfirm,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay: pantalla completa, por encima de topbar (z-50) y sidebar (z-40) */}
      <div
        className="fixed inset-0 z-[60] backdrop-blur-sm bg-black/50 animate-fade-in"
        onClick={() => { if (!loading) setOpen(false); }}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl text-black animate-fade-in pointer-events-auto">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-base font-bold tracking-tight">{title}</h2>
          </div>
          <div className="px-4 py-4 text-sm text-gray-500">{description}</div>
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-2 border-gray-300 text-gray-600 hover:bg-white hover:text-black rounded-lg text-sm font-semibold px-3 py-1.5 transition duration-150 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold px-3 py-1.5 transition duration-150 min-w-[80px] disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <ClipLoader color="white" size={18} /> : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
