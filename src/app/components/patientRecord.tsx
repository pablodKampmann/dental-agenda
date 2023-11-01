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
import { PulseLoader, GridLoader } from "react-spinners";
import { usePathname } from 'next/navigation'
interface ModalSettProps {
    patient: any | null;
}

export function PatientRecord({ patient }: ModalSettProps) {
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [initialContent, setInitialContent] = useState<string | null>(null);
    const [observationsContent, setObservationsContent] = useState('');
    const [saveButton, setSaveButton] = useState(false);
    const [load, setLoad] = useState(false);
    const [loadObservations, setLoadObservations] = useState(true);
    const [showCancel, setShowCancel] = useState(false);
    const pathname = usePathname()

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
        switch (true) {
            case pathname.includes("clinicHistory"):
                setSelectedField('clinicHistory')
                break;
            case pathname.includes("billing"):
                setSelectedField('billing')
                break;
            case pathname.includes("odontogram"):
                setSelectedField('odontogram')
                break;
            case pathname.includes("rx"):
                setSelectedField('rx')
                break;
            case pathname.includes("recipes"):
                setSelectedField('recipes')
                break;
            case pathname.includes("consents"):
                setSelectedField('consents')
                break;
            default:
                setSelectedField('modify')
                break;
        }
    }, [pathname]);

    useEffect(() => {
        async function get() {
            const result = await getObservations(patient.id)
            setObservationsContent(result);
            setInitialContent(result);
            setTimeout(() => {
                setLoadObservations(false);

            }, 1500);
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

    async function handleKeyPress(event: any) {
        if (event.key === 'Enter') {
            await handleSetObservations();
        } else if (event.key === 'Escape') {
            console.log("esc");
        }
    }

    return (
        <div className='flex-col mt-2'>
            <div className='border-4 rounded-3xl border-gray-600 bg-gray-400 bg-opacity-30 shadow-lg'>
                <div className='flex mb-2'>
                    <PiIdentificationBadgeDuotone className="text-gray-600 mt-2" size={120} />
                    <div className='flex-col mt-4'>
                        <div className='flex justify-start items-center'>
                            <div className='bg-teal-600 rounded-full w-8 h-8 flex items-center justify-center'>
                                <p className='font-bold text-lg text-teal-900'>{patient.id}</p>
                            </div>
                            <h1 className='ml-2 text-3xl font-bold text-teal-600'>{patient.name} {patient.lastName}</h1>
                            <p className='ml-2 mt-1 text-md text-black'>Edad: {getAge(patient.birthDate)},</p>
                            {patient.gender === 'male' ? (
                                <p className='ml-2 mt-1 text-md text-black'>Género: Hombre</p>
                            ) : (
                                <p className='ml-2 mt-1 text-md text-black'>Género: Mujer</p>
                            )}
                        </div>
                        <div className='mt-2 flex justify-start items-center'>
                            <LiaIdCardSolid size={26} className='shadow-2xl text-green-600' />
                            <p className='ml-1 text-sm text-black'>{patient.dni}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <TbPhone size={20} className='ml-2 shadow-2xl text-yellow-500' />
                            <p className='ml-1 text-sm text-black'>{patient.num}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <MdLocationPin size={20} className='ml-2 shadow-2xl text-red-600' />
                            <p className='ml-1 text-sm text-black'>{patient.address}</p>
                        </div>
                        <div className='mt-2 flex justify-start items-center'>
                            <FaHandHoldingMedical size={20} className='shadow-2xl text-blue-500' />
                            <p className='ml-2 text-sm text-black'>{patient.obra}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <FaFileMedical size={20} className='ml-2 shadow-2xl text-pink-500' />
                            <p className='ml-1 text-sm text-black'>{patient.plan}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <AiOutlineFieldNumber size={28} className='ml-2 shadow-2xl text-purple-400' />
                            <p className='ml-1 text-sm text-black'>{patient.affiliateNum}</p>
                        </div>
                    </div>
                    <div className='flex ml-auto'>
                        {loadObservations ? (
                            <div className='flex items-center mr-16 mt-2'>
                                <GridLoader color='teal' />
                            </div>
                        ) : (
                            <div className='flex mr-3 mt-3 mb-1 justify-between'>
                                <div>
                                    <div className='flex justify-center mr-2 border-black border-b-2 border-t-2 rounded-md px-1 py-0.5 h-fit mt-3.5'>
                                        <AiFillEdit className="mt-0.5 text-black" size={18} />
                                        <h1 className='ml-1 select-none text-sm text-black font-medium'>OBSERVACIONES:</h1>
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
                                            {showCancel ? (
                                                <button onClick={() => setShowCancel(false)} className='select-none p-2 rounded-xl text-teal-900 text-medium hover:scale-110 transition duration-150 font-medium bg-gradient-to-r from-teal-100 via-teal-500 to-teal-100 background-animate'>Cancelar</button>
                                            ) : (
                                                <button disabled className='select-none p-2 rounded-xl text-white text-medium bg-gray-500 bg-opacity-40 text-opacity-10 font-medium'>Guardar Cambios</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <textarea onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault(); 
                                    }; handleKeyPress(event);
                                }} value={observationsContent} onBlur={() => setShowCancel(false)} onFocus={() => setShowCancel(true)} onChange={(e) => setObservationsContent(e.target.value)} placeholder='Vacío' className='resize-none bg-teal-700 text-black bg-opacity-70 p-1 cursor-default border-gray-600 border-2 w-68 h-full rounded-xl focus:outline-none focus:border-teal-100 focus:border-dashed text-sm'></textarea>
                            </div>
                        )}
                        <div className='flex-col mt-2'>
                            <BsWhatsapp className="text-gray-600 ml-auto mr-10 mt-2" size={70} />
                            <h1 className='bg-teal-600 font-medium text-black hover:scale-110 rounded-lg px-1 py-0.5 mt-2 mr-6 select-none cursor-pointer transition duration-150'>CONTACTAR</h1>
                        </div>
                    </div>
                </div>
            </div>
            <div className='flex justify-center items-center mb-2'>
                <Link prefetch={true} href={`/patients/${patient.id}/`}>
                    <button onClick={() => setSelectedField('modify')} className={`${selectedField === 'modify' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-gray-400 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg ml-4 border-b-2 border-x-2 focus:outline-none border-gray-600 text-md font-semibold rounded-bl-lg transition duration-300 px-3 select-none`}>Modif. Datos</button>
                </Link>
                <Link prefetch={true} href={`/patients/${patient.id}/clinicHistory`}>
                    <button onClick={() => setSelectedField('clinicHistory')} className={`${selectedField === 'clinicHistory' ? 'bg-teal-600 border-gray-200' : 'bg-gray-400 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black  '} shadow-lg border-x-2 border-b-2 py-1 focus:outline-none border-gray-600 text-md font-semibold transition duration-300 px-3 select-none`}>Historia Clinica</button>
                </Link>
                <Link prefetch={true} href={`/patients/${patient.id}/billing`}>
                    <button onClick={() => setSelectedField('billing')} className={`${selectedField === 'billing' ? 'bg-teal-600 border-gray-200' : 'bg-gray-400 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} shadow-lg border-x-2 py-1 border-b-2 focus:outline-none border-gray-600 text-md font-semibold transition duration-300 px-3 select-none`}>Facturación</button>
                </Link>
                <Link prefetch={true} href={`/patients/${patient.id}/odontogram`}>
                    <button onClick={() => setSelectedField('odontogram')} className={`${selectedField === 'odontogram' ? 'bg-teal-600 border-gray-200 ' : 'bg-gray-400 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black'} shadow-lg py-1 border-b-2 border-x-2 focus:outline-none border-gray-600 text-md font-semibold transition duration-300 px-3 select-none`}>Odontograma</button>
                </Link>
                <Link prefetch={true} href={`/patients/${patient.id}/rx`}>
                    <button onClick={() => setSelectedField('rx')} className={`${selectedField === 'rx' ? 'bg-teal-600 border-gray-200 ' : 'bg-gray-400 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} shadow-lg py-1 border-x-2 border-b-2 focus:outline-none border-gray-600  text-md font-semibold transition duration-300 px-3 select-none`}>Rx y Doc.</button>
                </Link>
                <Link prefetch={true} href={`/patients/${patient.id}/recipes`}>
                    <button onClick={() => setSelectedField('recipes')} className={`${selectedField === 'recipes' ? 'bg-teal-600 border-gray-200 ' : 'bg-gray-400 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} shadow-lg py-1 border-b-2 border-x-2 focus:outline-none border-gray-600  text-md font-semibold transition duration-300 px-3 select-none`}>Recetas</button>
                </Link>
                <Link prefetch={true} href={`/patients/${patient.id}/consents`}>
                    <button onClick={() => setSelectedField('consents')} className={`${selectedField === 'consents' ? 'bg-teal-600 border-gray-200 ' : 'bg-gray-400 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} shadow-lg py-1 border-b-2 border-x-2 focus:outline-none border-gray-600 text-md font-semibold rounded-br-lg transition duration-300 px-3 select-none`}>Consentimientos</button>
                </Link>
            </div>
        </div >
    );
}
