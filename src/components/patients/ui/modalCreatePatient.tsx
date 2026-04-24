import React, { useState, useEffect } from 'react';
import { getInsuranceOptions } from "./../../options/getInsuranceOpt";
import { SetPatients } from "./../db/setPatients";
import PhoneInput, { formatPhoneNumberIntl } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from 'dayjs';
import { ClipLoader } from "react-spinners";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const INPUT_CLS = "h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-70 text-black";

export function ModalCreatePatient({ open, onClose, onSuccess }: Props) {
    const [insuranceOptions, setInsuranceOptions] = useState<null | any[]>(null);
    const [planOptions, setPlanOptions] = useState<string[]>([]);
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
    const [loading, setLoading] = useState(false);

    const [openInsuranceModal, setOpenInsuranceModal] = useState(false);
    const [newInsuranceName, setNewInsuranceName] = useState("");
    const [openPlanModal, setOpenPlanModal] = useState(false);
    const [newPlanName, setNewPlanName] = useState("");

    // Controls CSS entry animations
    const [mounted, setMounted] = useState(false);
    const [insuranceMounted, setInsuranceMounted] = useState(false);
    const [planMounted, setPlanMounted] = useState(false);

    useEffect(() => {
        async function Get() {
            const options = await getInsuranceOptions();
            if (options !== null) setInsuranceOptions(options);
        }
        Get();
    }, []);

    // Trigger entry animation one frame after mount
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

    // Reset plan when insurance changes
    useEffect(() => {
        setPlan("");
    }, [insurance]);

    function resetForm() {
        setName(""); setLastName(""); setGender(""); setDate(null);
        setDni(""); setNum(""); setAddress(""); setEmail("");
        setInsurance(""); setPlan(""); setAffiliate("");
        setLoading(false);
    }

    async function HandleSubmit(e: any) {
        e.preventDefault();
        if (!date) return;
        setLoading(true);
        const formattedDate = dayjs(date.$d).format('DD/MM/YYYY');
        const newNum = formatPhoneNumberIntl(num);
        const result = await SetPatients(name, lastName, gender, formattedDate, dni, newNum, address, email, insurance, plan, affiliate);
        if (result !== null) {
            resetForm();
            onSuccess();
        }
        setLoading(false);
    }

    function HandleCloseModal() {
        resetForm();
        onClose();
    }

    function handleAddInsurance() {
        if (!newInsuranceName.trim()) return;
        setInsuranceOptions(prev => prev ? [...prev, newInsuranceName.trim()] : [newInsuranceName.trim()]);
        setInsurance(newInsuranceName.trim());
        setNewInsuranceName("");
        setOpenInsuranceModal(false);
    }

    function handleAddPlan() {
        if (!newPlanName.trim()) return;
        const trimmed = newPlanName.trim();
        setPlanOptions(prev => [...prev, trimmed]);
        setPlan(trimmed);
        setNewPlanName("");
        setOpenPlanModal(false);
    }

    if (!open) return null;

    const planDisabled = !insurance || insurance === 'Particular';

    return (
        <>
            <div className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`} onClick={HandleCloseModal} />
            <div className="fixed inset-0 z-50 flex items-center justify-center mt-12">
                <form
                    onSubmit={HandleSubmit}
                    className={`relative py-2 w-[700px] transition-all duration-200 ease-out ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                >
                    <div className="w-full border-4 border-gray-600 relative px-4 py-4 bg-white shadow-xl rounded-xl">
                        <div className="flex items-center">
                            <div className="select-none h-12 w-12 bg-teal-600 rounded-full flex items-center justify-center text-teal-950 text-2xl font-mono">i</div>
                            <div className="block font-semibold text-xl text-black ml-3">
                                <h2 className="text-2xl leading-tight select-none">Agregar Paciente</h2>
                                <p className="text-sm font-normal leading-tight select-none">Por favor, completa los datos del formulario.</p>
                            </div>
                        </div>
                        <div className="pt-2 pb-4">
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col mt-1 w-1/3 mx-2">
                                    <div className='flex'>
                                        <label className="text-black select-none text-lg ml-1">Nombre</label>
                                        <p className='text-red-500 ml-1 text-lg'>*</p>
                                    </div>
                                    <input
                                        type="text"
                                        className={INPUT_CLS}
                                        required
                                        name='name'
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col mt-1 w-1/3 mx-2">
                                    <div className='flex'>
                                        <label className="text-black select-none text-lg ml-1">Apellido</label>
                                        <p className='text-red-500 ml-1 text-lg'>*</p>
                                    </div>
                                    <input
                                        type="text"
                                        className={INPUT_CLS}
                                        required
                                        name='lastName'
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col mt-1 w-1/3 mx-2">
                                    <div className='flex'>
                                        <label className="text-black select-none text-lg ml-1">Género</label>
                                        <p className='text-red-500 ml-1 text-lg'>*</p>
                                    </div>
                                    <select
                                        className={INPUT_CLS}
                                        required
                                        name='gender'
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                    >
                                        <option value="" disabled>Seleccionar</option>
                                        <option value="male">Masculino</option>
                                        <option value="female">Femenino</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex flex-col mt-1 w-1/3 mx-2">
                                    <div className='flex'>
                                        <label className="text-black select-none text-lg ml-1">Nacimiento</label>
                                        <p className='text-red-500 ml-1 text-lg'>*</p>
                                    </div>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            value={date}
                                            onChange={(newDate) => setDate(newDate)}
                                            format="DD/MM/YYYY"
                                            slotProps={{
                                                textField: { size: 'small' },
                                                desktopPaper: {
                                                    sx: { backgroundColor: 'rgba(209,213,219,0.85)', backdropFilter: 'blur(4px)' }
                                                }
                                            }}
                                            className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-70 text-black"
                                        />
                                    </LocalizationProvider>
                                </div>
                                <div className="flex flex-col mt-1 w-1/3 mx-2">
                                    <div className='flex'>
                                        <label className="text-black select-none text-lg ml-1">Dni</label>
                                        <p className='text-red-500 ml-1 text-lg'>*</p>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={8}
                                        onKeyDown={(event) => {
                                            if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Tab' && event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Delete') event.preventDefault();
                                        }}
                                        className={INPUT_CLS}
                                        required
                                        name='dni'
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col mt-1 w-1/3 mx-2">
                                    <div className='flex'>
                                        <label className="text-black select-none text-lg ml-1">Núm. Teléfono</label>
                                        <p className='text-red-500 ml-1 text-lg'>*</p>
                                    </div>
                                    <PhoneInput
                                        international
                                        countryCallingCodeEditable={false}
                                        defaultCountry="AR"
                                        name='num'
                                        value={num}
                                        onChange={(value) => setNum(value || '')}
                                        className="h-10 input-phone-number px-3 py-2 w-[204px] border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-70 text-black"
                                        countries={['AR', 'UY', 'BR', 'US']}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center mt-2">
                                <div className="flex flex-col w-full mt-1 mx-2">
                                    <label className="text-black select-none text-lg ml-1">Domicilio</label>
                                    <input
                                        type="text"
                                        className={INPUT_CLS}
                                        name='address'
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col w-full mt-1 mx-2">
                                    <label className="text-black select-none text-lg ml-1">Correo Electrónico</label>
                                    <input
                                        type="text"
                                        className={INPUT_CLS}
                                        name='email'
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-start mt-2">
                                {/* OBRA SOCIAL */}
                                <div className="flex flex-col mt-1 w-1/3 mx-2">
                                    <div className='flex'>
                                        <label className="text-black select-none text-lg ml-1">Obra Social</label>
                                        <p className='text-red-500 ml-1 text-lg'>*</p>
                                    </div>
                                    <select
                                        className={INPUT_CLS}
                                        required
                                        name='obra'
                                        value={insurance}
                                        onChange={(e) => setInsurance(e.target.value)}
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
                                        onClick={() => setOpenInsuranceModal(true)}
                                        className="mt-1 ml-1 text-xs text-teal-700 hover:text-teal-500 font-semibold text-left"
                                    >
                                        + Agregar nueva
                                    </button>
                                </div>
                                {/* PLAN */}
                                <div className="flex flex-col mt-1 w-1/3 mx-2">
                                    <label className={`${insurance === 'Particular' ? 'line-through' : ''} text-black ml-1 select-none text-lg`}>Plan</label>
                                    <div className={planDisabled ? 'cursor-not-allowed' : ''}>
                                        <select
                                            className={`${INPUT_CLS} ${planDisabled ? 'pointer-events-none text-gray-400' : ''}`}
                                            name='plan'
                                            value={plan}
                                            onChange={(e) => setPlan(e.target.value)}
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
                                        onClick={() => setOpenPlanModal(true)}
                                        disabled={planDisabled}
                                        className="mt-1 ml-1 text-xs text-teal-700 hover:text-teal-500 font-semibold text-left disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        + Agregar nueva
                                    </button>
                                </div>
                                {/* NÚM. AFILIADO */}
                                <div className="flex flex-col mt-1 w-1/3 mx-2">
                                    <label className={`${insurance === 'Particular' ? 'line-through' : ''} text-black ml-1 select-none text-lg`}>Núm. Afiliado</label>
                                    <input type="text"
                                        className={`${INPUT_CLS} ${insurance === 'Particular' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        name='affiliate'
                                        value={affiliate}
                                        onChange={(e) => setAffiliate(e.target.value)}
                                        disabled={insurance === 'Particular'}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-3 flex items-center space-x-3">
                            <button type="button" onClick={HandleCloseModal} className="bg-red-900 hover:bg-red-800 font-semibold flex justify-center items-center w-full text-red-200 hover:text-white px-4 py-3 rounded-md focus:outline-none transition duration-200">CANCELAR</button>
                            <button type="submit" className="bg-teal-600 hover:bg-teal-500 font-semibold flex justify-center items-center w-full text-teal-950 hover:text-white px-4 py-3 rounded-md focus:outline-none transition duration-200">
                                {loading ? <ClipLoader color="white" size={24} /> : 'CREAR'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* MINI MODAL — NUEVA OBRA SOCIAL */}
            {openInsuranceModal && (
                <>
                    <div className={`fixed inset-0 z-[55] backdrop-blur-sm bg-black/30 transition-opacity duration-150 ${insuranceMounted ? 'opacity-100' : 'opacity-0'}`} onClick={() => { setNewInsuranceName(""); setOpenInsuranceModal(false); }} />
                    <div className="fixed inset-0 z-[60] flex items-center justify-center">
                        <div className={`w-[400px] border-4 border-gray-600 bg-white shadow-xl rounded-xl px-6 py-5 transition-all duration-150 ease-out ${insuranceMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <h2 className="text-xl font-semibold text-black mb-4">Nueva Obra Social</h2>
                            <input
                                type="text"
                                placeholder="Nombre de la obra social"
                                value={newInsuranceName}
                                onChange={(e) => setNewInsuranceName(e.target.value)}
                                className={INPUT_CLS}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInsurance(); } }}
                            />
                            <div className="flex space-x-3 mt-4">
                                <button type="button" onClick={() => { setNewInsuranceName(""); setOpenInsuranceModal(false); }} className="bg-red-900 hover:bg-red-800 font-semibold flex justify-center items-center w-full text-red-200 hover:text-white px-4 py-3 rounded-md focus:outline-none transition duration-200">CANCELAR</button>
                                <button type="button" onClick={handleAddInsurance} className="bg-teal-600 hover:bg-teal-500 font-semibold flex justify-center items-center w-full text-teal-950 hover:text-white px-4 py-3 rounded-md focus:outline-none transition duration-200">AGREGAR</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* MINI MODAL — NUEVO PLAN */}
            {openPlanModal && (
                <>
                    <div className={`fixed inset-0 z-[55] backdrop-blur-sm bg-black/30 transition-opacity duration-150 ${planMounted ? 'opacity-100' : 'opacity-0'}`} onClick={() => { setNewPlanName(""); setOpenPlanModal(false); }} />
                    <div className="fixed inset-0 z-[60] flex items-center justify-center">
                        <div className={`w-[400px] border-4 border-gray-600 bg-white shadow-xl rounded-xl px-6 py-5 transition-all duration-150 ease-out ${planMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                            <h2 className="text-xl font-semibold text-black mb-4">Nuevo Plan <span className="text-gray-500 font-normal">({insurance})</span></h2>
                            <input
                                type="text"
                                placeholder="Nombre del plan"
                                value={newPlanName}
                                onChange={(e) => setNewPlanName(e.target.value)}
                                className={INPUT_CLS}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPlan(); } }}
                            />
                            <div className="flex space-x-3 mt-4">
                                <button type="button" onClick={() => { setNewPlanName(""); setOpenPlanModal(false); }} className="bg-red-900 hover:bg-red-800 font-semibold flex justify-center items-center w-full text-red-200 hover:text-white px-4 py-3 rounded-md focus:outline-none transition duration-200">CANCELAR</button>
                                <button type="button" onClick={handleAddPlan} className="bg-teal-600 hover:bg-teal-500 font-semibold flex justify-center items-center w-full text-teal-950 hover:text-white px-4 py-3 rounded-md focus:outline-none transition duration-200">AGREGAR</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
