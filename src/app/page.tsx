'use client'

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { setAppointment } from "./../components/appointments/setAppointment";
import { getAppointments } from "./../components/appointments/getAppointments";
import { SearchPatient } from "./../components/patients/db/searchPatient";
import { getPatients } from "./../components/patients/db/getPatients"
import { BsPersonCheck, BsCalendar2Date, BsArrowLeftCircle } from 'react-icons/bs';
import { AiOutlineSchedule } from 'react-icons/ai';
import { ClipLoader } from "react-spinners";
import { GiClick } from "react-icons/gi";
import { FaFileMedicalAlt, FaShare } from "react-icons/fa";
import { Loading } from "./../components/general/loading";
import { ModalCreatePatient } from './../components/patients/ui/modalCreatePatient'
import { useRouter } from 'next/navigation'
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { BiRightArrow, BiLeftArrow, BiSolidBookAdd, BiSolidBellRing } from "react-icons/bi";
import { MdUpdate, MdDeleteForever } from "react-icons/md";
import { ImCancelCircle } from "react-icons/im";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { IoTimeOutline } from "react-icons/io5";
import { Alert } from "./../components/general/alert";
import { getChapter } from "./../components/practices/getChapter";
import { FaRegTrashCan } from "react-icons/fa6";

export interface dateData {
  date: string;
  dayComplete: string;
  year: number;
  time: string;
  time2?: string;
  time3?: string;
  time4?: string;
  time5?: string;
  time6?: string;
}
interface CustomDayjs extends Dayjs {
  $d: Date;
}

