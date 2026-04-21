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
import { logOut } from "../../auth/logOut";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
interface props {
  open: boolean;
  setOpen: (value: boolean) => void;
}

export function LogOutAlert({ open, setOpen }: props) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  async function handleLogOut() {
    const result = await logOut();
    if (result === null) {
      console.log("Error al cerrar sesiÃ³n");
    } else {
      console.log("SesiÃ³n cerrada exitosamente");
    }
  }

  if (isMobile) {
    return (
      <AlertDialog open={open}>
        <AlertDialogContent className="text-black border-2 w-[80%] rounded-xl border-red-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="relative ">Â¿EstÃ¡s seguro(a) de que deseas cerrar sesiÃ³n?</AlertDialogTitle>
            <AlertDialogDescription className=" pl-2">
              DeberÃ¡s volver a ingresar tus credenciales para acceder nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="focus:outline-none outline-none shadow-xl rounded-xl" onClick={() => setOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-800 rounded-xl focus:outline-none shadow-xl hover:bg-red-900" onClick={() => { handleLogOut(); setOpen(false); }}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  } else {
    return (
      <AlertDialog open={open}>
        <AlertDialogContent className="text-black border-2 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="relative">Â¿EstÃ¡s seguro(a) de que deseas cerrar sesiÃ³n?</AlertDialogTitle>
            <AlertDialogDescription className="w-[80%] pl-2">
              DeberÃ¡s volver a ingresar tus credenciales para acceder nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="focus:outline-none outline-none rounded-xl shadow-lg" onClick={() => setOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-800 rounded-xl focus:outline-none outline-none shadow-xl hover:bg-red-900" onClick={() => { handleLogOut(); setOpen(false); }}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
}

