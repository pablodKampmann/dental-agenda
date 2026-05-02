'use client'

import { useRef, useEffect, useState } from 'react';
import { BsArrowLeftCircle } from 'react-icons/bs';
import { ClipLoader } from 'react-spinners';
import { GiClick } from 'react-icons/gi';
import { FaRegTrashCan } from 'react-icons/fa6';
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
  setShowResult: (v: any) => void;
}

export function AddAppointmentForm({
  appointmentDate, setAppointmentDate,
  appointmentHours, setAppointmentHours, freeSpaces,
  patient, setPatient,
  listPatients, searchContent, setSearchContent, Field, setField,
  reason, setReason,
  observations, setObservations,
  onSetAppoint, onOpenCreatePatient, setShowResult,
}: Props) {
  const [chapterName, setChapterName] = useState<string>('Consultas');
  const [chapterData, setChapterData] = useState<any>(null);

  const confirmRef = useRef<any>(null);
  const newPatientRef = useRef<any>(null);
  const selectDateRef = useRef<any>(null);
  const selectPatientRef = useRef<any>(null);
  const selectReasonRef = useRef<any>(null);

  useEffect(() => {
    async function getChapterData() {
      const { data, chapterNum } = await getChapter(chapterName);
      if (data && chapterNum) {
        const filteredData = data.filter((item: any) => !Object.values(item).every(value => value === undefined));
        filteredData.sort((a: any, b: any) => {
          if (a.id && b.id) return parseInt(a.id) - parseInt(b.id);
          return 0;
        });
        setChapterData(filteredData);
      }
    }
    if (chapterName !== '') getChapterData();
  }, [chapterName]);

  useEffect(() => {
    if (newPatientRef.current) {
      newPatientRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [listPatients]);

  useEffect(() => {
    if (selectDateRef.current) {
      selectDateRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [appointmentDate]);

  useEffect(() => {
    if (selectPatientRef.current) {
      selectPatientRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [patient]);

  useEffect(() => {
    if (selectReasonRef.current) {
      selectReasonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [reason]);

  useEffect(() => {
    if (patient && appointmentDate && reason) {
      confirmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [patient, appointmentDate, reason]);

  return (
    <div className='w-[35%] flex overflow-x-hidden'>
      <div className='flex-1 ml-10 overflow-x-hidden flex-col border-2 border-gray-600 rounded-lg shadow-xl bg-gray-300 bg-opacity-30 overflow-y-auto animate-move-from-right-form'>
        <h1 className='text-center bg-teal-600 rounded-md-lg text-white font-semibold pb-1 py-1 text-3xl border-b-2 border-gray-600 select-none'>Agregar Turno</h1>

        {/* 1. Seleccionar horario */}
        <div className='flex items-center mx-5 justify-center bg-white border-2 border-gray-600 rounded-xl h-10 cursor-default shadow-lg mt-4'>
          <h1 className='font-black text-2xl text-black mr-4 select-none'>1.</h1>
          <h1 className='text-xl font-bold text-black text-center cursor-default mt-1 select-none'>Selecciona el horario</h1>
        </div>
        <div ref={selectDateRef} className='border-gray-600 border-b-4 flex-1'>
          {appointmentDate ? (
            <div className='flex items-center px-5 w-full flex-col'>
              <div className='flex justify-between items-center w-full mx-6'>
                <div className='border-gray-600 w-full hover:bg-opacity-50 bg-white mt-4 mb-3 py-1 transition duration-150 border-2 px-6 rounded-lg flex justify-center items-center'>
                  <div className='group-hover:text-transparent text-black'>
                    <div>
                      <p className='text-sm text-center select-none whitespace-nowrap'>Día seleccionado: </p>
                      <p className='ml-1 text-sm text-center font-bold select-none'>{appointmentDate.dayComplete}, {appointmentDate.year}</p>
                    </div>
                    <div>
                      <p className='text-sm flex-col text-center select-none whitespace-nowrap'>Horario seleccionado: </p>
                      <p className='ml-1 text-sm text-center font-bold select-none'>{appointmentDate.time}-{timeCalc(appointmentDate.time)}</p>
                    </div>
                  </div>
                </div>
                <div className='flex ml-4 items-center bg-white rounded-2xl h-12 border-2 border-gray-600 px-3 cursor-default mt-1 shadow-lg'>
                  <FaRegTrashCan onClick={() => setAppointmentDate(null)} size={28} className='text-red-700 cursor-pointer hover:scale-110 transition duration-150' />
                </div>
              </div>
              <div className='flex-col select-none w-full mb-2'>
                <div className='w-full space-x-2 h-6 mb-2 flex justify-center items-center'>
                  <div className='bg-black bg-opacity-90 h-1 rounded-full w-1/2'></div>
                  <div className='bg-black bg-opacity-90 rounded-full h-2 w-2'></div>
                  <div className='bg-black bg-opacity-90 h-1 w-1/2 rounded-full'></div>
                </div>
                <div className='flex justify-center'>
                  <h1 className='text-black ml-1 mt-1 rounded-lg border-gray-600 font-bold'>Duración del turno (horas):</h1>
                  <select
                    value={appointmentHours}
                    onChange={(e) => setAppointmentHours(e.target.value)}
                    className='select-none rounded-lg pl-2 text-black border-2 border-gray-600 cursor-pointer hover:bg-teal-600 hover:border-gray-600 transition duration-150 hover:text-white bg-white flex py-1 ml-2 font-semibold shadow-xl focus:outline-none text-lg w-fit'
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
            <div className='flex-col border-2 border-gray-600 rounded-lg shadow-xl mx-4 mt-4 mb-4 bg-white py-1'>
              <BsArrowLeftCircle className="m-auto mt-2 mb-1 text-black" size={120} />
              <h1 className='m-auto text-center font-medium text-lg select-none text-black'>SELECCIONA EL DIA Y HORARIO <br /> EN LA AGENDA</h1>
            </div>
          )}
        </div>

        {/* 2. Seleccionar paciente */}
        <div ref={selectPatientRef} className='duration-[500ms] border-gray-600 border-b-4 flex justify-center items-center flex-col p-2'>
          <div className='w-full'>
            <div className='flex items-center justify-center bg-white border-2 border-gray-600 rounded-xl h-10 cursor-default shadow-lg mt-2 mx-3'>
              <h1 className='font-black text-2xl text-black mr-4 select-none'>2.</h1>
              <h1 className='text-xl font-bold text-black text-center cursor-default mt-1 select-none'>Selecciona el paciente</h1>
            </div>
          </div>
          {!patient && (
            <div className='w-full px-3'>
              <div className='mt-4 flex'>
                <input
                  name='search'
                  value={searchContent}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (Field === 'dni') {
                      setSearchContent(inputValue.replace(/[^0-9]/g, ''));
                    } else {
                      setSearchContent(inputValue);
                    }
                  }}
                  type="text"
                  placeholder='Busca un paciente'
                  className='select-none focus:border-3 focus:outline-none focus:border-teal-600 rounded-lg text-black h-10 shadow-lg p-2 w-full bg-white border-2 border-gray-600'
                />
                <button onClick={() => setField('dni')} className={`${Field === 'dni' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-white hover:bg-teal-900 hover:text-white text-black'} py-1 shadow-lg ml-4 border-2 focus:outline-none border-gray-600 text-md font-semibold rounded-l-lg transition duration-300 px-3 select-none w-24`}>DNI</button>
                <button onClick={() => setField('name')} className={`${Field === 'name' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-white hover:bg-teal-900 hover:text-white text-black'} py-1 shadow-lg border-2 focus:outline-none border-gray-600 text-md font-semibold rounded-r-lg transition duration-300 px-3 select-none w-24`}>NOMBRE</button>
              </div>
            </div>
          )}
          <div className={`w-full px-3 ${patient ? 'flex justify-center' : ''}`}>
            <div className='mt-4 mb-2 w-full border-2 border-gray-600 rounded-lg bg-white shadow-xl overflow-y-auto'>
              <div ref={newPatientRef} className={`${patient ? '' : 'h-40'}`}>
                {listPatients && typeof listPatients !== 'string' ? (
                  <div>
                    {patient ? (
                      <div className='text-black w-full hover:bg-gray-300 hover:bg-opacity-30 bg-white transition duration-150 py-0.5'>
                        <p className='text-sm text-center select-none'>Paciente seleccionado: </p>
                        <p className='ml-1 text-sm text-center font-bold select-none'>{patient.name} {patient.lastName}</p>
                      </div>
                    ) : (
                      <div>
                        {listPatients.map((p: any, index: number) => (
                          <div key={index} onClick={() => setPatient(p)} className="p-1 select-none hover:bg-gray-200 text-black text-base border-b border-gray-600 transition duration-100 cursor-pointer flex justify-between">
                            <p className='ml-1'>{p.name} {p.lastName}</p>
                            <p className='mr-1'>{p.dni}</p>
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
              <div className='flex ml-4 items-center bg-white rounded-2xl h-12 border-2 border-gray-600 px-3 cursor-default mt-4 shadow-lg'>
                <FaRegTrashCan onClick={() => setPatient(null)} size={28} className='text-red-700 cursor-pointer hover:scale-110 transition duration-150' />
              </div>
            )}
          </div>
          {!patient && (
            <div className='flex ml-1'>
              <p className='ml-4 mb-1 mt-0.5 text-gray-500 text-sm font-medium select-none'>No encontras un paciente?</p>
              <div onClick={onOpenCreatePatient} className='cursor-pointer flex items-center'>
                <p className='ml-2 mb-0.5 text-gray-500 text-sm font-extrabold select-none'>Cargalo ahora</p>
                <GiClick className="ml-1 mb-1 text-gray-500" />
              </div>
            </div>
          )}
        </div>

        {/* 3. Seleccionar motivo */}
        <div ref={selectReasonRef} className='duration-[500ms] border-gray-600 border-b-4 flex-1 p-2'>
          {reason ? (
            <div>
              <div className='flex items-center justify-center bg-white border-2 border-gray-600 rounded-xl h-10 cursor-default shadow-lg mt-2 mx-3'>
                <h1 className='font-black text-2xl text-black mr-4 select-none'>3.</h1>
                <h1 className='text-xl flex justify-center items-end font-bold text-black text-center cursor-default mt-1 select-none'>Selecciona el motivo <p className='flex ml-2 mb-0.5 text-xs font-bold'>(Opcional)</p></h1>
              </div>
              <div className='flex items-center justify-center mt-2'>
                <div className='w-full mt-2 py-1 hover:bg-opacity-30 bg-white mb-2 mx-4 transition duration-150 border-2 border-gray-600 rounded-lg flex justify-center items-center'>
                  <div className='text-black'>
                    <p className='text-sm text-center select-none'>Razón: </p>
                    <p className='ml-1 text-sm text-center font-bold select-none'>{reason.name}</p>
                  </div>
                </div>
                <div className='flex mr-3 items-center bg-white rounded-2xl h-12 border-2 border-gray-600 px-3 cursor-default shadow-lg'>
                  <FaRegTrashCan onClick={() => setReason(null)} size={28} className='text-red-700 cursor-pointer hover:scale-110 transition duration-150' />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className='flex items-center justify-center bg-white border-2 border-gray-600 rounded-xl h-10 cursor-default shadow-lg mt-2 mx-3'>
                <h1 className='font-black text-2xl text-black mr-4 select-none'>3.</h1>
                <h1 className='text-xl font-bold text-black text-center flex justify-center items-end cursor-default mt-1 select-none'>Selecciona el motivo <p className='flex ml-2 mb-0.5 text-xs font-bold'>(Opcional)</p></h1>
              </div>
              <div className='mx-2 mt-4 mb-4 px-2 flex justify-center items-center'>
                <h1 className='text-black text-xl mt-0.5 font-semibold select-none'>Razón:</h1>
                <select
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  className='cursor-pointer hover:bg-teal-600 hover:border-gray-600 hover:text-white transition duration-300 bg-white bg-opacity-30 w-full py-1 ml-2 outline-none text-black text-lg font-bold border-2 px-1 border-gray-600 rounded-lg shadow-lg flex justify-center items-center'
                >
                  <option>Seleccionar</option>
                  <option value="CONSULTAS">CONSULTAS</option>
                  <option value="OPERATORIA DENTAL">OPERATORIA DENTAL</option>
                  <option value="ENDODONCIA">ENDODONCIA</option>
                  <option value="PRÓTESIS">PRÓTESIS</option>
                  <option value="ODONTOLOGÍA PREVENTIVA">ODONTOLOGÍA PREVENTIVA</option>
                  <option value="ORTODONCIA Y ORTOPEDIA FUNCIONAL">ORTODONCIA Y ORTOPEDIA FUNCIONAL</option>
                  <option value="ODONTOPEDIATRÍA">ODONTOPEDIATRÍA</option>
                  <option value="PERIODONCIA">PERIODONCIA</option>
                  <option value="RADIOLOGÍA">RADIOLOGÍA</option>
                  <option value="CIRUGÍA">CIRUGÍA</option>
                </select>
              </div>
              {chapterName !== '' && chapterData && (
                <div className='border-gray-600 bg-white text-black text-sm border-2 mb-2 mt-4 select-none mx-3 rounded-lg'>
                  {chapterData.length > 0 ? (
                    <div>
                      {chapterData.map((practice: { id: number, name: string, price: number }, index: number) => (
                        <div
                          key={index}
                          onClick={() => setReason(practice)}
                          className={`${index === 0 ? 'rounded-t-md' : ''} ${index === chapterData.length - 1 ? 'rounded-b-md border-none' : ''} cursor-pointer border-b-2 hover:bg-teal-600 border-gray-600 py-1 px-1.5`}
                        >
                          {practice.name}<span className='ml-auto flex font-bold'>${formatPrice(practice.price)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='flex justify-center items-center py-1 text-base bg-red-500 rounded-md font-medium bg-opacity-30'>
                      No hay prácticas en este Capítulo
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Confirmar turno */}
        <div className='duration-[500ms] flex-1 p-2'>
          <div className='flex items-center justify-center bg-white border-2 border-gray-600 rounded-xl h-10 cursor-default shadow-lg mt-2 mx-3'>
            <h1 className='font-black text-2xl text-black mr-4 select-none'>4.</h1>
            <h1 className='text-xl font-bold text-black text-center cursor-default mt-1 select-none'>Confirmar Turno</h1>
          </div>
          {patient && appointmentDate ? (
            <div ref={confirmRef} className='mt-4 ml-2 mr-2 mb-2 flex'>
              <div className='ml-1 mr-1 border-2 border-gray-600 rounded-lg bg-white w-full p-1'>
                <h1 className='text-xl font-bold text-black select-none text-center'>Resumen: </h1>
                <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                  <p className='ml-1 text-lg font-bold text-black select-none text-left'>Fecha: </p>
                  <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>
                    Dia: {appointmentDate.dayComplete}, {appointmentDate.year} <br />
                    Horario: {appointmentDate.time}-{
                      appointmentDate.time6 ? timeCalc(appointmentDate.time6) :
                        appointmentDate.time5 ? timeCalc(appointmentDate.time5) :
                          appointmentDate.time4 ? timeCalc(appointmentDate.time4) :
                            appointmentDate.time3 ? timeCalc(appointmentDate.time3) :
                              appointmentDate.time2 ? timeCalc(appointmentDate.time2) :
                                timeCalc(appointmentDate.time)
                    }
                  </p>
                </div>
                <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                  <p className='ml-1 text-lg font-bold text-black text-left select-none'>Paciente: </p>
                  <p className='ml-1 text-sm text-black text-left font-bold'>
                    Nombre: {patient.name} {patient.lastName} <br /> DNI: {patient.dni} <br />Edad: {getAge(patient.birthDate)} años
                  </p>
                  {patient.insurance === 'Particular' ? (
                    <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>Obra Social: {patient.insurance}</p>
                  ) : (
                    <p className='ml-1 mb-1 text-sm text-black text-left font-bold'>Obra Social: {patient.insurance} <br /> Plan: {patient.plan}<br />Número de afiliado: {patient.affiliateNum}</p>
                  )}
                </div>
                <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                  {reason ? (
                    <p className='ml-1 text-lg font-bold text-black select-none text-left'>Razón: <br /><span className='mb-1 text-sm text-black text-left font-bold'></span></p>
                  ) : (
                    <p className='ml-1 text-lg font-bold text-black select-none text-left'>Razón: -</p>
                  )}
                </div>
                <div className='mt-1 m-2 border-2 rounded-lg border-gray-600'>
                  <p className='ml-1 text-lg font-bold text-black select-none text-left'>Observaciones (opcional): </p>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder='Ninguna'
                    className='resize-none text-black font-medium px-2 py-1 w-full h-20 focus:outline-none text-sm'
                  />
                </div>
                <div
                  onClick={() => { onSetAppoint(patient.id, appointmentDate, reason, observations); setShowResult(null); }}
                  className='flex justify-center items-center text-xl font-semibold transition duration-200 text-black rounded-lg ml-2 mr-2 mb-1 mt-4 p-1 cursor-pointer hover:bg-teal-600 hover:text-white border-gray-600 border-2 bg-white'
                >
                  Confirmar
                </div>
              </div>
            </div>
          ) : (
            <div className='mt-4 ml-2 mr-2 mb-2 flex'>
              <div className='ml-1 mr-1 border-2 border-gray-600 rounded-lg bg-white w-full p-1 shadow-xl'>
                <p className='text-sm font-semibold select-none text-black text-center mb-2'>Para confirmar el turno completá:</p>
                <div className='flex flex-col gap-1 px-2 pb-2'>
                  {!appointmentDate && (
                    <div className='flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-3 py-1.5'>
                      <div className='w-2 h-2 rounded-full bg-red-400'></div>
                      <p className='text-sm text-red-600 font-medium select-none'>Seleccioná un horario en la agenda</p>
                    </div>
                  )}
                  {!patient && (
                    <div className='flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-3 py-1.5'>
                      <div className='w-2 h-2 rounded-full bg-red-400'></div>
                      <p className='text-sm text-red-600 font-medium select-none'>Seleccioná un paciente</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
