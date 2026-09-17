"use client";

import { useState, useEffect, useMemo } from "react";
import { BsPersonFillAdd } from "react-icons/bs";
import { FileSpreadsheet } from "lucide-react";
import { Loading } from "./../../components/shared/loading";
import { PatientsToolbar } from "./../../components/patients/ui/patientsToolbar";
import { Table } from "./../../components/patients/ui/table";
import { getAllPatientsFull } from "./../../services/patients/getAllPatientsFull";
import { ModalCreatePatient } from "../../components/patients/ui/modalCreatePatient";
import { ExportPatientsModal } from "../../components/patients/ui/ExportPatientsModal";
import type { ToggleableColumn } from "../../components/patients/ui/columnsVisibilityMenu";
import { exportPatientsToExcel } from "@/lib/exportPatientsToExcel";
import { getClinicData } from "@/services/config/getClinicData";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const PAGE_SIZE = 100;

const TOGGLEABLE_COLUMNS: ToggleableColumn[] = [
  { key: "dni", label: "DNI" },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Correo" },
  { key: "insurance", label: "Obra Social" },
];

export default function Patients() {
  const [isLoad, setIsLoad] = useState(true);
  const [isOpenModalCreatePatient, setIsOpenModalCreatePatient] =
    useState(false);
  const [allPatients, setAllPatients] = useState<null | any[]>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchContent, setSearchContent] = useState("");
  const [selectedField, setSelectedField] = useState<"name" | "dni">("name");
  const [selectedInsurance, setSelectedInsurance] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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

  // Igual que la búsqueda: el filtro por obra social corre en memoria sobre el fetch
  // único de `getAllPatientsFull` (ya trae toda la clínica), no dispara ninguna query
  // nueva a Firebase — es el mismo patrón documentado para búsqueda/paginación acá.
  const insuranceOptions = useMemo(() => {
    if (!allPatients) return [{ value: "", label: "Todas las obras sociales" }];
    const names = new Set<string>();
    for (const p of allPatients) {
      if (p?.insurance) names.add(p.insurance);
    }
    const sorted = Array.from(names).sort((a, b) => a.localeCompare(b));
    return [
      { value: "", label: "Todas las obras sociales" },
      ...sorted.map((name) => ({ value: name, label: name })),
    ];
  }, [allPatients]);

  const filteredPatients = useMemo(() => {
    if (!allPatients) return null;
    let result = allPatients;

    if (selectedInsurance !== "") {
      result = result.filter((p) => p?.insurance === selectedInsurance);
    }

    const term = searchContent.trim();
    if (term === "") return result;

    if (selectedField === "dni") {
      return result.filter((p) => (p?.dni ?? "").toString().startsWith(term));
    }

    const termLower = term.toLowerCase();
    return result.filter((p) =>
      `${p?.name ?? ""} ${p?.lastName ?? ""}`.toLowerCase().includes(termLower)
    );
  }, [allPatients, searchContent, selectedField, selectedInsurance]);

  const isSearching = searchContent.trim() !== "";
  const isFiltering = isSearching || selectedInsurance !== "";
  const visiblePatients = filteredPatients
    ? isFiltering
      ? filteredPatients
      : filteredPatients.slice(0, visibleCount)
    : null;

  const isListOfPatientsComplete = filteredPatients
    ? isFiltering || visibleCount >= filteredPatients.length
    : false;

  function loadMorePatients() {
    setVisibleCount((count) => count + PAGE_SIZE);
  }

  const loadedCount = Array.isArray(visiblePatients) ? visiblePatients.length : 0;
  const totalPatientsCount = Array.isArray(allPatients) ? allPatients.length : 0;
  const countLabel =
    isFiltering
      ? `${loadedCount} ${loadedCount === 1 ? "resultado" : "resultados"}`
      : isListOfPatientsComplete
        ? `${loadedCount} ${loadedCount === 1 ? "paciente" : "pacientes"}`
        : `${loadedCount} de ${totalPatientsCount} cargados`;

  function handleToggleColumn(key: string) {
    setVisibleColumns((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }));
  }

  // Descripción mostrada en el modal de export — siempre aclara si hay un filtro activo,
  // porque el export corre sobre `filteredPatients` (el set completo filtrado), no sobre
  // `visiblePatients` (que puede estar recortado por la paginación de "Cargar más").
  const exportFilterParts: string[] = [];
  if (isSearching) {
    const fieldLabel = selectedField === "dni" ? "DNI" : "nombre";
    exportFilterParts.push(`que coinciden con "${searchContent.trim()}" (por ${fieldLabel})`);
  }
  if (selectedInsurance !== "") {
    exportFilterParts.push(`con obra social "${selectedInsurance}"`);
  }
  const exportFilterDescription =
    exportFilterParts.length > 0
      ? `Se exportan los pacientes ${exportFilterParts.join(" y ")} — el total que cumple el filtro, no solo lo cargado en pantalla.`
      : null;

  async function handleExportConfirm() {
    const clinicInfo = clinicId ? await getClinicData(clinicId, "info") : null;
    exportPatientsToExcel(filteredPatients ?? [], clinicInfo, exportFilterDescription);
  }

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
      <ExportPatientsModal
        open={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleExportConfirm}
        totalCount={filteredPatients?.length ?? 0}
        filterDescription={exportFilterDescription}
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              disabled={totalPatientsCount === 0}
              className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 border-2 text-sm font-semibold rounded-lg transition duration-150 text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={16} />
              Exportar
            </button>
            <button
              type="button"
              onClick={() => setIsOpenModalCreatePatient(true)}
              className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 border-2 text-sm font-semibold rounded-lg transition duration-150 bg-teal-700 border-teal-700 text-white hover:bg-teal-600"
            >
              <BsPersonFillAdd size={16} />
              Agregar Paciente
            </button>
          </div>
        </div>

        {/* Card: buscador + tabla */}
        <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <PatientsToolbar
            searchContent={searchContent}
            setSearchContent={setSearchContent}
            insuranceOptions={insuranceOptions}
            selectedInsurance={selectedInsurance}
            setSelectedInsurance={setSelectedInsurance}
            columns={TOGGLEABLE_COLUMNS}
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
            selectedField={selectedField}
            setSelectedField={setSelectedField}
          />
          <Table
            isFiltering={isFiltering}
            listOfPatients={visiblePatients}
            setLoadRow={setLoadRow}
            loadRow={loadRow}
            isListOfPatientsComplete={isListOfPatientsComplete}
            loadMorePatients={loadMorePatients}
            visibleColumns={visibleColumns}
          />
        </div>
      </div>
    </div>
  );
}
