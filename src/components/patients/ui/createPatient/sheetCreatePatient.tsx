import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { BsPersonFillAdd } from "react-icons/bs";
import { CarouselFormCreatePatient } from "./carouselFormCreatePatient";

interface props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SheetCreatePatient({ open, onClose, onSuccess }: props) {
    return (
        <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <SheetContent className="text-black border-l-4 border-teal-800">
                <SheetHeader>
                    <SheetTitle className="flex justify-start items-center">
                        Agregar Paciente <BsPersonFillAdd className="ml-1.5 bg-teal-700 rounded-full text-white p-1.5" size={34} />
                    </SheetTitle>
                    <SheetDescription className="text-start pl-0.5">
                        Por favor, completa los datos del formulario. <br />
                        Los campos marcados con <span className="font-semibold text-sm text-red-800">*</span> son obligatorios.
                    </SheetDescription>
                </SheetHeader>
                <div className="h-0.5 w-full bg-teal-700 rounded-full my-4"></div>
                <CarouselFormCreatePatient onClose={onClose} onSuccess={onSuccess} />
            </SheetContent>
        </Sheet>
    )
}
