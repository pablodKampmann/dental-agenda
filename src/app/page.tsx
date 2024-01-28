'use client'

import { useState, useEffect, useRef } from 'react';
import { setAppointment } from "./components/setAppointment";
import { getAppointments } from "./components/getAppointments";
import { SearchPatient } from "./components/searchPatient";
import { GetPatients } from "./components/getPatients"
import { BsPersonCheck, BsCalendar2Date, BsArrowLeftCircle, BsClipboardCheck } from 'react-icons/bs';
import { AiOutlineSchedule } from 'react-icons/ai';
import { ClipLoader } from "react-spinners";
import { GiClick } from "react-icons/gi";
import { FaTooth, FaFileMedicalAlt, FaShare } from "react-icons/fa";
import { ModalCreatePatient } from './components/modalCreatePatient'
import { useRouter } from 'next/navigation'
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { BiRightArrow, BiLeftArrow } from "react-icons/bi";
import { MdUpdate, MdAddCircleOutline, MdDeleteForever } from "react-icons/md";
import { ImCancelCircle } from "react-icons/im";
import { getReasonsOptions } from "./components/getReasonsOptions";
import { FiEdit } from "react-icons/fi";
export interface dateData {
  date: string;
  dayComplete: string;
  year: number;
  time: string;
}

