"use client";

import { useState, useEffect, useMemo } from "react";
import { BsPersonFillAdd } from "react-icons/bs";
import { Loading } from "./../../components/shared/loading";
import { PatientsToolbar } from "./../../components/patients/ui/patientsToolbar";
import { Table } from "./../../components/patients/ui/table";
import { getAllPatientsFull } from "./../../services/patients/getAllPatientsFull";
import { ModalCreatePatient } from "../../components/patients/ui/modalCreatePatient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const PAGE_SIZE = 100;

export default function Patients() {
  const [isLoad, setIsLoad] = useState(true);
  const [isOpenModalCreatePatient, setIsOpenModalCreatePatient] =
    useState(false);
  const [allPatients, setAllPatients] = useState<null | any[]>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchContent, setSearchContent] = useState("");
  const [selectedField, setSelectedField] = useState<"name" | "dni">("name");
  const [loadRow, setLoadRow] = useState<number | null>(null);
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? null;
  const { showToast } = useToast();

  useEffect(() => {
    if (clinicId) {
      fetchAllPatients();
    }
  }, [clinicId]);

  async function fetchAllPatients() {
    if (!clinicId) return;
    const data = await getAllPatientsFull(clinicId);
    setAllPatients(data ?? []);
    setIsLoad(false);
  }

  const filteredPatients = useMemo(() => {
    if (!allPatients) return null;
    const term = searchContent.trim();
    if (term === "") return allPatients;

    if (selectedField === "dni") {
      return allPatients.filter((p) => (p?.dni ?? "").toString().startsWith(term));
    }

    const termLower = term.toLowerCase();
    return allPatients.filter((p) =>
      `${p?.name ?? ""} ${p?.lastName ?? ""}`.toLowerCase().includes(termLower)
    );
  }, [allPatients, searchContent, selectedField]);

  const isSearching = searchContent.trim() !== "";
  const visiblePatients = filteredPatients
    ? isSearching
      ? filteredPatients
      : filteredPatients.slice(0, visibleCount)
    : null;

  const isListOfPatientsComplete = filteredPatients
    ? isSearching || visibleCount >= filteredPatients.length
    : false;

  function loadMorePatients() {
    setVisibleCount((count) => count + PAGE_SIZE);
  }

  const loadedCount = Array.isArray(visiblePatients) ? visiblePatients.length : 0;
  const totalPatientsCount = Array.isArray(allPatients) ? allPatients.length : 0;
  const countLabel =
    isSearching
      ? `${loadedCount} ${loadedCount === 1 ? "resultado" : "resultados"}`
      : isListOfPatientsComplete
        ? `${loadedCount} ${loadedCount === 1 ? "paciente" : "pacientes"}`
        : `${loadedCount} de ${totalPatientsCount} cargados`;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden">
      {isLoad && <Loading />}
      <ModalCreatePatient
        open={isOpenModalCreatePatient}
        onClose={() => setIsOpenModalCreatePatient(false)}
        onSuccess={() => {
          showToast("success", "Paciente creado correctamente");
          fetchAllPatients();
        }}
      />
      <div
        className={`${isLoad ? "opacity-0" : "animate-page-drop"} transition-opacity duration-150 flex flex-col h-full gap-4 px-4 pt-4 pb-4`}
      >
        {/* Page header */}
        <div className="shrink-0 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-2xl font-bold text-black tracking-tight">Pacientes</h1>
            {totalPatientsCount > 0 && (
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
            searchContent={searchContent}
            setSearchContent={setSearchContent}
            selectedField={selectedField}
            setSelectedField={setSelectedField}
          />
          <Table
            searchContent={searchContent}
            listOfPatients={visiblePatients}
            setLoadRow={setLoadRow}
            loadRow={loadRow}
            isListOfPatientsComplete={isListOfPatientsComplete}
            loadMorePatients={loadMorePatients}
          />
        </div>
      </div>
    </div>
  );
}
