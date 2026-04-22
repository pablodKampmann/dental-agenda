'use client'

import { getPatient } from "./../../../components/patients/db/getPatient";
import React, { useState, useEffect, useRef } from 'react';
import { TbPencilCog } from 'react-icons/tb';
import { ImAccessibility } from 'react-icons/im';
import { BsFillPhoneFill, BsFillCheckCircleFill } from 'react-icons/bs';
import { updatePatient } from "./../../../components/patients/db/updatePatient";
import { BiPlusMedical } from 'react-icons/bi';
import { Alert } from "./../../../components/general/alert";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaQuestionCircle } from "react-icons/fa";
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { PatientRecord } from "./../../../components/patients/ui/patientRecord";
import { getInsuranceOptions } from "./../../../components/options/getInsuranceOpt";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from 'dayjs';
import { Loading } from "./../../../components/general/loading";
import { MoonLoader } from "react-spinners";
import { FaCheck } from "react-icons/fa6";
import { getUser } from "./../../../components/auth/getUser";

import { EditableRow } from "@/components/patients/ui/editableRow";

export default function PatientId() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null);
  const [isLoad, setIsLoad] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState('');
  const [check, setCheck] = useState(false);
  const pathname = usePathname()
  const id = (pathname.split('/').pop() || null) as string | null;
  const [patient, setPatient] = useState<any>(null);
  const [hovered, setHovered] = useState('');
  const [rowModify, setRowModify] = useState('');
  const [changes, setChanges] = useState<any>('');
  const [openAlert, setOpenAlert] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [openInfo, setOpenInfo] = useState(false);
  const [insuranceOptions, setInsuranceOptions] = useState<null | any[]>(null);
  const [date, setDate] = useState<null | any>(null);
  const [dateFormatted, setDateFormatted] = useState<null | any>(null);

  //CHECK IF THE USER IS LOGGED IN && GET USER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && patient) {
        handleGetUser();
      } else if (!user) {
        router.push("/notSign");
      }
    });

    async function handleGetUser() {
      const user = await getUser(false);
      setUser(user);
      const date = dayjs(patient.birthDate, "DD/MM/YYYY");
      setDateFormatted(date)
      setIsLoad(false);
    }

    return () => unsubscribe();
  }, [router, patient]);

  async function submitChanges(changes: string, table: string, category: string) {
    setLoadingCategory(category);
    setRowModify('');
    setHovered('')
    setChanges('')
    if (changes !== '') {
      const newPatient = await updatePatient(changes, table, id);
      if (newPatient) {
        setPatient(newPatient);
        setCheck(true);
      } else {
        setLoadingCategory('')
      }
    } else {
      setLoadingCategory('')
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoadingCategory('');
      setCheck(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [check]);

  useEffect(() => {
    if (date) {
      const formattedDate = dayjs(date.$d);
      const formattedDateString = formattedDate.format('DD/MM/YYYY');
      setChanges(formattedDateString)
    }

  }, [date]);

  useEffect(() => {
    async function get() {
      try {
        const data = await getPatient(id);
        setPatient(data);
        const options = await getInsuranceOptions();
        if (options) {
          setInsuranceOptions(options);
        }
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

  function handleKeyPress(event: any, changes: any, rowModify: any, category: string) {
    if (event.key === 'Enter') {
      submitChanges(changes, rowModify, category);
    } else if (event.key === 'Escape') {
      setRowModify('');
    }
  }

  if (id !== null) {
    return (
      <div className='ml-56'>
        {isLoad ? (
          <Loading />
        ) : (
          <div className='ml-2 p-4 mt-16 mr-2 relative'>
            {openAlert && (
              <div className='fixed inset-0 backdrop-blur-sm ml-56 z-10'>
                <Alert onCloseAlert={() => setOpenAlert(false)} onSuccess={() => { setOpenAlert(false); router.push('/patients'); }} action={'Eliminar Paciente'} firstProp={'¿Estás seguro/a de que deseas eliminar a este paciente?'} secondProp={'Esta accion sera permanente y no se podra volver atras'} thirdProp={id} />
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
                  <div className='mr-4 border-2 rounded-lg border-gray-600 bg-gray-300 bg-opacity-30 shadow-lg w-1/2 relative'>
                    <div className="ml-auto top-0 right-0 mt-2 mr-2 bg-teal-950 bg-opacity-80 rounded-full w-20 h-20 flex justify-center items-center shadow-lg absolute">
                      {loadingCategory === 'basic' ? (
                        <div>
                          <div className={`${check ? 'opacity-100 animate-move-from-bottom' : 'opacity-0'} duration-[1000ms] transition-opacity `}>
                            <FaCheck size={40} />
                          </div>
                          {check !== true && (
                            <MoonLoader className="mb-10" color="white" size={50} />
                          )}
                        </div>
                      ) : (
                        <ImAccessibility size={60} className="text-teal-600" />
                      )}
                    </div>
                    <div className='flex'>
                      <div>
                        <h1 className='mb-2 text-xl font-semibold text-white border-b-4 border-r-2 border-gray-600 bg-teal-600 w-full rounded-tl-md  rounded-br-3xl pl-6 py-0.5 select-none'>INFORMACIÓN BÁSICA</h1>
                        {/*name*/}
                        <EditableRow
                          label="Nombre"
                          value={patient.name}
                          rowKey="name"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                        {/*lastName*/}
                        <EditableRow
                          label="Apellido"
                          value={patient.lastName}
                          rowKey="lastName"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                        {/*DNI*/}
                        <EditableRow
                          label="DNI"
                          value={patient.dni}
                          rowKey="dni"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                        {/*Address*/}
                         <EditableRow
                          label="Domicilio"
                          value={patient.address}
                          rowKey="address"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                        {/*birthDate*/}
                         <EditableRow
                          label="Nacimiento"
                          value={patient.birthDate}
                          rowKey="birthDate"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                        {/*Gender*/}
                         <EditableRow
                          label="Género"
                          value={patient.gender}
                          rowKey="gender"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                      </div>
                    </div>
                  </div>
                  <div className='w-1/2'>
                    <div className='mr-4 border-2 rounded-lg border-gray-600 bg-gray-300 bg-opacity-30 shadow-lg w-full relative'>
                      <div className="ml-auto top-0 right-0 mt-2 mr-2 bg-teal-950 bg-opacity-80 rounded-full w-20 h-20 flex justify-center items-center shadow-lg absolute">
                        {loadingCategory === 'contact' ? (
                          <div>
                            <div className={`${check ? 'opacity-100 animate-move-from-bottom' : 'opacity-0'} duration-[1000ms] transition-opacity `}>
                              <FaCheck size={40} />
                            </div>
                            {check !== true && (
                              <MoonLoader className="mb-10" color="white" size={50} />
                            )}
                          </div>
                        ) : (
                          <BsFillPhoneFill size={55} className=' text-teal-600' />
                        )}
                      </div>
                      <div className=''>
                        <div className='flex'>
                          <div>
                            <h1 className='mb-2 text-xl font-semibold text-white border-b-4 border-r-2 border-gray-600 bg-teal-600  w-full rounded-tl-md  rounded-br-3xl px-6 py-0.5 select-none'>CONTACTO</h1>
                            <div onClick={() => {
                              if (rowModify !== 'num') {
                                setRowModify('num');
                                setChanges('');
                              }
                            }} onMouseEnter={() => setHovered('num')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'num' || rowModify === 'num' ? '' : 'border-transparent'} ${rowModify === 'num' ? 'border-teal-600' : ''}`}>
                              <h1 className='text-md text-black font-semibold'>Núm.Telefono:</h1>
                              {rowModify === 'num' ? (
                                <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify, 'contact')} ref={textareaRef} onMouseEnter={handleTextArea} autoFocus defaultValue={patient.num} className="rounded-md text-black bg-teal-600 bg-opacity-20 pl-1 flex h-16 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.num}</p>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'num' && rowModify !== 'num' && <TbPencilCog size={26} className="text-gray-600" />}
                              </div>
                              {rowModify === 'num' && (
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify, 'contact')}>
                                  <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                                </button>
                              )}
                            </div>
                            <div onClick={() => {
                              if (rowModify !== 'email') {
                                setRowModify('email');
                                setChanges('');
                              }
                            }} onMouseEnter={() => setHovered('email')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'email' || rowModify === 'email' ? '' : 'border-transparent'} ${rowModify === 'email' ? 'border-teal-600' : ''}`}>
                              <h1 className='text-md text-black font-semibold'>Correo:</h1>
                              {rowModify === 'email' ? (
                                <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify, 'contact')} ref={textareaRef} onMouseEnter={handleTextArea} autoFocus defaultValue={patient.email} className="rounded-md text-black bg-teal-600 bg-opacity-20 pl-1 flex h-16 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                              ) : (
                                <div>
                                  {patient.email ? (
                                    <p className='ml-2 text-gray-700 text-lg w-fit overflow-auto'>{patient.email}</p>
                                  ) : (
                                    <p className='ml-2 text-gray-700 text-lg w-fit overflow-auto'>-</p>
                                  )}
                                </div>
                              )}
                              <div className='ml-auto'>
                                {hovered === 'email' && rowModify !== 'email' && <TbPencilCog size={26} className="text-gray-600" />}
                              </div>
                              {rowModify === 'email' && (
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify, 'contact')}>
                                  <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='mr-4 border-2 rounded-lg border-gray-600 bg-gray-300 bg-opacity-30 shadow-lg w-full mt-4 relative'>
                      <div className="ml-auto top-0 right-0 mt-2 mr-2 bg-teal-950 bg-opacity-80 rounded-full w-20 h-20 flex justify-center items-center shadow-lg absolute">
                        {loadingCategory === 'medic' ? (
                          <div>
                            <div className={`${check ? 'opacity-100 animate-move-from-bottom' : 'opacity-0'} duration-[1000ms] transition-opacity `}>
                              <FaCheck size={40} />
                            </div>
                            {check !== true && (
                              <MoonLoader className="mb-10" color="white" size={50} />
                            )}
                          </div>
                        ) : (
                          <BiPlusMedical size={60} className="text-teal-600" />
                        )}
                      </div>
                      <div className=''>
                        <div className='flex'>
                          <div>
                            <h1 className='mb-2 text-xl font-semibold text-white border-b-4 border-r-2 border-gray-600 bg-teal-600  w-full rounded-tl-md rounded-br-3xl px-6 py-0.5 select-none'>SALUD</h1>
                            <div onClick={() => {
                              if (rowModify !== 'insurance') {
                                setRowModify('insurance');
                                setChanges('');
                              }
                            }} onMouseEnter={() => setHovered('insurance')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'insurance' || rowModify === 'insurance' ? '' : 'border-transparent'} ${rowModify === 'insurance' ? 'border-teal-600' : ''}`}>
                              <h1 className='text-md text-black font-semibold'>ObraSocial:</h1>
                              {rowModify === 'insurance' ? (
                                <select defaultValue={patient.insurance} onChange={(event) => setChanges(event.target.value)} onKeyDown={(event) => handleKeyPress(event, changes, rowModify, 'medic')} autoFocus className="rounded-md text-black bg-teal-600 bg-opacity-20 pl-1 flex h-8 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" name="" id="">
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
                                <button className="ml-auto" onClick={() => submitChanges(changes, rowModify, 'medic')}>
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
                                    setChanges('');
                                  }
                                }} onMouseEnter={() => setHovered('plan')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'plan' || rowModify === 'plan' ? '' : 'border-transparent'} ${rowModify === 'plan' ? 'border-teal-600' : ''}`}>
                                  <h1 className='text-md text-black font-semibold'>Plan:</h1>
                                  {rowModify === 'plan' ? (
                                    <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify, 'medic')} ref={textareaRef} onMouseEnter={handleTextArea} autoFocus defaultValue={patient.plan} className="rounded-md text-black bg-opacity-20 pl-1 bg-teal-600 flex h-7 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                                  ) : (
                                    <div>
                                      {patient.plan ? (
                                        <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.plan}</p>
                                      ) : (
                                        <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>-</p>
                                      )}
                                    </div>
                                  )}
                                  <div className='ml-auto'>
                                    {hovered === 'plan' && rowModify !== 'plan' && <TbPencilCog size={26} className="text-gray-600" />}
                                  </div>
                                  {rowModify === 'plan' && (
                                    <button className="ml-auto" onClick={() => submitChanges(changes, rowModify, 'medic')}>
                                      <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                                    </button>
                                  )}
                                </div>
                                <div onClick={() => {
                                  if (rowModify !== 'affiliateNum') {
                                    setRowModify('affiliateNum');
                                    setChanges('');
                                  }
                                }} onMouseEnter={() => setHovered('affiliateNum')} onMouseLeave={() => setHovered('')} className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === 'affiliateNum' || rowModify === 'affiliateNum' ? '' : 'border-transparent'} ${rowModify === 'affiliateNum' ? 'border-teal-600' : ''}`}>
                                  <h1 className='text-md text-black font-semibold'>Núm.Afiliado:</h1>
                                  {rowModify === 'affiliateNum' ? (
                                    <textarea onKeyDown={(event) => handleKeyPress(event, changes, rowModify, 'medic')} ref={textareaRef} onMouseEnter={handleTextArea} autoFocus defaultValue={patient.affiliateNum} className="rounded-md bg-opacity-20 pl-1 text-black bg-teal-600  flex h-7 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4" onChange={(event) => setChanges(event.target.value)} />
                                  ) : (
                                    <div>
                                      {patient.affiliateNum ? (
                                        <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{patient.affiliateNum}</p>
                                      ) : (
                                        <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>-</p>
                                      )}
                                    </div>
                                  )}
                                  <div className='ml-auto'>
                                    {hovered === 'affiliateNum' && rowModify !== 'affiliateNum' && <TbPencilCog size={26} className="text-gray-600" />}
                                  </div>
                                  {rowModify === 'affiliateNum' && (
                                    <button className="ml-auto" onClick={() => submitChanges(changes, rowModify, 'medic')}>
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
                  <div onClick={() => setOpenAlert(true)} className='select-none mt-4 border-2 rounded-lg border-red-600 bg-gray-300 bg-opacity-30 shadow-lg w-full relative text-center transition duration-200 cursor-pointer hover:text-white hover:bg-red-900 border-opacity-30 hover:bg-opacity-70 px-2 py-1 text-black text-xl font-medium'>
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
