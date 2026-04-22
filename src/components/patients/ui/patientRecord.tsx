import Link from 'next/link'
import React, { useState, useEffect } from 'react';
import { TbPhone } from 'react-icons/tb';
import { MdLocationPin, MdOutlineMailOutline } from 'react-icons/md';
import { LiaIdCardSolid } from 'react-icons/lia';
import { HiMiniPencilSquare } from 'react-icons/hi2';
import { usePathname } from 'next/navigation'
import { FaMale, FaFemale } from "react-icons/fa";
import { HiOutlineIdentification } from "react-icons/hi";

interface ModalSettProps {
    patient: any | null;
}

export function PatientRecord({ patient }: ModalSettProps) {
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const pathname = usePathname()

    function getAge(date: any) {
        var today = new Date();
        var parts = date.split("/");
        var birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
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

    return (
        <div className='flex-col mt-2'>
            <div className='flex justify-center px-1 items-center border-2 rounded-lg border-gray-600 bg-gray-300 bg-opacity-30 shadow-lg'>
                <HiOutlineIdentification className="text-teal-600 mr-1" size={110} />
                <div className="flex">
                    <div className="flex-col">
                        <div className='flex justify-start items-center'>
                            <div className='bg-teal-600 rounded-full w-6 h-6 flex items-center justify-center'>
                                <p className='font-bold text-sm text-teal-950'>{patient.id}</p>
                            </div>
                            <h1 className='ml-2 text-2xl font-bold text-teal-600'>{patient.name} {patient.lastName}</h1>
                            <p className='ml-2 mt-1.5 text-sm text-black'>Edad: {getAge(patient.birthDate)},</p>
                            {patient.gender === 'male' ? (
                                <FaMale className="text-black" size={22} />
                            ) : (
                                <FaFemale className="text-black" size={22} />
                            )}
                        </div>
                        <div className='mt-1 flex justify-start items-center text-sm'>
                            <LiaIdCardSolid size={26} className=' text-green-600' />
                            <p className='ml-1 text-black'>{patient.dni}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-600 h-6' />
                            <MdLocationPin size={20} className='ml-2  text-red-600' />
                            {patient.address ? (
                                <p className='ml-1 text-black'>{patient.address}</p>
                            ) : (
                                <p className='ml-1 text-black'>-</p>
                            )}
                        </div>
                        <div className='mt-1 flex justify-start items-center'>
                            <TbPhone size={20} className='  text-yellow-500' />
                            <p className='ml-1 text-sm text-black'>{patient.num}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-600 h-6' />
                            <MdOutlineMailOutline size={20} className='ml-2  text-blue-500' />
                            {patient.email ? (
                                <p className='ml-1 text-sm text-black'>{patient.email}</p>
                            ) : (
                                <p className='ml-1 text-black'>-</p>
                            )}
                        </div>
                    </div>
                    <div className=' flex justify-start items-center'>
                        <hr className='mr-2 ml-4 border-2 rounded-full border-teal-600 h-20' />
                        <div className='flex-col'>
                            <div className='flex justify-start items-center'>
                                <h2 className='text-black'>Obra social:</h2>
                                <p className='ml-1 text-sm text-black font-semibold'>{patient.insurance}</p>
                            </div>
                            <div className='flex justify-start items-center mt-2'>
                                <h2 className='text-black'>Plan:</h2>
                                {patient.insurance === 'Particular' || !patient.plan ? (
                                    <p className='ml-1 text-sm text-black font-semibold'>-</p>
                                ) : (
                                    <p className='ml-1 text-sm text-black font-semibold'>{patient.plan}</p>
                                )}
                            </div>
                            <div className='flex justify-start items-center mt-2'>
                                <h2 className='text-black'>Núm.Afiliado:</h2>
                                {patient.insurance === 'Particular' || !patient.affiliateNum ? (
                                    <p className='ml-1 text-sm text-black font-semibold'>-</p>
                                ) : (
                                    <p className='ml-1 text-sm text-black font-semibold'>{patient.affiliateNum}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex ml-auto'>
                    <div className='flex justify-center items-center'>
                        <div className='flex-col mr-4'>
                            <HiMiniPencilSquare className="text-gray-600 ml-3" size={56} />
                            <h1 className='bg-teal-600 font-medium text-black hover:scale-110 rounded-lg px-1 py-0.5 mt-1.5 select-none cursor-pointer transition duration-150'>DAR CITA</h1>
                        </div>
                    </div>
                </div>
            </div>
            <div className='flex justify-center items-center mb-2'>
                <Link prefetch={true} href={`/patients/${patient.id}/`}>
                    <button onClick={() => setSelectedField('modify')} className={`${selectedField === 'modify' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-gray-300 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg ml-4 border-b-2 border-x-2 focus:outline-none border-gray-600 text-sm font-semibold rounded-bl-lg transition duration-300 px-3 select-none`}>Modificar Datos</button>
                </Link>
                <Link prefetch={true} href={`/patients/${patient.id}/clinicHistory`}>
                    <button onClick={() => setSelectedField('clinicHistory')} className={`${selectedField === 'clinicHistory' ? 'bg-teal-600 border-gray-200' : 'bg-gray-300 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black  '} shadow-lg border-x-2 border-b-2 py-1 focus:outline-none border-gray-600 text-sm font-semibold transition duration-300 px-3 select-none`}>Historia Clinica</button>
                </Link>
                <Link prefetch={true} href={`/patients/${patient.id}/odontogram`}>
                    <button onClick={() => setSelectedField('odontogram')} className={`${selectedField === 'odontogram' ? 'bg-teal-600 border-gray-200 ' : 'bg-gray-300 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black'} shadow-lg py-1 border-b-2 border-x-2 rounded-br-lg focus:outline-none border-gray-600 text-sm font-semibold transition duration-300 px-3 select-none`}>Odontograma</button>
                </Link>
            </div>
        </div >
    );
}
