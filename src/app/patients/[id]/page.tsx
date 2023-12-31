'use client'

import { getPatient } from "../../components/getPatient";
import React, { useState, useEffect, useRef } from 'react';
import { TbPencilCog } from 'react-icons/tb';
import { ImAccessibility } from 'react-icons/im';
import { BsFillPhoneFill, BsFillCheckCircleFill } from 'react-icons/bs';
import { updatePatient } from "../../components/updatePatient";
import { BiPlusMedical } from 'react-icons/bi';
import { Alert } from "../../components/alert";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth, FaQuestionCircle } from "react-icons/fa";
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { PatientRecord } from "./../../components/patientRecord";
import { getInsuranceOptions } from "../../components/getInsuranceOpt";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from 'dayjs';

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
  const [openInfo, setOpenInfo] = useState(false);
  const [insuranceOptions, setInsuranceOptions] = useState<null | any[]>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs(patient?.birthDate, 'DD/MM/YYYY'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && patient) {
        setIsLoad(false);
        setSelectedDate(dayjs(patient.birthDate, 'DD/MM/YYYY'));
      } else if (!user) {
        router.push("/notSign");
      }
    });

    return () => unsubscribe();
  }, [router, patient]);

  async function submitChanges(changes: string, table: string) {
    setRowModify('');
    setHovered('')
    setChanges('')
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
        const options = await getInsuranceOptions();
        setInsuranceOptions(options);
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
                <div onMouseEnter={() => setOpenInfo(true)} onMouseLeave={() => setOpenInfo(false)} className="hover:scale-125 transition duration-100 w-7 -translate-y-5 mr-2 ml-auto relative" style={{ zIndex: 1000 }}>
                  <FaQuestionCircle className="text-teal-600 cursor-pointer" size={26} />
                  {openInfo ? (
                    <div className="top-0 -translate-x-[324px] mr-2 bg-teal-600 border-2 border-gray-600 rounded-lg px-2 py-1 text-xs w-80 absolute" style={{ zIndex: 1001 }}>
                      Para actualizar los datos de un paciente, simplemente coloca el mouse sobre el dato que deseas modificar. <br />
                      Si deseas eliminar un paciente, encontrarás un botón correspondiente en la parte inferior de la página.
                    </div>
                  ) : null}
                </div>
                <div className='flex'>
                  <div className='mr-4 border-2 rounded-3xl border-gray-600 bg-gray-400 bg-opacity-30 shadow-xl w-1/2 relative'>
                    <div className="ml-auto top-0 right-0 mt-2 mr-2 bg-teal-950 bg-opacity-80 rounded-full w-20 h-20 flex justify-center items-center shadow-xl absolute">
                      <ImAccessibility size={60} className="text-teal-600" />
                    </div>
                    <div className='flex'>
                      <div>
                        <h1 className='mb-2 text-2xl font-semibold text-teal-600 border-b-4 border-r-2 border-gray-600 bg-gray-400 bg-opacity-30 w-full rounded-t-2xl rounded-br-3xl px-6 pt-1 pb-1 select-none'>INFORMACIÓN BÁSICA</h1>
                        <div onClick={() => {
                          if (rowModify !== 'name') {
                            setRowModify('name');
                          }
                        }} onMouseEnter={() => setHovered('name')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'name' || rowModify === 'name' ? '' : 'border-transparent'} ${rowModify === 'name' ? 'border-teal-600' : ''}`}>
                          <h1 className='text-md text-black font-semibold'>Nombre:</h1>
                          {rowModify === 'name' ? (
                            <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.name} className="rounded-md text-black bg-teal-600  flex h-7 font-semibold  focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.name}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'name' && rowModify !== 'name' && <TbPencilCog size={26} className="text-gray-600" />}
                          </div>
                          {rowModify === 'name' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                            </button>
                          )}
                        </div>
                        <div onClick={() => {
                          if (rowModify !== 'lastName') {
                            setRowModify('lastName');
                          }
                        }} onMouseEnter={() => setHovered('lastName')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'lastName' || rowModify === 'lastName' ? '' : 'border-transparent'} ${rowModify === 'lastName' ? 'border-teal-600' : ''}`}>
                          <h1 className='text-md text-black font-semibold'>Apellido:</h1>
                          {rowModify === 'lastName' ? (
                            <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.lastName} className="rounded-md text-black bg-teal-600 flex h-7 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.lastName}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'lastName' && rowModify !== 'lastName' && <TbPencilCog size={26} className="text-gray-600" />}
                          </div>
                          {rowModify === 'lastName' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                            </button>
                          )}
                        </div>
                        <div onClick={() => {
                          if (rowModify !== 'dni') {
                            setRowModify('dni');
                          }
                        }} onMouseEnter={() => setHovered('dni')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'dni' || rowModify === 'dni' ? '' : 'border-transparent'} ${rowModify === 'dni' ? 'border-teal-600' : ''}`}>
                          <h1 className='text-md text-black font-semibold'>DNI:</h1>
                          {rowModify === 'dni' ? (
                            <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.dni} className="rounded-md text-black bg-teal-600 flex h-7 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.dni}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'dni' && rowModify !== 'dni' && <TbPencilCog size={26} className="text-gray-600" />}
                          </div>
                          {rowModify === 'dni' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                            </button>
                          )}
                        </div>
                        <div onClick={() => {
                          if (rowModify !== 'address') {
                            setRowModify('address');
                          }
                        }} onMouseEnter={() => setHovered('address')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'address' || rowModify === 'address' ? '' : 'border-transparent'} ${rowModify === 'address' ? 'border-teal-600' : ''}`}>
                          <h1 className='text-md text-black font-semibold'>Domicilio:</h1>
                          {rowModify === 'address' ? (
                            <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.address} className="rounded-md text-black bg-teal-600 flex h-16 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                          ) : (
                            <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.address}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'address' && rowModify !== 'address' && <TbPencilCog size={26} className="text-gray-600" />}
                          </div>
                          {rowModify === 'address' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                            </button>
                          )}
                        </div>
                        <div onClick={() => {
                          if (rowModify !== 'birthDate') {
                            setRowModify('birthDate');
                          }
                        }} onMouseEnter={() => setHovered('birthDate')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'birthDate' || rowModify === 'birthDate' ? '' : 'border-transparent'} ${rowModify === 'birthDate' ? 'border-teal-600' : ''}`}>
                          <h1 className='text-md text-black font-semibold'>Nacimiento:</h1>
                          {rowModify === 'birthDate' ? (
                            <div>
                              <input type="datetime" onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.birthDate} className="rounded-md text-black bg-teal-600 flex h-16 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                              <div className="relative text-gray-400">
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                  <DatePicker value={patient.birthDate} format="DD/MM/YYYY" slotProps={{ textField: { size: 'small' } }} className='rounded-md  text-black bg-teal-600 flex h-10 focus:outline-none font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4' />
                                </LocalizationProvider>
                              </div>
                            </div>
                          ) : (
                            <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.birthDate}</p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'birthDate' && rowModify !== 'birthDate' && <TbPencilCog size={26} className="text-gray-600" />}
                          </div>
                          {rowModify === 'birthDate' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                            </button>
                          )}
                        </div>
                        <div onClick={() => {
                          if (rowModify !== 'gender') {
                            setRowModify('gender');
                          }
                        }} onMouseEnter={() => setHovered('gender')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'gender' || rowModify === 'gender' ? '' : 'border-transparent'} ${rowModify === 'gender' ? 'border-teal-600' : ''}`}>
                          <h1 className='text-md text-black font-semibold'>Género:</h1>
                          {rowModify === 'gender' ? (
                            <select defaultValue={patient.gender} onChange={(event) => setChanges(event.target.value)} onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} autoFocus className="rounded-md text-black bg-teal-600 flex h-8 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" name="" id="">
                              <option value="male">Hombre</option>
                              <option value="female">Mujer</option>
                            </select>
                          ) : (
                            <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>
                              {patient.gender === 'male' ? (
                                "Hombre"
                              ) : (
                                "Mujer"
                              )}
                            </p>
                          )}
                          <div className='ml-auto'>
                            {hovered === 'gender' && rowModify !== 'gender' && <TbPencilCog size={26} className="text-gray-600" />}
                          </div>
                          {rowModify === 'gender' && (
                            <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                              <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='w-1/2'>
                    <div className='mr-4 border-2 rounded-3xl border-gray-600 bg-gray-400 bg-opacity-30 shadow-xl w-full relative'>
                      <div className="ml-auto top-0 right-0 mt-2 mr-2 bg-teal-950 bg-opacity-80 rounded-full w-20 h-20 flex justify-center items-center shadow-xl absolute">
                        <BsFillPhoneFill size={55} className="text-teal-600" />
                      </div>
                      <div className=''>
                        <div className='flex'>
                          <div>
                            <h1 className='mb-2 text-2xl font-semibold text-teal-600 border-b-4 border-r-2 border-gray-600 bg-gray-400 bg-opacity-30 w-full rounded-t-2xl rounded-br-3xl px-6 pt-1 pb-1 select-none'>CONTACTO</h1>
                            <div onClick={() => {
                              if (rowModify !== 'num') {
                                setRowModify('num');
                              }
                            }} onMouseEnter={() => setHovered('num')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'num' || rowModify === 'num' ? '' : 'border-transparent'} ${rowModify === 'num' ? 'border-teal-600' : ''}`}>
                              <h1 className='text-md text-black font-semibold'>Núm.Telefono:</h1>
                              {rowModify === 'num' ? (
                                <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.num} className="rounded-md text-black bg-teal-600 flex h-16 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.num}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'num' && rowModify !== 'num' && <TbPencilCog size={26} className="text-gray-600" />}
                              </div>
                              {rowModify === 'num' && (
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                                  <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                                </button>
                              )}
                            </div>
                            <div onClick={() => {
                              if (rowModify !== 'email') {
                                setRowModify('email');
                              }
                            }} onMouseEnter={() => setHovered('email')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'email' || rowModify === 'email' ? '' : 'border-transparent'} ${rowModify === 'email' ? 'border-teal-600' : ''}`}>
                              <h1 className='text-md text-black font-semibold'>Correo:</h1>
                              {rowModify === 'email' ? (
                                <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.email} className="rounded-md text-black bg-teal-600 flex h-16 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.email}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'email' && rowModify !== 'email' && <TbPencilCog size={26} className="text-gray-600" />}
                              </div>
                              {rowModify === 'email' && (
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                                  <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='mr-4 border-2 rounded-3xl border-gray-600 bg-gray-400 bg-opacity-30 shadow-xl w-full mt-4 relative'>
                      <div className="ml-auto top-0 right-0 mt-2 mr-2 bg-teal-950 bg-opacity-80 rounded-full w-20 h-20 flex justify-center items-center shadow-xl absolute">
                        <BiPlusMedical size={60} className="text-teal-600" />
                      </div>
                      <div className=''>
                        <div className='flex'>
                          <div>
                            <h1 className='mb-2 text-2xl font-semibold text-teal-600 border-b-4 border-r-2 border-gray-600 bg-gray-400 bg-opacity-30 w-full rounded-t-2xl rounded-br-3xl px-6 pt-1 pb-1 select-none'>SALUD</h1>
                            <div onClick={() => {
                              if (rowModify !== 'insurance') {
                                setRowModify('insurance');
                              }
                            }} onMouseEnter={() => setHovered('insurance')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'insurance' || rowModify === 'insurance' ? '' : 'border-transparent'} ${rowModify === 'insurance' ? 'border-teal-600' : ''}`}>
                              <h1 className='text-md text-black font-semibold'>ObraSocial:</h1>
                              {rowModify === 'insurance' ? (
                                <select defaultValue={patient.insurance} onChange={(event) => setChanges(event.target.value)} onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} autoFocus className="rounded-md text-black bg-teal-600 flex h-8 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" name="" id="">
                                  {insuranceOptions?.map((insurance, index) => (
                                    <option key={index} value={insurance}>
                                      {insurance}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.insurance}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'insurance' && rowModify !== 'insurance' && <TbPencilCog size={26} className="text-gray-600" />}
                              </div>
                              {rowModify === 'insurance' && (
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                                  <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                                </button>
                              )}
                            </div>
                            {patient.insurance === 'Particular' ? (
                              <div>
                                <div className="transition duration-100 w-[25rem] border-2 border-transparent ml-4 mb-1 flex items-center rounded-lg p-1">
                                  <h1 className='text-md text-black font-semibold'>Plan:</h1>
                                  <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>-</p>
                                </div>
                                <div className="transition duration-100 w-[25rem] border-2 border-transparent ml-4 mb-1 flex items-center rounded-lg p-1">
                                  <h1 className='text-md text-black font-semibold'>Núm.Afiliado:</h1>
                                  <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>-</p>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div onClick={() => {
                                  if (rowModify !== 'plan') {
                                    setRowModify('plan');
                                  }
                                }} onMouseEnter={() => setHovered('plan')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'plan' || rowModify === 'plan' ? '' : 'border-transparent'} ${rowModify === 'plan' ? 'border-teal-600' : ''}`}>
                                  <h1 className='text-md text-black font-semibold'>Plan:</h1>
                                  {rowModify === 'plan' ? (
                                    <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.plan} className="rounded-md text-black bg-teal-600 flex h-7 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                                  ) : (
                                    <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.plan}</p>
                                  )}
                                  <div className='ml-auto'>
                                    {hovered === 'plan' && rowModify !== 'plan' && <TbPencilCog size={26} className="text-gray-600" />}
                                  </div>
                                  {rowModify === 'plan' && (
                                    <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                                      <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                                    </button>
                                  )}
                                </div>
                                <div onClick={() => {
                                  if (rowModify !== 'affiliateNum') {
                                    setRowModify('affiliateNum');
                                  }
                                }} onMouseEnter={() => setHovered('affiliateNum')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'affiliateNum' || rowModify === 'affiliateNum' ? '' : 'border-transparent'} ${rowModify === 'affiliateNum' ? 'border-teal-600' : ''}`}>
                                  <h1 className='text-md text-black font-semibold'>Núm.Afiliado:</h1>
                                  {rowModify === 'affiliateNum' ? (
                                    <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify)} ref={textareaRef} onMouseEnter={handleTextArea} onBlur={handleTextArea} autoFocus defaultValue={patient.affiliateNum} className="rounded-md text-black bg-teal-600  flex h-7 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                                  ) : (
                                    <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.affiliateNum}</p>
                                  )}
                                  <div className='ml-auto'>
                                    {hovered === 'affiliateNum' && rowModify !== 'affiliateNum' && <TbPencilCog size={26} className="text-gray-600" />}
                                  </div>
                                  {rowModify === 'affiliateNum' && (
                                    <button className="ml-auto" onClick={() => submitChanges(changes, rowModify)}>
                                      <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div onClick={() => setOpenAlert(true)} className='mt-4 border-2 rounded-3xl border-red-600 bg-gray-400 bg-opacity-30 shadow-xl w-[42rem] relative text-center transition duration-200 cursor-pointer hover:text-white hover:bg-red-900 border-opacity-30 hover:bg-opacity-70 px-2 py-1 text-black text-xl font-medium'>
                    Eliminar Paciente Permanentemente
                  </div>
                </div>
              </div>
            )}
          </div>
        )
        }
      </div >
    );
  }
}
