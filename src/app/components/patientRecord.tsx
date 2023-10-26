import React, { useState, useEffect } from 'react';
import { PiAddressBookBold } from 'react-icons/pi';
import { TbPhone } from 'react-icons/tb';
import { MdLocationPin } from 'react-icons/md';
import { LiaIdCardSolid } from 'react-icons/lia';
import { FaHandHoldingMedical, FaFileMedical } from 'react-icons/fa';
import { AiOutlineFieldNumber } from 'react-icons/ai';

interface ModalSettProps {
    patient: any | null;
}

export function PatientRecord({ patient }: ModalSettProps) {
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
        <div className='border-4 rounded-3xl border-teal-500 bg-gray-500 shadow-xl '>
            <div className='mt-4 ml-4 mb-4'>
                <div className='flex'>
                    <PiAddressBookBold size={70} />
                    <div className='flex items-center justify-between'>
                        <div className='mb-8 ml-2 bg-teal-500 rounded-full w-8 h-8 flex items-center justify-center'>
                            <p className='font-bold text-lg text-teal-800'>{patient.id}</p>
                        </div>
                        <h1 className='mb-8 ml-2 text-3xl font-bold text-teal-500'>{patient.name} {patient.lastName}</h1>
                        <p className='mb-8 ml-2 mt-1 text-md'>Edad: {getAge(patient.birthDate)},</p>
                        {patient.gender === 'male' ? (
                            <p className='mb-8 ml-2 mt-1 text-md'>Género: Hombre</p>
                        ) : (
                            <p className='mb-8 ml-2 mt-1 text-md'>Género: Mujer</p>
                        )}
                        <div className='ml-4 mt-9 absolute flex items-center'>
                            <TbPhone size={20} className='shadow-2xl text-yellow-500' />
                            <p className='ml-1 text-md'>{patient.num}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <MdLocationPin size={20} className='ml-2 shadow-2xl text-red-600' />
                            <p className='ml-1 text-md'>{patient.address}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <LiaIdCardSolid size={26} className='ml-2 shadow-2xl text-green-600' />
                            <p className='ml-1 text-md'>{patient.dni}</p>
                        </div>
                        <div className='ml-4 mt-24 absolute flex items-center'>
                            <FaHandHoldingMedical size={20} className='ml-2 shadow-2xl text-blue-500' />
                            <p className='ml-1 text-md'>{patient.obra}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <FaFileMedical size={20} className='ml-2 shadow-2xl text-pink-500' />
                            <p className='ml-1 text-md'>{patient.plan}</p>
                            <hr className='ml-2 border-2 rounded-full border-teal-500 h-6' />
                            <AiOutlineFieldNumber size={28} className='ml-2 shadow-2xl text-purple-400' />
                            <p className='ml-1 text-md'>{patient.affiliateNum}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
