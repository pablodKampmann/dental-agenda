"use client";

import * as React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePopoverAnchor } from "@/hooks/usePopoverAnchor";
import { usePopoverReveal } from "@/hooks/usePopoverReveal";
import { computePopoverStyle, POPOVER_Z_INDEX } from "@/lib/popoverPosition";
import { setAppointment } from "./../../services/appointments/setAppointment";
import { updateAppointment } from "./../../services/appointments/updateAppointment";
import { getAppointments } from "./../../services/appointments/getAppointments";
import { getAllPatientsFull } from "./../../services/patients/getAllPatientsFull";
import { getClinicData } from "@/services/config/getClinicData";
import { ClipLoader } from "react-spinners";
import { Loading } from "./../../components/shared/loading";
import { ModalCreatePatient } from "./../../components/patients/ui/modalCreatePatient";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { BiSolidBookAdd, BiSolidBellRing } from "react-icons/bi";
import {
  MdUpdate,
  MdDeleteForever,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdCalendarToday,
  MdEdit,
} from "react-icons/md";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { ConfirmAlert } from "./../../components/shared/dialogAlerts/confirmAlert";
import { deleteAppointment } from "./../../services/appointments/deleteAppointment";
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
import { MiniCalendar } from "@/components/appointments/ui/MiniCalendar";
import Tooltip from "@/components/shared/Tooltip";
import { CustomSelect } from "@/components/shared/CustomSelect";

import { useToast } from '@/context/ToastContext';

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

