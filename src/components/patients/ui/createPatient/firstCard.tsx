import { useState } from "react";

export function FirstCard() {
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gender, setGender] = useState("");
    const [date, setDate] = useState<null | any>(null);
    const [dni, setDni] = useState("");
    const [address, setAddress] = useState("");

    return (
        <div className="w-full">
            <h2 className=" text-lg  font-semibold">General</h2>
            <div className="flex-col text-base  space-y-4 my-4">
                <div className="flex items-center">
                    <label className="relative  tracking-tighter">
                        Nombre:
                        <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                    </label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                </div>
                <div className="flex items-center">
                    <label className="relative  tracking-tighter">
                        Apellido:
                        <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                    </label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                </div>
                <div className="flex items-center">
                    <label className="relative  tracking-tighter">
                        Género:
                        <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                    </label>
                    <input value={gender} onChange={(e) => setGender(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                </div>
                <div className="flex items-center">
                    <label className="relative  tracking-tighter">
                        Nacimiento:
                        <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                    </label>
                    <input value={date} onChange={(e) => setDate(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                </div>
                <div className="flex items-center">
                    <label className="relative  tracking-tighter">
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
        </div>
    );
}
