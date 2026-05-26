"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { setAppointment } from "./../services/appointments/setAppointment";
import { getAppointments } from "./../services/appointments/getAppointments";
import { SearchPatient } from "./../services/patients/searchPatient";
import { getPatients } from "./../services/patients/getPatients";
import { ClipLoader } from "react-spinners";
import { FaShare } from "react-icons/fa";
import { Loading } from "./../components/shared/loading";
import { ModalCreatePatient } from "./../components/patients/ui/modalCreatePatient";
import { SheetCreatePatient } from "./../components/patients/ui/createPatient/sheetCreatePatient";
import { useMediaQuery } from "./../hooks/useMediaQuery";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  BiRightArrow,
  BiLeftArrow,
  BiSolidBookAdd,
  BiSolidBellRing,
} from "react-icons/bi";
import { MdUpdate, MdDeleteForever } from "react-icons/md";
import { ImCancelCircle } from "react-icons/im";
import { BsCalendar2Date } from "react-icons/bs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { Alert } from "./../components/shared/alert";
import { getUser } from "@/services/auth/getUser";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  TIME_SLOTS,
  timeCalc,
} from "@/components/appointments/appointmentUtils";
import { AppointmentsTable } from "@/components/appointments/ui/AppointmentsTable";
import { AddAppointmentForm } from "@/components/appointments/ui/AddAppointmentForm";
import { RemainingAppointments } from "@/components/appointments/ui/RemainingAppointments";

import { Toast } from '@/components/shared/Toast';
import type { ToastVariant } from '@/components/shared/Toast';

export type { dateData } from "@/components/appointments/appointmentUtils";

interface CustomDayjs extends Dayjs {
  $d: Date;
}

async function fetchAppointments(
  formattedDate: string | null,
): Promise<any[] | null> {
  const result = await getAppointments(formattedDate);
  if (!result || result === "vacio") return null;
  return Array.isArray(result) ? result : Object.values(result);
}

function PatientParamReader({
  setPatient,
  setShowForm,
}: {
  setPatient: (p: any) => void;
  setShowForm: (v: boolean) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const patientParam = searchParams.get("patient");
    if (patientParam) {
      try {
        const patientData = JSON.parse(decodeURIComponent(patientParam));
        setPatient(patientData);
        setShowForm(true);
      } catch (error) {
        console.error("Error parsing patient data from URL:", error);
      }
    }
  }, [searchParams]);

  return null;
}