// Alto/ancho fijos del popover de Acciones (header + 3 ítems) — igual que FloatingAnchor en
// el odontograma, el alto se define por adelantado y nunca se mide después de pintar.
const ACCIONES_PANEL_WIDTH = 224; // w-56
const ACCIONES_PANEL_HEIGHT = 148;

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
  const [Field, setField] = useState("name");
  const [searchContent, setSearchContent] = useState("");
  const [allPatients, setAllPatients] = useState<null | any[]>(null);
  const [appointments, setAppointments] = useState<any>(null);
  const [appointmentSelect, setAppointmentSelect] = useState<any>(null);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
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
  const { showToast } = useToast();
  const [freeSpaces, setFreeSpaces] = useState<any>(null);
  const [time, setTime] = useState(getCurrentTime());
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [pros, setPros] = useState<any[] | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);

  const calendarRef = useRef<any>(null);
  const skipResetHours = useRef(false);
  const appointmentAnchorRef = useRef<HTMLElement | null>(null);
  const { rect: appointmentAnchorRect, hidden: appointmentAnchorHidden, capture: captureAppointmentAnchor } =
    usePopoverAnchor(appointmentAnchorRef, openModalAppointment);

  useEffect(() => {
    async function fetchClinicId() {
      const id = await getUser(true);
      setClinicId(id as string);
    }
    fetchClinicId();
  }, []);

  // No es realtime a propósito, mismo criterio que el resto de /agenda: la lista de
  // profesionales se trae una sola vez al montar, no hace falta escuchar cambios en vivo
  // de /config mientras la agenda está abierta.
  useEffect(() => {
    if (!clinicId) return;
    async function fetchPros() {
      const result = await getClinicData(clinicId!, "pros");
      setPros(Array.isArray(result) ? result : []);
    }
    fetchPros();
  }, [clinicId]);

  // Selector oculto y sin filtrado con 0 o 1 profesional — cero cambio de comportamiento
  // para una clínica que todavía no cargó un segundo profesional en /config.
  const showProfessionalFilter = !!pros && pros.length > 1;

  // Recuerda el último profesional visto por este admin en este browser (por clínica, no
  // global) — se restaura solo al volver a entrar a /agenda.
  useEffect(() => {
    if (!clinicId || !pros || pros.length === 0) return;
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(`agenda-last-pro-${clinicId}`);
    } catch { /* localStorage no disponible (privado/bloqueado) — arranca en el primero */ }
    const validSaved = saved && pros.some((p: any) => p.key === saved) ? saved : null;
    setSelectedProfessionalId(validSaved ?? pros[0].key);
  }, [clinicId, pros]);

  function handleSelectProfessional(id: string) {
    setSelectedProfessionalId(id);
    try {
      if (clinicId) window.localStorage.setItem(`agenda-last-pro-${clinicId}`, id);
    } catch { /* no pasa nada si no se pudo persistir, solo no se recuerda la próxima vez */ }
  }

  // El id que se graba en cada turno nuevo. Se tagea aunque el selector esté oculto (0 o 1
  // profesional) para que el día que se cargue un segundo profesional en /config, los turnos
  // ya existentes del primero no queden sin dueño y desaparezcan de su vista filtrada.
  const activeProfessionalId = pros && pros.length > 0 ? selectedProfessionalId ?? pros[0].key : null;

  // La agenda (grilla, turnos restantes, cálculo de huecos libres, click en fila) solo ve
  // los turnos del profesional seleccionado una vez que hay 2+ cargados — con 0 o 1 no hay
  // nada que filtrar y se muestra todo, igual que antes de esta feature.
  const visibleAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return appointments;
    if (!showProfessionalFilter || !selectedProfessionalId) return appointments;
    return appointments.filter((a: any) => a && a.professionalId === selectedProfessionalId);
  }, [appointments, showProfessionalFilter, selectedProfessionalId]);

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

  // Picker de paciente del alta de turno: un solo fetch de todos los pacientes de la
  // clínica al montar, igual criterio que /patients — búsqueda y listado se resuelven
  // filtrando en memoria, sin volver a golpear Firebase por cada tecla tipeada.
  useEffect(() => {
    if (!clinicId) return;
    getAllPatientsFull(clinicId).then((data) => setAllPatients(data ?? []));
  }, [clinicId]);

  useEffect(() => {
    setSearchContent("");
  }, [Field]);

  const listPatients: null | any[] | string = useMemo(() => {
    if (!allPatients) return null;
    const term = searchContent.trim();
    let matches = allPatients;
    if (term !== "") {
      matches = Field === "dni"
        ? allPatients.filter((p) => (p?.dni ?? "").toString().startsWith(term))
        : allPatients.filter((p) =>
            `${p?.name ?? ""} ${p?.lastName ?? ""}`.toLowerCase().includes(term.toLowerCase())
          );
    }
    if (matches.length < 1) return "noResult";
    return term === "" ? matches.slice(0, 20) : matches;
  }, [allPatients, searchContent, Field]);

  function updateListPatients() {
    if (!clinicId) return;
    getAllPatientsFull(clinicId).then((data) => setAllPatients(data ?? []));
  }

  useEffect(() => {
    const formattedDate = date?.replace(/\//g, "");
    setIsLoadAppoints(true);
    // Limpiar antes de fetchear, no solo al resolver: si no, appointments sigue
    // siendo el del día anterior durante el fetch, y con el key por fecha en
    // AppointmentsTable esos turnos viejos remontan (y animan) bajo la fecha nueva
    // antes de que llegue el dato real.
    setAppointments(null);

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

      if (!visibleAppointments || visibleAppointments.length === 0) {
        const maxSlots = slots.filter((s) =>
          (TIME_SLOTS as readonly string[]).includes(s),
        ).length;
        setFreeSpaces(Math.min(maxSlots, 5));
        return;
      }

      const validAppointments = visibleAppointments.filter((a: any) => a && a.time);
      let freeCount = 0;
      for (const slot of slots) {
        if (!(TIME_SLOTS as readonly string[]).includes(slot)) break;
        if (validAppointments.some((a: any) => a.time === slot)) break;
        freeCount++;
      }

      setFreeSpaces(freeCount);
    }
  }, [appointmentDate, visibleAppointments]);

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
    setEditingAppointment(null);
  }

  // Precarga el form de "Agregar Turno" con los datos del turno existente y lo deja en
  // modo edición (AddAppointmentForm con editing=true) — el paciente no se toca, solo
  // horario/motivo/observaciones. skipResetHours evita que el efecto que escucha
  // [appointmentDate] pise appointmentHours de vuelta a 1 apenas lo seteamos acá.
  function handleEditAppointment() {
    if (!appointmentSelect) return;
    setOpenModalAppointment(false);
    const hours = appointmentSelect.time6 ? 6
      : appointmentSelect.time5 ? 5
        : appointmentSelect.time4 ? 4
          : appointmentSelect.time3 ? 3
            : appointmentSelect.time2 ? 2
              : 1;
    skipResetHours.current = true;
    setPatient(appointmentSelect.patientData);
    setReason(appointmentSelect.reason ?? null);
    setObservations(appointmentSelect.observations ?? "");
    setAppointmentHours(hours);
    setAppointmentDate({
      date: appointmentSelect.date,
      dayComplete: appointmentSelect.dayComplete,
      year: appointmentSelect.year,
      time: appointmentSelect.time,
      time2: appointmentSelect.time2,
      time3: appointmentSelect.time3,
      time4: appointmentSelect.time4,
      time5: appointmentSelect.time5,
      time6: appointmentSelect.time6,
    });
    setEditingAppointment(appointmentSelect);
    setShowForm(true);
  }

  function handleShareWhatsApp() {
    setOpenModalAppointment(false);
    const phone = appointmentSelect?.patientData?.num?.replace(/\D/g, "");
    if (!phone) {
      showToast("error", "El paciente no tiene un teléfono cargado");
      return;
    }
    const patientName = appointmentSelect.patientData?.name ?? "";
    const message = `Hola ${patientName}, te recordamos tu turno del ${appointmentSelect.dayComplete} a las ${appointmentSelect.time}hs.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
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
        visibleAppointments &&
        visibleAppointments.some((a: { time: string }) => a.time === time)
      ) {
        const appointment = visibleAppointments.find(
          (a: { time: string }) => a && a.time === time,
        );
        // Reclickear el turno que ya está "activo" (Acciones abierto sobre él, o en
        // edición — el mismo resaltado de AppointmentsTable) cierra/cancela en vez de
        // reabrir lo mismo: no tiene sentido un segundo popover de Acciones sobre algo que
        // ya está abierto, ni reiniciar una edición ya en curso.
        const isActiveAppointment =
          activeAppointment &&
          appointment &&
          activeAppointment.date === appointment.date &&
          activeAppointment.time === appointment.time;
        clean();
        if (isActiveAppointment) {
          setOpenModalAppointment(false);
          return;
        }
        setAppointmentSelect(appointment);
        // Ancla el popover a la fila clickeada (no a la posición del mouse) — así
        // usePopoverAnchor lo reposiciona/oculta solo si el scroll interno de la tabla
        // mueve esa fila, en vez de quedar "flotando" desanclado en su posición original.
        appointmentAnchorRef.current = event.currentTarget as HTMLElement;
        captureAppointmentAnchor();
        setOpenModalAppointment(true);
      } else if (editingAppointment) {
        // Editando un turno existente, el horario queda fijo — lo único editable es la
        // duración (CustomSelect en el propio form). Clickear otro slot de la grilla no
        // reubica nada, a diferencia del alta de un turno nuevo.
        return;
      } else if (appointmentDate) {
        // Re-clickear cualquiera de los slots ya resaltados/"respirando" (el rango completo
        // que ocupa la duración elegida, no solo el horario inicial — ver el mismo chequeo
        // en AppointmentsTable) cancela el alta. Cualquier otro slot, sea del mismo día o de
        // otro, solo mueve el horario inicial sin tirar el estado de "Agregar Turno"
        // (paciente, motivo, observaciones quedan como estaban). La duración se recalcula
        // sola: el efecto que escucha `appointmentDate` ya resetea `appointmentHours` a 30
        // min por cada cambio de horario, y `freeSpaces` se recalcula para el nuevo horario
        // en su propio efecto.
        const isWithinSelectedRange =
          appointmentDate.date === date &&
          (appointmentDate.time === time ||
            appointmentDate.time2 === time ||
            appointmentDate.time3 === time ||
            appointmentDate.time4 === time ||
            appointmentDate.time5 === time ||
            appointmentDate.time6 === time);
        if (isWithinSelectedRange) {
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
        }
      } else {
        setOpenModalAppointment(false);
        const parts = date.split("/");
        const year = parts[2];
        setShowForm(true);
        setAppointmentDate({
          date: date,
          dayComplete: `${dayName} ${dayNum} de ${monthName}`,
          year: year,
          time: time,
        });
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
    const editing = editingAppointment;
    // Si se edita, el turno conserva el profesional que ya tenía (por si en el futuro se
    // habilita cambiarlo, hoy siempre coincide con el filtro activo). Si es alta nueva, el
    // profesional lo decide el filtro seleccionado en la agenda.
    const professionalId = editing?.professionalId ?? activeProfessionalId ?? undefined;
    clean();
    const result = editing
      ? await updateAppointment(
          editing.id,
          editing.date,
          patientId,
          dateData,
          reason,
          observations,
          professionalId,
        )
      : await setAppointment(
          patientId,
          dateData,
          reason,
          observations,
          professionalId,
        );
    const formattedDate = date?.replace(/\//g, "");
    const appts = await fetchAppointments(formattedDate);
    setAppointments(appts);
    setIsLoadAppoints(false);
    if (result === null) {
      showToast("error", editing ? "Error al editar el turno" : "Error al crear el turno");
    } else {
      showToast("success", editing ? "Turno editado correctamente" : "Turno creado correctamente");
    }
  }

  async function handleSuccessDeleteAppointment() {
    setIsLoadAppoints(true);
    const formattedDate = date?.replace(/\//g, "");
    const appts = await fetchAppointments(formattedDate);
    setAppointments(appts);
    setIsLoadAppoints(false);
    showToast("success", "Turno eliminado correctamente");
  }

  const appointmentsCount = Array.isArray(visibleAppointments)
    ? visibleAppointments.filter((a: any) => a && a.time).length
    : 0;

  // El turno sobre el que está abierto el popover de Acciones, o que se está editando —
  // se mantiene resaltado en la grilla mientras dure cualquiera de los dos, para que quede
  // claro con cuál se está interactuando.
  const activeAppointment = editingAppointment ?? (openModalAppointment ? appointmentSelect : null);
  const activeAppointmentKey = activeAppointment
    ? `${activeAppointment.date}-${activeAppointment.time}`
    : null;

  // Posicionamiento inteligente del popover de Acciones — mismo primitivo que CustomSelect:
  // clampea contra el viewport, decide arriba/abajo según espacio disponible, y se oculta
  // (sin desmontar) si el scroll interno de la tabla tapa la fila anclada. El alto es fijo
  // por adelantado (header + 3 ítems), nunca medido después de pintar.
  const { style: accionesStyle, openUp: accionesOpenUp } = appointmentAnchorRect
    ? computePopoverStyle({
        rect: appointmentAnchorRect,
        width: ACCIONES_PANEL_WIDTH,
        height: ACCIONES_PANEL_HEIGHT,
        hidden: appointmentAnchorHidden,
      })
    : { style: null, openUp: null };
  const accionesReveal = usePopoverReveal(accionesOpenUp);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden">
      {isLoad ? (
        <Loading />
      ) : (
        <>
          {/* Overlays: fuera del contenedor con gap, si no el gap-4 suma margen arriba del header */}
          <div>
            <ModalCreatePatient
              open={openModalCreatePatient}
              onClose={() => setOpenModalCreatePatient(false)}
              onSuccess={() => {
                showToast("success", "Paciente creado correctamente");
                updateListPatients();
              }}
            />
            <Suspense fallback={null}>
              <PatientParamReader
                setPatient={setPatient}
                setShowForm={setShowForm}
              />
            </Suspense>
            <ConfirmAlert
              open={openAlertMessage}
              setOpen={setOpenAlertMessage}
              title="¿Eliminar turno?"
              description={
                appointmentSelect ? (
                  <span>
                    Se eliminará el turno de <strong>{appointmentSelect.patientData?.name} {appointmentSelect.patientData?.lastName}</strong> del {appointmentSelect.dayComplete} a las {appointmentSelect.time}.
                  </span>
                ) : "Esta acción no se puede deshacer."
              }
              onConfirm={async () => {
                const dateUpdate = appointmentSelect.date.replace(/\//g, '');
                await deleteAppointment(appointmentSelect.id, dateUpdate);
                // clean() por si se disparó desde adentro de "Editar Turno" — si no, el form
                // queda abierto mostrando datos de un turno que ya no existe. Cuando viene
                // del menú de Acciones (form cerrado) es un no-op inofensivo.
                clean();
                await handleSuccessDeleteAppointment();
              }}
              confirmText="Eliminar"
            />
            {openModalAppointment && appointmentAnchorRect && accionesStyle && createPortal(
              <div
                key={`${appointmentSelect?.date}-${appointmentSelect?.time}`}
                className={`w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden select-none ${accionesReveal}`}
                style={{ ...accionesStyle, zIndex: POPOVER_Z_INDEX }}
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50">
                  <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                    Acciones
                  </span>
                  <button
                    onClick={() => setOpenModalAppointment(false)}
                    className="text-gray-400 hover:text-black transition duration-150"
                  >
                    <MdClose size={16} />
                  </button>
                </div>
                <button
                  onClick={handleEditAppointment}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition duration-150"
                >
                  <MdEdit size={16} />
                  Editar
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black whitespace-nowrap transition duration-150"
                >
                  <BiSolidBellRing size={16} className="shrink-0" />
                  Recordar por WhatsApp
                </button>
                <button
                  onClick={() => {
                    setOpenModalAppointment(false);
                    setOpenAlertMessage(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition duration-150"
                >
                  <MdDeleteForever size={18} />
                  Eliminar
                </button>
              </div>,
              document.body
            )}
          </div>

          <div className="flex flex-col h-full gap-4 px-4 pt-4 pb-4 animate-page-drop">
          {/* Page header */}
          <div className="shrink-0 flex items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-2xl font-bold text-black tracking-tight">
                Agenda
              </h1>
              <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                {appointmentsCount === 0
                  ? "Sin turnos"
                  : `${appointmentsCount} ${appointmentsCount === 1 ? "turno" : "turnos"}`}
              </span>
            </div>
            <button
              onClick={() => {
                if (showForm) {
                  clean();
                } else {
                  setShowForm(true);
                }
              }}
              type="button"
              className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 border-2 text-sm font-semibold rounded-lg transition duration-150 ${
                showForm
                  ? "text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-black"
                  : "bg-teal-700 border-teal-700 text-white hover:bg-teal-600"
              }`}
            >
              {showForm ? (
                <>
                  <MdClose size={18} />
                  Cancelar
                </>
              ) : (
                <>
                  <BiSolidBookAdd size={16} />
                  Agregar Turno
                </>
              )}
            </button>
          </div>

          {/* Body: agenda + panel lateral */}
          <div className="flex-1 min-h-0 flex gap-4">
            {/* Card de la agenda */}
            <div className="flex-1 min-w-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Navegador de fecha */}
              <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50 select-none">
                <button
                  onClick={() => {
                    setToday(new Date());
                    setOpenCalendar(false);
                    setCalendarValue(dayjs(new Date()));
                  }}
                  disabled={isToday(today)}
                  className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg border-2 text-xs font-semibold transition duration-150 ${
                    isToday(today)
                      ? "bg-teal-700 border-teal-700 text-white cursor-default"
                      : "text-gray-500 border-gray-300 hover:text-teal-700 hover:border-teal-300"
                  }`}
                >
                  <MdUpdate size={16} />
                  Hoy
                </button>

                <button
                  onClick={dayBack}
                  className="h-8 w-8 flex items-center justify-center text-gray-500 border-2 border-gray-300 rounded-lg hover:text-teal-700 hover:border-teal-300 transition duration-150"
                >
                  <MdChevronLeft size={20} />
                </button>

                <div ref={calendarRef} className="relative">
                  <button
                    onClick={() => setOpenCalendar(!openCalendar)}
                    className={`flex items-center justify-center gap-2 h-8 px-3 w-[320px] shrink-0 rounded-lg border-2 text-sm font-semibold transition duration-150 ${
                      openCalendar
                        ? "border-teal-700 text-teal-700"
                        : "border-gray-300 text-black hover:border-teal-300 hover:text-teal-700"
                    }`}
                  >
                    <MdCalendarToday size={15} className="shrink-0" />
                    <span className="truncate">
                      {dayName} {dayNum} de {monthName}
                    </span>
                    <span className="text-xs font-medium text-gray-400 shrink-0">
                      ({date})
                    </span>
                  </button>
                  {openCalendar && (
                    <div className="absolute top-10 z-20 w-72 bg-white text-black border border-gray-200 rounded-xl shadow-xl select-none animate-popover-drop">
                      <MiniCalendar
                        value={calendarValue}
                        onChange={(newValue) => setCalendarValue(newValue)}
                        compact
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={dayNext}
                  className="h-8 w-8 flex items-center justify-center text-gray-500 border-2 border-gray-300 rounded-lg hover:text-teal-700 hover:border-teal-300 transition duration-150"
                >
                  <MdChevronRight size={20} />
                </button>

                {showProfessionalFilter && (
                  <div className="w-48 shrink-0">
                    <CustomSelect
                      size="sm"
                      value={selectedProfessionalId ?? ""}
                      onChange={handleSelectProfessional}
                      options={pros!.map((p: any) => ({ value: p.key, label: p.nameComplete }))}
                      placeholder="Profesional"
                      triggerClassName="bg-gray-50"
                    />
                  </div>
                )}

                <div className="w-5 shrink-0 flex items-center justify-center">
                  {isLoadAppoints && (
                    <ClipLoader speedMultiplier={1.7} color="#0f766e" size={18} />
                  )}
                </div>
              </div>

              <AppointmentsTable
                appointments={visibleAppointments}
                appointmentDate={appointmentDate}
                date={date}
                onRowClick={handleCliclRow}
                activeAppointmentKey={activeAppointmentKey}
              />
            </div>

            {/* Panel lateral */}
            <div className="w-[360px] shrink-0 min-h-0 flex flex-col gap-4 overflow-hidden">
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
                  onOpenCreatePatient={() => setOpenModalCreatePatient(true)}
                  clinicId={clinicId}
                  professionalName={showProfessionalFilter ? (pros!.find((p: any) => p.key === activeProfessionalId)?.nameComplete ?? null) : null}
                  editing={!!editingAppointment}
                  onDelete={() => setOpenAlertMessage(true)}
                />
              ) : (
                <div className="flex flex-col gap-4 h-full min-h-0 animate-move-from-right-form-2">
                  {/* Calendario */}
                  <div className="flex-[60] [@media(min-height:850px)]:flex-[45] min-h-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden select-none text-black">
                    <div className="shrink-0 flex items-center justify-between gap-2 px-4 pt-3 pb-2.5 border-b border-gray-200 bg-gray-50">
                      <h2 className="text-base font-bold text-black tracking-tight">
                        Calendario
                      </h2>
                      {!isToday(today) && (
                        <Tooltip content="Volver al día de hoy" clickable>
                          <button
                            onClick={() => {
                              setToday(new Date());
                              setCalendarValue(dayjs(new Date()));
                            }}
                            className="text-xs font-semibold text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md transition duration-150"
                          >
                            Hoy
                          </button>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex-1 min-h-0">
                      <MiniCalendar
                        value={calendarValue}
                        onChange={(newValue) => setCalendarValue(newValue)}
                        fill
                      />
                    </div>
                  </div>

                  <RemainingAppointments
                    appointments={visibleAppointments}
                    isCurrentViewToday={isToday(today)}
                    time={time}
                    alwaysToday={alwaysToday}
                  />
                </div>
              )}
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
