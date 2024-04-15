'use client'

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { setAppointment } from "./components/appointments/setAppointment";
import { getAppointments } from "./components/appointments/getAppointments";
import { SearchPatient } from "./components/patients/searchPatient";
import { GetPatients } from "./components/patients/getPatients"
import { BsPersonCheck, BsCalendar2Date, BsArrowLeftCircle, BsClipboardCheck } from 'react-icons/bs';
import { AiOutlineSchedule } from 'react-icons/ai';
import { ClipLoader } from "react-spinners";
import { GiClick } from "react-icons/gi";
import { FaFileMedicalAlt, FaShare } from "react-icons/fa";
import { Loading } from "./components/style/loading";
import { ModalCreatePatient } from './components/style/modalCreatePatient'
import { useRouter } from 'next/navigation'
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { BiRightArrow, BiLeftArrow, BiError, BiSolidBookAdd } from "react-icons/bi";
import { MdUpdate, MdDeleteForever } from "react-icons/md";
import { ImCancelCircle } from "react-icons/im";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { IoTimeOutline } from "react-icons/io5";
import { Alert } from "./components/style/alert";
import { TiDocumentDelete } from "react-icons/ti";
import { getChapter } from "./components/practices/getChapter";

export interface dateData {
  date: string;
  dayComplete: string;
  year: number;
  time: string;
}
interface CustomDayjs extends Dayjs {
  $d: Date;
}

