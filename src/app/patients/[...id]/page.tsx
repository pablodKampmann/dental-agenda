'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getPatient } from "./../../components/getPatient";
import React, { useState, useEffect } from 'react';
import { PiAddressBookBold } from 'react-icons/pi';
import { RiArrowGoBackFill } from 'react-icons/ri';
import { TbPhone } from 'react-icons/tb';
import { MdLocationPin } from 'react-icons/md';
import { LiaIdCardSolid } from 'react-icons/lia';
import { ImAccessibility } from 'react-icons/im';
import { BsFillPhoneFill } from 'react-icons/bs';

export default function patientId() {
  const searchParams = useSearchParams()
  const id = searchParams.get('patientId');
  const [patient, setPatient] = useState<any>(null);

  if (id !== null) {
    useEffect(() => {
      async function get() {
        try {
          const data = await getPatient(id);
          setPatient(data);
        } catch (error) {
          console.error(error);
        }
      }

      get();
    }, []);

    return (
      <div className='ml-72 p-4 mt-20 mr-10'>
        <div className='flex mb-2'>
          <Link prefetch={true} href="/patients">
            <RiArrowGoBackFill size={40} className="shadow-2xl mb-4 hover:scale-125" />
          </Link>
        </div>
        {patient && (
          <div>
            <div className='border-2 rounded-md	border-slate-400 bg-gray-800 shadow-xl bg-opacity-50'>
              <div className='mt-4 ml-4 mb-4'>
                <div className='flex'>
                  <PiAddressBookBold size={70} />
                  <div className='flex items-center'>
                    <h1 className='mb-8 ml-4 text-3xl font-semibold text-blue-500'>{patient.name} {patient.lastName}</h1>
                    <p className='mb-8 ml-2 mt-1 text-gray-400 text-md'>(Paciente)</p>
                    <div className='ml-4 mt-9 absolute flex items-center'>
                      <TbPhone size={20} className='shadow-2xl text-yellow-500' />
                      <p className='ml-1 text-gray-400 text-md'>{patient.num}</p>
                      <MdLocationPin size={20} className='ml-8 shadow-2xl text-red-600' />
                      <p className='ml-1 text-gray-400 text-md'>{patient.address}</p>
                      <LiaIdCardSolid size={26} className='ml-8 shadow-2xl text-green-600' />
                      <p className='ml-1 text-gray-400 text-md'>{patient.dni}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex'>
              <div className='mt-8 mr-4 border-2 rounded-md border-slate-400 bg-gray-800 shadow-xl bg-opacity-50 w-1/2 relative'>
                <div className="absolute top-0 right-0 mt-3 mr-3">
                  <ImAccessibility size={70} />
                </div>
                <div className='mt-4 ml-4 mb-4'>
                  <div className='flex'>
                    <div>
                      <h1 className='mb-3 ml-4 text-2xl font-semibold text-blue-500 border-b-2 border-gray-300'>Informacion Basica</h1>
                      <div className='ml-4 mb-1 flex items-center'>
                        <h1 className='text-lg font-semibold'>Nombre:</h1>
                        <p className='ml-1 text-gray-300 text-lg'>{patient.name}</p>
                      </div>
                      <div className='ml-4 mb-1 flex items-center'>
                        <h1 className='text-lg font-semibold'>Apellido:</h1>
                        <p className='ml-1 text-gray-300 text-lg'>{patient.lastName}</p>
                      </div>
                      <div className='ml-4 mb-1 flex items-center'>
                        <h1 className='text-lg font-semibold'>DNI:</h1>
                        <p className='ml-1 text-gray-300 text-lg'>{patient.dni}</p>
                      </div>
                      <div className='ml-4 mb-1 flex items-center'>
                        <h1 className='text-lg font-semibold'>Fecha de Nacimiento:</h1>
                        <p className='ml-1 text-gray-300 text-lg'>{patient.birthDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='mt-8 ml-4 border-2 rounded-md border-slate-400 bg-gray-800 shadow-xl bg-opacity-50 w-1/2 relative'>
                <div className="absolute top-0 right-0 mt-3 mr-3">
                  <BsFillPhoneFill size={70} />
                </div>
                <div className='mt-4 ml-4 mb-4'>
                  <div className='flex'>
                    <div>
                      <h1 className='mb-3 ml-4 text-2xl font-semibold text-blue-500 border-b-2 border-gray-300'>Contacto</h1>
                      <div className='ml-4 mb-1 flex items-center'>
                        <h1 className='text-lg font-semibold'>Numero de Telefono:</h1>
                        <p className='ml-1 text-gray-300 text-lg'>{patient.num}</p>
                      </div>
                      <div className='ml-4 mb-1 flex items-center'>
                        <h1 className='text-lg font-semibold'>Correo Electronico:</h1>
                        <p className='ml-1 text-gray-300 text-lg'>correofalso@gmail.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
