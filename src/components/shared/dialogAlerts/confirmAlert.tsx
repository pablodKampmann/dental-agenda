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
      {/* Overlay: cubre solo el contenido, no el sidebar ni el topnav */}
      <div
        className="fixed top-[68px] left-0 sm:left-56 right-0 bottom-0 z-40 backdrop-blur-sm bg-black/20"
        onClick={() => { if (!loading) setOpen(false); }}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 sm:left-[calc(50%+7rem)] top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] sm:w-full max-w-md bg-white rounded-xl border-2 border-gray-300 shadow-lg p-6 text-black">
        <h2 className="text-lg font-semibold mb-1">{title}</h2>
        <div className="text-sm text-gray-500 mb-5 pl-0.5">{description}</div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            disabled={loading}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-medium hover:bg-gray-50 transition duration-150 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-red-800 text-white text-sm font-medium hover:bg-red-900 transition duration-150 min-w-[80px] disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <ClipLoader color="white" size={18} /> : confirmText}
          </button>
        </div>
      </div>
    </>
  );
}
