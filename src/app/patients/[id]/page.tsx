'use client'

import { getPatient } from './../../../services/patients/getPatient';
import React, { useState, useEffect, useRef } from 'react';
import { updatePatient } from './../../../services/patients/updatePatient';
import { Alert } from './../../../components/shared/alert';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { PatientRecord } from './../../../components/patients/ui/patientRecord';
import { getInsuranceOptions } from './../../../services/options/getInsuranceOpt';
import { getInsurancePlans } from './../../../services/options/getInsurancePlans';
import { getPatientAppointments } from './../../../services/appointments/getPatientAppointments';
import { MiniCalendar } from '@/components/appointments/ui/MiniCalendar';
import dayjs from 'dayjs';
import { Loading } from './../../../components/shared/loading';
import { useToast } from '@/context/ToastContext';
import { ScaleLoader, ClipLoader } from 'react-spinners';
import { FaCheck, FaCircleCheck, FaCircleXmark } from 'react-icons/fa6';
import { getUser } from './../../../services/auth/getUser';
import { EditableRow } from '@/components/patients/ui/editableRow';
import { TbPencilCog } from 'react-icons/tb';
import { BiArrowBack } from 'react-icons/bi';
import Link from 'next/link';
import { BsCalendarCheck, BsCalendarX } from 'react-icons/bs';

