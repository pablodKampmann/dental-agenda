'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getPatient } from "./../../components/getPatient";
import React, { useState, useEffect } from 'react';
import { PiAddressBookBold } from 'react-icons/pi';
import { RiArrowGoBackFill } from 'react-icons/ri';
import { TbPhone, TbPencilCog } from 'react-icons/tb';
import { MdLocationPin } from 'react-icons/md';
import { LiaIdCardSolid } from 'react-icons/lia';
import { ImAccessibility } from 'react-icons/im';
import { BsFillPhoneFill, BsFillCheckCircleFill } from 'react-icons/bs';
import { updatePatient } from "./../../components/updatePatient";

export default function patientId() {
  const searchParams = useSearchParams()
  const id = searchParams.get('patientId');
  const [patient, setPatient] = useState<any>(null);
  const [hovered, setHovered] = useState('');
  const [rowModify, setRowModify] = useState('');
  const [changes, setChanges] = useState('');

  async function submitChanges(changes: string, table: string) {
    if (changes !== '') {
      const newPatient = await updatePatient(changes, table, id);
      setPatient(newPatient);
    }
    setRowModify('');
  }

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
            <RiArrowGoBackFill size={50} className="mb-4 hover:scale-125 duration-150 ease-in-out" />
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
                      <h1 className=' mb-3 ml-4 text-2xl font-semibold text-blue-500 border-b-2 border-gray-300'>Informacion Basica</h1>
                      <div onMouseEnter={() => setHovered('name')} onMouseLeave={() => setHovered('')} className={`border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'name' ? '' : 'border-transparent'} ${rowModify === 'name' ? 'border-red-500' : 'border-blue-500'}`}>
                        <h1 className='text-lg font-semibold'>Nombre:</h1>
                        {rowModify === 'name' ? (
                          <input onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              submitChanges(changes, rowModify);
                            }
                          }} onSubmit={() => submitChanges(changes, rowModify)} defaultValue={patient.name} type="text" className='ml-1 focus:outline-none bg-transparent text-gray-300 text-lg' onChange={(event) => setChanges(event.target.value)} />
                        ) : (
                          <p className='ml-1 text-gray-300 text-lg'>{patient.name}</p>
                        )}
                        <button className="ml-auto" onClick={() => setRowModify('name')}>
                          {hovered === "name" && rowModify === '' && (
                            <TbPencilCog className="hover:scale-125 duration-150 ease-in-out" size={26} />
                          )}
                          {rowModify === 'name' && (
                            <BsFillCheckCircleFill onClick={() => submitChanges(changes, rowModify)} className="hover:scale-125 duration-150 ease-in-out" size={26} />
                          )}
                        </button>
                      </div>
                      <div onMouseEnter={() => setHovered('lastName')} onMouseLeave={() => setHovered('')} className={`border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1  border-blue-500 border-opacity-50 ${hovered === 'lastName' ? '' : ' border-transparent'}`}>
                        <h1 className='text-lg font-semibold'>Apellido:</h1>
                        <p className='ml-1 text-gray-300 text-lg'>{patient.lastName}</p>
                        <button className='ml-auto'>
                          {hovered === 'lastName' && <TbPencilCog className="hover:scale-125 duration-150 ease-in-out" size={26} />}
                        </button>
                      </div>
                      <div onMouseEnter={() => setHovered('dni')} onMouseLeave={() => setHovered('')} className={`border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-blue-500 border-opacity-50 ${hovered === 'dni' ? ' ' : ' border-transparent'}`}>
                        <h1 className='text-lg font-semibold'>DNI:</h1>
                        <p className='ml-1 text-gray-300 text-lg'>{patient.dni}</p>
                        <button className='ml-auto'>
                          {hovered === 'dni' && <TbPencilCog className="hover:scale-125 duration-150 ease-in-out" size={26} />}
                        </button>
                      </div>
                      <div onMouseEnter={() => setHovered('birthdate')} onMouseLeave={() => setHovered('')} className={`border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-blue-500 border-opacity-50 ${hovered === 'birthdate' ? ' ' : ' border-transparent'}`}>
                        <h1 className='text-lg font-semibold'>Fecha de Nacimiento:</h1>
                        <p className='ml-1 text-gray-300 text-lg'>{patient.birthDate}</p>
                        <button className='ml-auto'>
                          {hovered === 'birthdate' && <TbPencilCog className="hover:scale-125 duration-150 ease-in-out" size={26} />}
                        </button>
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
                      <div className='ml-4 mb-2 flex items-center'>
                        <h1 className='text-lg font-semibold'>Numero de Telefono:</h1>
                        <p className='ml-1 text-gray-300 text-lg'>{patient.num}</p>
                      </div>
                      <div className='ml-4 mb-2 flex items-center'>
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
