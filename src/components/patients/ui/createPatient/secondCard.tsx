'use client'
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const INPUT_CLS = "w-full border-2 border-gray-300 rounded-xl px-3 h-9 focus:outline-teal-700 bg-gray-300 bg-opacity-70 text-black text-sm";

interface props {
    num: string;
    setNum: (value: string) => void;
    email: string;
    setEmail: (value: string) => void;
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

export function SecondCard({ num, setNum, email, setEmail }: props) {
    return (
        <div>
            <h2 className="text-lg font-semibold">Contacto</h2>
            <div className="flex flex-col space-y-3 my-4">
                <Field label="Teléfono" required>
                    <PhoneInput
                        international
                        countryCallingCodeEditable={false}
                        defaultCountry="AR"
                        value={num}
                        onChange={(value) => setNum(value || '')}
                        className="w-full input-phone-number border-2 border-gray-300 rounded-xl px-3 h-9 bg-gray-300 bg-opacity-70 text-black text-sm"
                        countries={['AR', 'UY', 'BR', 'US']}
                    />
                </Field>
                <Field label="Email">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT_CLS} />
                </Field>
            </div>
        </div>
    );
}