export default function Page() {
  const router = useRouter();
  const [calendarValue, setCalendarValue] = React.useState<Dayjs | null>(
    dayjs(new Date()),
  );
  const [isLoad, setIsLoad] = useState(true);
  const [isLoadAppoints, setIsLoadAppoints] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [openModalAppointment, setOpenModalAppointment] = useState(false);
  const [openAlertMessage, setOpenAlertMessage] = useState(false);
  const [isLoadingCalendar] = useState(false);
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
    flipUp: false,
  });
  const [Field, setField] = useState("name");
  const [searchContent, setSearchContent] = useState("");
  const [listPatients, setListPatients] = useState<null | any[] | string>(null);
  const [appointments, setAppointments] = useState<any>(null);
  const [appointmentSelect, setAppointmentSelect] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [reason, setReason] = useState<any>(null);
  const [observations, setObservations] = useState<any>("");
  const [today, setToday] = useState(new Date());
  const [date, setDate] = useState<any>(null);
  const [dayName, setDayName] = useState<any>(null);
  const [dayNum, setDayNum] = useState<any>(null);
  const [monthName, setMonthName] = useState<any>(null);
  const [alwaysToday, setAlwaysToday] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState<any>(null);
  const [appointmentHours, setAppointmentHours] = useState<any>(1);
  const [openModalCreatePatient, setOpenModalCreatePatient] = useState(false);
  const [openSheetCreatePatient, setOpenSheetCreatePatient] = useState(false);
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const [showResult, setShowResult] = useState<ToastVariant | null>(null);
  const [freeSpaces, setFreeSpaces] = useState<any>(null);
  const [time, setTime] = useState(getCurrentTime());
  const [clinicId, setClinicId] = useState<string | null>(null);

  const calendarRef = useRef<any>(null);
  const skipResetHours = useRef(false);

  useEffect(() => {
    async function fetchClinicId() {
      const id = await getUser(true);
      setClinicId(id as string);
    }
    fetchClinicId();
  }, []);

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
    if (!clinicId) return;
    if (searchContent.length > 0) {
      Search();
    }
    if (searchContent === "") {
      Get();
    }

    async function Search() {
      const patientsFilter = await SearchPatient(
        Field,
        searchContent,
        clinicId!,
      );
      if (patientsFilter.length < 1) {
        setListPatients("noResult");
      } else {
        setListPatients(patientsFilter);
      }
    }

    async function Get() {
      const patients = await getPatients(20, clinicId!);
      if (patients) {
        setListPatients(patients.patients);
      } else {
        setListPatients("noResult");
      }
    }
  }, [searchContent, Field, clinicId]);

  useEffect(() => {
    setSearchContent("");
  }, [Field]);

  async function updateListPatients() {
    const patients = await getPatients(20, clinicId!);
    if (patients) {
      setListPatients(patients.patients);
    } else {
      setListPatients("noResult");
    }
  }

  useEffect(() => {
    const formattedDate = date?.replace(/\//g, "");
    setIsLoadAppoints(true);

    async function get() {
      const appts = await fetchAppointments(formattedDate);
      setAppointments(appts);
      setIsLoadAppoints(false);
    }

    get();
  }, [date]);

  useEffect(() => {
    const options = { timeZone: "America/Argentina/Buenos_Aires" };
    const formattedDate = today.toLocaleDateString("es-AR", options);
    setDate(formattedDate);
    let dn = today.toLocaleDateString("es-AR", { ...options, weekday: "long" });
    dn = dn.charAt(0).toUpperCase() + dn.slice(1);
    setDayName(dn);
    setDayNum(
      today.toLocaleDateString("es-AR", { ...options, day: "numeric" }),
    );
    let mn = today.toLocaleDateString("es-AR", { ...options, month: "long" });
    mn = mn.charAt(0).toUpperCase() + mn.slice(1);
    setMonthName(mn);
  }, [today]);

  useEffect(() => {
    const options = { timeZone: "America/Argentina/Buenos_Aires" };
    const dateToday = new Date();
    let dn = dateToday.toLocaleDateString("es-AR", {
      ...options,
      weekday: "long",
    });
    dn = dn.charAt(0).toUpperCase() + dn.slice(1);
    const dNum = dateToday.toLocaleDateString("es-AR", {
      ...options,
      day: "numeric",
    });
    let mn = dateToday.toLocaleDateString("es-AR", {
      ...options,
      month: "long",
    });
    mn = mn.charAt(0).toUpperCase() + mn.slice(1);
    setAlwaysToday(`${dn} ${dNum} de ${mn}`);
  }, []);

  useEffect(() => {
    setOpenCalendar(false);
    const day = (calendarValue as CustomDayjs)?.$d;
    setToday(day);
  }, [calendarValue]);

  useEffect(() => {
    const interval = setInterval(() => setTime(getCurrentTime()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (appointmentDate) {
      const [h, m] = appointmentDate.time.split(":").map(Number);
      const totalMins = h * 60 + m;

      const addMins = (mins: number) => {
        const t = totalMins + mins;
        const hh = Math.floor(t / 60);
        const mm = (t % 60).toString().padStart(2, "0");
        return `${hh}:${mm}`;
      };

      const slots = [
        addMins(30),
        addMins(60),
        addMins(90),
        addMins(120),
        addMins(150),
      ];

      if (!appointments || appointments.length === 0) {
        const maxSlots = slots.filter((s) =>
          (TIME_SLOTS as readonly string[]).includes(s),
        ).length;
        setFreeSpaces(Math.min(maxSlots, 5));
        return;
      }

      const validAppointments = appointments.filter((a: any) => a && a.time);
      let freeCount = 0;
      for (const slot of slots) {
        if (!(TIME_SLOTS as readonly string[]).includes(slot)) break;
        if (validAppointments.some((a: any) => a.time === slot)) break;
        freeCount++;
      }

      setFreeSpaces(freeCount);
    }
  }, [appointmentDate, appointments]);

  useEffect(() => {
    if (appointmentDate) {
      skipResetHours.current = true;

      const [h, m] = appointmentDate.time.split(":").map(Number);
      const totalMins = h * 60 + m;

      const addMins = (mins: number) => {
        const t = totalMins + mins;
        const hh = Math.floor(t / 60);
        const mm = (t % 60).toString().padStart(2, "0");
        return `${hh}:${mm}`;
      };

      const slots: Record<string, string | undefined> = {
        time2: undefined,
        time3: undefined,
        time4: undefined,
        time5: undefined,
        time6: undefined,
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

  useEffect(() => {
    const timeoutId = setTimeout(() => setShowResult(null), 6000);
    return () => clearTimeout(timeoutId);
  }, [showResult]);

  useEffect(() => {
    const handleClickOutside = (event: { target: any }) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setOpenCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarRef]);

  function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function isToday(dateToCheck: Date) {
    const todayDate = new Date();
    return (
      dateToCheck.getDate() === todayDate.getDate() &&
      dateToCheck.getMonth() === todayDate.getMonth() &&
      dateToCheck.getFullYear() === todayDate.getFullYear()
    );
  }

  function clean() {
    setShowForm(false);
    setAppointmentDate(null);
    setPatient(null);
    setReason(null);
    setObservations("");
    setFreeSpaces(null);
    setSearchContent("");
  }

  function dayBack() {
    setOpenCalendar(false);
    const newDate = new Date(today);
    newDate.setDate(today.getDate() - 1);
    setToday(newDate);
    setCalendarValue(dayjs(calendarValue).subtract(1, "day"));
  }

  function dayNext() {
    setOpenCalendar(false);
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + 1);
    setToday(newDate);
    setCalendarValue(dayjs(calendarValue).add(1, "day"));
  }

  function handleCliclRow(time: string, event: any) {
    if (!isLoadAppoints) {
      if (
        appointments &&
        appointments.some((a: { time: string }) => a.time === time)
      ) {
        clean();
        const appointment = appointments.find(
          (a: { time: string }) => a && a.time === time,
        );
        setAppointmentSelect(appointment);
        console.log('appointmentSelect:', appointment);
        setOpenModalAppointment(true);
        const modalHeight = 140;
        const spaceBelow = window.innerHeight - event.clientY;
        setMousePosition({
          x: event.pageX,
          y: event.pageY,
          flipUp: spaceBelow < modalHeight,
        });
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

  async function handleSetAppoint(
    patientId: number,
    dateData: any,
    reason: any,
    observations?: string,
  ) {
    setIsLoadAppoints(true);
    clean();
    const result = await setAppointment(
      patientId,
      dateData,
      reason,
      observations,
    );
    const formattedDate = date?.replace(/\//g, "");
    const appts = await fetchAppointments(formattedDate);
    setAppointments(appts);
    setTimeout(() => setIsLoadAppoints(false), 1500);
    if (result === null) {
      setShowResult("error");
    } else {
      setShowResult("good");
    }
  }

  async function handleSuccessDeleteAppointment() {
    setOpenAlertMessage(false);
    setIsLoadAppoints(true);
    const formattedDate = date?.replace(/\//g, "");
    const appts = await fetchAppointments(formattedDate);
    setAppointments(appts);
    setIsLoadAppoints(false);
    setShowResult("good-delete-appointment");
  }

  return (
    <div className="h-screen overflow-y-hidden flex-1">
      {isLoad ? (
        <Loading />
      ) : (
        <div className="ml-4 mr-2 p-4">
          <div className="mt-2">
            {isMobile ? (
              <SheetCreatePatient
                open={openSheetCreatePatient}
                onClose={() => setOpenSheetCreatePatient(false)}
                onSuccess={() => {
                  setShowResult("good-patient");
                  updateListPatients();
                }}
              />
            ) : (
              <ModalCreatePatient
                open={openModalCreatePatient}
                onClose={() => setOpenModalCreatePatient(false)}
                onSuccess={() => {
                  setShowResult("good-patient");
                  updateListPatients();
                }}
              />
            )}
            <Suspense fallback={null}>
              <PatientParamReader
                setPatient={setPatient}
                setShowForm={setShowForm}
              />
            </Suspense>
            {openAlertMessage && (
              <div className="absolute inset-0 backdrop-blur-sm ml-56 z-10">
                <Alert
                  onCloseAlert={() => setOpenAlertMessage(false)}
                  onSuccess={handleSuccessDeleteAppointment}
                  action={"Eliminar Turno"}
                  firstProp={"¿Estás seguro/a de que deseas eliminar el turno?"}
                  secondProp={appointmentSelect}
                />
              </div>
            )}
            {openModalAppointment && (
              <div
                className="bg-black rounded-xl shadow-xl opacity-90 absolute px-2 py-1 select-none animate-modal-appointment"
                style={{
                  left: `${mousePosition.x + 10}px`,
                  ...(mousePosition.flipUp
                    ? { bottom: `${window.innerHeight - mousePosition.y}px` }
                    : { top: `${mousePosition.y}px` }),
                }}
              >
                <div className="flex-col">
                  <h1 className="text-lg font-medium flex justify-center items-center border-b pb-2">
                    Acciones{" "}
                    <ImCancelCircle
                      onClick={() => setOpenModalAppointment(false)}
                      size={24}
                      className="ml-6 mt-1 font-semibold hover:text-teal-500 cursor-pointer duration-150 transform hover:scale-110"
                    />
                  </h1>
                  <button
                    onClick={() => {
                      setOpenModalAppointment(false);
                      setOpenAlertMessage(true);
                      setShowResult(null);
                    }}
                    className="flex justify-center items-center group hover:text-teal-500"
                  >
                    <MdDeleteForever
                      className="text-white group-hover:text-teal-500 flex mt-2 mb-2 mr-1"
                      size={20}
                    />
                    Eliminar{" "}
                  </button>
                  <button className="flex justify-center items-center group hover:text-teal-500">
                    <FaShare
                      className="text-white group-hover:text-teal-500 flex mt-2 mb-2 mr-1"
                      size={20}
                    />
                    Compartir{" "}
                  </button>
                  <button className="flex justify-center items-center group hover:text-teal-500">
                    <BiSolidBellRing
                      className="text-white group-hover:text-teal-500 flex mt-2 mb-2 mr-1"
                      size={20}
                    />
                    Recordar Turno{" "}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex justify-center items-center">
              {isToday(today) ? (
                <div className="border-2 bg-teal-600 border-gray-600 pr-2 pl-1 transition duration-150 rounded-lg py-0.5 mr-2">
                  <h1 className="flex font-bold text-lg text-white select-none">
                    <MdUpdate size={24} className="mt-0.5 mr-2" />
                    HOY
                  </h1>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setToday(new Date());
                    setOpenCalendar(false);
                    setCalendarValue(dayjs(new Date()));
                  }}
                  className="cursor-pointer transition text-black duration-150 hover:text-white hover:bg-teal-600 bg-gray-300 border-2 border-gray-600 bg-opacity-30 pr-2 pl-1 rounded-lg py-0.5 mr-2"
                >
                  <h1 className="flex font-bold text-lg select-none">
                    <MdUpdate size={24} className="mt-0.5 mr-2" />
                    HOY
                  </h1>
                </div>
              )}
              <BiLeftArrow
                onClick={dayBack}
                size={34}
                className="hover:text-white hover:bg-teal-600 transition duration-150 text-black cursor-pointer mr-2 bg-gray-300 bg-opacity-30 border-2 border-gray-600 rounded-lg py-1"
              />
              <div ref={calendarRef} className="relative">
                <div
                  onClick={() => setOpenCalendar(!openCalendar)}
                  className={`${openCalendar ? "bg-teal-600 text-white" : "text-black bg-gray-300 bg-opacity-30"} transition hover:text-white duration-150 hover:bg-teal-600 cursor-pointer border-2 border-gray-600 px-3 rounded-lg`}
                >
                  <h1 className="flex justify-center items-center font-semibold text-md h-8 select-none">
                    <BsCalendar2Date size={20} className="mr-2" /> {dayName}{" "}
                    {dayNum} de {monthName} ({date})
                  </h1>
                </div>
                {openCalendar && (
                  <div className="select-none absolute bg-white text-black border-2 border-gray-600 rounded-lg top-10 z-10">
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="es"
                    >
                      <DemoContainer components={["DateCalendar"]}>
                        <DateCalendar
                          value={calendarValue}
                          onChange={(newValue) => setCalendarValue(newValue)}
                          views={["day", "year"]}
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                  </div>
                )}
              </div>
              <BiRightArrow
                onClick={dayNext}
                size={34}
                className="hover:text-white hover:bg-teal-600 transition duration-150 text-black cursor-pointer ml-2 bg-gray-300 bg-opacity-30 border-2 border-gray-600 rounded-lg py-1"
              />
              {isLoadAppoints && <ClipLoader className="ml-4" />}
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setPatient(null);
                setSearchContent("");
                setAppointmentDate(null);
                setReason(null);
              }}
              type="button"
              className="select-none shadow-lg h-10 group text-black bg-gray-300 bg-opacity-30 hover:bg-teal-600 hover:border-gray-600 hover:text-white text-gl font-semibold px-4 border-b-4 border-2 border-b-teal-600 border-gray-600 rounded-lg flex items-center justify-center transition duration-200"
            >
              {showForm ? (
                <p className="text-gl text-black select-none font-semibold first-letter:transition duration-200 text-center flex px-4 group-hover:text-white">
                  <ImCancelCircle
                    size={20}
                    className="mr-2 mt-1 font-semibold"
                  />{" "}
                  Cancelar
                </p>
              ) : (
                <div className="flex">
                  <BiSolidBookAdd className="mr-2 mt-1" size={24} />
                  Agregar Turno
                </div>
              )}
            </button>
          </div>

          {/* Main content */}
          <div className="flex justify-between h-screen pb-44 overflow-y-hidden w-full">
            <AppointmentsTable
              appointments={appointments}
              appointmentDate={appointmentDate}
              date={date}
              onRowClick={handleCliclRow}
            />

            {showForm ? (
              <AddAppointmentForm
                appointmentDate={appointmentDate}
                setAppointmentDate={setAppointmentDate}
                appointmentHours={appointmentHours}
                setAppointmentHours={setAppointmentHours}
                freeSpaces={freeSpaces}
                patient={patient}
                setPatient={setPatient}
                listPatients={listPatients}
                searchContent={searchContent}
                setSearchContent={setSearchContent}
                Field={Field}
                setField={setField}
                reason={reason}
                setReason={setReason}
                observations={observations}
                setObservations={setObservations}
                onSetAppoint={handleSetAppoint}
                onOpenCreatePatient={() =>
                  isMobile
                    ? setOpenSheetCreatePatient(true)
                    : setOpenModalCreatePatient(true)
                }
                setShowResult={setShowResult}
                clinicId={clinicId}
              />
            ) : (
              <div className="w-[fit] h-full flex overflow-x-hidden">
                <div className="flex flex-col animate-move-from-right-form-2 w-full ml-10 overflow-x-hidden">
                  <div className="w-full justify-center flex flex-col select-none bg-gray-200 bg-opacity-30 text-black border-2 border-gray-600 rounded-lg shadow-xl">
                    <h1 className="text-center bg-teal-600 rounded-t-lg text-white font-semibold text-xl border-b-2 border-gray-600">
                      Calendario
                    </h1>
                    <div className="flex justify-center">
                      <LocalizationProvider
                        dateAdapter={AdapterDayjs}
                        adapterLocale="es"
                      >
                        <DemoContainer components={["DateCalendar"]}>
                          <DateCalendar
                            loading={isLoadingCalendar}
                            className="bg-transparent rounded-lg"
                            value={calendarValue}
                            onChange={(newValue) => setCalendarValue(newValue)}
                            views={["day", "year"]}
                          />
                        </DemoContainer>
                      </LocalizationProvider>
                    </div>
                  </div>
                  <RemainingAppointments
                    appointments={appointments}
                    isCurrentViewToday={isToday(today)}
                    time={time}
                    alwaysToday={alwaysToday}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <Toast variant={showResult} />
    </div>
  );
}
