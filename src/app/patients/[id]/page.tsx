'use client'

import { getPatient } from "../../components/getPatient";
import React, { useState, useEffect, useRef } from 'react';
import { TbPencilCog } from 'react-icons/tb';
import { ImAccessibility } from 'react-icons/im';
import { BsFillPhoneFill, BsFillCheckCircleFill } from 'react-icons/bs';
import { updatePatient } from "../../components/updatePatient";
import { BiPhoneCall, BiPlusMedical } from 'react-icons/bi';
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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
    setHovered('')
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

  function handleTextArea() {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.selectionStart = textarea.value.length;
    };
  };

  function handleKeyPress(event: any, changes: any, rowModify: any) {
    if (event.key === 'Enter') {
      submitChanges(changes, rowModify);
    } else if (event.key === 'Escape') {
      setRowModify('');
    }
  }

  if (id !== null) {
    return (
      <div className='ml-56'>
        {isLoad ? (
          <div className='fixed inset-0 backdrop-blur-sm ml-56'>
            <div className='fixed inset-0 flex items-center justify-center'>
              <div className='bg-teal-900 py-10 px-10 rounded-full shadow-xl animate-spin'>
                <FaTooth size={100} />
              </div>
            </div>
          </div>
        ) : (
          <div className='ml-2 p-4 mt-16 mr-2 relative'>
            {openAlert && (
              <div className='fixed inset-0 backdrop-blur-sm ml-56 z-10'>
                <Alert id={id} firstMessage={'¿Estás seguro/a de que deseas eliminar a este paciente?'} secondMessage={'Esta accion sera permanente y no se podra volver atras'} action={'Eliminar'} onCloseModal={closeModal} />
              </div>
            )}
            {patient && (
              <div>
                <PatientRecord patient={patient} />
                <div className='flex mt-8 transition duration-300'>
                  <div className='mr-4 border-4 rounded-3xl border-gray-600 bg-gray-400 bg-opacity-30 shadow-xl w-1/2 relative'>
                    <div className="absolute top-0 right-0 mt-2 mr-2 bg-teal-950 bg-opacity-60 rounded-full w-24 h-24 flex justify-center items-center shadow-xl">
                      <ImAccessibility size={70} className="text-teal-600" />
                    </div>
                    <div className='flex mb-4'>
                      <div>
                        <h1 className='mb-3 text-2xl font-semibold text-teal-600 border-b-4 border-r-2 border-gray-600 bg-gray-400 bg-opacity-30 w-full rounded-t-2xl rounded-br-3xl px-6 pt-1 pb-1 select-none'>INFORMACIÓN BÁSICA</h1>
                        <div onClick={() => {
                          if (rowModify !== 'name') {
                            setRowModify('name');
                          }
                        }} onMouseEnter={() => setHovered('name')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'name' || rowModify === 'name' ? '' : 'border-transparent'} ${rowModify === 'name' ? 'border-teal-200' : ''}`}>
                          <h1 className='text-lg text-teal-600 font-semibold'>Nombre:</h1>
                          {rowModify === 'name' ? (
                            <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.name} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-2 text-gray-700 text-xl w-4/6 overflow-auto'>{patient.name}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'name' && rowModify !== 'name' && <TbPencilCog size={26} className="text-gray-600" />}
                          </div>
                          {rowModify === 'name' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                            </button>
                          )}
                        </div>
                        <div onClick={() => {
                          if (rowModify !== 'lastName') {
                            setRowModify('lastName');
                          }
                        }} onMouseEnter={() => setHovered('lastName')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'lastName' || rowModify === 'lastName' ? '' : 'border-transparent'} ${rowModify === 'lastName' ? 'border-teal-200' : ''}`}>
                          <h1 className='text-lg font-semibold'>Apellido:</h1>
                          {rowModify === 'lastName' ? (
                            <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.lastName} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-2 text-gray-200 text-lg w-4/6 overflow-auto'>{patient.lastName}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'lastName' && rowModify !== 'lastName' && <TbPencilCog size={26} className="" />}
                          </div>
                          {rowModify === 'lastName' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                            </button>
                          )}
                        </div>
                        <div onClick={() => {
                          if (rowModify !== 'dni') {
                            setRowModify('dni');
                          }
                        }} onMouseEnter={() => setHovered('dni')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'dni' || rowModify === 'dni' ? '' : 'border-transparent'} ${rowModify === 'dni' ? 'border-teal-200' : ''}`}>
                          <h1 className='text-lg font-semibold'>DNI:</h1>
                          {rowModify === 'dni' ? (
                            <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.dni} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-2 text-gray-200 text-lg w-4/6 overflow-auto'>{patient.dni}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'dni' && rowModify !== 'dni' && <TbPencilCog size={26} className="" />}
                          </div>
                          {rowModify === 'dni' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                            </button>
                          )}
                        </div>

                        <div onClick={() => {
                          if (rowModify !== 'address') {
                            setRowModify('address');
                          }
                        }} onMouseEnter={() => setHovered('address')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'address' || rowModify === 'address' ? '' : 'border-transparent'} ${rowModify === 'address' ? 'border-teal-200' : ''}`}>
                          <h1 className='text-lg font-semibold'>Domicilio:</h1>
                          {rowModify === 'address' ? (
                            <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.address} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-2 text-gray-200 text-lg w-4/6 overflow-auto'>{patient.address}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'address' && rowModify !== 'address' && <TbPencilCog size={26} className="" />}
                          </div>
                          {rowModify === 'address' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                            </button>
                          )}
                        </div>

                        <div onClick={() => {
                          if (rowModify !== 'birthDate') {
                            setRowModify('birthDate');
                          }
                        }} onMouseEnter={() => setHovered('birthDate')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'birthDate' || rowModify === 'birthDate' ? '' : 'border-transparent'} ${rowModify === 'birthDate' ? 'border-teal-200' : ''}`}>
                          <h1 className='text-lg font-semibold'>Nacimiento:</h1>
                          {rowModify === 'birthDate' ? (
                            <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.birthDate} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-2 text-gray-200 text-lg w-4/6 overflow-auto'>{patient.birthDate}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'birthDate' && rowModify !== 'birthDate' && <TbPencilCog size={26} className="" />}
                          </div>
                          {rowModify === 'birthDate' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                            </button>
                          )}
                        </div>
                        <div onClick={() => {
                          if (rowModify !== 'gender') {
                            setRowModify('gender');
                          }
                        }} onMouseEnter={() => setHovered('gender')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'gender' || rowModify === 'gender' ? '' : 'border-transparent'} ${rowModify === 'gender' ? 'border-teal-200' : ''}`}>
                          <h1 className='text-lg font-semibold'>Género:</h1>
                          {rowModify === 'gender' ? (
                            <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.gender} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-2 text-gray-200 text-lg w-4/6 overflow-auto'>{patient.gender}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'gender' && rowModify !== 'gender' && <TbPencilCog size={26} className="" />}
                          </div>
                          {rowModify === 'gender' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='w-1/2'>
                    <div className='mr-4 border-4 rounded-3xl border-gray-600 bg-gradient-to-r from-black via-black to-teal-900 shadow-xl w-full relative'>
                      <div className="absolute top-0 right-0 mt-2 mr-2 bg-gray-400 bg-opacity-30 rounded-full w-24 h-24 flex justify-center items-center shadow-xl">
                        <BsFillPhoneFill size={70} className="text-teal-600" />
                      </div>
                      <div className='mb-4'>
                        <div className='flex'>
                          <div>
                            <h1 className='mb-3 text-2xl font-semibold text-white border-b-4 border-r-2 border-gray-600 bg-gray-400 bg-opacity-30 w-full rounded-t-2xl rounded-br-3xl px-6 pt-2 select-none'>CONTACTO</h1>
                            <div onClick={() => {
                              if (rowModify !== 'num') {
                                setRowModify('num');
                              }
                            }} onMouseEnter={() => setHovered('num')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'num' || rowModify === 'num' ? '' : 'border-transparent'} ${rowModify === 'num' ? 'border-teal-200' : ''}`}>
                              <h1 className='text-lg font-semibold'>Núm.Tel:</h1>
                              {rowModify === 'num' ? (
                                <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.num} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <p className='ml-2 text-gray-200 text-lg w-4/6 overflow-auto'>{patient.num}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'num' && rowModify !== 'num' && <TbPencilCog size={26} className="" />}
                              </div>
                              {rowModify === 'num' && (
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                                  <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                                </button>
                              )}
                            </div>
                            <div onClick={() => {
                              if (rowModify !== 'email') {
                                setRowModify('email');
                              }
                            }} onMouseEnter={() => setHovered('email')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'email' || rowModify === 'email' ? '' : 'border-transparent'} ${rowModify === 'email' ? 'border-teal-200' : ''}`}>
                              <h1 className='text-lg font-semibold'>Correo:</h1>
                              {rowModify === 'email' ? (
                                <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.email} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <p className='ml-2 text-gray-200 text-lg w-4/6 overflow-auto'>{patient.email}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'email' && rowModify !== 'email' && <TbPencilCog size={26} className="" />}
                              </div>
                              {rowModify === 'email' && (
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                                  <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='mr-4 mt-4 border-4 rounded-3xl border-gray-600 bg-gradient-to-r from-black via-black to-teal-900 shadow-xl w-full relative'>
                      <div className="absolute top-0 right-0 mt-2 mr-2 bg-gray-400 bg-opacity-30 rounded-full w-24 h-24 flex justify-center items-center shadow-xl">
                        <BiPlusMedical size={70} className="text-teal-600" />
                      </div>
                      <div className='mb-4'>
                        <div className='flex'>
                          <div>
                            <h1 className='mb-3 text-2xl font-semibold text-white border-b-4 border-r-2 border-gray-600 bg-gray-400 bg-opacity-30 w-full rounded-t-2xl rounded-br-3xl px-6 pt-2 select-none'>SALUD</h1>
                            <div onClick={() => {
                              if (rowModify !== 'obra') {
                                setRowModify('obra');
                              }
                            }} onMouseEnter={() => setHovered('obra')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'obra' || rowModify === 'obra' ? '' : 'border-transparent'} ${rowModify === 'obra' ? 'border-teal-200' : ''}`}>
                              <h1 className='text-lg font-semibold '>ObraSocial:</h1>
                              {rowModify === 'obra' ? (
                                <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.obra} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <p className='ml-2 text-gray-200 text-lg w-4/6 overflow-auto'>{patient.obra}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'obra' && rowModify !== 'obra' && <TbPencilCog size={26} className="" />}
                              </div>
                              {rowModify === 'obra' && (
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                                  <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                                </button>
                              )}
                            </div>
                            <div onClick={() => {
                              if (rowModify !== 'plan') {
                                setRowModify('plan');
                              }
                            }} onMouseEnter={() => setHovered('plan')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'plan' || rowModify === 'plan' ? '' : 'border-transparent'} ${rowModify === 'plan' ? 'border-teal-200' : ''}`}>
                              <h1 className='text-lg font-semibold'>Plan:</h1>
                              {rowModify === 'plan' ? (
                                <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.plan} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <p className='ml-2 text-gray-200 text-lg w-4/6 overflow-auto'>{patient.plan}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'plan' && rowModify !== 'plan' && <TbPencilCog size={26} className="" />}
                              </div>
                              {rowModify === 'plan' && (
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                                  <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                                </button>
                              )}
                            </div>
                            <div onClick={() => {
                              if (rowModify !== 'affiliateNum') {
                                setRowModify('affiliateNum');
                              }
                            }} onMouseEnter={() => setHovered('affiliateNum')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 border-opacity-50 ${hovered === 'affiliateNum' || rowModify === 'affiliateNum' ? '' : 'border-transparent'} ${rowModify === 'affiliateNum' ? 'border-teal-200' : ''}`}>
                              <h1 className='text-lg font-semibold'>Núm.Afiliado:</h1>
                              {rowModify === 'affiliateNum' ? (
                                <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.affiliateNum} className="text-teal-500 bg-teal-200 bg-opacity-50 flex h-16 font-semibold focus:bg-teal-200 focus:bg-opacity-50 focus:outline-transparent focus:text-black text-lg overflow-auto w-4/6 ml-4" onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <p className='ml-2 text-gray-200 text-lg w-4/6 overflow-auto'>{patient.affiliateNum}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'affiliateNum' && rowModify !== 'affiliateNum' && <TbPencilCog size={26} className="" />}
                              </div>
                              {rowModify === 'affiliateNum' && (
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                                  <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1" size={30} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
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