function parseApptDate(dateStr: string): Date {
  const [d, m, y] = dateStr.split('/');
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

export default function PatientId() {
  const router = useRouter();
  const [isLoad, setIsLoad] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState('');
  const [check, setCheck] = useState(false);
  const pathname = usePathname();
  const id = (pathname.split('/').pop() || null) as string | null;
  const [patient, setPatient] = useState<any>(null);
  const [rowModify, setRowModify] = useState('');
  const [changes, setChanges] = useState<any>('');
  const [openAlert, setOpenAlert] = useState(false);
  const [insuranceOptions, setInsuranceOptions] = useState<null | { id: string; name: string }[]>(null);
  const [planOptions, setPlanOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [insuranceDraft, setInsuranceDraft] = useState<{ id: string; name: string } | null>(null);
  const [planDraft, setPlanDraft] = useState<{ id: string; name: string } | null>(null);
  const [date, setDate] = useState<null | any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [dateFormatted, setDateFormatted] = useState<null | any>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<any[] | null>(null);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push('/notSign');
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!clinicId) return;
    async function get() {
      try {
        const data = await getPatient(id, clinicId as string);
        setPatient(data);
        setDateFormatted(dayjs(data.birthDate, 'DD/MM/YYYY'));
        setIsLoad(false);
        const options = await getInsuranceOptions();
        if (options) setInsuranceOptions(options);
      } catch (error) {
        console.error(error);
      }
    }
    get();
  }, [id, clinicId]);

  useEffect(() => {
    if (!patient?.id) return;
    setLoadingAppointments(true);
    getPatientAppointments(patient.id).then(appts => {
      setPatientAppointments(appts);
      setLoadingAppointments(false);
    });
  }, [patient?.id]);

  async function submitInsuranceChanges() {
    if (!insuranceDraft) { setRowModify(''); return; }
    setLoadingCategory('medic');
    setRowModify('');
    setChanges('');
    const newPatient = await updatePatient(
      { insurance: insuranceDraft.name, insuranceId: insuranceDraft.id, plan: '', planId: '' },
      null, id, clinicId as string
    );
    if (newPatient) { setPatient(newPatient); setCheck(true); showToast("success", "Datos actualizados correctamente"); }
    else { setLoadingCategory(''); showToast("error", "Error al actualizar los datos"); }
    setInsuranceDraft(null);
  }

  async function submitPlanChanges() {
    if (!planDraft?.id) { setRowModify(''); setPlanDraft(null); return; }
    setLoadingCategory('medic');
    setRowModify('');
    setChanges('');
    const newPatient = await updatePatient(
      { plan: planDraft.name, planId: planDraft.id },
      null, id, clinicId as string
    );
    if (newPatient) { setPatient(newPatient); setCheck(true); showToast("success", "Datos actualizados correctamente"); }
    else { setLoadingCategory(''); showToast("error", "Error al actualizar los datos"); }
    setPlanDraft(null);
  }

  async function submitChanges(changes: string, table: string, category: string) {
    if (table === 'insurance') { await submitInsuranceChanges(); return; }
    if (table === 'plan') { await submitPlanChanges(); return; }
    setLoadingCategory(category);
    setRowModify('');
    setChanges('');
    if (changes !== '') {
      const newPatient = await updatePatient(changes, table, id, clinicId as string);
      if (newPatient) { setPatient(newPatient); setCheck(true); showToast("success", "Datos actualizados correctamente"); }
      else { setLoadingCategory(''); showToast("error", "Error al actualizar los datos"); }
    } else {
      setLoadingCategory('');
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => { setLoadingCategory(''); setCheck(false); }, 2000);
    return () => clearTimeout(timeoutId);
  }, [check]);

  useEffect(() => {
    if (!patient?.insuranceId || patient.insurance === 'Particular') {
      setPlanOptions([]);
      return;
    }
    setLoadingPlans(true);
    getInsurancePlans(patient.insuranceId).then(plans => {
      setPlanOptions(plans ?? []);
      setLoadingPlans(false);
    });
  }, [patient?.insuranceId]);

  useEffect(() => {
    if (rowModify === 'insurance' && patient) {
      setInsuranceDraft({ id: patient.insuranceId ?? '', name: patient.insurance ?? '' });
    }
    if (rowModify === 'plan' && patient) {
      setPlanDraft({ id: patient.planId ?? '', name: patient.plan ?? '' });
    }
  }, [rowModify]);

  useEffect(() => {
    if (date) {
      setChanges(date.format('DD/MM/YYYY'));
    }
  }, [date]);

  useEffect(() => {
    if (!showDatePicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  useEffect(() => {
    async function fetchClinicId() {
      const cid = await getUser(true);
      setClinicId(cid as string);
    }
    fetchClinicId();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedAppointments = [...(patientAppointments || [])].sort(
    (a, b) => parseApptDate(a.date).getTime() - parseApptDate(b.date).getTime()
  );
  const nextAppointment = sortedAppointments.find(a => parseApptDate(a.date) >= today) ?? null;
  const lastAppointment = [...sortedAppointments].reverse().find(a => parseApptDate(a.date) < today) ?? null;

  if (id !== null) {
    return (
      <div className="h-[calc(100vh-68px)] overflow-y-auto">
        {isLoad ? (
          <Loading />
        ) : (
          <div className="ml-4 mr-2 px-4 pb-4 pt-6">
            {openAlert && (
              <div className="fixed inset-0 backdrop-blur-sm ml-56 z-10">
                <Alert
                  onCloseAlert={() => setOpenAlert(false)}
                  onSuccess={() => { setOpenAlert(false); showToast("success", "Paciente eliminado correctamente"); router.push('/patients'); }}
                  action="Eliminar Paciente"
                  firstProp="¿Estás seguro/a de que deseas eliminar a este paciente?"
                  secondProp="Esta acción será permanente y no se podrá volver atrás"
                  thirdProp={id}
                />
              </div>
            )}

            {patient && (
              <div>
                {/* Back arrow */}
                <Link href="/patients">
                  <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-700 transition duration-150 mb-3 select-none">
                    <BiArrowBack size={16} /> Pacientes
                  </button>
                </Link>

                <PatientRecord patient={patient} />

                {/* Appointments panel */}
                <div className="border-2 border-gray-300 rounded-xl overflow-hidden mb-4">
                  <div className="flex divide-x divide-gray-200">
                    {/* Last visit */}
                    <div className="flex-1 px-4 py-3 bg-gray-50">
                      <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
                        <BsCalendarX size={13} /> Última Visita
                      </h3>
                      {loadingAppointments ? (
                        <ClipLoader size={14} color="#9ca3af" />
                      ) : lastAppointment ? (
                        <>
                          <p className="text-sm font-semibold text-black">
                            {lastAppointment.dayComplete} · {lastAppointment.time}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {typeof lastAppointment.reason === 'string'
                              ? lastAppointment.reason
                              : lastAppointment.reason?.name || 'Sin motivo registrado'}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Sin visitas anteriores</p>
                      )}
                    </div>
                    {/* Next appointment */}
                    <div className="flex-1 px-4 py-3">
                      <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
                        <BsCalendarCheck size={13} /> Próximo Turno
                      </h3>
                      {loadingAppointments ? (
                        <ClipLoader size={14} color="#9ca3af" />
                      ) : nextAppointment ? (
                        <>
                          <p className="text-sm font-semibold text-teal-700">
                            {nextAppointment.dayComplete} · {nextAppointment.time}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {typeof nextAppointment.reason === 'string'
                              ? nextAppointment.reason
                              : nextAppointment.reason?.name || 'Sin motivo registrado'}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Sin próximo turno</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section header with save indicator */}
                <div className="flex items-center justify-between mb-3 select-none">
                  <h2 className="text-base font-bold tracking-wide text-black">Datos del paciente</h2>
                  {loadingCategory && (
                    <div className="flex items-center gap-2">
                      {check ? (
                        <span className="flex items-center gap-1.5 text-sm text-teal-700 font-semibold">
                          <FaCheck size={13} /> Guardado
                        </span>
                      ) : (
                        <ScaleLoader margin={2} color="#0d9488" width={2} height={18} speedMultiplier={1.4} />
                      )}
                    </div>
                  )}
                </div>

                {/* Two-column data layout */}
                <div className="flex gap-4">
                  {/* Left: Información Básica */}
                  <div className="flex-1">
                    <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Información Básica</h3>
                    <div className="flex flex-col gap-2">
                      <EditableRow
                        label="Nombre"
                        value={patient.name}
                        rowKey="name"
                        category="basic"
                        rowModify={rowModify}
                        setRowModify={setRowModify}
                        setChanges={setChanges}
                        submitChanges={submitChanges}
                        changes={changes}
                      />
                      <EditableRow
                        label="Apellido"
                        value={patient.lastName}
                        rowKey="lastName"
                        category="basic"
                        rowModify={rowModify}
                        setRowModify={setRowModify}
                        setChanges={setChanges}
                        submitChanges={submitChanges}
                        changes={changes}
                      />
                      <EditableRow
                        label="DNI"
                        value={patient.dni}
                        rowKey="dni"
                        category="basic"
                        rowModify={rowModify}
                        setRowModify={setRowModify}
                        setChanges={setChanges}
                        submitChanges={submitChanges}
                        changes={changes}
                      />
                      <EditableRow
                        label="Domicilio"
                        value={patient.address}
                        rowKey="address"
                        category="basic"
                        rowModify={rowModify}
                        setRowModify={setRowModify}
                        setChanges={setChanges}
                        submitChanges={submitChanges}
                        changes={changes}
                      />
                      <EditableRow
                        label="Nacimiento"
                        value={patient.birthDate}
                        rowKey="birthDate"
                        category="basic"
                        rowModify={rowModify}
                        setRowModify={setRowModify}
                        setChanges={setChanges}
                        submitChanges={submitChanges}
                        changes={changes}
                        renderInput={
                          <div className="flex-1 relative" ref={datePickerRef}>
                            <button
                              type="button"
                              onClick={() => setShowDatePicker(!showDatePicker)}
                              className="w-full text-left border-2 border-gray-300 rounded-lg px-3 py-1 text-sm bg-gray-100 text-black"
                            >
                              {date ? date.format('DD/MM/YYYY') : dateFormatted ? dateFormatted.format('DD/MM/YYYY') : 'DD/MM/YYYY'}
                            </button>
                            {showDatePicker && (
                              <div className="absolute bottom-full left-0 z-50 mb-1 bg-white border-2 border-gray-300 rounded-xl shadow-xl w-64">
                                <MiniCalendar
                                  value={date ?? dateFormatted}
                                  onChange={(d) => { setDate(d); setShowDatePicker(false); }}
                                />
                              </div>
                            )}
                          </div>
                        }
                      />
                      <EditableRow
                        label="Género"
                        value={patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : '-'}
                        rowKey="gender"
                        category="basic"
                        rowModify={rowModify}
                        setRowModify={setRowModify}
                        setChanges={setChanges}
                        submitChanges={submitChanges}
                        changes={changes}
                        renderInput={
                          <select
                            defaultValue={patient.gender}
                            onChange={(e) => setChanges(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitChanges(changes, 'gender', 'basic');
                              else if (e.key === 'Escape') setRowModify('');
                            }}
                            autoFocus
                            className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                          >
                            <option value="male">Masculino</option>
                            <option value="female">Femenino</option>
                          </select>
                        }
                      />
                    </div>
                  </div>

                  {/* Right: Contacto + Salud */}
                  <div className="flex-1 flex flex-col gap-4">
                    {/* Contacto */}
                    <div>
                      <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Contacto</h3>
                      <div className="flex flex-col gap-2">
                        <EditableRow
                          label="Teléfono"
                          value={patient.num}
                          rowKey="num"
                          category="contact"
                          rowModify={rowModify}
                          setRowModify={setRowModify}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                        <EditableRow
                          label="Correo"
                          value={patient.email}
                          rowKey="email"
                          category="contact"
                          rowModify={rowModify}
                          setRowModify={setRowModify}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                      </div>
                    </div>

                    {/* Salud */}
                    <div>
                      <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Salud</h3>
                      <div className="flex flex-col gap-2">
                        <EditableRow
                          label="Obra Social"
                          value={patient.insurance}
                          rowKey="insurance"
                          category="medic"
                          rowModify={rowModify}
                          setRowModify={setRowModify}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                          renderInput={
                            <select
                              value={insuranceDraft?.id ?? ''}
                              onChange={(e) => {
                                const opt = insuranceOptions?.find(o => o.id === e.target.value);
                                if (opt) setInsuranceDraft(opt);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') submitInsuranceChanges();
                                else if (e.key === 'Escape') { setRowModify(''); setInsuranceDraft(null); }
                              }}
                              autoFocus
                              className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                            >
                              {insuranceOptions?.map((opt) => (
                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                              ))}
                            </select>
                          }
                        />

                        {patient.insurance === 'Particular' ? (
                          <>
                            <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                                <span className="text-sm text-gray-500">Plan:</span>
                                <span className="text-sm font-semibold text-black">-</span>
                              </div>
                            </div>
                            <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                                <span className="text-sm text-gray-500">Núm. Afiliado:</span>
                                <span className="text-sm font-semibold text-black">-</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <EditableRow
                              label="Plan"
                              value={patient.plan}
                              rowKey="plan"
                              category="medic"
                              rowModify={rowModify}
                              setRowModify={setRowModify}
                              setChanges={setChanges}
                              submitChanges={submitChanges}
                              changes={changes}
                              renderInput={
                                loadingPlans ? (
                                  <span className="text-sm text-gray-400 flex-1">Cargando...</span>
                                ) : (
                                  <select
                                    value={planDraft?.id ?? ''}
                                    onChange={(e) => {
                                      const opt = planOptions.find(o => o.id === e.target.value);
                                      if (opt) setPlanDraft(opt);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') submitPlanChanges();
                                      else if (e.key === 'Escape') { setRowModify(''); setPlanDraft(null); }
                                    }}
                                    autoFocus
                                    className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                                  >
                                    {!planDraft?.id && <option value="" disabled>Seleccionar...</option>}
                                    {planOptions.length === 0 && planDraft?.id && <option value="" disabled>Sin planes</option>}
                                    {planOptions.map((opt) => (
                                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                  </select>
                                )
                              }
                            />
                            <EditableRow
                              label="Núm. Afiliado"
                              value={patient.affiliateNum}
                              rowKey="affiliateNum"
                              category="medic"
                              rowModify={rowModify}
                              setRowModify={setRowModify}
                              setChanges={setChanges}
                              submitChanges={submitChanges}
                              changes={changes}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Observaciones</h3>
                  <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                    <div className="flex items-start justify-between px-3 py-2 bg-gray-50 gap-2">
                      {rowModify === 'notes' ? (
                        <div className="flex flex-col gap-2 flex-1">
                          <textarea
                            autoFocus
                            defaultValue={patient.notes}
                            onChange={(e) => setChanges(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setRowModify(''); }}
                            rows={3}
                            className="border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-teal-700 bg-gray-100 text-black resize-none w-full"
                          />
                          <div className="flex gap-2 justify-end">
                            <FaCircleXmark
                              onClick={() => setRowModify('')}
                              className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer"
                              size={20}
                            />
                            <FaCircleCheck
                              onClick={() => submitChanges(changes, 'notes', 'notes')}
                              className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer"
                              size={20}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-black flex-1 whitespace-pre-wrap min-h-[2rem]">
                            {patient.notes
                              ? patient.notes
                              : <span className="text-gray-400 italic">Sin observaciones</span>
                            }
                          </p>
                          <button
                            onClick={() => { setRowModify('notes'); setChanges(patient.notes ?? ''); }}
                            className="text-gray-400 hover:text-teal-700 transition duration-150 flex-shrink-0 mt-0.5"
                          >
                            <TbPencilCog size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setOpenAlert(true)}
                    className="w-full py-2 px-4 text-sm font-semibold text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 transition duration-200 select-none"
                  >
                    Eliminar Paciente Permanentemente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
