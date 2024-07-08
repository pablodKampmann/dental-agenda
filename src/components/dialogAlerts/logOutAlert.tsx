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
          <AlertDialogContent className="text-black">
            <AlertDialogHeader>
              <AlertDialogTitle className="relative">¿Estás seguro(a) de que deseas cerrar sesión?</AlertDialogTitle>
              <AlertDialogDescription className="w-[80%]">
                Deberás volver a ingresar tus credenciales para acceder nuevamente.
              </AlertDialogDescription>
              <FaRunning className="absolute bottom-6" size={42} />
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="focus:outline-none" onClick={() => setOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-900 focus:outline-none hover:bg-red-800" onClick={() => { handleLogOut(); setOpen(false); }}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="mobile-layout">
        <AlertDialog open={open}>
          <AlertDialogContent className="text-black">
            <AlertDialogHeader>
              <AlertDialogTitle className="relative">¿Estás seguro(a)aa de que deseas cerrar sesión?</AlertDialogTitle>
              <AlertDialogDescription className="w-[80%]">
                Deberás volver a ingresar tus credenciales para acceder nuevamente.
              </AlertDialogDescription>
              <FaRunning className="absolute bottom-6" size={42} />
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="focus:outline-none" onClick={() => setOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-900 focus:outline-none hover:bg-red-800" onClick={() => { handleLogOut(); setOpen(false); }}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
