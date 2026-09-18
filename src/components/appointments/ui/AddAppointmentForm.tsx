'use client'

import { useEffect, useRef, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { GiClick } from 'react-icons/gi';
import { TbUserSearch } from 'react-icons/tb';
import { FaRegTrashCan, FaCheck } from 'react-icons/fa6';
import { BsArrowLeftCircle } from 'react-icons/bs';
import { getChapter } from '@/services/practices/getChapter';
import { CustomSelect } from '@/components/shared/CustomSelect';
import Tooltip from '@/components/shared/Tooltip';
import { timeCalc, getAge, formatPrice } from '../appointmentUtils';
import type { dateData } from '../appointmentUtils';

interface Props {
  appointmentDate: dateData | null;
  setAppointmentDate: (v: dateData | null) => void;
  appointmentHours: any;
  setAppointmentHours: (v: any) => void;
  freeSpaces: any;
  patient: any;
  setPatient: (v: any) => void;
  listPatients: any;
  isPickerListComplete: boolean;
  onLoadMorePatients: () => void;
  searchContent: string;
  setSearchContent: (v: string) => void;
  Field: string;
  setField: (v: string) => void;
  reason: any;
  setReason: (v: any) => void;
  observations: string;
  setObservations: (v: string) => void;
  onSetAppoint: (patientId: number, dateData: dateData, reason: any, observations?: string) => void;
  onOpenCreatePatient: () => void;
  clinicId: string | null;
  /** Nombre del profesional dueño de esta agenda — solo se pasa (y solo se muestra) cuando
   *  la clínica tiene 2+ profesionales cargados; con uno solo no hay ambigüedad que aclarar. */
  professionalName?: string | null;
  /** El turno ya existe y se está reagendando/editando, en vez de crear uno nuevo — el
   *  paciente queda fijo (no se ofrece el step de cambiarlo) y el copy/label reflejan
   *  "editar" en vez de "agregar". */
  editing?: boolean;
  /** Solo se usa con `editing`: eliminar el turno definitivamente en vez de guardar los
   *  cambios — el padre es responsable de la confirmación (mismo `ConfirmAlert` que ya
   *  dispara el menú de Acciones). */
  onDelete?: () => void;
}

const CHAPTERS = [
  'CONSULTAS', 'OPERATORIA DENTAL', 'ENDODONCIA', 'PRÓTESIS',
  'ODONTOLOGÍA PREVENTIVA', 'ORTODONCIA Y ORTOPEDIA FUNCIONAL',
  'ODONTOPEDIATRÍA', 'PERIODONCIA', 'RADIOLOGÍA', 'CIRUGÍA',
];

const PANEL = "bg-gray-50 border border-gray-200 rounded-xl";
const PANEL_HEAD = "flex justify-between items-center gap-2 px-3 py-1.5 border-b border-gray-200";
const PANEL_LABEL = "text-xs font-bold tracking-widest text-gray-400 uppercase select-none";
const LINK_BTN = "text-xs font-semibold text-teal-700 hover:text-teal-600 transition duration-150";
const INPUT_CLS = "w-full h-9 px-3 border-2 border-gray-300 rounded-lg bg-white text-sm text-black placeholder:text-gray-400 focus:outline-teal-700";
const PRIMARY_BTN = "w-full py-2 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150";

export function AddAppointmentForm({
  appointmentDate, setAppointmentDate,
  appointmentHours, setAppointmentHours, freeSpaces,
  patient, setPatient,
  listPatients, isPickerListComplete, onLoadMorePatients, searchContent, setSearchContent, Field, setField,
  reason, setReason,
  observations, setObservations,
  onSetAppoint, onOpenCreatePatient,
  clinicId,
  professionalName,
  editing = false,
  onDelete,
}: Props) {
  const [step, setStep] = useState(editing ? 3 : 1);
  const [chapterName, setChapterName] = useState('');
  const [chapterData, setChapterData] = useState<any>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const patientListScrollRef = useRef<HTMLDivElement>(null);
  const onLoadMorePatientsRef = useRef(onLoadMorePatients);
  onLoadMorePatientsRef.current = onLoadMorePatients;

  // Si viene paciente por URL, ya está seteado en el padre — no hace falta lógica extra acá

  // Scroll infinito del picker de paciente: chequeo directo de "cuánto falta para el fondo"
  // en vez de IntersectionObserver — con éste último, si la tanda cargada deja al sentinel
  // pegado exactamente al borde del scroll (el caso típico acá, el usuario scrollea hasta el
  // fondo y ahí se queda), su estado "visible" nunca cambia de `true`, y el observer solo
  // dispara en cambios de estado — se quedaba cargando para siempre después de la primera
  // tanda. Corre en cada scroll y también después de cada tanda nueva (por si el contenido
  // agregado todavía no alcanza a generar scroll y hay que seguir pidiendo de una).
  useEffect(() => {
    const el = patientListScrollRef.current;
    if (!el || isPickerListComplete) return;
    // Bandera por tanda: sin esto, cada evento de scroll cercano al fondo agenda su propio
    // setTimeout de 400ms — un solo gesto de scroll dispara el evento varias veces, así que
    // se encolaban varios pedidos de "+50" en paralelo antes de que llegara el primero.
    let requested = false;
    function checkAndLoadMore() {
      if (requested || el.scrollHeight - el.scrollTop - el.clientHeight > 20) return;
      requested = true;
      setTimeout(() => onLoadMorePatientsRef.current(), 400); // delay hardcodeado, para que el spinner se llegue a ver
    }
    checkAndLoadMore();
    el.addEventListener('scroll', checkAndLoadMore);
    return () => el.removeEventListener('scroll', checkAndLoadMore);
    // `step` entra en las dependencias a propósito: el contenedor (`patientListScrollRef`) solo
    // existe en el DOM cuando `step === 2` (se renderiza condicionalmente) — sin `step` acá, si
    // `isPickerListComplete`/`listPatients` ya estaban estables antes de llegar a ese step, el
    // efecto no se re-ejecuta al entrar y corre una sola vez con `ref.current` en null.
  }, [isPickerListComplete, listPatients, step]);

  useEffect(() => {
    if (!chapterName) return;
    async function fetchChapter() {
      setLoadingChapter(true);
      const { data } = await getChapter(chapterName, clinicId ?? '');
      if (data) {
        const filtered = data
          .filter((item: any) => !Object.values(item).every(v => v === undefined))
          .sort((a: any, b: any) => parseInt(a.id) - parseInt(b.id));
        setChapterData(filtered);
      }
      setLoadingChapter(false);
    }
    fetchChapter();
  }, [chapterName]);

  // Stepper: step completado si tiene dato
  function isStepComplete(s: number) {
    if (s === 1) return !!appointmentDate;
    if (s === 2) return !!patient;
    return false;
  }

  // Calcula hora de fin del turno
  function getEndTime() {
    if (!appointmentDate) return '';
    const last = appointmentDate.time6 ?? appointmentDate.time5 ?? appointmentDate.time4 ??
      appointmentDate.time3 ?? appointmentDate.time2 ?? appointmentDate.time;
    return timeCalc(last);
  }

  return (
    <div className='flex-1 min-h-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-move-from-right-form'>

      {/* Card header */}
      <div className='shrink-0 px-4 pt-3 pb-2.5 border-b border-gray-200 bg-gray-50 select-none'>
        <div className='flex items-center justify-between gap-2'>
          <h2 className='text-base font-bold text-black tracking-tight'>{editing ? 'Editar Turno' : 'Agregar Turno'}</h2>
          {professionalName && (
            <span className='shrink-0 max-w-[140px] truncate text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5'>
              {professionalName}
            </span>
          )}
        </div>
        <p className='text-xs text-gray-400'>{editing ? 'Horario y detalles del turno.' : 'Horario, paciente y confirmación.'}</p>
      </div>

      {/* Stepper — en modo edición el paciente queda fijo, no se ofrece ese step */}
      <div className='shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200'>
        {(editing
          ? [{ s: 1, label: 'Horario' }, { s: 3, label: 'Confirmar' }]
          : [{ s: 1, label: 'Horario' }, { s: 2, label: 'Paciente' }, { s: 3, label: 'Confirmar' }]
        ).map(({ s, label }, i, arr) => {
          const complete = isStepComplete(s);
          const active = step === s;
          return (
            <div key={s} className='flex items-center flex-1'>
              <button
                onClick={() => setStep(s)}
                className='flex flex-col items-center gap-1 flex-1 group'
              >
                <div className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition duration-150
                  ${active
                    ? 'bg-teal-700 border-teal-700 text-white'
                    : complete
                      ? 'bg-teal-50 border-teal-200 text-teal-700'
                      : 'bg-gray-50 border-gray-300 text-gray-400 group-hover:border-teal-300 group-hover:text-teal-600'}
                `}>
                  {complete && !active ? <FaCheck size={12} /> : s}
                </div>
                <span className={`text-xs font-semibold select-none transition duration-150
                  ${active ? 'text-teal-700' : complete ? 'text-teal-600' : 'text-gray-400 group-hover:text-teal-600'}
                `}>
                  {label}
                </span>
              </button>
              {i < arr.length - 1 && (
                <div className={`h-0.5 w-6 mx-1 rounded-full transition duration-150 ${complete ? 'bg-teal-600' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className='flex-1 min-h-0 flex flex-col'>

        {/* ── STEP 1: Horario ── */}
        {step === 1 && (
          <div className='p-4 flex flex-col gap-3 overflow-y-auto h-full'>
            {appointmentDate ? (
              <div className='flex flex-col gap-3 animate-popover-drop'>
                <div className={`${PANEL} p-3 flex justify-between items-start gap-2`}>
                  <div className='flex flex-col gap-0.5 min-w-0'>
                    <p className='text-xs text-gray-500 select-none'>Día seleccionado</p>
                    <p className='text-sm font-semibold text-black'>{appointmentDate.dayComplete}, {appointmentDate.year}</p>
                    <p className='text-xs text-gray-500 select-none mt-1'>Horario</p>
                    <p className='text-sm font-semibold text-black'>{appointmentDate.time} – {getEndTime()}</p>
                  </div>
                  {!editing && (
                    <button onClick={() => setAppointmentDate(null)} className='shrink-0'>
                      <Tooltip content="Quitar horario" side="top" align="end" clickable>
                        <FaRegTrashCan size={18} className='text-gray-400 hover:text-red-600 transition duration-150' />
                      </Tooltip>
                    </button>
                  )}
                </div>

                {/* Duración */}
                <div className={`${PANEL} p-3`}>
                  <p className='text-xs text-gray-500 select-none mb-1.5'>Duración del turno</p>
                  <CustomSelect
                    value={String(appointmentHours)}
                    onChange={setAppointmentHours}
                    options={[
                      { value: '1', label: '30 min' },
                      { value: '2', label: '1 hora' },
                      { value: '3', label: '1 hora 30 min' },
                      { value: '4', label: '2 horas' },
                      { value: '5', label: '2 horas 30 min' },
                      { value: '6', label: '3 horas' },
                    ]}
                    disabledValues={[
                      freeSpaces < 1 && '2',
                      freeSpaces < 2 && '3',
                      freeSpaces < 3 && '4',
                      freeSpaces < 4 && '5',
                      freeSpaces < 5 && '6',
                    ].filter(Boolean) as string[]}
                    triggerClassName="bg-white"
                  />
                </div>

                <button onClick={() => setStep(editing ? 3 : 2)} className={PRIMARY_BTN}>
                  Siguiente →
                </button>
              </div>
            ) : (
              <div className={`${PANEL} flex flex-col items-center justify-center p-6 text-center gap-2`}>
                <BsArrowLeftCircle size={64} className='text-gray-300' />
                <p className='text-sm font-medium text-gray-500 select-none'>
                  Seleccioná el día y horario<br />haciendo click en la agenda
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Paciente ── */}
        {step === 2 && (
          <div className='p-4 flex flex-col gap-3 h-full min-h-0'>
            {patient ? (
              <>
                <div className={`${PANEL} p-3 flex justify-between items-start gap-2`}>
                  <div className='min-w-0'>
                    <p className='text-xs text-gray-500 select-none'>Paciente seleccionado</p>
                    <p className='text-sm font-semibold text-black truncate'>{patient.name} {patient.lastName}</p>
                    <p className='text-xs text-gray-500'>DNI: {patient.dni}</p>
                  </div>
                  <button onClick={() => setPatient(null)} className='shrink-0'>
                    <FaRegTrashCan size={18} className='text-gray-400 hover:text-red-600 transition duration-150' />
                  </button>
                </div>
                <button onClick={() => setStep(3)} className={PRIMARY_BTN}>
                  Siguiente →
                </button>
              </>
            ) : (
              <div className='flex flex-col gap-3 flex-1 min-h-0'>
                {/* Search bar — mismo componente fusionado buscador+toggle que /patients (patientsToolbar.tsx), en versión compacta */}
                <div className='relative flex items-stretch h-8 border-2 border-gray-300 rounded-lg bg-white transition-colors focus-within:border-teal-700'>
                  <TbUserSearch
                    className='absolute left-1.5 top-1/2 -translate-y-1/2 text-teal-700 pointer-events-none'
                    size={15}
                  />
                  <input
                    autoFocus
                    name='search'
                    value={searchContent}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSearchContent(Field === 'dni' ? v.replace(/[^0-9]/g, '') : v);
                    }}
                    type='text'
                    placeholder='Buscar por nombre o apellido...'
                    className='flex-1 min-w-0 pl-7 pr-2 bg-transparent text-xs text-black placeholder:text-gray-400 outline-none rounded-l-lg'
                  />
                  <div className='flex gap-0.5 p-1 shrink-0 border-l border-gray-200 select-none'>
                    {[{ id: 'name', label: 'Nombre' }, { id: 'dni', label: 'DNI' }].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => setField(id)}
                        className={`px-2 rounded-md text-xs font-semibold transition duration-150 ${
                          Field === id ? 'bg-teal-700 text-white shadow-sm' : 'text-gray-500 hover:text-black hover:bg-gray-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results */}
                <div ref={patientListScrollRef} className='bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 min-h-0 overflow-y-auto'>
                  {listPatients && typeof listPatients !== 'string' ? (
                    listPatients.map((p: any, i: number) => (
                      <div
                        key={i}
                        onClick={() => { setPatient(p); setStep(3); }}
                        className='flex justify-between items-center gap-2 px-3 py-2 text-sm text-black border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition duration-100'
                      >
                        <span className='truncate'>{p.name} {p.lastName}</span>
                        <span className='text-gray-400 text-xs shrink-0'>{p.dni}</span>
                      </div>
                    ))
                  ) : listPatients === 'noResult' ? (
                    <p className='text-sm text-gray-400 p-3'>Sin resultados...</p>
                  ) : (
                    <div className='flex justify-center items-center py-8'>
                      <ClipLoader color='#0f766e' size={28} />
                    </div>
                  )}
                  {listPatients && typeof listPatients !== 'string' && !isPickerListComplete && (
                    <div className='flex justify-center items-center py-3'>
                      <ClipLoader color='#0f766e' size={16} />
                    </div>
                  )}
                </div>

                {/* Crear paciente */}
                <div className='flex items-center gap-1 text-xs text-gray-500'>
                  <span>¿No encontrás al paciente?</span>
                  <button onClick={onOpenCreatePatient} className={`${LINK_BTN} flex items-center gap-0.5`}>
                    Cargalo ahora <GiClick size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Confirmar ── */}
        {step === 3 && (
          <div className='p-4 flex flex-col gap-3 overflow-y-auto h-full'>

            {/* Resumen horario */}
            <div className={`${PANEL} shrink-0 overflow-hidden`}>
              <div className={PANEL_HEAD}>
                <span className={PANEL_LABEL}>Horario</span>
                <button onClick={() => setStep(1)} className={LINK_BTN}>Editar</button>
              </div>
              {appointmentDate ? (
                <div className='px-3 py-2'>
                  <p className='text-sm font-semibold text-black'>{appointmentDate.dayComplete}, {appointmentDate.year}</p>
                  <p className='text-xs text-gray-500'>{appointmentDate.time} – {getEndTime()}</p>
                  {professionalName && (
                    <p className='text-xs text-gray-500 mt-0.5'>Profesional: <span className='font-semibold text-black'>{professionalName}</span></p>
                  )}
                </div>
              ) : (
                <div className='px-3 py-2 flex items-center justify-between gap-2'>
                  <p className='text-xs text-red-600 font-medium'>Sin horario seleccionado</p>
                  <button onClick={() => setStep(1)} className={LINK_BTN}>Seleccionar</button>
                </div>
              )}
            </div>

            {/* Resumen paciente */}
            <div className={`${PANEL} shrink-0 overflow-hidden`}>
              <div className={PANEL_HEAD}>
                <span className={PANEL_LABEL}>Paciente</span>
                {!editing && <button onClick={() => setStep(2)} className={LINK_BTN}>Editar</button>}
              </div>
              {patient ? (
                <div className='px-3 py-2'>
                  <p className='text-sm font-semibold text-black'>{patient.name} {patient.lastName}</p>
                  <p className='text-xs text-gray-500'>DNI: {patient.dni} · {getAge(patient.birthDate)} años</p>
                  {patient.insurance !== 'Particular' && (
                    <p className='text-xs text-gray-500'>{patient.insurance} — Plan: {patient.plan}</p>
                  )}
                </div>
              ) : (
                <div className='px-3 py-2 flex items-center justify-between gap-2'>
                  <p className='text-xs text-red-600 font-medium'>Sin paciente seleccionado</p>
                  {!editing && <button onClick={() => setStep(2)} className={LINK_BTN}>Seleccionar</button>}
                </div>
              )}
            </div>

            {/* Motivo (opcional) */}
            <div className={`${PANEL} shrink-0 overflow-hidden`}>
              <div className={PANEL_HEAD}>
                <span className={PANEL_LABEL}>
                  Motivo <span className='font-normal normal-case tracking-normal'>(opcional)</span>
                </span>
                {reason && (
                  <button onClick={() => setReason(null)}>
                    <FaRegTrashCan size={14} className='text-gray-400 hover:text-red-600 transition duration-150' />
                  </button>
                )}
              </div>
              {reason ? (
                <div className='px-3 py-2'>
                  <p className='text-sm font-semibold text-black'>{reason.name}</p>
                  <p className='text-xs text-gray-500'>${formatPrice(reason.price)}</p>
                </div>
              ) : (
                <div className='px-3 py-2 flex flex-col gap-2'>
                  <CustomSelect
                    value={chapterName}
                    onChange={(v) => { setChapterName(v); setChapterData(null); }}
                    placeholder="— Seleccionar categoría —"
                    options={CHAPTERS.map((c) => ({ value: c, label: c }))}
                    size="sm"
                    triggerClassName="bg-white"
                  />
                  {chapterName && (
                    <div className='border border-gray-200 rounded-lg overflow-hidden max-h-36 overflow-y-auto bg-white'>
                      {loadingChapter ? (
                        <div className='flex justify-center py-4'><ClipLoader color='#0f766e' size={20} /></div>
                      ) : chapterData && chapterData.length > 0 ? (
                        chapterData.map((practice: any, i: number) => (
                          <div
                            key={i}
                            onClick={() => setReason(practice)}
                            className='flex justify-between items-center gap-2 px-3 py-1.5 text-xs text-black border-b border-gray-100 last:border-none hover:bg-gray-50 cursor-pointer transition duration-100'
                          >
                            <span className='truncate'>{practice.name}</span>
                            <span className='font-semibold text-gray-500 shrink-0'>${formatPrice(practice.price)}</span>
                          </div>
                        ))
                      ) : (
                        <p className='text-xs text-gray-400 p-3 text-center'>Sin prácticas en esta categoría</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className={`${PANEL} shrink-0 overflow-hidden`}>
              <div className={PANEL_HEAD}>
                <span className={PANEL_LABEL}>
                  Observaciones <span className='font-normal normal-case tracking-normal'>(opcional)</span>
                </span>
              </div>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder='Ninguna'
                className='w-full resize-none text-black text-sm px-3 py-2 focus:outline-none h-16 bg-white placeholder:text-gray-400'
              />
            </div>

            {/* Botón confirmar */}
            <button
              onClick={() => {
                if (!patient || !appointmentDate) return;
                onSetAppoint(patient.id, appointmentDate, reason, observations);
              }}
              disabled={!patient || !appointmentDate}
              className={`shrink-0 w-full py-2.5 text-sm font-semibold rounded-lg transition duration-150
                ${patient && appointmentDate
                  ? 'bg-teal-700 text-white hover:bg-teal-600 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed'}
              `}
            >
              {editing ? 'Guardar cambios' : 'Confirmar Turno'}
            </button>

            {editing && onDelete && (
              <button
                onClick={onDelete}
                className='shrink-0 w-full flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-50 transition duration-150'
              >
                <FaRegTrashCan size={14} />
                Eliminar turno
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
