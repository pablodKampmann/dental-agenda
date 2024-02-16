import React, { useState, useEffect } from 'react';
import { getInsuranceOptions } from "./getInsuranceOpt";
import { SetPatients } from "./../components/setPatients";
import PhoneInput, { formatPhoneNumberIntl } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from 'dayjs';
import { ClipLoader } from "react-spinners";

interface ModalSettProps {
    onCloseModal: () => void;
    onSuccess: () => void;
}

export function ModalCreatePatient({ onCloseModal, onSuccess }: ModalSettProps) {
    const [insuranceOptions, setInsuranceOptions] = useState<null | any[]>(null);
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

    useEffect(() => {
        async function Get() {
            const options = await getInsuranceOptions();
            setInsuranceOptions(options);
        }
        Get()
    }, [])

    async function HandleSubmit(e: any) {
        e.preventDefault();
        setLoading(true);
        const formattedDate = dayjs(date.$d);
        const formattedDateString = formattedDate.format('DD/MM/YYYY');
        const newNum = formatPhoneNumberIntl(num);
        const result = await SetPatients(name, lastName, gender, formattedDateString, dni, newNum, address, email, insurance, plan, affiliate);
        if (result !== 'error') {
            onCloseModal();
            onSuccess();
        }
    }

    function HandleCloseModal() {
        onCloseModal();
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center mt-12">
            <form onSubmit={HandleSubmit} className="relative py-2 w-[700px] ">
                <div className="w-full border-4 border-gray-600 relative px-4 py-4 bg-white shadow-xl rounded-xl ">
                    <div className="flex items-center space-x-3">
                        <div className="select-none h-12 w-12 bg-teal-600 rounded-full flex items-center justify-center text-teal-950 text-2xl font-mono">i</div>
                        <div className="block font-semibold text-xl text-black">
                            <h2 className="text-2xl leading-tight select-none">Agregar Paciente</h2>
                            <p className="text-sm  font-normal leading-tight select-none">Por favor, completa los datos del formulario.</p>
                        </div>
                    </div>
                    <div className="pt-2 pb-4">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col mt-1 w-1/3 mx-2">
                                <label className="text-black select-none text-lg ml-1">Nombre</label>
                                <div className="relative text-gray-400 ">
                                    <input
                                        type="text"
                                        className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                        required
                                        name='name'
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col mt-1 w-1/3 mx-2">
                                <label className="text-black select-none text-lg ml-1">Apellido</label>
                                <div className="relative text-gray-400 ">
                                    <input
                                        type="text"
                                        className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                        required
                                        name='lastName'
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col mt-1 w-1/3 mx-2">
                                <label className="text-black select-none text-lg ml-1">Género</label>
                                <div className="relative text-gray-400 ">
                                    <select
                                        className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                        required
                                        name='gender'
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                    >
                                        <option value="" disabled selected>
                                            Seleccionar
                                        </option>
                                        <option value="male">Masculino</option>
                                        <option value="female">Femenino</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <div className="flex flex-col mt-1 w-1/3 mx-2">
                                <label className="text-black select-none text-lg ml-1">Nacimiento</label>
                                <div className="relative text-gray-400">
                                    <LocalizationProvider dateAdapter={AdapterDayjs} >
                                        <DatePicker value={date} onChange={(newDate) => setDate(newDate)} format="DD/MM/YYYY" slotProps={{ textField: { size: 'small' } }}
                                            className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black" />
                                    </LocalizationProvider>
                                </div>
                            </div>
                            <div className="flex flex-col mt-1 w-1/3 mx-2">
                                <label className="text-black select-none text-lg ml-1">DNI</label>
                                <div className="relative text-gray-400">
                                    <input
                                        type="text"
                                        maxLength={8}
                                        onKeyPress={(event) => {
                                            if (!/[0-9]/.test(event.key)) {
                                                event.preventDefault();
                                            }
                                        }}
                                        className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                        required
                                        name='dni'
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col mt-1 w-1/3 mx-2">
                                <label className="text-black select-none text-lg ml-1">Núm. Teléfono</label>
                                <div className="relative text-gray-400">
                                    <PhoneInput
                                        international
                                        countryCallingCodeEditable={false}
                                        defaultCountry="AR"
                                        name='num'
                                        value={num}
                                        onChange={(value) => setNum(value || '')}
                                        className="h-10 input-phone-number px-3 py-2 w-[204px] border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                        textInputProps={{ placeholderTextColor: "red" }}
                                        countries={['AR', 'UY', 'BR', 'US']}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center mt-2 ">
                            <div className="flex flex-col w-full mt-1 mx-2">
                                <label className="text-black select-none text-lg ">Domicilio</label>
                                <div className="relative text-gray-400">
                                    <input
                                        type="text"
                                        className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                        name='address'
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col w-full mt-1 mx-2">
                                <label className="text-black select-none text-lg">Correo Electrónico</label>
                                <div className="relative text-gray-400">
                                    <input
                                        type="text"
                                        className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                        name='email'
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <div className="flex flex-col mt-1 w-1/3 mx-2">
                                <label className="text-black select-none text-lg">Obra Social</label>
                                <div className="relative text-gray-400">
                                    {insuranceOptions ? (
                                        <select
                                            className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                            required
                                            name='obra'
                                            value={insurance}
                                            onChange={(e) => setInsurance(e.target.value)}
                                        >
                                            <option value="" disabled>
                                                Seleccionar
                                            </option>
                                            {insuranceOptions.map((insurance, index) => (
                                                <option key={index} value={insurance}>
                                                    {insurance}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select
                                            className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                            required
                                        >
                                            <option value="" disabled selected>
                                                Seleccionar
                                            </option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col mt-1 w-1/3 mx-2">
                                <label className={`${insurance === 'Particular' ? 'line-through' : ''} text-black select-none text-lg`}>Plan</label>
                                <div className="relative text-gray-400">
                                    <input type="text"
                                        className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                        name='plan'
                                        value={plan}
                                        onChange={(e) => setPlan(e.target.value)}
                                        disabled={insurance === 'Particular'}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col mt-1 w-1/3 mx-2">
                                <label className={`${insurance === 'Particular' ? 'line-through' : ''} text-black select-none text-lg`}>Núm. Afiliado</label>
                                <div className="relative text-gray-400">
                                    <input type="text"
                                        className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                        name='affiliate'
                                        value={affiliate}
                                        onChange={(e) => setAffiliate(e.target.value)}
                                        disabled={insurance === 'Particular'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-3 flex items-center space-x-3">
                        <button type="button" onClick={HandleCloseModal} className="bg-red-900 hover:bg-red-800 font-semibold flex justify-center items-center w-full text-red-200 hover:text-white px-4 py-3 rounded-md focus:outline-none transition duration-200">CANCELAR</button>
                        <button type="submit" className="bg-teal-600 hover:bg-teal-500 font-semibold flex justify-center items-center w-full text-teal-950 hover:text-white px-4 py-3 rounded-md focus:outline-none transition duration-200">
                            {loading ? (
                                <div className='flex justify-center items-center '>
                                    <ClipLoader className='' color="white" size={24} />
                                </div>
                            ) : (
                                'CREAR'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
