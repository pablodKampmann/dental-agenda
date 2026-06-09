'use client'

import { useRef, useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { GiClick } from 'react-icons/gi';
import { FaRegTrashCan, FaCheck } from 'react-icons/fa6';
import { BsArrowLeftCircle } from 'react-icons/bs';
import { FaRegTrashCan as Trash } from 'react-icons/fa6';
import { getChapter } from '@/services/practices/getChapter';
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
}

const CHAPTERS = [
  'CONSULTAS', 'OPERATORIA DENTAL', 'ENDODONCIA', 'PRÓTESIS',
  'ODONTOLOGÍA PREVENTIVA', 'ORTODONCIA Y ORTOPEDIA FUNCIONAL',
  'ODONTOPEDIATRÍA', 'PERIODONCIA', 'RADIOLOGÍA', 'CIRUGÍA',
];

export function AddAppointmentForm({
  appointmentDate, setAppointmentDate,
  appointmentHours, setAppointmentHours, freeSpaces,
  patient, setPatient,
  listPatients, searchContent, setSearchContent, Field, setField,
  reason, setReason,
  observations, setObservations,
  onSetAppoint, onOpenCreatePatient,
  clinicId,
}: Props) {
  const [step, setStep] = useState(1);
  const [chapterName, setChapterName] = useState('');
  const [chapterData, setChapterData] = useState<any>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);

  // Si viene paciente por URL, ya está seteado en el padre — no hace falta lógica extra acá

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

  function canNavigateTo(s: number) {
    // Siempre libre, pero el step 3 requiere al menos horario y paciente para confirmar
    return true;
  }

  // Calcula hora de fin del turno
  function getEndTime() {
    if (!appointmentDate) return '';
    const last = appointmentDate.time6 ?? appointmentDate.time5 ?? appointmentDate.time4 ??
      appointmentDate.time3 ?? appointmentDate.time2 ?? appointmentDate.time;
    return timeCalc(last);
  }

  return (
    <div className='w-[35%] flex overflow-x-hidden'>
      <div className='flex-1 ml-10 overflow-x-hidden flex flex-col border-2 border-gray-600 rounded-lg shadow-xl bg-gray-300 bg-opacity-30 animate-move-from-right-form'>

        {/* Header */}
        <h1 className='text-center bg-teal-600 rounded-t-lg text-white font-semibold pb-1 py-1 text-2xl border-b-2 border-gray-600 select-none'>
          Agregar Turno
        </h1>

        {/* Stepper */}
        <div className='flex items-center justify-between px-4 py-3 border-b-2 border-gray-600 bg-white bg-opacity-40'>
          {[1, 2, 3].map((s, i) => {
            const labels = ['Horario', 'Paciente', 'Confirmar'];
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
                    ${active ? 'bg-teal-600 border-teal-600 text-white' : complete ? 'bg-teal-100 border-teal-600 text-teal-700' : 'bg-white border-gray-400 text-gray-400 group-hover:border-teal-400 group-hover:text-teal-500'}
                  `}>
                    {complete && !active ? <FaCheck size={12} /> : s}
                  </div>
                  <span className={`text-xs font-semibold select-none transition duration-150
                    ${active ? 'text-teal-700' : complete ? 'text-teal-600' : 'text-gray-400 group-hover:text-teal-500'}
                  `}>
                    {labels[i]}
                  </span>
                </button>
                {i < 2 && (
                  <div className={`h-0.5 w-6 mx-1 rounded-full transition duration-150 ${complete ? 'bg-teal-500' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className='flex-1 overflow-hidden flex flex-col'>

          {/* ── STEP 1: Horario ── */}
          {step === 1 && (
            <div className='p-4 flex flex-col gap-4 overflow-y-auto h-full'>
              {appointmentDate ? (
                <div className='flex flex-col gap-3'>
                  <div className='bg-white border-2 border-gray-600 rounded-xl p-3 flex justify-between items-start shadow'>
                    <div className='flex flex-col gap-0.5'>
                      <p className='text-xs text-gray-500 select-none'>Día seleccionado</p>
                      <p className='text-sm font-bold text-black'>{appointmentDate.dayComplete}, {appointmentDate.year}</p>
                      <p className='text-xs text-gray-500 select-none mt-1'>Horario</p>
                      <p className='text-sm font-bold text-black'>{appointmentDate.time} – {getEndTime()}</p>
                    </div>
                    <button onClick={() => setAppointmentDate(null)} className='ml-2'>
                      <FaRegTrashCan size={20} className='text-red-600 hover:scale-110 transition duration-150' />
                    </button>
                  </div>

                  {/* Duración */}
                  <div className='bg-white border-2 border-gray-600 rounded-xl p-3 shadow'>
                    <p className='text-xs text-gray-500 select-none mb-1'>Duración del turno</p>
                    <select
                      value={appointmentHours}
                      onChange={(e) => setAppointmentHours(e.target.value)}
                      className='w-full rounded-lg border-2 border-gray-600 px-2 py-1.5 text-black text-sm font-semibold cursor-pointer hover:bg-teal-600 hover:text-white hover:border-gray-600 transition duration-150 focus:outline-none bg-white'
                    >
                      <option value={1}>30 min</option>
                      <option value={2} disabled={freeSpaces < 1}>1 hora</option>
                      <option value={3} disabled={freeSpaces < 2}>1 hora 30 min</option>
                      <option value={4} disabled={freeSpaces < 3}>2 horas</option>
                      <option value={5} disabled={freeSpaces < 4}>2 horas 30 min</option>
                      <option value={6} disabled={freeSpaces < 5}>3 horas</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className='w-full py-2 bg-teal-600 text-white font-semibold rounded-lg border-2 border-gray-600 hover:bg-teal-700 transition duration-150 text-sm'
                  >
                    Siguiente →
                  </button>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center bg-white border-2 border-gray-600 rounded-xl p-6 shadow text-center gap-2'>
                  <BsArrowLeftCircle size={80} className='text-gray-300' />
                  <p className='text-sm font-medium text-gray-500 select-none'>
                    Seleccioná el día y horario<br />haciendo click en la agenda
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Paciente ── */}
          {step === 2 && (
            <div className='p-4 flex flex-col gap-3 h-full'>
              {patient ? (
                <div className='flex flex-col gap-3'>
                  <div className='bg-white border-2 border-gray-600 rounded-xl p-3 flex justify-between items-start shadow'>
                    <div>
                      <p className='text-xs text-gray-500 select-none'>Paciente seleccionado</p>
                      <p className='text-sm font-bold text-black'>{patient.name} {patient.lastName}</p>
                      <p className='text-xs text-gray-500'>DNI: {patient.dni}</p>
                    </div>
                    <button onClick={() => setPatient(null)}>
                      <FaRegTrashCan size={20} className='text-red-600 hover:scale-110 transition duration-150' />
                    </button>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className='w-full py-2 bg-teal-600 text-white font-semibold rounded-lg border-2 border-gray-600 hover:bg-teal-700 transition duration-150 text-sm'
                  >
                    Siguiente →
                  </button>
                </div>
              ) : (
                <div className='flex flex-col gap-3 flex-1 min-h-0'>
                  {/* Search bar */}
                  <div className='flex '>
                    <input
                      autoFocus
                      name='search'
                      value={searchContent}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSearchContent(Field === 'dni' ? v.replace(/[^0-9]/g, '') : v);
                      }}
                      type='text'
                      placeholder='Buscar paciente...'
                      className='flex-1 mr-4 rounded-lg border-2 border-gray-600 px-3 py-1.5 text-sm text-black bg-white focus:outline-none focus:border-teal-600 shadow'
                    />
                    <button
                      onClick={() => setField('dni')}
                      className={`px-3 py-1.5 rounded-l-lg border-2 border-gray-600 text-xs font-semibold transition duration-150
                        ${Field === 'dni' ? 'bg-teal-600 text-white' : 'bg-white text-black hover:bg-teal-50'}`}
                    >DNI</button>
                    <button
                      onClick={() => setField('name')}
                      className={`px-3 py-1.5 rounded-r-lg border-2 border-l-0 border-gray-600 text-xs font-semibold transition duration-150
                        ${Field === 'name' ? 'bg-teal-600 text-white' : 'bg-white text-black hover:bg-teal-50'}`}
                    >Nombre</button>
                  </div>

                  {/* Results */}
                  <div className='bg-white border-2 border-gray-600 rounded-xl overflow-hidden shadow flex-1 min-h-0 overflow-y-auto'>
                    {listPatients && typeof listPatients !== 'string' ? (
                      listPatients.map((p: any, i: number) => (
                        <div
                          key={i}
                          onClick={() => { setPatient(p); setStep(3); }}
                          className='flex justify-between items-center px-3 py-2 text-sm text-black border-b border-gray-200 hover:bg-teal-50 cursor-pointer transition duration-100'
                        >
                          <span>{p.name} {p.lastName}</span>
                          <span className='text-gray-400 text-xs'>{p.dni}</span>
                        </div>
                      ))
                    ) : listPatients === 'noResult' ? (
                      <p className='text-sm text-gray-500 p-3'>Sin resultados...</p>
                    ) : (
                      <div className='flex justify-center items-center py-8'>
                        <ClipLoader color='rgb(20 184 166)' size={28} />
                      </div>
                    )}
                  </div>

                  {/* Crear paciente */}
                  <div className='flex items-center gap-1 text-xs text-gray-500'>
                    <span>¿No encontrás al paciente?</span>
                    <button onClick={onOpenCreatePatient} className='font-extrabold flex items-center gap-0.5 hover:text-teal-700 transition'>
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
              <div className='bg-white border-2 border-gray-600 rounded-xl overflow-hidden shadow'>
                <div className='bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex justify-between items-center'>
                  <span className='text-xs font-bold text-gray-500 uppercase tracking-wide'>Horario</span>
                  <button onClick={() => setStep(1)} className='text-xs text-teal-600 hover:underline font-semibold'>Editar</button>
                </div>
                {appointmentDate ? (
                  <div className='px-3 py-2'>
                    <p className='text-sm font-semibold text-black'>{appointmentDate.dayComplete}, {appointmentDate.year}</p>
                    <p className='text-xs text-gray-500'>{appointmentDate.time} – {getEndTime()}</p>
                  </div>
                ) : (
                  <div className='px-3 py-2 flex items-center justify-between'>
                    <p className='text-xs text-red-500 font-medium'>Sin horario seleccionado</p>
                    <button onClick={() => setStep(1)} className='text-xs text-teal-600 font-semibold hover:underline'>Seleccionar</button>
                  </div>
                )}
              </div>

              {/* Resumen paciente */}
              <div className='bg-white border-2 border-gray-600 rounded-xl overflow-hidden shadow'>
                <div className='bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex justify-between items-center'>
                  <span className='text-xs font-bold text-gray-500 uppercase tracking-wide'>Paciente</span>
                  <button onClick={() => setStep(2)} className='text-xs text-teal-600 hover:underline font-semibold'>Editar</button>
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
                  <div className='px-3 py-2 flex items-center justify-between'>
                    <p className='text-xs text-red-500 font-medium'>Sin paciente seleccionado</p>
                    <button onClick={() => setStep(2)} className='text-xs text-teal-600 font-semibold hover:underline'>Seleccionar</button>
                  </div>
                )}
              </div>

              {/* Motivo (opcional) */}
              <div className='bg-white border-2 border-gray-600 rounded-xl overflow-hidden shadow'>
                <div className='bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex justify-between items-center'>
                  <span className='text-xs font-bold text-gray-500 uppercase tracking-wide'>Motivo <span className='font-normal normal-case'>(opcional)</span></span>
                  {reason && (
                    <button onClick={() => setReason(null)}>
                      <FaRegTrashCan size={14} className='text-red-500 hover:scale-110 transition' />
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
                    <select
                      value={chapterName}
                      onChange={(e) => { setChapterName(e.target.value); setChapterData(null); }}
                      className='w-full rounded-lg border-2 border-gray-300 px-2 py-1.5 text-black text-xs font-semibold cursor-pointer focus:outline-none bg-white hover:border-teal-500 transition'
                    >
                      <option value=''>— Seleccionar categoría —</option>
                      {CHAPTERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {chapterName && (
                      <div className='border border-gray-200 rounded-lg overflow-hidden max-h-36 overflow-y-auto'>
                        {loadingChapter ? (
                          <div className='flex justify-center py-4'><ClipLoader color='rgb(20 184 166)' size={20} /></div>
                        ) : chapterData && chapterData.length > 0 ? (
                          chapterData.map((practice: any, i: number) => (
                            <div
                              key={i}
                              onClick={() => setReason(practice)}
                              className='flex justify-between items-center px-3 py-1.5 text-xs text-black border-b border-gray-100 last:border-none hover:bg-teal-50 cursor-pointer transition'
                            >
                              <span>{practice.name}</span>
                              <span className='font-bold text-gray-500'>${formatPrice(practice.price)}</span>
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
              <div className='bg-white border-2 border-gray-600 rounded-xl overflow-hidden shadow'>
                <div className='bg-gray-50 px-3 py-1.5 border-b border-gray-200'>
                  <span className='text-xs font-bold text-gray-500 uppercase tracking-wide'>Observaciones <span className='font-normal normal-case'>(opcional)</span></span>
                </div>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder='Ninguna'
                  className='w-full resize-none text-black text-sm px-3 py-2 focus:outline-none h-16 bg-white'
                />
              </div>

              {/* Botón confirmar */}
              <button
                onClick={() => {
                  if (!patient || !appointmentDate) return;
                  onSetAppoint(patient.id, appointmentDate, reason, observations);
                }}
                disabled={!patient || !appointmentDate}
                className={`w-full py-2.5 text-sm font-bold rounded-lg border-2 border-gray-600 transition duration-150
                  ${patient && appointmentDate
                    ? 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300'}
                `}
              >
                Confirmar Turno
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}