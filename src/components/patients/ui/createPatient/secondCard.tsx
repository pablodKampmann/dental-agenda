import { useState } from "react";

export function SecondCard() {
    const [num, setNum] = useState("");
    const [email, setEmail] = useState("");

    return (
        <div>
            <h2 className="text-lg  font-semibold">Contacto</h2>
            <div className="flex-col text-base space-y-4 my-4">
                <div className="flex items-center">
                    <label className="relative tracking-tighter">
                        Teléfono:
                        <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                    </label>
                    <input value={num} onChange={(e) => setNum(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                </div>
                <div className="flex items-center">
                    <label className=" tracking-tighter">
                        Email:
                    </label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                </div>
            </div>
        </div>
    );
}
