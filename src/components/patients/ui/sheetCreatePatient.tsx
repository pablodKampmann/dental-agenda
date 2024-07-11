import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react";
import { BsPersonFillAdd } from "react-icons/bs";

interface props {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export function SheetCreatePatient({ open, setOpen }: props) {
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gender, setGender] = useState("");
    const [date, setDate] = useState<null | any>(null);
    const [dni, setDni] = useState("");
    const [num, setNum] = useState("");
    const [address, setAddress] = useState("");
    const [email, setEmail] = useState("");
    const [insurance, setInsurance] = useState("");
    const [plan, setPlan] = useState("");
    const [affiliate, setAffiliate] = useState("");

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="text-black text-nowrap">
                <SheetHeader>
                    <SheetTitle className="flex justify-start items-center">Agregar Paciente <BsPersonFillAdd className="ml-1.5 bg-teal-700 rounded-full text-white p-1.5" size={34} /></SheetTitle>
                    <SheetDescription>
                        Por favor, completa los datos del formulario. <br />
                        Los campos marcados con <span className="font-semibold text-sm text-red-800">*</span> son obligatorios.
                    </SheetDescription>
                </SheetHeader>
                <div className="h-0.5 w-full bg-teal-700 rounded-full my-4"></div>
                <div className="border-2">
                    <h2 className="text-base  font-semibold">General</h2>
                    <div className="flex-col text-sm  space-y-3 my-4">
                        <div className="flex items-center">
                            <label className="relative">
                                Nombre:
                                <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                            </label>
                            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                        <div className="flex items-center">
                            <label className="relative">
                                Apellido:
                                <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                            </label>
                            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                        <div className="flex items-center">
                            <label className="relative">
                                Género:
                                <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                            </label>
                            <input value={gender} onChange={(e) => setGender(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                        <div className="flex items-center">
                            <label className="relative">
                                Nacimiento:
                                <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                            </label>
                            <input value={date} onChange={(e) => setDate(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                        <div className="flex items-center">
                            <label className="relative">
                                Dni:
                                <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                            </label>
                            <input value={dni} onChange={(e) => setDni(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                        <div className="flex items-center">
                            <label>
                                Domicilio:
                            </label>
                            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                    </div>
                    <h2 className="text-base  font-semibold">Contacto</h2>
                    <div className="flex-col text-sm space-y-3 my-4">
                        <div className="flex items-center">
                            <label className="relative">
                                Teléfono:
                                <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                            </label>
                            <input value={num} onChange={(e) => setNum(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                        <div className="flex items-center">
                            <label>
                                Email:
                            </label>
                            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                    </div>
                    <h2 className="text-base  font-semibold">Datos Medicos</h2>
                    <div className="flex-col text-sm space-y-3 my-4">
                        <div className="flex items-center">
                            <label className="relative">
                                Obra Social:
                                <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                            </label>
                            <input value={insurance} onChange={(e) => setInsurance(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                        <div className="flex items-center">
                            <label>
                                Plan:
                            </label>
                            <input value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                        <div className="flex items-center">
                            <label>
                                Núm. Afiliado:
                            </label>
                            <input value={affiliate} onChange={(e) => setAffiliate(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                        </div>
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button className="bg-teal-700 hover:bg-teal-600 hover:border-gray-600 border-2 border-transparent" type="submit">Confirmar</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