export default function Page() {
  const router = useRouter()
  const [isLoad, setIsLoad] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedField, setSelectedField] = useState('name');
  const [searchContent, setSearchContent] = useState('');
  const [listPatients, setListPatients] = useState<null | any[] | string>(null);
  const [appointments, setAppointments] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [reason, setReason] = useState<any>(null);
  const [observations, setObservations] = useState<any>(null);
  const [today, setToday] = useState(new Date());
  const [date, setDate] = useState<any>(null);
  const [dayName, setDayName] = useState<any>(null);
  const [dayNum, setDayNum] = useState<any>(null);
  const [monthName, setMonthName] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState<any>(null);
  const [openModalCreatePatient, setOpenModalCreatePatient] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [hoveredOne, setHoveredOne] = useState(false);
  const [hoveredTwo, setHoveredTwo] = useState(false);
  const [hoveredThree, setHoveredThree] = useState(false);
  const [reasonsOptions, setReasonsOptions] = useState<null | any[]>(null);
  const navigationRef = useRef<any>(null);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoad(false);

      } else if (!user) {
        router.push("/notSign");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    setSearchContent('');
  }, [selectedField]);

  function handleCliclRow(time: string) {
    if (appointments && appointments.some((appointment: { time: string }) => appointment.time === time)) {
      setShowForm(false);
      setAppointmentDate(null);
      setPatient(null);
      setReason(null);
      setObservations(null);
    } else if (appointmentDate) {
      setShowForm(false);
      setAppointmentDate(null);
    } else {
      const parts = date.split("/");
      const year = parts[2];
      setAppointmentDate({
        date: date,
        dayComplete: `${dayName} ${dayNum} de ${monthName}`,
        year: year,
        time: time
      });
      setShowForm(true);
    }
  }

  async function handleSetAppoint(patientId: number, dateData: dateData, reason: string, observations?: string) {
    setShowSuccess(true);
    setShowForm(false);
    setAppointmentDate(null);
    setPatient(null);
    setReason(null);
    setObservations(null);
    await setAppointment(patientId, dateData, reason, observations);
    const formattedDate = date?.replace(/\//g, '');
    const appointments = await getAppointments(formattedDate)
    if (appointments === 'vacio') {
      setAppointments(null);
    } else {
      setAppointments(appointments);
    }
  }

  useEffect(() => {
    const formattedDate = date?.replace(/\//g, '');

    async function get() {
      const appointments = await getAppointments(formattedDate)
      const options = await getReasonsOptions();
      setReasonsOptions(options);
      if (appointments === 'vacio') {
        setAppointments(null);
      } else {
        setAppointments(appointments);
      }
    }

    get()
  }, [date]);



  useEffect(() => {
    const options = { timeZone: 'America/Argentina/Buenos_Aires' };
    const formattedDate = today.toLocaleDateString('es-AR', options);
    setDate(formattedDate);
    let dayName = today.toLocaleDateString('es-AR', { ...options, weekday: 'long' });
    dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    setDayName(dayName);
    const dayNum = today.toLocaleDateString('es-AR', { ...options, day: 'numeric' });
    setDayNum(dayNum);
    let monthName = today.toLocaleDateString('es-AR', { ...options, month: 'long' });
    monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    setMonthName(monthName);
  }, [today]);

  function dayBack() {
    const newDate = new Date(today);
    newDate.setDate(today.getDate() - 1);
    setToday(newDate);
  }

  function dayNext() {
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + 1);
    setToday(newDate);
  }

  function isToday(dateToCheck: Date) {
    const todayDate = new Date();
    return (
      dateToCheck.getDate() === todayDate.getDate() &&
      dateToCheck.getMonth() === todayDate.getMonth() &&
      dateToCheck.getFullYear() === todayDate.getFullYear()
    );
  }

  useEffect(() => {
    if (searchContent.length > 0) {
      Search();
    }
    if (searchContent === "") {
      Get();
    }

    async function Search() {
      const patientsFilter = await SearchPatient(selectedField, searchContent)
      if (patientsFilter.length < 1) {
        setListPatients(null)
      } else {
        setListPatients(patientsFilter)
      }
    }

    async function Get() {
      const patients = await GetPatients(1, 20);
      if (patients === null) {
        setListPatients('noResult')
      } else {
        setListPatients(patients.patients)
      }
    }
  }, [searchContent, selectedField])

  useEffect(() => {

    const timeoutId = setTimeout(() => {
      setShowSuccess(false);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [showSuccess]);

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
    if (patient && appointmentDate && reason) {
      navigationRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [patient, appointmentDate, reason]);

  return (
    <div className='mt-2 ml-56'>
      {isLoad ? (
        <div className='fixed inset-0 backdrop-blur-sm ml-56'>
          <div className='fixed inset-0 flex items-center justify-center'>
            <div className='bg-teal-900 py-10 px-10 rounded-full shadow-xl animate-spin'>
              <FaTooth size={100} />
            </div>
          </div>
        </div>
      ) : (
        <div className='ml-2 mr-2 p-4 mt-16 relative'>
          <div>
            {openModalCreatePatient && (
              <div className="fixed inset-0 backdrop-blur-sm ml-56 z-10">
                {/*<ModalCreatePatient onCloseModal={() => setOpenModalCreatePatient(false)} onSuccess={showSuccessAlert} /> */}
              </div>
            )}
            {showSuccess && (
              <div className="fixed top-16 right-0 py-2 px-4 border-2 border-green-900 mt-4 mr-6 rounded-lg bg-emerald-500 transform animate-move-from-right">
                <div className='flex justify-start items-center'>
                  <BsClipboardCheck className='text-black' size={36} />
                  <p className='ml-2 text-black font-semibold text-lg select-none'>Turno asignado exitosamente</p>
                </div>
              </div>
            )}
          </div>
          <div className='mb-4 flex justify-between items-center'>
            <div className='flex justify-center items-center'>
              {isToday(today) ? (
                <div className=' border-2 bg-teal-600 border-gray-600 pr-2 pl-1 rounded-lg  py-0.5 mr-2 '>
                  <h1 className='flex font-bold text-lg text-white select-none '><MdUpdate size={24} className="mt-0.5 mr-2" />HOY</h1>
                </div>
              ) : (
                <div onClick={() => setToday(new Date())} className='cursor-pointer hover:bg-teal-700 bg-gray-400 border-2 border-gray-600 bg-opacity-30 pr-2 pl-1 rounded-lg  py-0.5 mr-2 '>
                  <h1 className='flex font-bold text-lg text-black select-none '><MdUpdate size={24} className="mt-0.5 mr-2" />HOY</h1>
                </div>
              )}
              <BiLeftArrow onClick={dayBack} size={32} className="hover:text-white hover:bg-teal-600 transition duration-150 hover:scale-110 text-black cursor-pointer mr-2 bg-gray-400 bg-opacity-30 border-2 border-gray-600 rounded-lg py-1" />
              <div className='bg-gray-400 border-2 border-gray-600 bg-opacity-30 px-3 rounded-lg  py-0.5 '>
                <h1 className='flex font-bold text-lg text-black select-none'><BsCalendar2Date size={20} className="mt-1 mr-2" /> {dayName} {dayNum} de {monthName} ({date})</h1>
              </div>
              <BiRightArrow onClick={dayNext} size={32} className="hover:text-white hover:bg-teal-600 transition duration-150 hover:scale-110 text-black cursor-pointer ml-2 bg-gray-400 bg-opacity-30 border-2 border-gray-600 rounded-lg py-1" />
            </div>
            <button className='shadow-xl mt-2 h-11 bg-gray-400 bg-opacity-30 hover:bg-teal-600 hover:border-b-gray-600 group border-b-4 border-2 border-b-teal-600 border-gray-600 rounded-lg flex items-center justify-center transition duration-200' onClick={() => { setShowForm(!showForm); setPatient(null); setSearchContent(''); setAppointmentDate(null); setReason(null) }}>
              {showForm ? (
                <p className='text-xl text-black select-none font-semibold first-letter:transition duration-200 text-center flex px-4 group-hover:text-white'><ImCancelCircle size={20} className="mr-2 mt-1 font-semibold" /> Cancelar</p>
              ) : (
                <p className='text-xl text-black group-hover:text-white font-semibold first-letter:transition duration-200 text-center flex px-4 select-none'><MdAddCircleOutline size={24} className="mr-2 mt-0.5 font-semibold" /> Agregar Turno</p>
              )}
            </button>
          </div>
          <div className='flex justify-between'>
            <div className='bg-gray-400 bg-opacity-30 shadow-xl flex-1 h-[520px] w-full border-2 border-gray-600  rounded-lg overflow-y-auto'>
              <table>
                <tbody className='text-black '>
                  {['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((time, index, array) => (
                    <tr key={time}>
                      <td className={`text-black select-none cursor-default align-top px-3 translate-y-2 text-xs font-semibold  border-r ${index === array.length - 1 ? '' : 'border-b '} border-gray-600`}>{time}</td>
                      <td
                        className={`${appointments && appointments.filter((appointment: { time: string; }) => appointment.time === time).length ? 'bg-teal-600 pt-1 pb-1 px-2 hover:bg-opacity-70 hover:bg-teal-600' : 'p-8 '}
                         ${appointmentDate && appointmentDate.time === time && appointmentDate.date === date ? 'bg-gray-400 animate-breathe' : 'hover:bg-gray-900 hover:bg-opacity-30'} 
                         ${index === array.length - 1 ? '' : 'border-b '}
                         select-none w-full border-gray-600  text-center cursor-pointer items-center transition duration-200`}
                        onClick={() => handleCliclRow(time)}
                      >
                        {appointments &&
                          appointments
                            .filter((appointment: { time: string }) => appointment.time === time)
                            .map((filteredAppointment: {
                              patientData: any; id: number; time: string; reason: string; observations: string;
                            }) => {
                              const [hoursStr, minutesStr] = time.split(':');
                              const hours = parseInt(hoursStr, 10);
                              const newHours = hours + 1;
                              const newTime = `${newHours.toString().padStart(2, '0')}:${minutesStr}`;
                              return (
                                <div className='flex justify-between'>
                                  <div key={filteredAppointment.id} className='flex-col'>
                                    <p className='text-left text-xs font-bold'>
                                      {time}-{newTime}
                                    </p>
                                    <div className='flex'>
                                      <p className='text-left text-sm ml-2'> Paciente:</p>
                                      <p className='text-left text-sm font-semibold ml-1'>
                                        {filteredAppointment.patientData.name}{' '}
                                        {filteredAppointment.patientData.lastName}
                                      </p>
                                    </div>
                                    <div className='flex'>
                                      <p className='text-left text-sm ml-2'> DNI:</p>
                                      <p className='text-left text-sm font-semibold ml-1'>{filteredAppointment.patientData.dni}</p>
                                    </div>
                                    <div className='flex'>
                                      <p className='text-left text-sm ml-2'> Contacto:</p>
                                      <p className='text-left text-sm font-semibold ml-1'>{filteredAppointment.patientData.num} <br /> {filteredAppointment.patientData.email}</p>
                                    </div>
                                  </div>
                                  <div className='mt-3'>
                                    <div className='flex'>
                                      <p className='text-left text-sm ml-2'> Razón de turno:</p>
                                      <p className='text-left text-sm font-semibold ml-1'>{filteredAppointment.reason}</p>
                                    </div>
                                    <div className='flex'>
                                      <p className='text-left text-sm ml-2'> Observaciones:</p>
                                      {filteredAppointment.observations ? (
                                        <p className='text-left text-sm font-semibold ml-1'>{filteredAppointment.observations}</p>
                                      ) : (
                                        <p className='text-left text-sm font-semibold ml-1'>Ninguna</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className='flex-col my-1'>
                                    <FaShare className="text-black" size={30} />
                                    <MdDeleteForever className="text-black flex mt-2 mb-2 mr-1" size={32} />
                                    <FiEdit className="text-black mt-1" size={30} />
                                  </div>
                                </div>
                              );
                            })
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex w-[35%] ml-10 h-[520px]">
              {showForm ? (
                <div className='flex-1 flex-col border-2 border-gray-600 rounded-lg shadow-xl h-full bg-gray-400 bg-opacity-30 overflow-y-auto'>
                  <div className='border-gray-600 border-b-4 flex-1 p-2'>
                    {appointmentDate ? (
                      <div>
                        <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default mt-1 shadow-lg'>
                          <AiOutlineSchedule size={38} className="text-white ml-2" />
                        </div>
                        <div onClick={() => { setAppointmentDate(null); setHoveredOne(false) }} onMouseEnter={() => setHoveredOne(true)} onMouseLeave={() => setHoveredOne(false)} className='bg-white mt-4 mb-2 mx-4 py-1 transition duration-150 border-2 border-gray-600 rounded-lg flex-col hover:bg-red-500 hover:bg-opacity-10   flex justify-center items-center cursor-pointer'>
                          {hoveredOne ? (
                            <div className='flex'>
                              <ImCancelCircle size={40} className=" text-red-600" />
                            </div>
                          ) : (
                            <div>
                              <div className='flex'>
                                <p className='text-sm text-black text-center select-none'>Día seleccionado: </p>
                                <p className='ml-1 text-sm text-black text-center font-bold select-none'>{appointmentDate.dayComplete}, {appointmentDate.year}</p>
                              </div>
                              <div className='flex justify-center'>
                                <p className='text-sm flex-col text-black text-center select-none'>Horario seleccionado: </p>
                                <p className='ml-1 text-sm text-black text-center font-bold select-none'>{appointmentDate.time} </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default shadow-lg mt-1'>
                          <h1 className='font-black	text-2xl text-white mr-2 select-none'>1.</h1>
                          <h1 className='text-xl font-bold text-white text-center cursor-default mt-1 select-none'>Selecciona la fecha</h1>
                        </div>
                        <div className='flex-col   border-2 border-gray-600 rounded-lg shadow-xl mx-4 mt-4 mb-2 bg-gray-200 bg-opacity-30 py-1'>
                          <BsArrowLeftCircle className="m-auto mt-2 mb-1 text-teal-600" size={120} />
                          <h1 className='m-auto text-center font-medium text-lg select-none text-black'>SELECCIONA EL DIA Y HORARIO <br /> EN EL CALENDARIO</h1>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='border-gray-600 border-b-4 flex-1 p-2'>
                    {patient ? (
                      <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 mt-1 cursor-default shadow-lg'>
                        <BsPersonCheck size={32} className="ml-2" />
                      </div>
                    ) : (
                      <div>
                        <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default shadow-lg mt-1'>
                          <h1 className='font-black	text-2xl text-white mr-2 select-none'>2.</h1>
                          <h1 className='text-xl font-bold text-white text-center cursor-default mt-1 select-none'>Selecciona el paciente</h1>
                        </div>
                        <div className='mt-4 mx-4 flex'>
                          <input name='search'
                            value={searchContent}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (selectedField === 'dni') {
                                const numericValue = inputValue.replace(/[^0-9]/g, '');
                                setSearchContent(numericValue);
                              } else {
                                setSearchContent(inputValue);
                              }
                            }}
                            type="text" placeholder='Busca un paciente' className='select-none focus:border-3 focus:outline-none focus:border-teal-600 rounded-lg text-black h-10 shadow-lg p-2 w-full bg-gray-200 bg-opacity-30 border-2 border-gray-600' />
                          <button onClick={() => setSelectedField('dni')} className={`${selectedField === 'dni' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-gray-200 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg ml-4 border-2 focus:outline-none border-gray-600 text-md font-semibold rounded-l-lg transition duration-300 px-3 select-none w-24`}>DNI</button>
                          <button onClick={() => setSelectedField('name')} className={`${selectedField === 'name' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-gray-200 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg border-2 focus:outline-none border-gray-600 text-md font-semibold rounded-r-lg transition duration-300 px-3 select-none w-24`}>NOMBRE</button>
                        </div>
                      </div>
                    )}
                    <div className='mt-4 ml-4 mr-4 mb-2 border-2 border-gray-600 rounded-lg bg-gray-200 shadow-xl bg-opacity-30 overflow-auto'>
                      <div className={`${patient ? '' : 'h-40'} `}>
                        {listPatients && typeof listPatients !== 'string' ? (
                          <div>
                            {patient ? (
                              <div onClick={() => { setPatient(null); setHoveredTwo(false) }} onMouseEnter={() => setHoveredTwo(true)} onMouseLeave={() => setHoveredTwo(false)} className='hover:bg-red-500 hover:bg-opacity-10 bg-white transition duration-150   cursor-pointer  '>
                                {hoveredTwo ? (
                                  <div className='flex justify-center items-center'>
                                    <ImCancelCircle size={44} className=" text-red-600 py-1" />
                                  </div>
                                ) : (
                                  <div>
                                    <div className='flex justify-center items-center py-3 bg-white '>
                                      <p className='text-sm text-black text-center select-none'>Paciente seleccionado: </p>
                                      <p className='ml-1 text-sm text-black text-center font-bold select-none'>{patient.name} {patient.lastName}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                {listPatients.map((patient, index) => (
                                  <div key={index} onClick={() => setPatient(patient)} className="p-1 select-none hover:bg-gray-400 text-black text-base border-b border-gray-600 transition duration-100 cursor-pointer flex justify-between">
                                    <p className='ml-1'>
                                      {patient.name} {patient.lastName}
                                    </p>
                                    <p className='mr-1'>
                                      {patient.dni}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="ml-2 p-1">
                            {listPatients === 'noResult' ? (
                              <p>Sin resultados...</p>
                            ) : (
                              <div className='flex justify-center items-center mt-14 mb-14'>
                                <ClipLoader color='rgb(20 184 166)' size={36} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {!patient && (
                      <div className='flex ml-1'>
                        <p className='ml-4 mb-1 mt-0.5 text-gray-500 text-sm font-medium select-none'>No encontras un paciente?</p>
                        <div onClick={() => setOpenModalCreatePatient(true)} className='cursor-pointer flex items-center'>
                          <p className='ml-2 mb-0.5 text-gray-500 text-sm font-extrabold select-none '>Cargalo ahora</p>
                          <GiClick className="ml-1 mb-1 text-gray-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='border-gray-600 border-b-4 flex-1 p-2'>
                    {reason ? (
                      <div>
                        <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default shadow-lg mt-1'>
                          <FaFileMedicalAlt size={28} className="ml-2" />
                        </div>
                        <div onClick={() => { setReason(null); setHoveredThree(false) }} onMouseEnter={() => setHoveredThree(true)} onMouseLeave={() => setHoveredThree(false)} className='bg-white mt-4 mb-2 mx-4 transition duration-150 border-2 border-gray-600 rounded-lg flex-col hover:bg-red-500 hover:bg-opacity-10    flex justify-center items-center cursor-pointer'>
                          {hoveredThree ? (
                            <div className='flex py-1'>
                              <ImCancelCircle size={36} className=" text-red-600" />
                            </div>
                          ) : (
                            <div>
                              <div className='flex py-3'>
                                <p className='text-sm text-black text-center select-none'>Razón: </p>
                                <p className='ml-1 text-sm text-black text-center font-bold select-none'>{reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default shadow-lg mt-1'>
                          <h1 className='font-black	text-2xl text-white mr-2 select-none'>3.</h1>
                          <h1 className='text-xl font-bold text-white text-center cursor-default mt-1 select-none'>Motivo del turno</h1>
                        </div>
                        <div className='mx-2 mt-4 mb-2 px-2 flex'>
                          <h1 className='text-black text-xl mt-0.5 font-semibold select-none'>Razón:</h1>
                          <select
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            className=" select-none rounded-lg text-black border-2 border-gray-600 bg-gray-200 bg-opacity-30 flex py-1 ml-2 font-semibold shadow-xl focus:outline-none focus:text-black text-lg w-full"
                          >
                            <option value="" disabled selected>
                              Seleccionar
                            </option>
                            {reasonsOptions?.map((reason, index) => (
                              <option key={index} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className=" flex-1 p-2">
                    <div ref={navigationRef} className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default shadow-lg mt-1'>
                      <h1 className='font-black	text-2xl text-white mr-2 select-none'>4.</h1>
                      <h1 className='text-xl font-bold text-white text-center cursor-default mt-1 select-none'>Confirmar turno</h1>
                    </div>
                    {patient && appointmentDate && reason ? (
                      <div className='mt-4 ml-2 mr-2 mb-2 flex'>
                        <div className='ml-1 mr-1 border-2 border-gray-600 rounded-lg bg-white w-full p-1'>
                          <h1 className='text-xl font-bold text-black select-none text-center'>Resumen: </h1>
                          <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                            <p className='ml-1  text-lg font-bold text-black select-none text-left'>Fecha: </p>
                            <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>Dia: {appointmentDate.dayComplete}, {appointmentDate.year} <br /> Horario: {appointmentDate.time}</p>
                          </div>
                          <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                            <p className='ml-1 text-lg font-bold text-black text-left select-none'>Paciente: </p>
                            <p className='ml-1 text-sm text-black text-left font-bold'>Nombre: {patient.name} {patient.lastName} <br /> DNI: {patient.dni} <br />Edad: {getAge(patient.birthDate)} años</p>
                            {patient.insurance === 'Particular' ? (
                              <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>Obra Social: {patient.insurance}</p>
                            ) : (
                              <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>Obra Social: {patient.insurance} <br /> Plan:  {patient.plan}<br />Número de afiliado: {patient.affiliateNum}</p>
                            )}
                          </div>
                          <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                            <p className='ml-1 text-lg font-bold text-black select-none text-left'>Razón: </p>
                            <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>{reason}</p>
                          </div>
                          <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                            <p className='ml-1 text-lg font-bold text-black select-none text-left'>Observaciones (opcional): </p>
                            <textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder='Ninguna'
                              className='resize-none text-black font-medium px-2 py-1 w-full h-20 focus:outline-none text-sm'></textarea>
                          </div>

                          <div autoFocus onClick={() => handleSetAppoint(patient.id, appointmentDate, reason, observations)} className='flex justify-center items-center text-xl font-semibold transition duration-200 text-black  rounded-lg ml-2 mr-2 mb-1 mt-4 p-1 cursor-pointer hover:bg-teal-600 hover:text-white border-gray-600 border-2 bg-white'>
                            Confirmar
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='mt-4 ml-2 mr-2 mb-2 flex'>
                        <div className='ml-1 mr-1 border-2 border-gray-600 rounded-lg bg-gray-200 bg-opacity-30 w-full p-1 shadow-xl'>
                          <p className='text-lg font-semibold select-none text-black text-center'>Completa los datos anteriores antes de confirmar el turno</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                null
              )}
            </div>
          </div >
        </div >
      )
      }
    </div >
  )
}
