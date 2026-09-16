import React, { useState, useEffect, useRef } from 'react';
import { getInsuranceOptions } from "@/services/options/getInsuranceOpt";
import { getInsurancePlans } from "@/services/options/getInsurancePlans";
import { addInsurance } from "@/services/options/addInsurance";
import { addInsurancePlan } from "@/services/options/addInsurancePlan";
import { SetPatients } from "@/services/patients/setPatients";
import PhoneInput, { formatPhoneNumberIntl } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'
import { MiniCalendar } from "@/components/appointments/ui/MiniCalendar";
import { ClipLoader } from "react-spinners";
import { BsPersonFillAdd } from "react-icons/bs";
import { IoClose } from "react-icons/io5";

interface InsuranceOption { id: string; name: string; }
interface PlanOption { id: string; name: string; }

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const INPUT_CLS = "h-9 w-full px-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-sm text-black placeholder:text-gray-400 focus:outline-teal-700";
const LABEL_CLS = "text-xs font-semibold text-gray-500 select-none";
const GROUP_CLS = "text-xs font-bold tracking-widest text-gray-400 uppercase select-none";
const BTN_GHOST = "px-4 py-2 text-sm font-semibold text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:text-black transition duration-150";
const BTN_PRIMARY = "px-4 py-2 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150 disabled:opacity-60";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 min-w-0">
            <label className={LABEL_CLS}>
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

