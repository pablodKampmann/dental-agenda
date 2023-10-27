import Link from 'next/link'
import React, { useState, useEffect } from 'react';
import { PiIdentificationBadgeDuotone } from 'react-icons/pi';
import { TbPhone } from 'react-icons/tb';
import { MdLocationPin } from 'react-icons/md';
import { LiaIdCardSolid } from 'react-icons/lia';
import { FaHandHoldingMedical, FaFileMedical } from 'react-icons/fa';
import { AiOutlineFieldNumber } from 'react-icons/ai';
import { BsWhatsapp } from 'react-icons/bs';
interface ModalSettProps {
    patient: any | null;
}

export function PatientRecord({ patient }: ModalSettProps) {
    const [selectedField, setSelectedField] = useState('basic');

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

    return (
        <div className='flex-col mt-2'>
            <div className='border-4 rounded-3xl border-teal-500 bg-gray-500 opacity-95 shadow-md '>
                <div className='flex'>
                    <PiIdentificationBadgeDuotone className="text-teal-500" size={120} />
                    <div className='flex-col mt-2'>
                        <div className='flex justify-start items-center'>
                            <div className='ml-2 bg-teal-500 rounded-full w-8 h-8 flex items-center justify-center'>
                                <p className='font-bold text-lg text-teal-800'>{patient.id}</p>
                            </div>
                            <h1 className='ml-2 text-3xl font-bold text-teal-500'>{patient.name} {patient.lastName}</h1>
                            <p className='ml-2 mt-1 text-md'>Edad: {getAge(patient.birthDate)},</p>
                            {patient.gender === 'male' ? (
                                <p className='ml-2 mt-1 text-md'>Género: Hombre</p>
                            ) : (
                                <p className='l-2 mt-1 text-md'>Género: Mujer</p>
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
                    <div className='flex-col ml-auto mr-2 border-2 mt-2 mb-2 w-60 rounded-md relative'>
                        <h1 className='ml-1 '>Observaciones:</h1>
                        <input type="text" className=' bg-transparent border-teal-500 border-2 w-full h-20 rounded-md focus:outline-none focus:border-teal-300' />
                    </div>
                    <div className='flex-col ml-auto mr-2'>
                        <BsWhatsapp className="text-teal-500 ml-auto mr-10 mt-2" size={70} />
                        <h1 className='bg-teal-500 font-medium hover:text-teal-900 hover:scale-110 rounded-lg px-1 py-0.5 mt-2 mr-6 select-none cursor-pointer transition duration-150'>CONTACTAR</h1>
                    </div>
                </div>

            </div>
            <div className='flex justify-center items-center mb-2 '>
                <button onClick={() => setSelectedField('basic')} className={`${selectedField === 'basic' ? 'bg-teal-500 border-teal-200 text-teal-900' : 'bg-gray-500 hover:bg-teal-900 text-white'} py-1 shadow-lg ml-4  border-x-2 focus:outline-none border-teal-500 text-md font-semibold rounded-bl-lg transition duration-300 px-3`}>Modif. Datos</button>
                <button onClick={() => setSelectedField('history')} className={`${selectedField === 'history' ? 'bg-teal-500 border-teal-200' : 'bg-gray-500 hover:bg-teal-900'}  shadow-lg border-x-2 py-1 focus:outline-none border-teal-500 text-white text-md font-semibold transition duration-300 px-3`}>Historia Clinica</button>
                <button onClick={() => setSelectedField('billing')} className={`${selectedField === 'billing' ? 'bg-teal-500 border-teal-200' : 'bg-gray-500 hover:bg-teal-900'}  shadow-lg border-x-2 py-1  focus:outline-none border-teal-500 text-white text-md font-semibold transition duration-300 px-3`}>Facturación</button>
                <Link prefetch={true} href={`/patients/${patient.id}/odontogram`}>
                    <button onClick={() => setSelectedField('odontogram')} className={`${selectedField === 'odontogram' ? 'bg-teal-500 border-teal-200 ' : 'bg-gray-500 hover:bg-teal-900'} shadow-lg py-1 border-x-2 focus:outline-none border-teal-500 text-white text-md font-semibold transition duration-300 px-3`}>Odontograma</button>
                </Link>
                <button onClick={() => setSelectedField('odontogram')} className={`${selectedField === 'odontogram' ? 'bg-teal-500 border-teal-200 ' : 'bg-gray-500 hover:bg-teal-900'} shadow-lg py-1 border-x-2 focus:outline-none border-teal-500 text-white text-md font-semibold transition duration-300 px-3`}>Rx y Doc.</button>
                <button onClick={() => setSelectedField('odontogram')} className={`${selectedField === 'odontogram' ? 'bg-teal-500 border-teal-200 ' : 'bg-gray-500 hover:bg-teal-900'} shadow-lg py-1 border-x-2 focus:outline-none border-teal-500 text-white text-md font-semibold transition duration-300 px-3`}>Recetas</button>
                <button onClick={() => setSelectedField('odontogram')} className={`${selectedField === 'odontogram' ? 'bg-teal-500 border-teal-200 ' : 'bg-gray-500 hover:bg-teal-900'} shadow-lg py-1 border-x-2 focus:outline-none border-teal-500 text-white text-md font-semibold rounded-br-lg transition duration-300 px-3`}>Consentimientos</button>
            </div>
        </div>
    );
}