export default function Page() {
  const router = useRouter()
  const [calendarValue, setCalendarValue] = React.useState<Dayjs | null>(dayjs(new Date()));
  const [isLoad, setIsLoad] = useState(true);
  const [isLoadAppoints, setIsLoadAppoints] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [openModalAppointment, setOpenModalAppointment] = useState(false);
  const [openAlertMessage, setOpenAlertMessage] = useState(false);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [Field, setField] = useState('name');
  const [searchContent, setSearchContent] = useState('');
  const [listPatients, setListPatients] = useState<null | any[] | string>(null);
  const [appointments, setAppointments] = useState<any>(null);
  const [appointmentSelect, setAppointmentSelect] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [reason, setReason] = useState<any>(null);
  const [observations, setObservations] = useState<any>(null);
  const [today, setToday] = useState(new Date());
  const [date, setDate] = useState<any>(null);
  const [dayName, setDayName] = useState<any>(null);
  const [dayNum, setDayNum] = useState<any>(null);
  const [monthName, setMonthName] = useState<any>(null);
  const [alwaysToday, setAlwaysToday] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState<any>(null);
  const [appointmentHours, setAppointmentHours] = useState<any>(1);
  const [openModalCreatePatient, setOpenModalCreatePatient] = useState(false);
  const [showResult, setShowResult] = useState<any>(null);
  const [reasonsOptions, setReasonsOptions] = useState<null | any[]>(null);
  const [freeSpaces, setFreeSpaces] = useState<any>(null);
  const confirmRef = useRef<any>(null);
  const newPatientRef = useRef<any>(null);
  const calendarRef = useRef<any>(null);
  const selectDateRef = useRef<any>(null);
  const selectPatientRef = useRef<any>(null);
  const selectReasonRef = useRef<any>(null);
  const [time, setTime] = useState(getCurrentTime());
  const [chapterName, setChapterName] = useState<string>('');
  const [chapterData, setChapterData] = useState<any>(null);

  //CHECK IF THE USER IS LOGGED IN && GET USER
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

  //PATIENTS LOGIC
  useEffect(() => {
    if (searchContent.length > 0) {
      Search();
    }
    if (searchContent === "") {
      Get();
    }

    async function Search() {
      const patientsFilter = await SearchPatient(Field, searchContent)
      if (patientsFilter.length < 1) {
        setListPatients('noResult')
      } else {
        setListPatients(patientsFilter)
      }
    }

    async function Get() {
      const patients = await GetPatients(20);
      if (patients) {
        setListPatients(patients.patients)
      } else {
        setListPatients('noResult')
      }
    }
  }, [searchContent, Field])

  useEffect(() => {
    setSearchContent('');
  }, [Field]);

  async function updateListPatients() {
    const patients = await GetPatients(20);
    if (patients) {
      setListPatients(patients.patients)
    } else {
      setListPatients('noResult')
    }
  }

  //DATE LOGIC
  useEffect(() => {
    const formattedDate = date?.replace(/\//g, '');
    setIsLoadAppoints(true);

    async function get() {
      let appointments = await getAppointments(formattedDate)
      if (appointments === 'vacio') {
        setAppointments(null);
        setIsLoadAppoints(false);
      } else {
        if (!Array.isArray(appointments)) {
          appointments = Object.values(appointments);
        }
        setAppointments(appointments);
        setIsLoadAppoints(false);
      }
      //const options = await getReasonsOptions();
      //setReasonsOptions(options);
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

  useEffect(() => {
    const options = { timeZone: 'America/Argentina/Buenos_Aires' };
    const dateToday = new Date()
    let dayName = dateToday.toLocaleDateString('es-AR', { ...options, weekday: 'long' });
    dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dayNum = dateToday.toLocaleDateString('es-AR', { ...options, day: 'numeric' });
    setDayNum(dayNum);
    let monthName = dateToday.toLocaleDateString('es-AR', { ...options, month: 'long' });
    monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const date = dayName + ' ' + dayNum + ' de ' + monthName
    setAlwaysToday(date);
  }, []);

  function dayBack() {
    setOpenCalendar(false);
    const newDate = new Date(today);
    newDate.setDate(today.getDate() - 1);
    setToday(newDate);
    const newDayjsDate = dayjs(calendarValue).subtract(1, 'day');
    setCalendarValue(newDayjsDate)
  }

  function dayNext() {
    setOpenCalendar(false);
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + 1);
    setToday(newDate);
    const newDayjsDate = dayjs(calendarValue).add(1, 'day');
    setCalendarValue(newDayjsDate)
  }

  function isToday(dateToCheck: Date) {
    const todayDate = new Date();
    return (
      dateToCheck.getDate() === todayDate.getDate() &&
      dateToCheck.getMonth() === todayDate.getMonth() &&
      dateToCheck.getFullYear() === todayDate.getFullYear()
    );
  }

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
    setOpenCalendar(false);
    const day = (calendarValue as CustomDayjs)?.$d;
    setToday(day);
  }, [calendarValue]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentTime());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    //console.log(appointments);

    return `${hours}:${minutes}`;
  }

  //APPOINTMENTS LOGIC
  function clean() {
    setShowForm(false);
    setAppointmentDate(null);
    setPatient(null);
    setReason(null);
    setObservations(null);
    setFreeSpaces(null);
    setSearchContent('');
  }

  function handleCliclRow(time: string, event: any) {
    if (!isLoadAppoints) {
      if (appointments && appointments.some((appointment: { time: string }) => appointment.time === time)) {
        clean();
        const appointment = appointments.find((appointment: { time: string; }) => appointment && appointment.time === time);
        setAppointmentSelect(appointment)
        setOpenModalAppointment(true);
        setMousePosition({ x: event.clientX, y: event.clientY });
      } else if (appointmentDate) {
        clean();
      } else {
        setOpenModalAppointment(false);
        const parts = date.split("/");
        const year = parts[2];
        setAppointmentDate({
          date: date,
          dayComplete: `${dayName} ${dayNum} de ${monthName}`,
          year: year,
          time: time,
        });
        setShowForm(true);
      }
    }
  }

  async function handleSetAppoint(patientId: number, dateData: dateData, reason: string, observations?: string) {
    setIsLoadAppoints(true);
    clean();
    const result = await setAppointment(patientId, dateData, observations);
    const formattedDate = date?.replace(/\//g, '');
    let appointments = await getAppointments(formattedDate)
    if (appointments === 'vacio') {
      setAppointments(null);
      setIsLoadAppoints(false);
    } else {
      if (!Array.isArray(appointments)) {
        appointments = Object.values(appointments);
      }
      setAppointments(appointments);
      setIsLoadAppoints(false);
    }
    if (result === 'error') {
      setShowResult('error');
    } else {
      setShowResult('good');
    }
  }

  useEffect(() => {
    if (appointmentDate && appointments) {
      const hour = parseInt(appointmentDate.time.split(':')[0]);
      const nextHour = hour + 1;
      const twoHoursLater = hour + 2;

      const validAppointments = appointments.filter(
        (appointment: { time: any; }) => appointment && appointment.time
      );

      const isNextHourOccupied = validAppointments.find((appointment: { time: string; }) => {
        const appointmentHour = parseInt(appointment.time.split(':')[0]);
        return appointmentHour === nextHour;
      });

      const areTwoHoursFree = !validAppointments.find((appointment: { time: string; }) => {
        const appointmentHour = parseInt(appointment.time.split(':')[0]);
        return appointmentHour === nextHour || appointmentHour === twoHoursLater;
      });

      if (isNextHourOccupied) {
        setFreeSpaces(0)
      } else if (areTwoHoursFree) {
        setFreeSpaces(2)
      } else {
        setFreeSpaces(1)
      }
    }
  }, [appointmentDate, appointments]);

  useEffect(() => {
    if (appointmentDate) {
      const hour = parseInt(appointmentDate.time.split(':')[0]);
      const nextHour = hour + 1;
      const twoHoursLater = hour + 2;
      const updatedAppointmentDate = {
        ...appointmentDate,
        ...(appointmentHours == 2 ? { time2: (nextHour + ":00") } : {}),
        ...(appointmentHours == 3 ? { time2: (nextHour + ":00"), time3: (twoHoursLater + ":00") } : {})
      };

      setAppointmentDate(updatedAppointmentDate)
    }
  }, [appointmentHours]);

  useEffect(() => {
    setAppointmentHours(1);

  }, [appointmentDate]);

  async function handleSuccessDeleteAppointment() {
    setOpenAlertMessage(false);
    setIsLoadAppoints(true);
    const formattedDate = date?.replace(/\//g, '');
    let appointments = await getAppointments(formattedDate)
    if (appointments === 'vacio') {
      setAppointments(null);
      setIsLoadAppoints(false);
      setShowResult('good-delete-appointment')
    } else {
      if (!Array.isArray(appointments)) {
        appointments = Object.values(appointments);
      }
      setAppointments(appointments);
      setIsLoadAppoints(false);
      setShowResult('good-delete-appointment')
    }
  }

  function timeCalc(time: string) {
    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const newHours = hours + 1;
    const newTime = `${newHours.toString().padStart(2, '0')}:${minutesStr}`;
    return newTime;
  }

  //POP-UP MESSAGES
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowResult(null);
    }, 6000);

    return () => clearTimeout(timeoutId);
  }, [showResult]);

  //USER EXPERIENCE
  useEffect(() => {
    if (newPatientRef.current) {
      newPatientRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [listPatients]);

  useEffect(() => {
    if (selectDateRef.current) {
      selectDateRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [appointmentDate]);

  useEffect(() => {
    if (selectPatientRef.current) {
      selectPatientRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [patient]);

  useEffect(() => {
    if (selectReasonRef.current) {
      selectReasonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [reason]);


  useEffect(() => {
    if (patient && appointmentDate && reason) {
      confirmRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [patient, appointmentDate, reason]);

  useEffect(() => {
    const handleClickOutside = (event: { target: any; }) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setOpenCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarRef]);


  useEffect(() => {
    async function getChapterData() {
      //setIsLoadData(true);
      const { data, chapterNum } = await getChapter(chapterName)
      if (data && chapterNum) {
        const filteredData = data.filter(item => !Object.values(item).every(value => value === undefined));
        filteredData.sort((a, b) => {
          if (a.id && b.id) {
            return parseInt(a.id) - parseInt(b.id);
          }
          return 0;
        });
        setChapterData(filteredData);
        console.log(filteredData);

        // setChapterNum(chapterNum);
        // setIsLoadData(false);
      }
    }

    if (chapterName !== '') {
      getChapterData();
    }
  }, [chapterName]);

  function formatPrice(price: number) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return (
    <div className='ml-56 h-screen overflow-y-hidden flex-1 ' >
      {isLoad ? (
        <Loading />
      ) : (
        <div className='ml-2 mr-2 p-4 mt-16'>
          <div className='mt-2'>
            {openModalCreatePatient && (
              <div className="fixed inset-0 backdrop-blur-sm ml-56 z-10">
                <ModalCreatePatient onCloseModal={() => setOpenModalCreatePatient(false)} onSuccess={() => { setShowResult('good-patient'); updateListPatients() }} />
              </div>
            )}
            {showResult === 'good' && (
              <div className="fixed shadow-xl  top-16 right-0 py-2 px-4 border-2 border-green-900 mt-4 mr-6 rounded-lg bg-emerald-500 bg-opacity-95  transform animate-move-from-right">
                <div className='flex justify-start items-center'>
                  <BsClipboardCheck className='text-black' size={36} />
                  <p className='ml-2 text-black font-semibold text-lg select-none'>Turno asignado exitosamente</p>
                </div>
              </div>
            )}
            {showResult === 'good-patient' && (
              <div className="fixed shadow-xl  top-16 right-0 py-2 px-4 border-2 border-green-900 mt-4 mr-6 rounded-lg bg-emerald-500 bg-opacity-95 transform animate-move-from-right">
                <div className='flex justify-start items-center'>
                  <BsClipboardCheck className='text-black' size={36} />
                  <p className='ml-2 text-black font-semibold text-lg select-none'>Paciente agregado exitosamente</p>
                </div>
              </div>
            )}
            {showResult === 'error' && (
              <div className=" fixed shadow-xl top-16 right-0 py-1 pl-1 pr-2 border-2 border-red-900 mt-4 mr-6 rounded-lg bg-red-400 bg-opacity-95 transform animate-move-from-right">
                <div className='flex justify-start items-center'>
                  <BiError className='text-black' size={42} />
                  <p className='ml-1 text-black font-semibold text-lg select-none'>Error:</p>
                  <p className='ml-1 text-black font-medium text-sm mt-0.5 select-none'>Por favor, verifique su conexión a internet e intente nuevamente.</p>
                </div>
              </div>
            )}
            {showResult === 'good-delete-appointment' && (
              <div className="fixed shadow-xl  top-16 right-0 py-2 px-4 border-2 border-green-900 mt-4 mr-6 rounded-lg bg-emerald-500 bg-opacity-95 transform animate-move-from-right">
                <div className='flex justify-start items-center'>
                  <TiDocumentDelete className='text-black' size={36} />
                  <p className='ml-2 text-black font-semibold text-lg select-none'>El turno a sido eliminado.</p>
                </div>
              </div>
            )}
            {openAlertMessage && (
              <div className='absolute inset-0 backdrop-blur-sm ml-56 z-10'>
                <Alert onCloseAlert={() => setOpenAlertMessage(false)} onSuccess={handleSuccessDeleteAppointment} action={'Eliminar Turno'} firstProp={'¿Estás seguro/a de que deseas elimanar el turno?'} secondProp={appointmentSelect} />
              </div>
            )}
            {openModalAppointment && (
              <div
                className='bg-black rounded-xl shadow-xl opacity-90  absolute px-2 py-1 select-none animate-modal-appointment'
                style={{
                  left: `${mousePosition.x + 10}px`,
                  top: `${mousePosition.y}px`
                }}
              >
                <div className='flex-col'>
                  <h1 className='text-xl font-medium flex justify-center items-center border-b pb-2'>Acciones <ImCancelCircle onClick={() => setOpenModalAppointment(false)} size={24} className="ml-6 mt-1 font-semibold hover:text-teal-500 cursor-pointer duration-150 transform hover:scale-110" /></h1>
                  <button onClick={() => { setOpenModalAppointment(false); setOpenAlertMessage(true); setShowResult(null) }} className='flex justify-center items-center group hover:text-teal-500'><MdDeleteForever className="text-white group-hover:text-teal-500 flex mt-2 mb-2 mr-1" size={20} />Eliminar </button>
                  <button className='flex justify-center items-center group hover:text-teal-500'><FaShare className="text-white group-hover:text-teal-500 flex mt-2 mb-2 mr-1" size={20} />Compartir </button>
                </div>
              </div>
            )}
          </div>
          <div className='mb-6 flex justify-between items-center '>
            <div className='flex justify-center items-center'>
              {isToday(today) ? (
                <div className=' border-2 bg-teal-600 border-gray-600 pr-2 pl-1 transition duration-150 rounded-lg  py-0.5 mr-2 '>
                  <h1 className='flex font-bold text-lg text-white select-none '><MdUpdate size={24} className="mt-0.5 mr-2" />HOY</h1>
                </div>
              ) : (
                <div onClick={() => { setToday(new Date()); setOpenCalendar(false); setCalendarValue(dayjs(new Date())) }} className='cursor-pointer transition text-black duration-150 hover:text-white hover:bg-teal-600 bg-gray-300 border-2  border-gray-600 bg-opacity-30 pr-2 pl-1 rounded-lg  py-0.5 mr-2 '>
                  <h1 className='flex font-bold text-lg  select-none '><MdUpdate size={24} className="mt-0.5 mr-2" />HOY</h1>
                </div>
              )}
              <BiLeftArrow onClick={dayBack} size={34} className="hover:text-white hover:bg-teal-600 transition duration-150 text-black cursor-pointer mr-2 bg-gray-300 bg-opacity-30 border-2 border-gray-600 rounded-lg py-1" />
              <div ref={calendarRef} className='relative'>
                <div onClick={() => setOpenCalendar(!openCalendar)} className={`${openCalendar ? 'bg-teal-600 text-white' : 'text-black bg-gray-300 bg-opacity-30'} transition hover:text-white duration-150 hover:bg-teal-600 cursor-pointer   border-2 border-gray-600  px-3 rounded-lg  `}>
                  <h1 className='flex justify-center items-center font-semibold text-md h-8  select-none'><BsCalendar2Date size={20} className=" mr-2" /> {dayName} {dayNum} de {monthName} ({date})</h1>
                </div>
                {openCalendar && (
                  <div className=' select-none absolute bg-white text-black border-2 border-gray-600 rounded-lg top-10 z-10'>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                      <DemoContainer components={['DateCalendar']}>
                        <DateCalendar
                          value={calendarValue}
                          onChange={(newValue) => setCalendarValue(newValue)}
                          views={['day', 'year']}
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                  </div>
                )}
              </div>
              <BiRightArrow onClick={dayNext} size={34} className="hover:text-white hover:bg-teal-600 transition duration-150 text-black cursor-pointer ml-2 bg-gray-300 bg-opacity-30 border-2 border-gray-600 rounded-lg py-1" />
              {isLoadAppoints && (
                <ClipLoader className='ml-4' />
              )}
            </div>
            <button onClick={() => { setShowForm(!showForm); setPatient(null); setSearchContent(''); setAppointmentDate(null); setReason(null) }} type="button" className="select-none shadow-lg h-10 group text-black bg-gray-300 bg-opacity-30 hover:bg-teal-600 hover:border-gray-600 hover:text-white text-xl font-semibold  px-4 border-b-4 border-2 border-b-teal-600 border-gray-600 rounded-lg flex items-center justify-center transition duration-200">
              {showForm ? (
                <p className='text-xl text-black select-none font-semibold first-letter:transition duration-200 text-center flex px-4 group-hover:text-white'><ImCancelCircle size={20} className="mr-2 mt-1 font-semibold" /> Cancelar</p>
              ) : (
                <div className='flex'>
                  <BiSolidBookAdd className=" mr-2 mt-1" size={24} />
                  Agregar Turno
                </div>
              )}
            </button>
          </div>
          <div className='flex justify-between h-screen pb-44 overflow-y-hidden w-full'>
            <h1 className='text-center bg-teal-600 border-t-2 border-b-2 border-l-2 border-gray-600 rounded-bl-lg rounded-tl-lg shadow-xl text-white font-semibold text-4xl select-none px-4 pt-2'>A <br /> G <br />E <br />N <br />D <br />A</h1>
            <div className='bg-gray-300 bg-opacity-30  shadow-xl flex-1 transition-width  border-2 border-gray-600 rounded-r-lg overflow-y-auto '>
              <table>
                <tbody className='text-black '>
                  {['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((time, index, array) => (
                    <tr key={time}>
                      <td className={`text-black select-none cursor-default align-top px-3 text-xs font-semibold pt-2 border-r ${index === array.length - 1 ? '' : 'border-b '} border-gray-600`}>
                        {time}
                      </td>
                      <td
                        className={`${(appointments && Array.isArray(appointments) && appointments.filter((appointment: { time: string; }) => appointment.time === time).length) ? 'bg-teal-600 bg-opacity-20 ml-4 pt-1 pb-1 px-2 hover:bg-opacity-70 hover:bg-teal-600' : 'p-8 '}
                          ${appointmentDate && appointmentDate.time === time && appointmentDate.date === date ? 'bg-gray-300 animate-breathe' : 'hover:bg-gray-900 hover:bg-opacity-30'} 
                          ${appointmentDate && appointmentDate.time2 === time && appointmentDate.date === date ? 'bg-gray-300 animate-breathe' : 'hover:bg-gray-900 hover:bg-opacity-30'} 
                          ${appointmentDate && appointmentDate.time3 === time && appointmentDate.date === date ? 'bg-gray-300 animate-breathe' : 'hover:bg-gray-900 hover:bg-opacity-30'} 
                          ${index === array.length - 1 ? '' : 'border-b '}
                          select-none w-full border-gray-600  text-center cursor-pointer items-center transition duration-200`}
                        onClick={(e) => handleCliclRow(time, e)}
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
                                <div key={filteredAppointment.id} className='flex justify-between' >
                                  <div className='flex-col'>
                                    <p className='text-left text-xs font-bold'>
                                      {time}-{newTime}
                                    </p>
                                    <div className='flex mt-2'>
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
                                  <div className='mt-auto'>
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

            {showForm ? (
              <div className='w-[35%] flex overflow-x-hidden'>
                <div className='flex-1 ml-10 overflow-x-hidden flex-col border-2 border-gray-600 rounded-lg shadow-xl bg-gray-300 bg-opacity-30 overflow-y-auto animate-move-from-right-form'>
                  <h1 className='text-center bg-teal-600 rounded-tl-lg text-white font-semibold pb-1 py-1 text-3xl border-b-2 border-gray-600 select-none'>Agregar Turno</h1>
                  <div ref={selectDateRef} className='border-gray-600 border-b-4 flex-1 p-2'>
                    {appointmentDate ? (
                      <div>
                        <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default mt-1 shadow-lg'>
                          <AiOutlineSchedule size={38} className="text-white " />
                        </div>
                        <div onClick={() => setAppointmentDate(null)} className='group relative hover:bg-red-500 hover:bg-opacity-30 bg-white mt-4 mb-2 mx-4 py-1 transition duration-150 border-2 border-gray-600 rounded-lg flex justify-center items-center cursor-pointer'>
                          <div className='group-hover:block hidden absolute top-1 left-1/2 transform -translate-x-1/2'>
                            <ImCancelCircle size={40} className="bg-red text-red-600" />
                          </div>
                          <div className='group-hover:text-transparent text-black'>
                            <div className='flex'>
                              <p className='text-sm  text-center select-none'>Día seleccionado: </p>
                              <p className='ml-1 text-sm  text-center font-bold select-none'>{appointmentDate.dayComplete}, {appointmentDate.year}</p>
                            </div>
                            <div className='flex justify-center'>
                              <p className='text-sm flex-col  text-center select-none'>Horario seleccionado: </p>
                              <p className='ml-1 text-sm  text-center font-bold select-none'>{appointmentDate.time}-{timeCalc(appointmentDate.time)}</p>
                            </div>
                          </div>
                        </div>
                        <div className='flex select-none mb-2'>
                          <h1 className='text-black px-4 rounded-lg py-2 bg-white border-2 border-gray-600 ml-4 font-bold'>Duración del turno (horas):</h1>
                          <select
                            value={appointmentHours}
                            onChange={(event) => setAppointmentHours(event.target.value)}
                            className="select-none rounded-lg pl-2 text-black border-2 border-gray-600 bg-white flex py-1 ml-2 font-semibold shadow-xl focus:outline-none focus:text-black text-lg w-12"
                          >
                            <option value={1}>1</option>
                            <option value={2} disabled={freeSpaces < 1}>
                              2
                            </option>
                            <option value={3} disabled={freeSpaces < 2}>
                              3
                            </option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default shadow-lg mt-1'>
                          <h1 className='font-black	text-2xl text-white mr-2 select-none'>1.</h1>
                          <h1 className='text-xl font-bold text-white text-center cursor-default mt-1 select-none'>Selecciona la fecha</h1>
                        </div>
                        <div className='flex-col   border-2 border-gray-600 rounded-lg shadow-xl mx-4 mt-4 mb-2 bg-white py-1'>
                          <BsArrowLeftCircle className="m-auto mt-2 mb-1 text-black" size={120} />
                          <h1 className='m-auto text-center font-medium text-lg select-none text-black'>SELECCIONA EL DIA Y HORARIO <br /> EN LA AGENDA</h1>
                        </div>
                      </div>
                    )}
                  </div>

                  <div ref={selectPatientRef} className='border-gray-600 border-b-4 flex-1 p-2'>
                    {patient ? (
                      <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 mt-1 cursor-default shadow-lg'>
                        <BsPersonCheck size={32} className="" />
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
                              if (Field === 'dni') {
                                const numericValue = inputValue.replace(/[^0-9]/g, '');
                                setSearchContent(numericValue);
                              } else {
                                setSearchContent(inputValue);
                              }
                            }}
                            type="text" placeholder='Busca un paciente' className='select-none focus:border-3 focus:outline-none focus:border-teal-600 rounded-lg text-black h-10 shadow-lg p-2 w-full bg-white border-2 border-gray-600' />
                          <button onClick={() => setField('dni')} className={`${Field === 'dni' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-white hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg ml-4 border-2 focus:outline-none border-gray-600 text-md font-semibold rounded-l-lg transition duration-300 px-3 select-none w-24`}>DNI</button>
                          <button onClick={() => setField('name')} className={`${Field === 'name' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-white hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg border-2 focus:outline-none border-gray-600 text-md font-semibold rounded-r-lg transition duration-300 px-3 select-none w-24`}>NOMBRE</button>
                        </div>
                      </div>
                    )}
                    <div className='mt-4 ml-4 mr-4 mb-2 border-2 border-gray-600 rounded-lg bg-white shadow-xl overflow-y-auto'>
                      <div ref={newPatientRef} className={`${patient ? '' : 'h-40'} `}>
                        {listPatients && typeof listPatients !== 'string' ? (
                          <div>
                            {patient ? (
                              <div onClick={() => setPatient(null)} className='group relative hover:bg-red-500 hover:bg-opacity-30 bg-white transition duration-150 py-0.5  cursor-pointer  '>
                                <div className='group-hover:block hidden absolute top-1 left-1/2 transform -translate-x-1/2'>
                                  <ImCancelCircle size={40} className="bg-red text-red-600" />
                                </div>
                                <div className='group-hover:text-transparent text-black'>
                                  <div className='flex justify-center items-center py-3  '>
                                    <p className='text-sm  text-center select-none'>Paciente seleccionado: </p>
                                    <p className='ml-1 text-sm text-center font-bold select-none'>{patient.name} {patient.lastName}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div >
                                {listPatients.map((patient, index) => (
                                  <div key={index} onClick={() => setPatient(patient)} className="p-1 select-none hover:bg-gray-200 text-black text-base border-b border-gray-600 transition duration-100 cursor-pointer flex justify-between">
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

                  <div ref={selectReasonRef} className='border-gray-600 border-b-4 flex-1 p-2'>
                    {reason ? (
                      <div>
                        <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default shadow-lg mt-1'>
                          <FaFileMedicalAlt size={28} className="" />
                        </div>
                        <div onClick={() => setReason(null)} className='group relative py-1 hover:bg-red-500 hover:bg-opacity-30 bg-white mt-4 mb-2 mx-4 transition duration-150 border-2 border-gray-600 rounded-lg flex-col  flex justify-center items-center cursor-pointer'>
                          <div className='group-hover:block hidden absolute top-1 left-1/2 transform -translate-x-1/2'>
                            <ImCancelCircle size={40} className="bg-red text-red-600" />
                          </div>
                          <div className='group-hover:text-transparent text-black'>
                            <p className='text-sm  text-center select-none'>Razón: </p>
                            <p className='ml-1 text-sm  text-center font-bold select-none'>{reason}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default shadow-lg mt-1'>
                          <h1 className='font-black	text-2xl text-white mr-2 select-none'>3.</h1>
                          <h1 className='text-xl font-bold text-white text-center cursor-default mt-1 select-none'>Motivo del turno</h1>
                        </div>
                        <div className='mx-2 mt-4 mb-4 px-2 flex justify-center items-center'>
                          <h1 className='text-black text-xl mt-0.5 font-semibold select-none'>Razón:</h1>
                          <select value={chapterName} onChange={(e) => setChapterName(e.target.value)}
                            className='cursor-pointer hover:bg-teal-600 hover:border-gray-600 hover:text-white  transition duration-300 bg-white bg-opacity-30 w-full py-1 ml-2  outline-none text-black text-lg font-bold border-2 px-1  border-teal-600 rounded-lg shadow-lg  flex justify-center items-center'>
                            <option selected>Seleccionar</option>
                            <option value={"CONSULTAS"} >CONSULTAS</option>
                            <option value={"OPERATORIA DENTAL"} >OPERATORIA DENTAL</option>
                            <option value={"ENDODONCIA"} >ENDODONCIA</option>
                            <option value={"PRÓTESIS"} >PRÓTESIS</option>
                            <option value={"ODONTOLOGÍA PREVENTIVA"} >ODONTOLOGÍA PREVENTIVA</option>
                            <option value={"ORTODONCIA Y ORTOPEDIA FUNCIONAL"} >ORTODONCIA Y ORTOPEDIA FUNCIONAL</option>
                            <option value={"ODONTOPEDIATRÍA"} >ODONTOPEDIATRÍA</option>
                            <option value={"PERIODONCIA"} >PERIODONCIA</option>
                            <option value={"RADIOLOGÍA"} >RADIOLOGÍA</option>
                            <option value={"CIRUGÍA"} >CIRUGÍA</option>
                          </select>
                        </div>
                        {chapterName !== '' && chapterData && (
                          <div className='border-gray-600 bg-white text-black border-2  mt-4 select-none mx-3 rounded-lg '>
                            {/* Mapear todas las opciones */}
                            {chapterData.map((practice, index) => (
                              <div className={`${index === 0 ? 'rounded-t-md' : ''} ${index === chapterData.length - 1 ? 'rounded-b-md border-none' : ''} cursor-pointer border-b-2 hover:bg-teal-600 border-gray-600 py-1 px-1.5`} key={index} value={practice.id}>{practice.name}<span className=' ml-auto flex font-bold'>${formatPrice(practice.price)}</span> </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className=" flex-1 p-2">
                    <div className='flex items-center justify-center bg-teal-600 rounded-xl h-10 cursor-default shadow-lg mt-1'>
                      <h1 className='font-black	text-2xl text-white mr-2 select-none'>4.</h1>
                      <h1 className='text-xl font-bold text-white text-center cursor-default mt-1 select-none'>Confirmar turno</h1>
                    </div>
                    {patient && appointmentDate ? (
                      <div ref={confirmRef} className='mt-4 ml-2 mr-2 mb-2 flex'>
                        <div className='ml-1 mr-1 border-2 border-gray-600 rounded-lg bg-white w-full p-1'>
                          <h1 className='text-xl font-bold text-black select-none text-center'>Resumen: </h1>
                          <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                            <p className='ml-1  text-lg font-bold text-black select-none text-left'>Fecha: </p>
                            <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>Dia: {appointmentDate.dayComplete}, {appointmentDate.year} <br /> Horario: {appointmentDate.time}-{timeCalc(appointmentDate.time)}</p>
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

                          <div autoFocus onClick={() => { handleSetAppoint(patient.id, appointmentDate, reason, observations); setShowResult(null) }} className='flex justify-center items-center text-xl font-semibold transition duration-200 text-black  rounded-lg ml-2 mr-2 mb-1 mt-4 p-1 cursor-pointer hover:bg-teal-600 hover:text-white border-gray-600 border-2 bg-white'>
                            Confirmar
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='mt-4 ml-2 mr-2 mb-2 flex'>
                        <div className='ml-1 mr-1 border-2 border-gray-600 rounded-lg bg-white w-full p-1 shadow-xl'>
                          <p className='text-lg font-semibold select-none text-black text-center'>Completa los datos anteriores antes de confirmar el turno</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className='w-[fit] h-full flex overflow-x-hidden '>
                <div className='flex flex-col animate-move-from-right-form-2 w-full ml-10 overflow-x-hidden '>
                  <div className='w-full  justify-center flex flex-col select-none bg-gray-200 bg-opacity-30 text-black border-2 border-gray-600 rounded-lg  shadow-xl'>
                    <h1 className='text-center bg-teal-600 rounded-t-lg text-white font-semibold text-2xl border-b-2 border-gray-600'>Calendario</h1>
                    <div className='flex justify-center '>
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                        <DemoContainer components={['DateCalendar']}>
                          <DateCalendar
                            loading={isLoadingCalendar}
                            className='bg-transparent rounded-lg '
                            value={calendarValue}
                            onChange={(newValue) => setCalendarValue(newValue)}
                            views={['day', 'year']}
                          />
                        </DemoContainer>
                      </LocalizationProvider>
                    </div>
                  </div>
                  <div className='select-none  justify-center mt-4 bg-gray-300 bg-opacity-30 text-black border-2 border-gray-600 rounded-lg h-full shadow-xl '>
                    <h1 className='text-center justify-center flex bg-teal-600 rounded-t-lg text-white font-semibold text-2xl  border-b-2 border-gray-600'>Turnos Restantes</h1>
                    <div className=' px-2 py-1 bg-white flex'>
                      <h1 className='text-left text-medium font-medium'>Hoy ({alwaysToday})</h1>
                      <h1 className='ml-auto text-medium font-medium flex'><IoTimeOutline className="mt-0.5 mr-1" size={20} /> {time}</h1>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div >
        </div >
      )
      }
    </div >
  )
}
