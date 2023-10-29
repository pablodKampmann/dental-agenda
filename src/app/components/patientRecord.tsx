import Link from 'next/link'
import React, { useState, useEffect } from 'react';
import { PiIdentificationBadgeDuotone } from 'react-icons/pi';
import { TbPhone } from 'react-icons/tb';
import { MdLocationPin } from 'react-icons/md';
import { LiaIdCardSolid } from 'react-icons/lia';
import { FaHandHoldingMedical, FaFileMedical } from 'react-icons/fa';
import { AiOutlineFieldNumber, AiFillEdit } from 'react-icons/ai';
import { BsWhatsapp } from 'react-icons/bs';
import { setObservations } from "./../components/setObservations";
import { getObservations } from "./../components/getObservations";
import { PulseLoader } from "react-spinners";
interface ModalSettProps {
    patient: any | null;
}

export function PatientRecord({ patient }: ModalSettProps) {
    const [selectedField, setSelectedField] = useState('modify');
    const [initialContent, setInitialContent] = useState<string | null>(null);
    const [observationsContent, setObservationsContent] = useState('');
    const [saveButton, setSaveButton] = useState(false);
    const [load, setLoad] = useState(false);

    function getAge(date: Date) {
        var today = new Date();
        var birthDate = new Date(date);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    useEffect(() => {
        async function get() {
            const result = await getObservations(patient.id)
            setObservationsContent(result);
            setInitialContent(result);
        }

        get();
    }, []);

    useEffect(() => {
        if (initialContent === observationsContent) {
            setSaveButton(false);
        } else {
            setSaveButton(true);
        }
    }, [observationsContent]);

    async function handleSetObservations() {
        setLoad(true);
        await setObservations(patient.id, observationsContent);
        setInitialContent(observationsContent);
        setTimeout(() => {
            setSaveButton(false);
            setLoad(false);
        }, 1000);
    }

    return (
        <div className='flex-col mt-2'>
            <div className='border-4 rounded-3xl border-teal-500 bg-teal-950 opacity-95 shadow-md'>
                <div className='flex mb-2'>
                    <PiIdentificationBadgeDuotone className="text-teal-500 mt-2" size={120} />
                    <div className='flex-col mt-4'>
                        <div className='flex justify-start items-center'>
                            <div className='ml-2 bg-teal-500 rounded-full w-8 h-8 flex items-center justify-center'>
                                <p className='font-bold text-lg text-teal-800'>{patient.id}</p>
                            </div>
                            <h1 className='ml-2 text-3xl font-bold text-teal-500'>{patient.name} {patient.lastName}</h1>
                            <p className='ml-2 mt-1 text-md'>Edad: {getAge(patient.birthDate)},</p>
                            {patient.gender === 'male' ? (
                                <p className='ml-2 mt-1 text-md'>Género: Hombre</p>
                            ) : (
                                <p className='ml-2 mt-1 text-md'>Género: Mujer</p>
                            )}
                        </div>
                        <div className='ml-4 mt-2 flex justify-start items-center'>
                            <LiaIdCardSolid size={26} className='shadow-2xl text-green-600' />
                            <p className='ml-1 text-sm'>{patient.dni}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <TbPhone size={20} className='ml-2 shadow-2xl text-yellow-500' />
                            <p className='ml-1 text-sm'>{patient.num}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <MdLocationPin size={20} className='ml-2 shadow-2xl text-red-600' />
                            <p className='ml-1 text-sm'>{patient.address}</p>
                        </div>
                        <div className='ml-4 mt-2 flex justify-start items-center'>
                            <FaHandHoldingMedical size={20} className='shadow-2xl text-blue-500' />
                            <p className='ml-2 text-sm'>{patient.obra}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <FaFileMedical size={20} className='ml-2 shadow-2xl text-pink-500' />
                            <p className='ml-1 text-sm'>{patient.plan}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <AiOutlineFieldNumber size={28} className='ml-2 shadow-2xl text-purple-400' />
                            <p className='ml-1 text-sm'>{patient.affiliateNum}</p>
                        </div>
                    </div>
                    <div className='flex ml-auto'>
                        <div className='flex mr-6 mt-3 mb-1 justify-between'>
                            <div>
                                <div className='flex justify-center mr-2 bg-teal-500 rounded-md px-1 py-0.5 h-fit mt-0.5'>
                                    <AiFillEdit className="mt-0.5 text-teal-950" size={18} />
                                    <h1 className='ml-1 select-none text-sm text-teal-950 font-medium'>OBSERVACIONES:</h1>
                                </div>
                                {saveButton ? (
                                    <div className='flex justify-center items-center mt-4 mr-1.5'>
                                        <button onClick={handleSetObservations} className='select-none p-2 rounded-xl text-teal-900 text-medium hover:scale-110 transition duration-150 font-medium bg-gradient-to-r from-teal-100 via-teal-500 to-teal-100 background-animate'>
                                            {load ? (
                                                <div className='flex justify-center items-center py-0.5 px-1'>
                                                    <PulseLoader size={14} color='white' />
                                                </div>
                                            ) : (
                                                "Guardar Cambios"
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className='flex justify-center items-center mt-4 mr-1.5'>
                                        <button disabled className='select-none p-2 rounded-xl text-white text-medium bg-gray-500 bg-opacity-40 text-opacity-10 font-medium'>Guardar Cambios</button>
                                    </div>
                                )}
                            </div>
                            <textarea value={observationsContent} onChange={(e) => setObservationsContent(e.target.value)} placeholder='Vacío' className='resize-none bg-transparent p-1 border-teal-500 border-2 w-68 h-full rounded-md focus:outline-none focus:border-teal-100 focus:border-dashed text-sm'></textarea>
                        </div>
                        <div className='flex-col mt-2'>
                            <BsWhatsapp className="text-teal-500 ml-auto mr-10 mt-2" size={70} />
                            <h1 className='bg-teal-500 font-medium hover:text-teal-900 hover:scale-110 rounded-lg px-1 py-0.5 mt-2 mr-6 select-none cursor-pointer transition duration-150'>CONTACTAR</h1>
                        </div>
                    </div>
                </div>
            </div>
            <div className='flex justify-center items-center mb-2 '>
                <button onClick={() => setSelectedField('modify')} className={`${selectedField === 'modify' ? 'bg-teal-500 border-teal-200 text-teal-900' : 'bg-gray-500 hover:bg-teal-900 text-white'} py-1 shadow-lg ml-4  border-x-2 focus:outline-none border-teal-500 text-md font-semibold rounded-bl-lg transition duration-300 px-3 select-none`}>Modif. Datos</button>
                <button onClick={() => setSelectedField('history')} className={`${selectedField === 'history' ? 'bg-teal-500 border-teal-200' : 'bg-gray-500 hover:bg-teal-900'}  shadow-lg border-x-2 py-1 focus:outline-none border-teal-500 text-white text-md font-semibold transition duration-300 px-3 select-none`}>Historia Clinica</button>
                <button onClick={() => setSelectedField('billing')} className={`${selectedField === 'billing' ? 'bg-teal-500 border-teal-200' : 'bg-gray-500 hover:bg-teal-900'}  shadow-lg border-x-2 py-1  focus:outline-none border-teal-500 text-white text-md font-semibold transition duration-300 px-3 select-none`}>Facturación</button>
                <Link prefetch={true} href={`/patients/${patient.id}/odontogram`}>
                    <button onClick={() => setSelectedField('odontogram')} className={`${selectedField === 'odontogram' ? 'bg-teal-500 border-teal-200 ' : 'bg-gray-500 hover:bg-teal-900'} shadow-lg py-1 border-x-2 focus:outline-none border-teal-500 text-white text-md font-semibold transition duration-300 px-3 select-none`}>Odontograma</button>
                </Link>
                <button onClick={() => setSelectedField('rx')} className={`${selectedField === 'rx' ? 'bg-teal-500 border-teal-200 ' : 'bg-gray-500 hover:bg-teal-900'} shadow-lg py-1 border-x-2 focus:outline-none border-teal-500 text-white text-md font-semibold transition duration-300 px-3 select-none`}>Rx y Doc.</button>
                <button onClick={() => setSelectedField('recipes')} className={`${selectedField === 'recipes' ? 'bg-teal-500 border-teal-200 ' : 'bg-gray-500 hover:bg-teal-900'} shadow-lg py-1 border-x-2 focus:outline-none border-teal-500 text-white text-md font-semibold transition duration-300 px-3 select-none`}>Recetas</button>
                <button onClick={() => setSelectedField('consents')} className={`${selectedField === 'consents' ? 'bg-teal-500 border-teal-200 ' : 'bg-gray-500 hover:bg-teal-900'} shadow-lg py-1 border-x-2 focus:outline-none border-teal-500 text-white text-md font-semibold rounded-br-lg transition duration-300 px-3 select-none`}>Consentimientos</button>
            </div>
        </div >
    );
}
