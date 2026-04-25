'use client'

import { getPatient } from "./../../../components/patients/db/getPatient";
import React, { useState, useEffect, useRef } from 'react';
import { ImAccessibility } from 'react-icons/im';
import { BsFillPhoneFill} from 'react-icons/bs';
import { updatePatient } from "./../../../components/patients/db/updatePatient";
import { BiPlusMedical } from 'react-icons/bi';
import { Alert } from "./../../../components/general/alert";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaQuestionCircle } from "react-icons/fa";
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { PatientRecord } from "./../../../components/patients/ui/patientRecord";
import { getInsuranceOptions } from "./../../../components/options/getInsuranceOpt";
import { getInsurancePlans } from "./../../../components/options/getInsurancePlans";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from 'dayjs';
import { Loading } from "./../../../components/general/loading";
import { MoonLoader } from "react-spinners";
import { FaCheck } from "react-icons/fa6";
import { getUser } from "./../../../components/auth/getUser";

import { EditableRow } from "@/components/patients/ui/editableRow";

export default function PatientId() {
  const router = useRouter()
  const [isLoad, setIsLoad] = useState(true);
  const [loadingCategory, setLoadingCategory] = useState('');
  const [check, setCheck] = useState(false);
  const pathname = usePathname()
  const id = (pathname.split('/').pop() || null) as string | null;
  const [patient, setPatient] = useState<any>(null);
  const [hovered, setHovered] = useState('');
  const [rowModify, setRowModify] = useState('');
  const [changes, setChanges] = useState<any>('');
  const [openAlert, setOpenAlert] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [insuranceOptions, setInsuranceOptions] = useState<null | {id: string, name: string}[]>(null);
  const [planOptions, setPlanOptions] = useState<{id: string, name: string}[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [insuranceDraft, setInsuranceDraft] = useState<{id: string, name: string} | null>(null);
  const [planDraft, setPlanDraft] = useState<{id: string, name: string} | null>(null);
  const [date, setDate] = useState<null | any>(null);
  const [dateFormatted, setDateFormatted] = useState<null | any>(null);

  const [clinicId, setClinicId] = useState<string | null>(null);

  //CHECK IF THE USER IS LOGGED IN && GET USER

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/notSign");
      }
    });
    return () => unsubscribe();
}, [router]);

  useEffect(() => {
    if (!clinicId) return;
    async function get() {
      try {
        const data = await getPatient(id, clinicId as string);
        setPatient(data);
        const date = dayjs(data.birthDate, "DD/MM/YYYY");
        setDateFormatted(date);
        setIsLoad(false);
        const options = await getInsuranceOptions();
        if (options) {
          setInsuranceOptions(options);
        }
      } catch (error) {
        console.error(error);
      }
    }
    get();
  }, [id, clinicId]);

  async function submitInsuranceChanges() {
    if (!insuranceDraft) { setRowModify(''); return; }
    setLoadingCategory('medic');
    setRowModify('');
    setHovered('');
    setChanges('');
    const newPatient = await updatePatient(
      { insurance: insuranceDraft.name, insuranceId: insuranceDraft.id, plan: '', planId: '' },
      null, id, clinicId as string
    );
    if (newPatient) { setPatient(newPatient); setCheck(true); } else { setLoadingCategory(''); }
    setInsuranceDraft(null);
  }

  async function submitPlanChanges() {
    if (!planDraft?.id) { setRowModify(''); setPlanDraft(null); return; }
    setLoadingCategory('medic');
    setRowModify('');
    setHovered('');
    setChanges('');
    const newPatient = await updatePatient(
      { plan: planDraft.name, planId: planDraft.id },
      null, id, clinicId as string
    );
    if (newPatient) { setPatient(newPatient); setCheck(true); } else { setLoadingCategory(''); }
    setPlanDraft(null);
  }

  async function submitChanges(changes: string, table: string, category: string) {
    if (table === 'insurance') { await submitInsuranceChanges(); return; }
    if (table === 'plan') { await submitPlanChanges(); return; }
    setLoadingCategory(category);
    setRowModify('');
    setHovered('')
    setChanges('')
    if (changes !== '') {
      const newPatient = await updatePatient(changes, table, id, clinicId as string);
      if (newPatient) {
        setPatient(newPatient);
        setCheck(true);
      } else {
        setLoadingCategory('')
      }
    } else {
      setLoadingCategory('')
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoadingCategory('');
      setCheck(false);
    }, 2000);

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
      const formattedDate = dayjs(date.$d);
      const formattedDateString = formattedDate.format('DD/MM/YYYY');
      setChanges(formattedDateString)
    }

  }, [date]);

  useEffect(() => {
    async function fetchClinicId() {
      const id = await getUser(true);
      setClinicId(id as string);
    }
    fetchClinicId();
  }, []);



  if (id !== null) {
    return (
      <div>
        {isLoad ? (
          <Loading />
        ) : (
          <div className='ml-2 p-4 mt-16 mr-2 relative'>
            {openAlert && (
              <div className='fixed inset-0 backdrop-blur-sm ml-56 z-10'>
                <Alert onCloseAlert={() => setOpenAlert(false)} onSuccess={() => { setOpenAlert(false); router.push('/patients'); }} action={'Eliminar Paciente'} firstProp={'¿Estás seguro/a de que deseas eliminar a este paciente?'} secondProp={'Esta accion sera permanente y no se podra volver atras'} thirdProp={id} />
              </div>
            )}
            {patient && (
              <div>
                <PatientRecord patient={patient} />
                <div onMouseEnter={() => setOpenInfo(true)} onMouseLeave={() => setOpenInfo(false)} className="hover:scale-125 transition duration-100 w-7 -translate-y-5 mr-2 ml-auto relative" style={{ zIndex: 1000 }}>
                  <FaQuestionCircle className="text-teal-600 cursor-pointer" size={26} />
                  {openInfo ? (
                    <div className="top-0 -translate-x-[324px] mr-2 bg-teal-600 border-2 border-gray-600 rounded-lg px-2 py-1 text-xs w-80 absolute" style={{ zIndex: 1001 }}>
                      Para actualizar los datos de un paciente, simplemente coloca el mouse sobre el dato que deseas modificar. <br />
                      Si deseas eliminar un paciente, encontrarás un botón correspondiente en la parte inferior de la página.
                    </div>
                  ) : null}
                </div>
                <div className='flex'>
                  <div className='mr-4 border-2 rounded-lg border-gray-600 bg-gray-300 bg-opacity-30 shadow-lg w-1/2 relative'>
                    <div className="ml-auto top-0 right-0 mt-2 mr-2 bg-teal-950 bg-opacity-80 rounded-full w-20 h-20 flex justify-center items-center shadow-lg absolute">
                      {loadingCategory === 'basic' ? (
                        <div>
                          <div className={`${check ? 'opacity-100 animate-move-from-bottom' : 'opacity-0'} duration-[1000ms] transition-opacity `}>
                            <FaCheck size={40} />
                          </div>
                          {check !== true && (
                            <MoonLoader className="mb-10" color="white" size={50} />
                          )}
                        </div>
                      ) : (
                        <ImAccessibility size={60} className="text-teal-600" />
                      )}
                    </div>
                    <div className='flex'>
                      <div>
                        <h1 className='mb-2 text-xl font-semibold text-white border-b-4 border-r-2 border-gray-600 bg-teal-600 w-full rounded-tl-md  rounded-br-3xl pl-6 py-0.5 select-none'>INFORMACIÓN BÁSICA</h1>
                        {/*name*/}
                        <EditableRow
                          label="Nombre"
                          value={patient.name}
                          rowKey="name"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                        {/*lastName*/}
                        <EditableRow
                          label="Apellido"
                          value={patient.lastName}
                          rowKey="lastName"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                        {/*DNI*/}
                        <EditableRow
                          label="DNI"
                          value={patient.dni}
                          rowKey="dni"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                        {/*Address*/}
                        <EditableRow
                          label="Domicilio"
                          value={patient.address}
                          rowKey="address"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                        />
                        {/*birthDate*/}
                        <EditableRow
                          label="Nacimiento"
                          value={patient.birthDate}
                          rowKey="birthDate"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                          renderInput={
                            <div className="relative text-gray-400 ml-2 mr-2" onKeyDown={(e) => { if (e.key === 'Enter') submitChanges(changes, 'birthDate', 'basic'); else if (e.key === 'Escape') setRowModify(''); }}>
                              <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker defaultValue={dateFormatted} onChange={(newDate) => setDate(newDate)} format="DD/MM/YYYY" slotProps={{ textField: { size: 'small' } }} className="px-3 py-2 w-full border text-sm border-gray-300 rounded-md focus:outline-none bg-teal-600 bg-opacity-20 text-black" />
                              </LocalizationProvider>
                            </div>
                          }
                        />
                        {/*Gender*/}
                        <EditableRow
                          label="Género"
                          value={patient.gender}
                          rowKey="gender"
                          category="basic"
                          rowModify={rowModify}
                          hovered={hovered}
                          setRowModify={setRowModify}
                          setHovered={setHovered}
                          setChanges={setChanges}
                          submitChanges={submitChanges}
                          changes={changes}
                          renderInput={
                            <select defaultValue={patient.gender} onChange={(e) => setChanges(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitChanges(changes, 'gender', 'basic'); else if (e.key === 'Escape') setRowModify(''); }} autoFocus className="rounded-md text-black bg-teal-600 bg-opacity-20 pl-1 flex h-8 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4">
                              <option value="male">Hombre</option>
                              <option value="female">Mujer</option>
                            </select>
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className='w-1/2'>
                    <div className='mr-4 border-2 rounded-lg border-gray-600 bg-gray-300 bg-opacity-30 shadow-lg w-full relative'>
                      <div className="ml-auto top-0 right-0 mt-2 mr-2 bg-teal-950 bg-opacity-80 rounded-full w-20 h-20 flex justify-center items-center shadow-lg absolute">
                        {loadingCategory === 'contact' ? (
                          <div>
                            <div className={`${check ? 'opacity-100 animate-move-from-bottom' : 'opacity-0'} duration-[1000ms] transition-opacity `}>
                              <FaCheck size={40} />
                            </div>
                            {check !== true && (
                              <MoonLoader className="mb-10" color="white" size={50} />
                            )}
                          </div>
                        ) : (
                          <BsFillPhoneFill size={55} className=' text-teal-600' />
                        )}
                      </div>
                      <div className=''>
                        <div className='flex'>
                          <div>
                            <h1 className='mb-2 text-xl font-semibold text-white border-b-4 border-r-2 border-gray-600 bg-teal-600  w-full rounded-tl-md  rounded-br-3xl px-6 py-0.5 select-none'>CONTACTO</h1>
                            {/*num*/}
                            <EditableRow
                              label="Núm.Telefono"
                              value={patient.num}
                              rowKey="num"
                              category="contact"
                              rowModify={rowModify}
                              hovered={hovered}
                              setRowModify={setRowModify}
                              setHovered={setHovered}
                              setChanges={setChanges}
                              submitChanges={submitChanges}
                              changes={changes}
                            />
                            {/*email*/}
                            <EditableRow
                              label="Correo"
                              value={patient.email}
                              rowKey="email"
                              category="contact"
                              rowModify={rowModify}
                              hovered={hovered}
                              setRowModify={setRowModify}
                              setHovered={setHovered}
                              setChanges={setChanges}
                              submitChanges={submitChanges}
                              changes={changes}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='mr-4 border-2 rounded-lg border-gray-600 bg-gray-300 bg-opacity-30 shadow-lg w-full mt-4 relative'>
                      <div className="ml-auto top-0 right-0 mt-2 mr-2 bg-teal-950 bg-opacity-80 rounded-full w-20 h-20 flex justify-center items-center shadow-lg absolute">
                        {loadingCategory === 'medic' ? (
                          <div>
                            <div className={`${check ? 'opacity-100 animate-move-from-bottom' : 'opacity-0'} duration-[1000ms] transition-opacity `}>
                              <FaCheck size={40} />
                            </div>
                            {check !== true && (
                              <MoonLoader className="mb-10" color="white" size={50} />
                            )}
                          </div>
                        ) : (
                          <BiPlusMedical size={60} className="text-teal-600" />
                        )}
                      </div>
                      <div className=''>
                        <div className='flex'>
                          <div>
                            <h1 className='mb-2 text-xl font-semibold text-white border-b-4 border-r-2 border-gray-600 bg-teal-600  w-full rounded-tl-md rounded-br-3xl px-6 py-0.5 select-none'>SALUD</h1>
                            <EditableRow
                              label="ObraSocial"
                              value={patient.insurance}
                              rowKey="insurance"
                              category="medic"
                              rowModify={rowModify}
                              hovered={hovered}
                              setRowModify={setRowModify}
                              setHovered={setHovered}
                              setChanges={setChanges}
                              submitChanges={submitChanges}
                              changes={changes}
                              renderInput={
                                <select value={insuranceDraft?.id ?? ''} onChange={(e) => { const opt = insuranceOptions?.find(o => o.id === e.target.value); if (opt) setInsuranceDraft(opt); }} onKeyDown={(e) => { if (e.key === 'Enter') submitInsuranceChanges(); else if (e.key === 'Escape') { setRowModify(''); setInsuranceDraft(null); } }} autoFocus className="rounded-md text-black bg-teal-600 bg-opacity-20 pl-1 flex h-8 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4">
                                  {insuranceOptions?.map((opt) => (
                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                  ))}
                                </select>
                              }
                            />
                            {patient.insurance === 'Particular' ? (
                              <div>
                                <div className="transition duration-100 w-[25rem] border-2 border-transparent ml-4 mb-1 flex items-center rounded-lg p-1">
                                  <h1 className='text-md text-black font-semibold'>Plan:</h1>
                                  <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>-</p>
                                </div>
                                <div className="transition duration-100 w-[25rem] border-2 border-transparent ml-4 mb-1 flex items-center rounded-lg p-1">
                                  <h1 className='text-md text-black font-semibold'>Núm.Afiliado:</h1>
                                  <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>-</p>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {/*plan*/}
                                <EditableRow
                                  label="Plan"
                                  value={patient.plan}
                                  rowKey="plan"
                                  category="medic"
                                  rowModify={rowModify}
                                  hovered={hovered}
                                  setRowModify={setRowModify}
                                  setHovered={setHovered}
                                  setChanges={setChanges}
                                  submitChanges={submitChanges}
                                  changes={changes}
                                  renderInput={
                                    loadingPlans ? (
                                      <span className="ml-4 text-sm text-gray-400">Cargando...</span>
                                    ) : (
                                      <select value={planDraft?.id ?? ''} onChange={(e) => { const opt = planOptions.find(o => o.id === e.target.value); if (opt) setPlanDraft(opt); }} onKeyDown={(e) => { if (e.key === 'Enter') submitPlanChanges(); else if (e.key === 'Escape') { setRowModify(''); setPlanDraft(null); } }} autoFocus className="rounded-md text-black bg-teal-600 bg-opacity-20 pl-1 flex h-8 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4">
                                        {!planDraft?.id && <option value="" disabled>Seleccionar...</option>}
                                        {planOptions.length === 0 && planDraft?.id && <option value="" disabled>Sin planes</option>}
                                        {planOptions.map((opt) => (
                                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                                        ))}
                                      </select>
                                    )
                                  }
                                />
                                {/*affiliateNum*/}
                                <EditableRow
                                  label="Núm.Afiliado"
                                  value={patient.affiliateNum}
                                  rowKey="affiliateNum"
                                  category="medic"
                                  rowModify={rowModify}
                                  hovered={hovered}
                                  setRowModify={setRowModify}
                                  setHovered={setHovered}
                                  setChanges={setChanges}
                                  submitChanges={submitChanges}
                                  changes={changes}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div onClick={() => setOpenAlert(true)} className='select-none mt-4 border-2 rounded-lg border-red-600 bg-gray-300 bg-opacity-30 shadow-lg w-full relative text-center transition duration-200 cursor-pointer hover:text-white hover:bg-red-900 border-opacity-30 hover:bg-opacity-70 px-2 py-1 text-black text-xl font-medium'>
                    Eliminar Paciente Permanentemente
                  </div>
                </div>
              </div>
            )}
          </div>
        )
        }
      </div >
    );
  }
}
