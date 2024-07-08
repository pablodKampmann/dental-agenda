import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { logOut } from "../auth/logOut";
import { FaRunning } from 'react-icons/fa';

interface props {
  open: boolean;
  setOpen: (value: boolean) => void;
}

export function LogOutAlert({ open, setOpen }: props) {

  async function handleLogOut() {
    const result = await logOut();
    if (result === 'error') {
      console.log("Error al cerrar sesión");
    } else {
      console.log("Sesión cerrada exitosamente");
    }
  }

  return (
    <div>
      <div className="desktop-layout">
        <AlertDialog open={open}>
          <AlertDialogContent className="text-black border-2 border-red-950">
            <AlertDialogHeader>
              <AlertDialogTitle className="relative">¿Estás seguro(a) de que deseas cerrar sesión?</AlertDialogTitle>
              <AlertDialogDescription className="w-[80%] pl-2">
                Deberás volver a ingresar tus credenciales para acceder nuevamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="focus:outline-none rounded-xl" onClick={() => setOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-900 rounded-xl focus:outline-none hover:bg-red-800" onClick={() => { handleLogOut(); setOpen(false); }}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
     
    </div>
  )
}