export function ModalCreatePatient({ open, onClose, onSuccess }: Props) {
    const [insuranceOptions, setInsuranceOptions] = useState<InsuranceOption[] | null>(null);
    const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gender, setGender] = useState("");
    const [date, setDate] = useState<null | any>(null);
    const [dni, setDni] = useState("");
    const [num, setNum] = useState("");
    const [address, setAddress] = useState("");
    const [email, setEmail] = useState("");
    const [insurance, setInsurance] = useState("");
    const [insuranceId, setInsuranceId] = useState("");
    const [plan, setPlan] = useState("");
    const [planId, setPlanId] = useState("");
    const [affiliate, setAffiliate] = useState("");
    const [loading, setLoading] = useState(false);

    const [openInsuranceModal, setOpenInsuranceModal] = useState(false);
    const [newInsuranceName, setNewInsuranceName] = useState("");
    const [openPlanModal, setOpenPlanModal] = useState(false);
    const [newPlanName, setNewPlanName] = useState("");

    const [showDatePicker, setShowDatePicker] = useState(false);
    const datePickerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [insuranceMounted, setInsuranceMounted] = useState(false);
    const [planMounted, setPlanMounted] = useState(false);

    useEffect(() => {
        getInsuranceOptions().then(options => { if (options !== null) setInsuranceOptions(options); });
    }, []);

    useEffect(() => {
        if (open) {
            const frame = requestAnimationFrame(() => setMounted(true));
            return () => cancelAnimationFrame(frame);
        }
        setMounted(false);
    }, [open]);

    useEffect(() => {
        if (openInsuranceModal) {
            const frame = requestAnimationFrame(() => setInsuranceMounted(true));
            return () => cancelAnimationFrame(frame);
        }
        setInsuranceMounted(false);
    }, [openInsuranceModal]);

    useEffect(() => {
        if (openPlanModal) {
            const frame = requestAnimationFrame(() => setPlanMounted(true));
            return () => cancelAnimationFrame(frame);
        }
        setPlanMounted(false);
    }, [openPlanModal]);

    useEffect(() => {
        setPlan(""); setPlanId(""); setPlanOptions([]);
        if (!insuranceId || insurance === 'Particular') return;
        setLoadingPlans(true);
        getInsurancePlans(insuranceId).then(plans => {
            setPlanOptions(plans ?? []);
            setLoadingPlans(false);
        });
    }, [insuranceId]);

    useEffect(() => {
        if (!showDatePicker) return;
        function handleClickOutside(e: MouseEvent) {
            if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
                setShowDatePicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDatePicker]);

    //ESC CIERRA EL SUB-MODAL ABIERTO, Y SI NO HAY, EL MODAL PRINCIPAL
    useEffect(() => {
        if (!open) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key !== 'Escape') return;
            if (openInsuranceModal) { setNewInsuranceName(""); setOpenInsuranceModal(false); }
            else if (openPlanModal) { setNewPlanName(""); setOpenPlanModal(false); }
            else if (showDatePicker) setShowDatePicker(false);
            else HandleCloseModal();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, openInsuranceModal, openPlanModal, showDatePicker]);

    function handleSelectInsurance(id: string, insuranceName: string) {
        setInsuranceId(id);
        setInsurance(insuranceName);
    }

    function resetForm() {
        setName(""); setLastName(""); setGender(""); setDate(null);
        setDni(""); setNum(""); setAddress(""); setEmail("");
        setInsurance(""); setInsuranceId(""); setPlan(""); setPlanId(""); setAffiliate("");
        setPlanOptions([]);
        setLoading(false);
    }

    async function HandleSubmit(e: any) {
        e.preventDefault();
        if (!date) return;
        setLoading(true);
        const formattedDate = date.format('DD/MM/YYYY');
        const newNum = formatPhoneNumberIntl(num);
        const result = await SetPatients(name, lastName, gender, formattedDate, dni, newNum, address, email, insurance, insuranceId, plan, planId, affiliate);
        if (result !== "error") {
            resetForm();
            onSuccess();
            onClose();
        }
        setLoading(false);
    }

    function HandleCloseModal() {
        resetForm();
        onClose();
    }

    async function handleAddInsurance() {
        if (!newInsuranceName.trim()) return;
        const result = await addInsurance(newInsuranceName.trim());
        if (result) {
            setInsuranceOptions(prev => prev ? [...prev, result] : [result]);
            handleSelectInsurance(result.id, result.name);
        }
        setNewInsuranceName("");
        setOpenInsuranceModal(false);
    }

    async function handleAddPlan() {
        if (!newPlanName.trim() || !insuranceId) return;
        const result = await addInsurancePlan(insuranceId, newPlanName.trim());
        if (result) {
            setPlanOptions(prev => [...prev, result]);
            setPlanId(result.id);
            setPlan(result.name);
        }
        setNewPlanName("");
        setOpenPlanModal(false);
    }

    if (!open) return null;

    const planDisabled = !insuranceId || insurance === 'Particular';

    return (
        <>
            <div className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`} onClick={HandleCloseModal} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={HandleCloseModal}>
                <form
                    onSubmit={HandleSubmit}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full max-w-[720px] max-h-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-xl transition-all duration-200 ease-out ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                >
                    {/* Header */}
                    <div className="shrink-0 flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-200">
                        <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl">
                            <BsPersonFillAdd size={20} />
                        </div>
                        <div className="flex-1 min-w-0 select-none">
                            <h2 className="text-base font-bold text-black tracking-tight">Agregar Paciente</h2>
                            <p className="text-xs text-gray-400">
                                Los campos con <span className="text-red-500">*</span> son obligatorios.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={HandleCloseModal}
                            className="shrink-0 text-gray-400 hover:text-black transition duration-150"
                        >
                            <IoClose size={22} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
                        {/* Datos personales */}
                        <div className="flex flex-col gap-2">
                            <h3 className={GROUP_CLS}>Datos personales</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Field label="Nombre" required>
                                    <input type="text" className={INPUT_CLS} required value={name} onChange={(e) => setName(e.target.value)} />
                                </Field>
                                <Field label="Apellido" required>
                                    <input type="text" className={INPUT_CLS} required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                </Field>
                                <Field label="Género" required>
                                    <select className={INPUT_CLS} required value={gender} onChange={(e) => setGender(e.target.value)}>
                                        <option value="" disabled>Seleccionar</option>
                                        <option value="male">Masculino</option>
                                        <option value="female">Femenino</option>
                                    </select>
                                </Field>
                                <Field label="Nacimiento" required>
                                    <div className="relative" ref={datePickerRef}>
                                        <button
                                            type="button"
                                            onClick={() => setShowDatePicker(!showDatePicker)}
                                            className={`${INPUT_CLS} text-left ${date ? 'text-black' : 'text-gray-400'}`}
                                        >
                                            {date ? date.format('DD/MM/YYYY') : 'DD/MM/YYYY'}
                                        </button>
                                        {showDatePicker && (
                                            <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl">
                                                <MiniCalendar
                                                    value={date}
                                                    onChange={(d) => { setDate(d); setShowDatePicker(false); }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Field>
                                <Field label="DNI" required>
                                    <input
                                        type="text" maxLength={8}
                                        onKeyDown={(e) => {
                                            if (e.ctrlKey || e.metaKey) return;
                                            if (!/[0-9]/.test(e.key) && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)) e.preventDefault();
                                        }}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
                                            const input = e.currentTarget;
                                            const start = input.selectionStart ?? 0;
                                            const end = input.selectionEnd ?? 0;
                                            const next = (dni.slice(0, start) + pasted + dni.slice(end)).slice(0, 8);
                                            setDni(next);
                                        }}
                                        className={INPUT_CLS} required value={dni} onChange={(e) => setDni(e.target.value)}
                                    />
                                </Field>
                                <Field label="Domicilio">
                                    <input type="text" className={INPUT_CLS} value={address} onChange={(e) => setAddress(e.target.value)} />
                                </Field>
                            </div>
                        </div>

                        {/* Contacto */}
                        <div className="flex flex-col gap-2">
                            <h3 className={GROUP_CLS}>Contacto</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Field label="Núm. Teléfono" required>
                                    <PhoneInput
                                        international countryCallingCodeEditable={false} defaultCountry="AR"
                                        value={num} onChange={(value) => setNum(value || '')}
                                        className={`input-phone-number ${INPUT_CLS}`}
                                        countries={['AR', 'UY', 'BR', 'US']}
                                    />
                                </Field>
                                <div className="sm:col-span-2">
                                    <Field label="Correo Electrónico">
                                        <input type="text" className={INPUT_CLS} value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Cobertura */}
                        <div className="flex flex-col gap-2">
                            <h3 className={GROUP_CLS}>Cobertura</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                                <Field label="Obra Social" required>
                                    <select
                                        className={INPUT_CLS} required value={insuranceId}
                                        onChange={(e) => {
                                            const opt = insuranceOptions?.find(o => o.id === e.target.value);
                                            handleSelectInsurance(e.target.value, opt?.name ?? '');
                                        }}
                                        disabled={!insuranceOptions}
                                    >
                                        <option value="" disabled>{insuranceOptions ? 'Seleccionar' : 'Cargando...'}</option>
                                        {insuranceOptions?.map((opt) => (
                                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                                        ))}
                                    </select>
                                    <button type="button" onClick={() => setOpenInsuranceModal(true)} className="text-xs text-teal-700 hover:text-teal-600 font-semibold text-left transition duration-150">
                                        + Agregar nueva
                                    </button>
                                </Field>
                                <Field label="Plan">
                                    <div className={planDisabled ? 'cursor-not-allowed' : ''}>
                                        <select
                                            className={`${INPUT_CLS} ${planDisabled ? 'pointer-events-none text-gray-400' : ''}`}
                                            value={planId}
                                            onChange={(e) => {
                                                const opt = planOptions.find(o => o.id === e.target.value);
                                                setPlanId(e.target.value);
                                                setPlan(opt?.name ?? '');
                                            }}
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
                                    <button type="button" onClick={() => setOpenPlanModal(true)} disabled={planDisabled} className="text-xs text-teal-700 hover:text-teal-600 font-semibold text-left transition duration-150 disabled:text-gray-400 disabled:cursor-not-allowed">
                                        + Agregar nuevo
                                    </button>
                                </Field>
                                <Field label="Núm. Afiliado">
                                    <input
                                        type="text"
                                        className={`${INPUT_CLS} ${insurance === 'Particular' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={affiliate}
                                        onChange={(e) => setAffiliate(e.target.value)}
                                        disabled={insurance === 'Particular'}
                                    />
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <button type="button" onClick={HandleCloseModal} className={BTN_GHOST}>Cancelar</button>
                        <button type="submit" disabled={loading} className={`${BTN_PRIMARY} min-w-[104px] flex items-center justify-center`}>
                            {loading ? <ClipLoader color="white" size={16} /> : 'Crear paciente'}
                        </button>
                    </div>
                </form>
            </div>

            {openInsuranceModal && (
                <MiniModal
                    mounted={insuranceMounted}
                    title="Nueva Obra Social"
                    placeholder="Nombre de la obra social"
                    value={newInsuranceName}
                    onChange={setNewInsuranceName}
                    onCancel={() => { setNewInsuranceName(""); setOpenInsuranceModal(false); }}
                    onConfirm={handleAddInsurance}
                />
            )}

            {openPlanModal && (
                <MiniModal
                    mounted={planMounted}
                    title="Nuevo Plan"
                    subtitle={insurance}
                    placeholder="Nombre del plan"
                    value={newPlanName}
                    onChange={setNewPlanName}
                    onCancel={() => { setNewPlanName(""); setOpenPlanModal(false); }}
                    onConfirm={handleAddPlan}
                />
            )}
        </>
    );
}

interface MiniModalProps {
    mounted: boolean;
    title: string;
    subtitle?: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}

function MiniModal({ mounted, title, subtitle, placeholder, value, onChange, onCancel, onConfirm }: MiniModalProps) {
    return (
        <>
            <div
                className={`fixed inset-0 z-[55] backdrop-blur-sm bg-black/30 transition-opacity duration-150 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                onClick={onCancel}
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={`w-full max-w-[400px] bg-white border border-gray-200 rounded-2xl shadow-xl transition-all duration-150 ease-out pointer-events-auto ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-5 pt-4 pb-3 border-b border-gray-200 select-none">
                        <h2 className="text-base font-bold text-black tracking-tight">
                            {title}
                            {subtitle && <span className="text-gray-400 font-normal"> · {subtitle}</span>}
                        </h2>
                    </div>
                    <div className="px-5 py-4">
                        <input
                            type="text"
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className={INPUT_CLS}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onConfirm(); } }}
                        />
                    </div>
                    <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <button type="button" onClick={onCancel} className={BTN_GHOST}>Cancelar</button>
                        <button type="button" onClick={onConfirm} className={BTN_PRIMARY}>Agregar</button>
                    </div>
                </div>
            </div>
        </>
    );
}
