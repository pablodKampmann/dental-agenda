'use client'

const INPUT_CLS = "w-full border-2 border-gray-300 rounded-xl px-3 h-9 focus:outline-teal-700 bg-gray-300 bg-opacity-70 text-black text-sm";

interface props {
    name: string;
    setName: (value: string) => void;
    lastName: string;
    setLastName: (value: string) => void;
    gender: string;
    setGender: (value: string) => void;
    date: string;
    setDate: (value: string) => void;
    dni: string;
    setDni: (value: string) => void;
    address: string;
    setAddress: (value: string) => void;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium tracking-tight">
                {label} {required && <span className="text-red-800 font-semibold">*</span>}
            </label>
            {children}
        </div>
    );
}

export function FirstCard({ name, setName, lastName, setLastName, gender, setGender, date, setDate, dni, setDni, address, setAddress }: props) {
    return (
        <div className="w-full">
            <h2 className="text-lg font-semibold">General</h2>
            <div className="flex flex-col space-y-3 my-4">
                <Field label="Nombre" required>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLS} />
                </Field>
                <Field label="Apellido" required>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={INPUT_CLS} />
                </Field>
                <Field label="Género" required>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={INPUT_CLS}>
                        <option value="" disabled>Seleccionar</option>
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                    </select>
                </Field>
                <Field label="Nacimiento" required>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={INPUT_CLS}
                    />
                </Field>
                <Field label="DNI" required>
                    <input
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        maxLength={8}
                        onKeyDown={(event) => {
                            if (!/[0-9]/.test(event.key) && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(event.key)) event.preventDefault();
                        }}
                        className={INPUT_CLS}
                    />
                </Field>
                <Field label="Domicilio">
                    <input value={address} onChange={(e) => setAddress(e.target.value)} className={INPUT_CLS} />
                </Field>
            </div>
        </div>
    );
}
