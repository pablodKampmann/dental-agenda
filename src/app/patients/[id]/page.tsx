'use client'

import { getPatient } from './../../../services/patients/getPatient';
import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { updatePatient } from './../../../services/patients/updatePatient';
import { ConfirmAlert } from './../../../components/shared/dialogAlerts/confirmAlert';
import { deletePatient } from './../../../services/patients/deletePatient';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { PatientRecord } from './../../../components/patients/ui/patientRecord';
import { getInsuranceOptions } from './../../../services/options/getInsuranceOpt';
import { getInsurancePlans } from './../../../services/options/getInsurancePlans';
import dayjs from 'dayjs';
import { PatientRecordSkeleton } from './../../../components/patients/ui/patientRecordSkeleton';
import { useToast } from '@/context/ToastContext';
import { ScaleLoader } from 'react-spinners';
import { FaCheck } from 'react-icons/fa6';
import { getUser } from './../../../services/auth/getUser';
import { EditableRow } from '@/components/patients/ui/editableRow';
import { SelectField } from '@/components/patients/ui/fields/selectField';
import { DateField } from '@/components/patients/ui/fields/dateField';
import { combine, required, numeric, phone as phoneValidator, email as emailValidator } from '@/lib/validators';
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
  const [dateFormatted, setDateFormatted] = useState<null | any>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push('/notSign');
    });
    return () => unsubscribe();
  }, [router]);

  useDocumentTitle(patient?.name ? `${patient.name} ${patient.lastName}` : "Paciente");

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

  async function submitPayload(payload: Record<string, string>, category: string) {
    setLoadingCategory(category);
    setRowModify('');
    setChanges('');
    const newPatient = await updatePatient(payload, null, id, clinicId as string);
    if (newPatient) { setPatient(newPatient); setCheck(true); showToast("success", "Datos actualizados correctamente"); }
    else { setLoadingCategory(''); showToast("error", "Error al actualizar los datos"); }
  }

  function submitChanges(changes: string, table: string, category: string) {
    if (changes === '') { setRowModify(''); return; }
    submitPayload({ [table]: changes }, category);
  }

  function submitInsuranceChanges() {
    if (!insuranceDraft) { setRowModify(''); return; }
    submitPayload({ insurance: insuranceDraft.name, insuranceId: insuranceDraft.id, plan: '', planId: '' }, 'medic');
    setInsuranceDraft(null);
  }

  function submitPlanChanges() {
    if (!planDraft?.id) { setRowModify(''); setPlanDraft(null); return; }
    submitPayload({ plan: planDraft.name, planId: planDraft.id }, 'medic');
    setPlanDraft(null);
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
    async function fetchClinicId() {
      const cid = await getUser(true);
      setClinicId(cid as string);
    }
    fetchClinicId();
  }, []);

  if (id !== null) {
    return (
      <div className="h-[calc(100vh-56px)] overflow-y-auto">
        {isLoad ? (
          <div className="px-4 pb-4 pt-4">
            <PatientRecordSkeleton />
          </div>
        ) : (
          <div className="px-4 pb-4 pt-4 animate-fade-in">
            <ConfirmAlert
              open={openAlert}
              setOpen={setOpenAlert}
              title="¿Eliminar paciente?"
              description="Esta acción es permanente y no se puede deshacer."
              onConfirm={async () => {
                await deletePatient(id);
                setOpenAlert(false);
                showToast("success", "Paciente eliminado correctamente");
                router.push('/patients');
              }}
              confirmText="Eliminar"
            />

            {patient && (
              <div>
                <PatientRecord patient={patient} />

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-4">
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
                        validate={combine(required('El nombre es obligatorio'))}
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
                        validate={combine(required('El apellido es obligatorio'))}
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
                        validate={combine(required('El DNI es obligatorio'), numeric('El DNI debe ser numérico'))}
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
                          <DateField
                            value={date ?? dateFormatted}
                            onChange={(d) => setDate(d)}
                          />
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
                          <SelectField
                            value={changes || patient.gender}
                            onChange={setChanges}
                            onSubmit={() => submitChanges(changes, 'gender', 'basic')}
                            onCancel={() => setRowModify('')}
                            options={[
                              { value: 'male', label: 'Masculino' },
                              { value: 'female', label: 'Femenino' },
                            ]}
                          />
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
                          validate={phoneValidator()}
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
                          validate={emailValidator()}
                          type="email"
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
                            <SelectField
                              value={insuranceDraft?.id ?? ''}
                              onChange={(value) => {
                                const opt = insuranceOptions?.find(o => o.id === value);
                                if (opt) setInsuranceDraft(opt);
                              }}
                              onSubmit={submitInsuranceChanges}
                              onCancel={() => { setRowModify(''); setInsuranceDraft(null); }}
                              options={insuranceOptions?.map(opt => ({ value: opt.id, label: opt.name })) ?? []}
                            />
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
                                  <SelectField
                                    value={planDraft?.id ?? ''}
                                    onChange={(value) => {
                                      const opt = planOptions.find(o => o.id === value);
                                      if (opt) setPlanDraft(opt);
                                    }}
                                    onSubmit={submitPlanChanges}
                                    onCancel={() => { setRowModify(''); setPlanDraft(null); }}
                                    placeholder={planOptions.length === 0 ? 'Sin planes' : 'Seleccionar...'}
                                    options={planOptions.map(opt => ({ value: opt.id, label: opt.name }))}
                                  />
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
                  <EditableRow
                    label="Observaciones"
                    value={patient.notes}
                    rowKey="notes"
                    category="notes"
                    rowModify={rowModify}
                    setRowModify={setRowModify}
                    setChanges={setChanges}
                    submitChanges={submitChanges}
                    changes={changes}
                    multiline
                  />
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
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}
