'use client'
import { useState } from "react";
import { ClipLoader } from "react-spinners";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shared/ui/alert-dialog";

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

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="text-black border-2 border-gray-300 rounded-xl w-[90%] sm:w-full">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="pl-1">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-xl shadow-sm focus:outline-none"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-800 rounded-xl focus:outline-none shadow-sm hover:bg-red-900 min-w-[80px]"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <div className="flex justify-center items-center">
                <ClipLoader color="white" size={18} />
              </div>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