async function fetchAppointments(formattedDate: string | null): Promise<any[] | null> {
  const result = await getAppointments(formattedDate);
  if (!result || result === 'vacio') return null;
  return Array.isArray(result) ? result : Object.values(result);
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, flipUp: false });
  const [Field, setField] = useState('name');
  const [searchContent, setSearchContent] = useState('');
  const [listPatients, setListPatients] = useState<null | any[] | string>(null);
  const [appointments, setAppointments] = useState<any>(null);
  const [appointmentSelect, setAppointmentSelect] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [reason, setReason] = useState<any>(null);
  const [observations, setObservations] = useState<any>('');
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
  const [chapterName, setChapterName] = useState<string>('Consultas');
  const [chapterData, setChapterData] = useState<any>(null);
  const isUpdatingFromHours = useRef(false);
  const skipResetHours = useRef(false);

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
      const patients = await getPatients(20);
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
    const patients = await getPatients(20);
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
      const appointments = await fetchAppointments(formattedDate);
      setAppointments(appointments);
      setIsLoadAppoints(false);
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
    setObservations('');
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
        const modalHeight = 140; // altura aproximada del modal en px
        const spaceBelow = window.innerHeight - event.clientY;
        const flipUp = spaceBelow < modalHeight;
        setMousePosition({ x: event.pageX, y: event.pageY, flipUp });
      } else if (appointmentDate) {
        clean();
      } else {
        setOpenModalAppointment(false);
        const parts = date.split("/");
        const year = parts[2];
        setShowForm(true);
        setTimeout(() => {
          setAppointmentDate({
            date: date,
            dayComplete: `${dayName} ${dayNum} de ${monthName}`,
            year: year,
            time: time,
          });
        }, 300);
      }
    }
  }

  async function handleSetAppoint(patientId: number, dateData: dateData, reason: any, observations?: string) {
    setIsLoadAppoints(true);
    clean();
    const result = await setAppointment(patientId, dateData, observations);
    const formattedDate = date?.replace(/\//g, '');
    const appointments = await fetchAppointments(formattedDate);
    setAppointments(appointments);
    setTimeout(() => setIsLoadAppoints(false), 1500);
    if (result === null) {
      setShowResult('error');
    } else {
      setShowResult('good');
    }
  }

  useEffect(() => {

    if (appointmentDate) {
      const timeSlots = ['8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];

      const [h, m] = appointmentDate.time.split(':').map(Number);
      const totalMins = h * 60 + m;

      const addMins = (mins: number) => {
        const t = totalMins + mins;
        const hh = Math.floor(t / 60);
        const mm = (t % 60).toString().padStart(2, '0');
        return `${hh}:${mm}`;
      };

      const slots = [addMins(30), addMins(60), addMins(90), addMins(120), addMins(150)];

      if (!appointments || appointments.length === 0) {
        const maxSlots = slots.filter(s => timeSlots.includes(s)).length;
        setFreeSpaces(Math.min(maxSlots, 5));
        return;
      }

      const validAppointments = appointments.filter((a: any) => a && a.time);

      let freeCount = 0;
      for (const slot of slots) {
        if (!timeSlots.includes(slot)) break;
        if (validAppointments.some((a: any) => a.time === slot)) break;
        freeCount++;
      }

      setFreeSpaces(freeCount);
    }
  }, [appointmentDate, appointments]);

  useEffect(() => {
    if (appointmentDate) {
      skipResetHours.current = true;

      const [h, m] = appointmentDate.time.split(':').map(Number);
      const totalMins = h * 60 + m;

      const addMins = (mins: number) => {
        const t = totalMins + mins;
        const hh = Math.floor(t / 60);
        const mm = (t % 60).toString().padStart(2, '0');
        return `${hh}:${mm}`;
      };

      const slots: Record<string, string | undefined> = {
        time2: undefined, time3: undefined, time4: undefined, time5: undefined, time6: undefined
      };
      if (appointmentHours >= 2) slots.time2 = addMins(30);
      if (appointmentHours >= 3) slots.time3 = addMins(60);
      if (appointmentHours >= 4) slots.time4 = addMins(90);
      if (appointmentHours >= 5) slots.time5 = addMins(120);
      if (appointmentHours >= 6) slots.time6 = addMins(150);

      setAppointmentDate((prev: any) => ({ ...prev, ...slots }));
    }
  }, [appointmentHours]);

  useEffect(() => {
    if (skipResetHours.current) {
      skipResetHours.current = false;
      return;
    }
    setAppointmentHours(1);
  }, [appointmentDate]);

  async function handleSuccessDeleteAppointment() {
    setOpenAlertMessage(false);
    setIsLoadAppoints(true);
    const formattedDate = date?.replace(/\//g, '');
    const appointments = await fetchAppointments(formattedDate);
    setAppointments(appointments);
    setIsLoadAppoints(false);
    setShowResult('good-delete-appointment');
  }

  function timeCalc(time: string) {
    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const totalMinutes = hours * 60 + minutes + 30;
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
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
    <div className=' h-screen overflow-y-hidden flex-1 ' >
      {isLoad ? (
        <Loading />
      ) : (
        <div className='ml-4 mr-2 p-4 '>
          <div className='mt-2'>
            {/** 
            {openModalCreatePatient && (
              <div className="fixed inset-0 backdrop-blur-sm ml-56 z-10">
                <ModalCreatePatient onCloseModal={() => setOpenModalCreatePatient(false)} onSuccess={() => { setShowResult('good-patient'); updateListPatients() }} />
              </div>
            )}*/}
            {openAlertMessage && (
              <div className='absolute inset-0 backdrop-blur-sm ml-56 z-10'>
                <Alert onCloseAlert={() => setOpenAlertMessage(false)} onSuccess={handleSuccessDeleteAppointment} action={'Eliminar Turno'} firstProp={'Â¿EstÃ¡s seguro/a de que deseas elimanar el turno?'} secondProp={appointmentSelect} />
              </div>
            )}
            {openModalAppointment && (
              <div
                className='bg-black rounded-xl shadow-xl opacity-90  absolute px-2 py-1 select-none animate-modal-appointment'
                style={{
                  left: `${mousePosition.x + 10}px`,
                  ...(mousePosition.flipUp
                    ? { bottom: `${window.innerHeight - mousePosition.y}px` }
                    : { top: `${mousePosition.y}px` })
                }}
              >
                <div className='flex-col'>
                  <h1 className='text-xl font-medium flex justify-center items-center border-b pb-2'>Acciones <ImCancelCircle onClick={() => setOpenModalAppointment(false)} size={24} className="ml-6 mt-1 font-semibold hover:text-teal-500 cursor-pointer duration-150 transform hover:scale-110" /></h1>
                  <button onClick={() => { setOpenModalAppointment(false); setOpenAlertMessage(true); setShowResult(null) }} className='flex justify-center items-center group hover:text-teal-500'><MdDeleteForever className="text-white group-hover:text-teal-500 flex mt-2 mb-2 mr-1" size={20} />Eliminar </button>
                  <button className='flex justify-center items-center group hover:text-teal-500'><FaShare className="text-white group-hover:text-teal-500 flex mt-2 mb-2 mr-1" size={20} />Compartir </button>
                  <button className='flex justify-center items-center group hover:text-teal-500'><BiSolidBellRing className="text-white group-hover:text-teal-500 flex mt-2 mb-2 mr-1" size={20} />Recordar Turno </button>
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
          {/* TABLA DE TURNOS */}
          <div className='flex justify-between h-screen pb-44 overflow-y-hidden w-full'>
            <h1 className='text-center bg-teal-600 border-t-2 border-b-2 border-l-2 border-gray-600 rounded-bl-lg rounded-tl-lg shadow-xl text-white font-semibold text-4xl select-none px-4 pt-2'>A <br /> G <br />E <br />N <br />D <br />A</h1>
            <div className='bg-gray-300 bg-opacity-30  shadow-xl flex-1 transition-width  border-2 border-gray-600 rounded-r-lg overflow-y-auto '>
              <table className='w-full'>
                <tbody className='text-black'>
                  {['8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map((time, index, array) => {

                    // Slots que son time2 o time3 de algÃºn turno â†’ no renderizar td
                    const isSecondarySlot = appointments && Array.isArray(appointments) && appointments.some(
                      (a: any) => a && (a.time2 === time || a.time3 === time || a.time4 === time || a.time5 === time || a.time6 === time)
                    );

                    // Turno que empieza en este slot
                    const appointment = appointments && Array.isArray(appointments) &&
                      appointments.find((a: any) => a && a.time === time);

                    // Calcular rowSpan
                    const rowSpan = appointment
                      ? (appointment.time6 ? 6 : appointment.time5 ? 5 : appointment.time4 ? 4 : appointment.time3 ? 3 : appointment.time2 ? 2 : 1)
                      : 1;

                    // horario de fin:
                    const endTime = appointment ? (
                      appointment.time6 ? timeCalc(appointment.time6)
                        : appointment.time5 ? timeCalc(appointment.time5)
                          : appointment.time4 ? timeCalc(appointment.time4)
                            : appointment.time3 ? timeCalc(appointment.time3)
                              : appointment.time2 ? timeCalc(appointment.time2)
                                : timeCalc(time)
                    ) : timeCalc(time);

                    if (isSecondarySlot) {
                      // Solo renderizar la celda de hora, sin td de contenido
                      return (
                        <tr key={time}>
                          <td className={`text-black select-none cursor-default align-top px-3 text-xs font-semibold pt-2 border-r ${index === array.length - 1 ? '' : 'border-b'} border-gray-600`}>
                            {time}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={time}>
                        <td className={`text-black select-none cursor-default align-top px-3 text-xs font-semibold pt-2 border-r ${index === array.length - 1 ? '' : 'border-b'} border-gray-600`}>
                          {time}
                        </td>
                        <td
                          rowSpan={rowSpan}
                          className={`
              ${appointment ? 'bg-teal-600 bg-opacity-20 pt-1 pb-1 px-2 hover:bg-opacity-70 hover:bg-teal-600' : 'p-8'}
             ${appointmentDate && appointmentDate.date === date &&
                              (appointmentDate.time === time || appointmentDate.time2 === time || appointmentDate.time3 === time ||
                                appointmentDate.time4 === time || appointmentDate.time5 === time || appointmentDate.time6 === time)
                              ? 'animate-breathe bg-gray-400'
                              : 'hover:bg-gray-900 hover:bg-opacity-30'
                            }
              ${index === array.length - 1 ? '' : 'border-b'}
              select-none w-full border-gray-600 text-center cursor-pointer items-center`}
                          onClick={(e) => handleCliclRow(time, e)}
                        >
                          {appointment && (
                            <div className='flex justify-between'>
                              <div className='flex-col'>
                                <p className='text-left text-xs font-bold'>
                                  {time}-{endTime}
                                </p>
                                <div className='flex mt-2'>
                                  <p className='text-left text-sm ml-2'>Paciente:</p>
                                  <p className='text-left text-sm font-semibold ml-1'>
                                    {appointment.patientData.name}{' '}{appointment.patientData.lastName}
                                  </p>
                                </div>
                                <div className='flex'>
                                  <p className='text-left text-sm ml-2'>DNI:</p>
                                  <p className='text-left text-sm font-semibold ml-1'>{appointment.patientData.dni}</p>
                                </div>
                                <div className='flex'>
                                  <p className='text-left text-sm ml-2'>Contacto:</p>
                                  <p className='text-left text-sm font-semibold ml-1'>
                                    {appointment.patientData.num} <br /> {appointment.patientData.email}
                                  </p>
                                </div>
                              </div>
                              <div className='mt-auto'>
                                <div className='flex'>
                                  <p className='text-left text-sm ml-2'>RazÃ³n de turno:</p>
                                  <p className='text-left text-sm font-semibold ml-1'>{appointment.reason}</p>
                                </div>
                                <div className='flex'>
                                  <p className='text-left text-sm ml-2'>Observaciones:</p>
                                  {appointment.observations ? (
                                    <p className='text-left text-sm font-semibold ml-1'>{appointment.observations}</p>
                                  ) : (
                                    <p className='text-left text-sm font-semibold ml-1'>Ninguna</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>




            {/* FORMULARIO PARA AGREGAR TURNO */}
            {showForm ? (
              <div className='w-[35%] flex overflow-x-hidden'>
                <div className='flex-1 ml-10 overflow-x-hidden flex-col border-2 border-gray-600 rounded-lg shadow-xl bg-gray-300 bg-opacity-30 overflow-y-auto animate-move-from-right-form'>
                  <h1 className='text-center bg-teal-600 rounded-md-lg text-white font-semibold pb-1 py-1 text-3xl border-b-2 border-gray-600 select-none'>Agregar Turno</h1>
                  <div className='flex items-center mx-5 justify-center bg-white border-2 border-gray-600 rounded-xl h-10 cursor-default shadow-lg mt-4'>
                    <h1 className='font-black	text-2xl text-black mr-4 select-none'>1.</h1>
                    <h1 className='text-xl font-bold text-black text-center cursor-default mt-1 select-none'>Selecciona el horario</h1>
                  </div>
                  {/* 1. SELECCIONAR FECHA */}
                  <div ref={selectDateRef} className={` border-gray-600 border-b-4 flex-1 `}>
                    {appointmentDate ? (
                      <div className='flex  items-center px-5  w-full flex-col'>

                        <div className='flex justify-between items-center w-full mx-6'>
                          <div className=' border-gray-600 w-full hover:bg-opacity-50 bg-white mt-4 mb-3  py-1 transition duration-150 border-2 px-6 rounded-lg flex justify-center items-center '>
                            <div className='group-hover:text-transparent text-black'>
                              <div className=''>
                                <p className='text-sm  text-center select-none whitespace-nowrap	'>DÃ­a seleccionado: </p>
                                <p className='ml-1 text-sm  text-center font-bold select-none'>{appointmentDate.dayComplete}, {appointmentDate.year}</p>
                              </div>
                              <div className=''>
                                <p className='text-sm flex-col  text-center select-none whitespace-nowrap'>Horario seleccionado: </p>
                                <p className='ml-1 text-sm  text-center font-bold select-none'>{appointmentDate.time}-{timeCalc(appointmentDate.time)}</p>
                              </div>
                            </div>
                          </div>
                          <div className=' flex ml-4 items-center  bg-white rounded-2xl h-12 border-2 border-gray-600 px-3 cursor-default mt-1 shadow-lg'>
                            <FaRegTrashCan onClick={() => setAppointmentDate(null)} size={28} className='text-red-700  cursor-pointer hover:scale-110 transition duration-150' />
                          </div>
                        </div>

                        <div className='flex-col select-none w-full   mb-2'>
                          <div className='w-full space-x-2  h-6 mb-2  flex justify-center items-center'>
                            <div className='bg-black bg-opacity-90 h-1 rounded-full w-1/2'></div>
                            <div className='bg-black  bg-opacity-90 rounded-full h-2 w-2'></div>
                            <div className='bg-black bg-opacity-90 h-1 w-1/2 rounded-full'></div>
                          </div>
                          <div className='flex justify-center'>
                            <h1 className='text-black ml-1 mt-1 rounded-lg border-gray-600 font-bold'>DuraciÃ³n del turno (horas):</h1>
                            <select
                              value={appointmentHours}
                              onChange={(event) => setAppointmentHours(event.target.value)}
                              className="select-none rounded-lg pl-2 text-black border-2 border-gray-600 cursor-pointer hover:bg-teal-600 hover:border-gray-600 transition duration-150 hover:text-white bg-white flex py-1 ml-2 font-semibold shadow-xl focus:outline-none text-lg w-fit"
                            >
                              <option value={1}>30 min</option>
                              <option value={2} disabled={freeSpaces < 1}>1 hora</option>
                              <option value={3} disabled={freeSpaces < 2}>1 hora 30 min</option>
                              <option value={4} disabled={freeSpaces < 3}>2 horas</option>
                              <option value={5} disabled={freeSpaces < 4}>2 horas 30 min</option>
                              <option value={6} disabled={freeSpaces < 5}>3 horas</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>

                        <div className='flex-col   border-2 border-gray-600 rounded-lg shadow-xl mx-4 mt-4 mb-4 bg-white py-1'>
                          <BsArrowLeftCircle className="m-auto mt-2 mb-1 text-black" size={120} />
                          <h1 className='m-auto text-center font-medium text-lg select-none text-black'>SELECCIONA EL DIA Y HORARIO <br /> EN LA AGENDA</h1>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. SELECCIONAR PACIENTE */}

                  <div ref={selectPatientRef} className={` duration-[500ms] border-gray-600 border-b-4 flex justify-center items-center flex-col p-2`}>
                    <div className='w-full '>
                      <div className='flex items-center justify-center bg-white border-2 border-gray-600 rounded-xl h-10 cursor-default shadow-lg mt-2 mx-3'>
                        <h1 className='font-black	text-2xl text-black mr-4 select-none'>2.</h1>
                        <h1 className='text-xl font-bold text-black text-center cursor-default mt-1 select-none'>Selecciona el paciente</h1>
                      </div>
                    </div>
                    {patient ? (
                      null
                    ) : (
                      <div className='w-full px-3'>

                        <div className='mt-4   flex'>
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
                    <div className={`w-full px-3 ${patient ? 'flex justify-center' : ''}`}>
                      <div className='mt-4  mb-2 w-full border-2 border-gray-600 rounded-lg bg-white shadow-xl overflow-y-auto'>
                        <div ref={newPatientRef} className={`${patient ? '' : 'h-40'} `}>
                          {listPatients && typeof listPatients !== 'string' ? (
                            <div>
                              {patient ? (
                                <div className=' text-black w-full  hover:bg-gray-300 hover:bg-opacity-30 bg-white transition duration-150 py-0.5  '>
                                  <p className='text-sm  text-center select-none'>Paciente seleccionado: </p>
                                  <p className='ml-1 text-sm text-center font-bold select-none'>{patient.name} {patient.lastName}</p>
                                </div>

                              ) : (
                                <div >
                                  {listPatients.map((patient, index) => (
                                    <div key={index} onClick={() => { setPatient(patient); }} className="p-1 select-none hover:bg-gray-200 text-black text-base border-b border-gray-600 transition duration-100 cursor-pointer flex justify-between">
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
                      {patient && (
                        <div className=' flex ml-4  items-center  bg-white rounded-2xl h-12 border-2 border-gray-600 px-3 cursor-default mt-4 shadow-lg'>
                          <FaRegTrashCan onClick={() => setPatient(null)} size={28} className='text-red-700  cursor-pointer hover:scale-110 transition duration-150' />
                        </div>
                      )}
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


                  {/* 3. SELECCIONAR RAZON */}

                  <div ref={selectReasonRef} className={`duration-[500ms] border-gray-600 border-b-4 flex-1 p-2`}>
                    {reason ? (
                      <div>
                        <div className='flex items-center justify-center bg-white border-2 border-gray-600 rounded-xl h-10 cursor-default shadow-lg mt-2 mx-3'>
                          <h1 className='font-black	text-2xl text-black mr-4 select-none'>3.</h1>
                          <h1 className='text-xl flex justify-center items-end font-bold text-black text-center cursor-default mt-1 select-none'>Selecciona el motivo <p className='flex ml-2 mb-0.5 text-xs font-bold'>(Opcional)</p></h1>
                        </div>
                        <div className='flex items-center justify-center mt-2'>
                          <div className=' w-full mt-2 py-1 hover:bg-opacity-30 bg-white  mb-2 mx-4 transition duration-150 border-2 border-gray-600 rounded-lg  flex justify-center items-center '>
                            <div className=' text-black'>
                              <p className='text-sm  text-center select-none'>RazÃ³n: </p>
                              <p className='ml-1 text-sm  text-center font-bold select-none'>{reason.name}</p>
                            </div>
                          </div>
                          <div className=' flex  mr-3  items-center  bg-white rounded-2xl h-12 border-2 border-gray-600 px-3 cursor-default  shadow-lg'>
                            <FaRegTrashCan onClick={() => setReason(null)} size={28} className='text-red-700  cursor-pointer hover:scale-110 transition duration-150' />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className='flex items-center justify-center bg-white border-2 border-gray-600 rounded-xl h-10 cursor-default shadow-lg mt-2 mx-3'>
                          <h1 className='font-black	text-2xl text-black mr-4 select-none'>3.</h1>
                          <h1 className='text-xl font-bold text-black text-center flex justify-center items-end  cursor-default mt-1 select-none'>Selecciona el motivo <p className='flex ml-2 mb-0.5 text-xs font-bold'>(Opcional)</p></h1>
                        </div>
                        <div className='mx-2 mt-4 mb-4 px-2 flex justify-center items-center'>
                          <h1 className='text-black text-xl mt-0.5 font-semibold select-none'>RazÃ³n:</h1>
                          <select value={chapterName} onChange={(e) => setChapterName(e.target.value)}
                            className='cursor-pointer hover:bg-teal-600 hover:border-gray-600 hover:text-white  transition duration-300 bg-white bg-opacity-30 w-full py-1 ml-2  outline-none text-black text-lg font-bold border-2 px-1  border-gray-600 rounded-lg shadow-lg  flex justify-center items-center'>
                            <option>Seleccionar</option>
                            <option value={"CONSULTAS"} >CONSULTAS</option>
                            <option value={"OPERATORIA DENTAL"} >OPERATORIA DENTAL</option>
                            <option value={"ENDODONCIA"} >ENDODONCIA</option>
                            <option value={"PRÃ“TESIS"} >PRÃ“TESIS</option>
                            <option value={"ODONTOLOGÃA PREVENTIVA"} >ODONTOLOGÃA PREVENTIVA</option>
                            <option value={"ORTODONCIA Y ORTOPEDIA FUNCIONAL"} >ORTODONCIA Y ORTOPEDIA FUNCIONAL</option>
                            <option value={"ODONTOPEDIATRÃA"} >ODONTOPEDIATRÃA</option>
                            <option value={"PERIODONCIA"} >PERIODONCIA</option>
                            <option value={"RADIOLOGÃA"} >RADIOLOGÃA</option>
                            <option value={"CIRUGÃA"} >CIRUGÃA</option>
                          </select>
                        </div>
                        {chapterName !== '' && chapterData && (
                          <div className='border-gray-600 bg-white text-black text-sm border-2 mb-2  mt-4 select-none mx-3 rounded-lg '>
                            {chapterData.length > 0 ? (
                              <div>
                                {chapterData.map((practice: { id: number, name: string, price: number }, index: number) => (
                                  <div onClick={() => setReason(practice)} className={`${index === 0 ? 'rounded-t-md' : ''} ${index === chapterData.length - 1 ? 'rounded-b-md border-none' : ''} cursor-pointer border-b-2 hover:bg-teal-600 border-gray-600 py-1 px-1.5`} key={index}>{practice.name}<span className=' ml-auto flex font-bold'>${formatPrice(practice.price)}</span> </div>
                                ))}
                              </div>
                            ) : (
                              <div className='flex justify-center items-center py-1 text-base bg-red-500 rounded-md font-medium bg-opacity-30'>
                                No hay prÃ¡cticas en este CapÃ­tulo
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4. CONFIRMAR TURNO */}

                  <div className={`duration-[500ms] flex-1 p-2`}>
                    <div className='flex items-center justify-center bg-white border-2 border-gray-600 rounded-xl h-10 cursor-default shadow-lg mt-2 mx-3'>
                      <h1 className='font-black	text-2xl text-black mr-4 select-none'>4.</h1>
                      <h1 className='text-xl font-bold text-black text-center cursor-default mt-1 select-none'>Confirmar Turno</h1>
                    </div>
                    {patient && appointmentDate ? (
                      <div ref={confirmRef} className='mt-4 ml-2 mr-2 mb-2 flex'>
                        <div className='ml-1 mr-1 border-2 border-gray-600 rounded-lg bg-white w-full p-1'>
                          <h1 className='text-xl font-bold text-black select-none text-center'>Resumen: </h1>
                          <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                            <p className='ml-1  text-lg font-bold text-black select-none text-left'>Fecha: </p>
                            <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>Dia: {appointmentDate.dayComplete}, {appointmentDate.year} <br /> Horario: {appointmentDate.time}-{
                              appointmentDate.time6 ? timeCalc(appointmentDate.time6) :
                                appointmentDate.time5 ? timeCalc(appointmentDate.time5) :
                                  appointmentDate.time4 ? timeCalc(appointmentDate.time4) :
                                    appointmentDate.time3 ? timeCalc(appointmentDate.time3) :
                                      appointmentDate.time2 ? timeCalc(appointmentDate.time2) :
                                        timeCalc(appointmentDate.time)
                            }</p>
                          </div>
                          <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                            <p className='ml-1 text-lg font-bold text-black text-left select-none'>Paciente: </p>
                            <p className='ml-1 text-sm text-black text-left font-bold'>Nombre: {patient.name} {patient.lastName} <br /> DNI: {patient.dni} <br />Edad: {getAge(patient.birthDate)} aÃ±os</p>
                            {patient.insurance === 'Particular' ? (
                              <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>Obra Social: {patient.insurance}</p>
                            ) : (
                              <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>Obra Social: {patient.insurance} <br /> Plan:  {patient.plan}<br />NÃºmero de afiliado: {patient.affiliateNum}</p>
                            )}
                          </div>
                          <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                            {reason ? (
                              <p className='ml-1 text-lg font-bold text-black select-none text-left'>RazÃ³n: <br /><span className=' mb-1 text-sm text-black text-left font-bold'></span></p>
                            ) : (
                              <p className='ml-1 text-lg font-bold text-black select-none text-left'>RazÃ³n: -</p>
                            )}
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
                          <p className='text-sm font-semibold select-none text-black text-center mb-2'>Para confirmar el turno completÃ¡:</p>
                          <div className='flex flex-col gap-1 px-2 pb-2'>
                            {!appointmentDate && (
                              <div className='flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-3 py-1.5'>
                                <div className='w-2 h-2 rounded-full bg-red-400'></div>
                                <p className='text-sm text-red-600 font-medium select-none'>SeleccionÃ¡ un horario en la agenda</p>
                              </div>
                            )}
                            {!patient && (
                              <div className='flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-3 py-1.5'>
                                <div className='w-2 h-2 rounded-full bg-red-400'></div>
                                <p className='text-sm text-red-600 font-medium select-none'>SeleccionÃ¡ un paciente</p>
                              </div>
                            )}
                          </div>
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

