'use client'

const INPUT_CLS = "w-full border-2 border-gray-300 rounded-xl px-3 h-9 focus:outline-teal-700 bg-gray-300 bg-opacity-70 text-black text-sm";

interface props {
    insurance: string;
    setInsurance: (value: string) => void;
    plan: string;
    setPlan: (value: string) => void;
    affiliate: string;
    setAffiliate: (value: string) => void;
    insuranceOptions: null | any[];
    planOptions: string[];
    onOpenInsuranceModal: () => void;
    onOpenPlanModal: () => void;
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

export function ThirdCard({ insurance, setInsurance, plan, setPlan, affiliate, setAffiliate, insuranceOptions, planOptions, onOpenInsuranceModal, onOpenPlanModal }: props) {
    const planDisabled = !insurance || insurance === 'Particular';

    return (
        <div>
            <h2 className="text-lg font-semibold">Datos Médicos</h2>
            <div className="flex flex-col space-y-3 my-4">
                {/* OBRA SOCIAL */}
                <Field label="Obra Social" required>
                    <select
                        value={insurance}
                        onChange={(e) => setInsurance(e.target.value)}
                        className={INPUT_CLS}
                        disabled={!insuranceOptions}
                    >
                        <option value="" disabled>
                            {insuranceOptions ? 'Seleccionar' : 'Cargando...'}
                        </option>
                        {insuranceOptions?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={onOpenInsuranceModal}
                        className="text-xs text-teal-700 hover:text-teal-500 font-semibold text-left"
                    >
                        + Agregar nueva
                    </button>
                </Field>

                {/* PLAN */}
                <Field label="Plan">
                    <div className={planDisabled ? 'cursor-not-allowed' : ''}>
                        <select
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className={`${INPUT_CLS} ${planDisabled ? 'pointer-events-none text-gray-400' : ''}`}
                        >
                            <option value="" disabled>
                                {!insurance ? 'Elegí obra social primero' : insurance === 'Particular' ? '-' : planOptions.length === 0 ? 'Agregá un plan' : 'Seleccionar'}
                            </option>
                            {planOptions.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={onOpenPlanModal}
                        disabled={planDisabled}
                        className="text-xs text-teal-700 hover:text-teal-500 font-semibold text-left disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        + Agregar nueva
                    </button>
                </Field>

                {/* NÚM. AFILIADO */}
                <Field label="Núm. Afiliado">
                    <div className={insurance === 'Particular' ? 'cursor-not-allowed' : ''}>
                        <input
                            value={affiliate}
                            onChange={(e) => setAffiliate(e.target.value)}
                            className={`${INPUT_CLS} ${insurance === 'Particular' ? 'pointer-events-none text-gray-400' : ''}`}
                        />
                    </div>
                </Field>
            </div>
        </div>
    );
}
