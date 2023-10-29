'use client'

import Link from 'next/link'
import { getPatient } from "../../components/getPatient";
import React, { useState, useEffect } from 'react';
import { PiAddressBookBold } from 'react-icons/pi';
import { RiArrowGoBackFill } from 'react-icons/ri';
import { TbPhone, TbPencilCog } from 'react-icons/tb';
import { MdLocationPin, MdDelete } from 'react-icons/md';
import { LiaIdCardSolid } from 'react-icons/lia';
import { ImAccessibility } from 'react-icons/im';
import { BsFillPhoneFill, BsFillCheckCircleFill } from 'react-icons/bs';
import { updatePatient } from "../../components/updatePatient";
import { Alert } from "../../components/alert";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth } from "react-icons/fa";
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { PatientRecord } from "./../../components/patientRecord";

export default function PatientId() {
  const router = useRouter()
  const [isLoad, setIsLoad] = useState(true);
  const pathname = usePathname()
  const id = (pathname.split('/').pop() || null) as string | null;
  const [patient, setPatient] = useState<any>(null);
  const [hovered, setHovered] = useState('');
  const [rowModify, setRowModify] = useState('');
  const [changes, setChanges] = useState('');
  const [openAlert, setOpenAlert] = useState(false);
  const [selectedField, setSelectedField] = useState('basic');
  const [goBack, setGoBack] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && patient) {
        setIsLoad(false);
      } else if (!user) {
        router.push("/notSign");
      }
    });

    return () => unsubscribe();
  }, [router, patient]);

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
  }, [id]);

  if (id !== null) {

    return (
      <div className='ml-64'>
        {isLoad ? (
          <div className='fixed inset-0 backdrop-blur-sm ml-64'>
            <div className='fixed inset-0 flex items-center justify-center'>
              <div className='bg-teal-900 py-10 px-10 rounded-full shadow-xl animate-spin'>
                <FaTooth size={100} />
              </div>
            </div>
          </div>
        ) : (
          <div className='ml-2 p-4 mt-16 mr-2 relative'>
            {openAlert && (
              <div className='fixed inset-0 backdrop-blur-sm ml-64 z-10'>
                <Alert id={id} firstMessage={'¿Estás seguro/a de que deseas eliminar a este paciente?'} secondMessage={'Esta accion sera permanente y no se podra volver atras'} action={'Eliminar'} onCloseModal={closeModal} />
              </div>
            )}
            {patient && (
              <div>
                <PatientRecord patient={patient} />
                <div className='flex mt-4'>

                  <div className='mr-4 border-4 rounded-3xl border-teal-500 bg-gray-500 shadow-xl w-1/2 relative'>
                    <div className="absolute top-0 right-0 mt-3 mr-3">
                      <ImAccessibility size={70} className="text-teal-500" />
                    </div>

                    <div className='flex mt-4 mb-4'>
                      <div>
                        <h1 className='mb-3 ml-4 text-2xl font-semibold text-teal-500 border-b-2 border-teal-500 bg-teal-950 bg-opacity-70 rounded-lg px-2 select-none'>Información Básica</h1>
                        <div onClick={() => setRowModify('name')} onMouseEnter={() => setHovered('name')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'name' || rowModify === 'name' ? '' : 'border-transparent'} ${rowModify === 'name' ? 'border-teal-500' : ''}`}>
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
                        <div onClick={() => setRowModify('lastName')} onMouseEnter={() => setHovered('lastName')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'lastName' || rowModify === 'lastName' ? '' : 'border-transparent'} ${rowModify === 'lastName' ? 'border-teal-500' : ''}`}>
                          <h1 className='text-lg font-semibold'>Apellido:</h1>
                          {rowModify === 'lastName' ? (
                            <input onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                submitChanges(changes, rowModify);
                              } else if ((event.key === 'Escape')) {
                                setRowModify('');
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
                        <div onClick={() => setRowModify('dni')} onMouseEnter={() => setHovered('dni')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'dni' || rowModify === 'dni' ? '' : 'border-transparent'} ${rowModify === 'dni' ? 'border-teal-500' : ''}`}>
                          <h1 className='text-lg font-semibold'>DNI:</h1>
                          {rowModify === 'dni' ? (
                            <input onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                submitChanges(changes, rowModify);
                              } else if ((event.key === 'Escape')) {
                                setRowModify('');
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
                        <div onClick={() => setRowModify('address')} onMouseEnter={() => setHovered('address')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'address' || rowModify === 'address' ? '' : 'border-transparent'} ${rowModify === 'address' ? 'border-teal-500' : ''}`}>
                          <h1 className='text-lg font-semibold'>Domicilio:</h1>
                          {rowModify === 'address' ? (
                            <input onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                submitChanges(changes, rowModify);
                              } else if ((event.key === 'Escape')) {
                                setRowModify('');
                              }
                            }} autoFocus defaultValue={patient.address} type="text" className='text-teal-500 font-semibold ml-1 focus:outline-none bg-transparent text-lg' onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-1 text-gray-300 text-lg'>{patient.address}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'address' && rowModify !== 'address' && <TbPencilCog size={26} />}
                          </div>
                          {rowModify === 'address' && (
                            <button className="ml-auto" >
                              <BsFillCheckCircleFill onClick={() => submitChanges(changes, rowModify)} className="hover:scale-125 duration-150 ease-in-out" size={26} />
                            </button>
                          )}
                        </div>
                        <div onClick={() => setRowModify('birthDate')} onMouseEnter={() => setHovered('birthDate')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'birthDate' || rowModify === 'birthDate' ? '' : 'border-transparent'} ${rowModify === 'birthDate' ? 'border-teal-500' : ''}`}>
                          <h1 className='text-lg font-semibold'>Nacimiento:</h1>
                          {rowModify === 'birthDate' ? (
                            <input onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                submitChanges(changes, rowModify);
                              } else if ((event.key === 'Escape')) {
                                setRowModify('');
                              }
                            }} autoFocus defaultValue={patient.birthDate} type="text" className='text-teal-500 font-semibold ml-1 focus:outline-none bg-transparent text-lg' onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-1 text-gray-300 text-lg'>{patient.birthDate}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'birthDate' && rowModify !== 'birthDate' && <TbPencilCog size={26} />}
                          </div>
                          {rowModify === 'birthDate' && (
                            <button className="ml-auto" >
                              <BsFillCheckCircleFill onClick={() => submitChanges(changes, rowModify)} className="hover:scale-125 duration-150 ease-in-out" size={26} />
                            </button>
                          )}
                        </div>
                        <div onClick={() => setRowModify('gender')} onMouseEnter={() => setHovered('gender')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'gender' || rowModify === 'gender' ? '' : 'border-transparent'} ${rowModify === 'gender' ? 'border-teal-500' : ''}`}>
                          <h1 className='text-lg font-semibold'>Género:</h1>
                          {rowModify === 'gender' ? (
                            <input onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                submitChanges(changes, rowModify);
                              } else if ((event.key === 'Escape')) {
                                setRowModify('');
                              }
                            }} autoFocus defaultValue={patient.gender} type="text" className='text-teal-500 font-semibold ml-1 focus:outline-none bg-transparent text-lg' onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <div>
                              {patient.gender === 'male' ? (
                                <p className='ml-1 text-gray-300 text-lg'>Hombre</p>
                              ) : (
                                <p className='ml-1 text-gray-300 text-lg'>Mujer</p>
                              )}
                            </div>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'gender' && rowModify !== 'gender' && <TbPencilCog size={26} />}
                          </div>
                          {rowModify === 'gender' && (
                            <button className="ml-auto" >
                              <BsFillCheckCircleFill onClick={() => submitChanges(changes, rowModify)} className="hover:scale-125 duration-150 ease-in-out" size={26} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='w-1/2'>
                    <div className='ml-4 mb-2 border-4 rounded-3xl border-teal-500 bg-gray-500 shadow-xl relative'>
                      <div className="absolute top-0 right-0 mt-3 mr-3">
                        <BsFillPhoneFill size={70} className="text-teal-500" />
                      </div>
                      <div className='mt-4 ml-4 mb-4'>
                        <div className='flex'>
                          <div>
                            <h1 className='mb-3 ml-4 text-2xl font-semibold text-teal-500 border-b-2 bg-teal-950 bg-opacity-70 px-2 rounded-lg border-teal-500 select-none'>Contacto</h1>
                            <div onClick={() => setRowModify('num')} onMouseEnter={() => setHovered('num')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'num' || rowModify === 'num' ? '' : 'border-transparent'} ${rowModify === 'num' ? 'border-teal-500' : ''}`}>
                              <h1 className='text-lg font-semibold'>Núm. Tel:</h1>
                              {rowModify === 'num' ? (
                                <input onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    submitChanges(changes, rowModify);
                                  } else if ((event.key === 'Escape')) {
                                    setRowModify('');
                                  }
                                }} autoFocus defaultValue={patient.num} type="text" className='text-teal-500 font-semibold ml-1 focus:outline-none bg-transparent text-lg' onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <p className='ml-1 text-gray-300 text-lg'>{patient.num}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'num' && rowModify !== 'num' && <TbPencilCog size={26} />}
                              </div>
                              {rowModify === 'num' && (
                                <button className="ml-auto" >
                                  <BsFillCheckCircleFill onClick={() => submitChanges(changes, rowModify)} className="hover:scale-125 duration-150 ease-in-out" size={26} />
                                </button>
                              )}
                            </div>
                            <div onClick={() => setRowModify('email')} onMouseEnter={() => setHovered('email')} onMouseLeave={() => setHovered('')} className={`hover:cursor-pointer w-96 border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'email' || rowModify === 'email' ? '' : 'border-transparent'} ${rowModify === 'email' ? 'border-teal-500' : ''}`}>
                              <h1 className='text-lg font-semibold'>Correo:</h1>
                              {rowModify === 'email' ? (
                                <input onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    submitChanges(changes, rowModify);
                                  } else if ((event.key === 'Escape')) {
                                    setRowModify('');
                                  }
                                }} autoFocus defaultValue={patient.email} type="text" className='text-teal-500 font-semibold ml-1 focus:outline-none bg-transparent text-lg' onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <p className='ml-1 text-gray-300 text-lg'>{patient.email}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'email' && rowModify !== 'email' && <TbPencilCog size={26} />}
                              </div>
                              {rowModify === 'email' && (
                                <button className="ml-auto" >
                                  <BsFillCheckCircleFill onClick={() => submitChanges(changes, rowModify)} className="hover:scale-125 duration-150 ease-in-out" size={26} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='border-4 rounded-3xl border-teal-500 bg-gray-500 shadow-xl relative ml-4 mt-2'>
                      hola
                    </div>
                  </div>


                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
