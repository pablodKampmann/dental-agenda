'use client'

const INPUT_CLS = "w-full border-2 border-gray-300 rounded-xl px-3 h-9 focus:outline-teal-700 bg-gray-300 bg-opacity-40 text-black text-sm";

interface InsuranceOption { id: string; name: string; }
interface PlanOption { id: string; name: string; }

interface props {
    insuranceId: string;
    insurance: string;
    onSelectInsurance: (id: string, name: string) => void;
    planId: string;
    onSelectPlan: (id: string, name: string) => void;
    affiliate: string;
    setAffiliate: (value: string) => void;
    insuranceOptions: InsuranceOption[] | null;
    planOptions: PlanOption[];
    loadingPlans: boolean;
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

export function ThirdCard({ insuranceId, insurance, onSelectInsurance, planId, onSelectPlan, affiliate, setAffiliate, insuranceOptions, planOptions, loadingPlans, onOpenInsuranceModal, onOpenPlanModal }: props) {
    const planDisabled = !insuranceId || insurance === 'Particular';

    return (
        <div>
            <h2 className="text-lg font-semibold">Datos Médicos</h2>
            <div className="flex flex-col space-y-3 my-4">
                <Field label="Obra Social" required>
                    <select
                        value={insuranceId}
                        onChange={(e) => {
                            const opt = insuranceOptions?.find(o => o.id === e.target.value);
                            onSelectInsurance(e.target.value, opt?.name ?? '');
                        }}
                        className={INPUT_CLS}
                        disabled={!insuranceOptions}
                    >
                        <option value="" disabled>
                            {insuranceOptions ? 'Seleccionar' : 'Cargando...'}
                        </option>
                        {insuranceOptions?.map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                    </select>
                    <button type="button" onClick={onOpenInsuranceModal} className="text-xs text-teal-700 hover:text-teal-500 font-semibold text-left">
                        + Agregar nueva
                    </button>
                </Field>

                <Field label="Plan">
                    <div className={planDisabled ? 'cursor-not-allowed' : ''}>
                        <select
                            value={planId}
                            onChange={(e) => {
                                const opt = planOptions.find(o => o.id === e.target.value);
                                onSelectPlan(e.target.value, opt?.name ?? '');
                            }}
                            className={`${INPUT_CLS} ${planDisabled ? 'pointer-events-none text-gray-400' : ''}`}
                        >
                            <option value="" disabled>
                                {!insuranceId ? 'Elegí obra social primero'
                                    : insurance === 'Particular' ? '-'
                                    : loadingPlans ? 'Cargando...'
                                    : planOptions.length === 0 ? 'Agregá un plan'
                                    : 'Seleccionar'}
                            </option>
                            {planOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                        </select>
                    </div>
                    <button type="button" onClick={onOpenPlanModal} disabled={planDisabled} className="text-xs text-teal-700 hover:text-teal-500 font-semibold text-left disabled:text-gray-400 disabled:cursor-not-allowed">
                        + Agregar nueva
                    </button>
                </Field>

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
