'use client'

import Link from 'next/link'
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation';
import { AvatarFallback } from '../../shared/AvatarFallback';
import { FaMale, FaFemale } from 'react-icons/fa';
import { TbPhone } from 'react-icons/tb';
import { MdLocationPin, MdOutlineMailOutline } from 'react-icons/md';
import { LiaIdCardSolid } from 'react-icons/lia';

interface ModalSettProps {
    patient: any | null;
}

export function PatientRecord({ patient }: ModalSettProps) {
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const pathname = usePathname()
    const router = useRouter();

    function getAge(date: any) {
        const today = new Date();
        const parts = date.split('/');
        const birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    }

    useEffect(() => {
        if (pathname.includes('clinicHistory')) setSelectedField('clinicHistory');
        else if (pathname.includes('odontogram')) setSelectedField('odontogram');
        else if (pathname.includes('billing')) setSelectedField('billing');
        else setSelectedField('modify');
    }, [pathname]);

    return (
        <div className="mb-4">
            <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                {/* Patient info */}
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50">
                    <AvatarFallback
                        displayName={`${patient.name} ${patient.lastName}`}
                        size={60}
                        className="rounded-full flex-shrink-0 border-2 border-white shadow-md select-none"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold text-black">{patient.name} {patient.lastName}</h1>
                            <span className="text-sm text-gray-500">· {getAge(patient.birthDate)} años</span>
                            {patient.gender === 'male'
                                ? <FaMale className="text-blue-500" size={18} />
                                : <FaFemale className="text-pink-500" size={18} />
                            }
                            <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5 font-medium select-none">
                                #{patient.id}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                                <LiaIdCardSolid size={15} className="text-teal-600" />
                                {patient.dni || '-'}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                                <MdLocationPin size={15} className="text-red-500" />
                                {patient.address || '-'}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                                <TbPhone size={15} className="text-yellow-600" />
                                {patient.num || '-'}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-gray-600">
                                <MdOutlineMailOutline size={15} className="text-blue-500" />
                                {patient.email || '-'}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 mt-0.5">
                            <span className="text-sm text-gray-500">
                                Obra social: <strong className="text-black font-semibold">{patient.insurance}</strong>
                            </span>
                            {patient.insurance !== 'Particular' && patient.plan && (
                                <span className="text-sm text-gray-500">
                                    Plan: <strong className="text-black font-semibold">{patient.plan}</strong>
                                </span>
                            )}
                            {patient.insurance !== 'Particular' && patient.affiliateNum && (
                                <span className="text-sm text-gray-500">
                                    Afiliado: <strong className="text-black font-semibold">{patient.affiliateNum}</strong>
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const patientParam = encodeURIComponent(JSON.stringify({
                                id: patient.id,
                                name: patient.name,
                                lastName: patient.lastName,
                                dni: patient.dni,
                                birthDate: patient.birthDate,
                                num: patient.num,
                                email: patient.email,
                                insurance: patient.insurance,
                                plan: patient.plan,
                                affiliateNum: patient.affiliateNum
                            }));
                            router.push(`/?patient=${patientParam}`);
                        }}
                        className="flex-shrink-0 px-3 py-1.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150 select-none"
                    >
                        Dar cita
                    </button>
                </div>

                {/* Tab navigation */}
                <div className="bg-gray-100 border-t border-gray-200 flex select-none">
                    <Link prefetch={true} href={`/patients/${patient.id}/`}>
                        <button
                            onClick={() => setSelectedField('modify')}
                            className={`${selectedField === 'modify' ? 'bg-white text-teal-700 font-semibold' : 'text-gray-500 hover:text-gray-800'} px-5 py-2 text-sm transition duration-150`}
                        >
                            Modificar Datos
                        </button>
                    </Link>
                    <Link prefetch={true} href={`/patients/${patient.id}/clinicHistory`}>
                        <button
                            onClick={() => setSelectedField('clinicHistory')}
                            className={`${selectedField === 'clinicHistory' ? 'bg-white text-teal-700 font-semibold' : 'text-gray-500 hover:text-gray-800'} px-5 py-2 text-sm transition duration-150`}
                        >
                            Historia Clínica
                        </button>
                    </Link>
                    <Link prefetch={true} href={`/patients/${patient.id}/odontogram`}>
                        <button
                            onClick={() => setSelectedField('odontogram')}
                            className={`${selectedField === 'odontogram' ? 'bg-white text-teal-700 font-semibold' : 'text-gray-500 hover:text-gray-800'} px-5 py-2 text-sm transition duration-150`}
                        >
                            Odontograma
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
