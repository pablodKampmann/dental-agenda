import React, { useState, useEffect } from 'react';
import { GetObrasSociales } from "./../components/getObras";
import { SetPatients } from "./../components/setPatients";
import PhoneInput, { formatPhoneNumberIntl } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'

interface ModalSettProps {
    onCloseModal: () => void;
    onSuccess: () => void;
}

export function ModalCreatePatient({ onCloseModal, onSuccess }: ModalSettProps) {
    const [obrasOptions, setObrasOptions] = useState<null | any[]>(null);
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gender, setGender] = useState("");
    const [date, setDate] = useState("");
    const [dni, setDni] = useState("");
    const [num, setNum] = useState("");
    const [address, setAddress] = useState("");
    const [obra, setObra] = useState("");
    const [plan, setPlan] = useState("");
    const [affiliate, setAffiliate] = useState("");


    useEffect(() => {
        async function Get() {
            const options = await GetObrasSociales();
            setObrasOptions(options);
        }
        Get()
    }, [])

    async function HandleSubmit(e: any) {
        e.preventDefault();
        const newNum = formatPhoneNumberIntl(num);
        await SetPatients(name, lastName, gender, date, dni, newNum, address, obra, plan, affiliate);
        onCloseModal();
        onSuccess();
    }

    function HandleCloseModal() {
        onCloseModal();
    }

    return (
        <div className="fixed inset-0 z-50 bg-black backdrop-blur-sm bg-opacity-10 backdrop-filter flex items-center justify-center">
            <form onSubmit={HandleSubmit} className="relative py-2 sm:max-w-lg sm:mx-auto">
                <div className="border border-2 border-blue-900 relative px-4 py-6 bg-gray-600 mx-4 md:mx-0 shadow rounded-xl sm:p-6 max-w-lg mx-auto">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-yellow-200 rounded-full flex items-center justify-center text-yellow-500 text-xl font-mono">i</div>
                        <div className="block font-semibold text-xl text-white">
                            <h2 className="leading-tight">Agregar Paciente</h2>
                            <p className="text-sm text-gray-200 font-normal leading-tight">Por favor, completa los datos del formulario.</p>
                        </div>
                    </div>
                    <div className="py-6 text-base leading-6 space-y-3 text-gray-white sm:text-lg sm:leading-7">
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col flex-1">
                                <label className="leading-loose">Nombre</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='name'
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col flex-1">
                                <label className="leading-loose">Apellido</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='lastName'
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col flex-2">
                                <label className="leading-loose">Género</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <select
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
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
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col" style={{ width: '110px' }}>
                                <label className="leading-loose">Nacimiento</label>
                                <style>
                                    {`input[type="date"]::-webkit-inner-spin-button,input[type="date"]::-webkit-calendar-picker-indicator {display: none; -webkit-appearance: none; }   `}
                                </style>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input
                                        type="date"
                                        className="px-2.5 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='date'
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col" style={{ width: '105px' }}>
                                <label className="leading-loose">Dni</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input
                                        type="text"
                                        maxLength={8}
                                        onKeyPress={(event) => {
                                            if (!/[0-9]/.test(event.key)) {
                                                event.preventDefault();
                                            }
                                        }}
                                        style={{ padding: '9px 15px' }}
                                        className="px-3 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='dni'
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col" style={{ width: '220px' }}>
                                <label className="leading-loose">Telefono</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <PhoneInput
                                        international
                                        countryCallingCodeEditable={false}
                                        defaultCountry="AR"
                                        name='num'
                                        value={num}
                                        onChange={(value) => setNum(value || '')}
                                        className="px-3 border focus:ring-gray-500 focus:border-gray-500 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600 bg-white"
                                        style={{ padding: '9px 15px' }}
                                        required
                                        countries={['AR', 'UY', 'BR', 'US']}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col w-full">
                                <label className="leading-loose">Domicilio</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input
                                        type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='address'
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col flex-1">
                                <label className="leading-loose">Obra Social</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    {obrasOptions ? (
                                        <select
                                            className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                            required
                                            name='obra'
                                            value={obra}
                                            onChange={(e) => setObra(e.target.value)}
                                        >
                                            <option value="" disabled>
                                                Seleccionar
                                            </option>
                                            {obrasOptions.map((obra, index) => (
                                                <option key={index} value={obra}>
                                                    {obra}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select
                                            className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                            required
                                        >
                                            <option value="" disabled selected>
                                                Seleccionar
                                            </option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col flex-1">
                                <label className="leading-loose">Plan</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='plan'
                                        value={plan}
                                        onChange={(e) => setPlan(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col flex-1">
                                <label className="leading-loose">N. Afiliado</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='affiliate'
                                        value={affiliate}
                                        onChange={(e) => setAffiliate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-3 flex items-center space-x-3">
                        <button type="button" onClick={HandleCloseModal} className="bg-red-900 hover:bg-red-800 font-semibold flex justify-center items-center w-full text-white px-4 py-3 rounded-md focus:outline-none">CANCELAR</button>
                        <button type="submit" className="bg-blue-800 hover:bg-blue-500 font-semibold flex justify-center items-center w-full text-white px-4 py-3 rounded-md focus:outline-none">CREAR</button>
                    </div>
                </div>
            </form>
        </div>
    );
}
