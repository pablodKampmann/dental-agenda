"use client";

import { useState, useEffect } from "react";
import { BsPersonFillAdd } from "react-icons/bs";
import { Loading } from "./../../components/shared/loading";
import { PatientsToolbar } from "./../../components/patients/ui/patientsToolbar";
import { Table } from "./../../components/patients/ui/table";
import { getPatients } from "./../../services/patients/getPatients";
import { ModalCreatePatient } from "../../components/patients/ui/modalCreatePatient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function Patients() {
  const [isLoad, setIsLoad] = useState(true);
  const [isOpenModalCreatePatient, setIsOpenModalCreatePatient] =
    useState(false);
  const [listOfPatients, setListOfPatients] = useState<null | any[]>(null);
  const [isListOfPatientsComplete, setIsListOfPatientsComplete] =
    useState(false);
  const [loadMorePatientsButtom, setLoadMorePatientsButtom] = useState(true);
  const [searchContent, setSearchContent] = useState("");
  const [loadRow, setLoadRow] = useState<number | null>(null);
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? null;
  const { showToast } = useToast();

  useEffect(() => {
    if (clinicId) {
      handleGetPatients(20);
    }
  }, [clinicId]);

  async function handleGetPatients(quantity: number) {
    if (!clinicId) return;
    const data = await getPatients(quantity, clinicId);
    if (data) {
      setIsListOfPatientsComplete(data.isFull);
      setListOfPatients(data.patients);
    }
    setLoadMorePatientsButtom(false);
  }

  useEffect(() => {
    if (listOfPatients) {
      setIsLoad(false);
    }
  }, [listOfPatients]);

  const loadedCount = Array.isArray(listOfPatients) ? listOfPatients.length : 0;
  const countLabel =
    searchContent !== ""
      ? `${loadedCount} ${loadedCount === 1 ? "resultado" : "resultados"}`
      : isListOfPatientsComplete
        ? `${loadedCount} ${loadedCount === 1 ? "paciente" : "pacientes"}`
        : `${loadedCount} cargados`;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden">
      {isLoad && <Loading />}
      <ModalCreatePatient
        open={isOpenModalCreatePatient}
        onClose={() => setIsOpenModalCreatePatient(false)}
        onSuccess={() => { showToast("success", "Paciente creado correctamente"); handleGetPatients(20); }}
      />
      <div
        className={`${isLoad ? "opacity-0" : "animate-page-drop"} transition-opacity duration-150 flex flex-col h-full gap-4 px-4 pt-4 pb-4`}
      >
        {/* Page header */}
        <div className="shrink-0 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-2xl font-bold text-black tracking-tight">Pacientes</h1>
            {loadedCount > 0 && (
              <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                {countLabel}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsOpenModalCreatePatient(true)}
            className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150"
          >
            <BsPersonFillAdd size={16} />
            Agregar Paciente
          </button>
        </div>

        {/* Card: buscador + tabla */}
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <PatientsToolbar
            clinicId={clinicId}
            searchContent={searchContent}
            setSearchContent={setSearchContent}
            setListOfPatients={setListOfPatients}
            handleGetPatients={handleGetPatients}
          />
          <Table
            searchContent={searchContent}
            listOfPatients={listOfPatients}
            setLoadRow={setLoadRow}
            loadRow={loadRow}
            isListOfPatientsComplete={isListOfPatientsComplete}
            loadMorePatientsButtom={loadMorePatientsButtom}
            setLoadMorePatientsButtom={setLoadMorePatientsButtom}
            handleGetPatients={handleGetPatients}
          />
        </div>
      </div>
    </div>
  );
}
