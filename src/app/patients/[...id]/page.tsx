'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getPatient } from "./../../components/getPatient";
import React, { useState, useEffect } from 'react';
import { PiAddressBookBold } from 'react-icons/pi';
import { RiArrowGoBackFill } from 'react-icons/ri';
import { TbPhone, TbPencilCog } from 'react-icons/tb';
import { MdLocationPin, MdDelete } from 'react-icons/md';
import { LiaIdCardSolid } from 'react-icons/lia';
import { ImAccessibility } from 'react-icons/im';
import { BsFillPhoneFill, BsFillCheckCircleFill } from 'react-icons/bs';
import { updatePatient } from "./../../components/updatePatient";
import { Alert } from "../../components/alert";

export default function PatientId() {
  const searchParams = useSearchParams()
  const id = searchParams.get('patientId');
  const [patient, setPatient] = useState<any>(null);
  const [hovered, setHovered] = useState('');
  const [rowModify, setRowModify] = useState('');
  const [changes, setChanges] = useState('');
  const [openAlert, setOpenAlert] = useState(false);
  const [selectedField, setSelectedField] = useState('basic');

  async function submitChanges(changes: string, table: string) {
    setRowModify('');
    if (changes !== '') {
      const newPatient = await updatePatient(changes, table, id);
      setPatient(newPatient);
    }
  }

  function closeModal() {
    setOpenAlert(false);
  }

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

  if (id !== null) {

    return (
      <div className='ml-72 p-4 mt-20 mr-10 relative'>
        {openAlert && (
          <div className='fixed inset-0 backdrop-blur-sm ml-64 z-10'>
            <Alert id={id} firstMessage={'¿Estás seguro/a de que deseas eliminar a este paciente?'} secondMessage={'Esta accion sera permanente y no se podra volver atras'} action={'Eliminar'} onCloseModal={closeModal} />
          </div>
        )}
        <div className='flex mb-2'>
          <Link prefetch={true} href="/patients">
            <RiArrowGoBackFill size={50} className="mb-4 hover:scale-125 duration-150 ease-in-out text-teal-800" />
          </Link>
          <div className='flex mx-auto items-center mb-2'>
            <button onClick={() => setSelectedField('basic')} className={`${selectedField === 'basic' ? 'bg-teal-500 border-teal-200 border-4' : 'bg-gray-500 hover:bg-teal-900'}  shadow-lg ml-4  h-10 border-2 focus:outline-none border-teal-500 text-white text-lg font-semibold rounded-l-lg transition duration-300 px-3`}>Info. Basica</button>
            <button onClick={() => setSelectedField('history')} className={`${selectedField === 'history' ? 'bg-teal-500 border-teal-200 border-4' : 'bg-gray-500 hover:bg-teal-900'}  shadow-lg h-10 border-2 focus:outline-none border-teal-500 text-white text-lg font-semibold transition duration-300 px-3`}>Historia Clinica</button>
            <button onClick={() => setSelectedField('odontogram')} className={`${selectedField === 'odontogram' ? 'bg-teal-500 border-teal-200 border-4' : 'bg-gray-500 hover:bg-teal-900'}  shadow-lg  h-10 border-2 focus:outline-none border-teal-500 text-white  text-lg font-semibold rounded-r-lg transition duration-300 px-3`}>Odontograma</button>
          </div>
        </div>
        {patient && (
          <div>
            <div className='border-4 rounded-md	border-teal-500 bg-gray-500 shadow-xl '>
              <div className='mt-4 ml-4 mb-4'>
                <div className='flex'>
                  <PiAddressBookBold size={70} />
                  <div className='flex items-center'>
                    <div className='mb-8 ml-2 bg-teal-500 rounded-full w-8 h-8 transform translate-y-0.5'>
                      <p className='font-bold text-center text-lg text-teal-800'>{patient.id}</p>
                    </div>
                    <h1 className='mb-8 ml-2 text-3xl font-bold text-teal-500'>{patient.name} {patient.lastName}</h1>
                    <p className='mb-8 ml-2 mt-1 text-md'>(Paciente)</p>
                    <div className='ml-4 mt-9 absolute flex items-center'>
                      <TbPhone size={20} className='shadow-2xl text-yellow-500' />
                      <p className='ml-1 text-md'>{patient.num}</p>
                      <MdLocationPin size={20} className='ml-8 shadow-2xl text-red-600' />
                      <p className='ml-1 text-md'>{patient.address}</p>
                      <LiaIdCardSolid size={26} className='ml-8 shadow-2xl text-green-600' />
                      <p className='ml-1 text-md'>{patient.dni}</p>
                    </div>
                  </div>
                  <div className='ml-auto'>
                    <button onClick={() => setOpenAlert(true)} className='flex items-center'>
                      <MdDelete size={60} className="mt-1 mr-2 text-teal-500 hover:scale-125 duration-150 ease-in-out" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
            <div className='flex'>
              <div className='mt-8 mr-4 border-4 rounded-md border-teal-500 bg-gray-500 shadow-xl w-1/2 relative'>
                <div className="absolute top-0 right-0 mt-3 mr-3">
                  <ImAccessibility size={70} className="text-teal-500" />
                </div>
                <div className='mt-4 ml-4 mb-4'>
                  <div className='flex'>
                    <div>
                      <h1 className=' mb-3 ml-4 text-2xl font-semibold text-teal-500 border-b-2 border-gray-300'>Informacion Basica</h1>

                      <div onClick={() => {
                        if (rowModify !== 'name') {
                          setRowModify('name');
                        }
                      }} onMouseEnter={() => setHovered('name')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'name' || rowModify === 'name' ? '' : 'border-transparent'} ${rowModify === 'name' ? 'border-teal-500' : ''}`}>
                        <h1 className='text-lg font-semibold'>Nombre:</h1>
                        {rowModify === 'name' ? (
                          <input onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              submitChanges(changes, rowModify);
                            } else if ((event.key === 'Escape')) {
                              setRowModify('');
                            }
                          }} autoFocus defaultValue={patient.name} type="text" className='text-teal-500 font-semibold ml-1 focus:outline-none bg-transparent text-lg' onChange={(event) => setChanges(event.target.value)} />
                        ) : (
                          <p className='ml-1 text-gray-300 text-lg'>{patient.name}</p>
                        )}
                        <div className='ml-auto'>
                          {hovered === 'name' && rowModify !== 'name' && <TbPencilCog size={26} />}
                        </div>
                        {rowModify === 'name' && (
                          <button className="ml-auto" >
                            <BsFillCheckCircleFill onClick={() => submitChanges(changes, rowModify)} className="hover:scale-125 duration-150 ease-in-out" size={26} />
                          </button>
                        )}
                      </div>


                      <div onClick={() => {
                        if (rowModify !== 'lastName') {
                          setRowModify('lastName');
                        }
                      }} onMouseEnter={() => setHovered('lastName')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'lastName' || rowModify === 'lastName' ? '' : 'border-transparent'} ${rowModify === 'lastName' ? 'border-teal-500' : ''}`}>
                        <h1 className='text-lg font-semibold'>Apellido:</h1>
                        {rowModify === 'lastName' ? (
                          <input onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              submitChanges(changes, rowModify);
                            }
                          }} autoFocus defaultValue={patient.lastName} type="text" className='text-teal-500 font-semibold ml-1 focus:outline-none bg-transparent text-lg' onChange={(event) => setChanges(event.target.value)} />
                        ) : (
                          <p className='ml-1 text-gray-300 text-lg'>{patient.lastName}</p>
                        )}
                        <div className='ml-auto'>
                          {hovered === 'lastName' && rowModify !== 'lastName' && <TbPencilCog size={26} />}
                        </div>
                        {rowModify === 'lastName' && (
                          <button className="ml-auto" >
                            <BsFillCheckCircleFill onClick={() => submitChanges(changes, rowModify)} className="hover:scale-125 duration-150 ease-in-out" size={26} />
                          </button>
                        )}
                      </div>

                      <div onClick={() => {
                        if (rowModify !== 'dni') {
                          setRowModify('dni');
                        }
                      }} onMouseEnter={() => setHovered('dni')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'dni' || rowModify === 'dni' ? '' : 'border-transparent'} ${rowModify === 'dni' ? 'border-teal-500' : ''}`}>
                        <h1 className='text-lg font-semibold'>DNI:</h1>
                        {rowModify === 'dni' ? (
                          <input onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              submitChanges(changes, rowModify);
                            }
                          }} autoFocus defaultValue={patient.dni} type="text" className='text-teal-500 font-semibold ml-1 focus:outline-none bg-transparent text-lg' onChange={(event) => setChanges(event.target.value)} />
                        ) : (
                          <p className='ml-1 text-gray-300 text-lg'>{patient.dni}</p>
                        )}
                        <div className='ml-auto'>
                          {hovered === 'dni' && rowModify !== 'dni' && <TbPencilCog size={26} />}
                        </div>
                        {rowModify === 'dni' && (
                          <button className="ml-auto" >
                            <BsFillCheckCircleFill onClick={() => submitChanges(changes, rowModify)} className="hover:scale-125 duration-150 ease-in-out" size={26} />
                          </button>
                        )}
                      </div>

                      <div onClick={() => {
                        if (rowModify !== 'birthDate') {
                          setRowModify('birthDate');
                        }
                      }} onMouseEnter={() => setHovered('birthDate')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'birthDate' || rowModify === 'birthDate' ? '' : 'border-transparent'} ${rowModify === 'birthDate' ? 'border-teal-500' : ''}`}>
                        <h1 className='text-lg font-semibold'>Nacimiento:</h1>
                        {rowModify === 'birthDate' ? (
                          <input onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              submitChanges(changes, rowModify);
                            }
                          }} autoFocus defaultValue={patient.birthDate} type="text" className='text-teal-500 font-semibold ml-1 focus:outline-none bg-transparent text-lg' onChange={(event) => setChanges(event.target.value)} />
                        ) : (
                          <p className='ml-1 text-gray-300 text-lg'>{patient.birthDate}</p>
                        )}
                        <div className='ml-auto'>
                          {hovered === 'birthDate' && rowModify !== 'birthDate' && <TbPencilCog size={26} />}
                        </div>
                        {rowModify === 'birthDate' && (
                          <button className="ml-auto transform -translate-x-3" >
                            <BsFillCheckCircleFill onClick={() => submitChanges(changes, rowModify)} className="hover:scale-125 duration-150 ease-in-out" size={26} />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
              <div className='mt-8 ml-4 border-4 rounded-md border-teal-500 bg-gray-500 shadow-xl  w-1/2 relative'>
                <div className="absolute top-0 right-0 mt-3 mr-3">
                  <BsFillPhoneFill size={70} className="text-teal-500" />
                </div>
                <div className='mt-4 ml-4 mb-4'>
                  <div className='flex'>
                    <div>
                      <h1 className='mb-3 ml-4 text-2xl font-semibold text-teal-500 border-b-2 border-gray-300'>Contacto</h1>
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
