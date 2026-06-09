'use client'
import { useState } from "react";
import { ClipLoader } from "react-spinners";
import { logOut } from "@/services/auth/logOut";

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
}

export function LogOutAlert({ open, setOpen }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleLogOut() {
    setLoading(true);
    try {
      await logOut();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed top-[68px] left-0 sm:left-56 right-0 bottom-0 z-40 backdrop-blur-sm bg-black/20"
        onClick={() => { if (!loading) setOpen(false); }}
      />
      <div className="fixed left-1/2 sm:left-[calc(50%+7rem)] top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] sm:w-full max-w-md bg-white rounded-xl border-2 border-gray-300 shadow-lg p-6 text-black">
        <h2 className="text-lg font-semibold mb-1">¿Cerrar sesión?</h2>
        <div className="text-sm text-gray-500 mb-5 pl-0.5">
          Deberás volver a ingresar tus credenciales para acceder nuevamente.
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            disabled={loading}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-medium hover:bg-gray-50 transition duration-150 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleLogOut}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-red-800 text-white text-sm font-medium hover:bg-red-900 transition duration-150 min-w-[80px] disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <ClipLoader color="white" size={18} /> : "Cerrar sesión"}
          </button>
        </div>
      </div>
    </>
  );
}
