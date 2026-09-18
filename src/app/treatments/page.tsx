"use client";

import { useEffect, useMemo, useState } from "react";
import { MdClose, MdMedicalServices, MdOutlineAddCircle, MdOutlineFileUpload } from "react-icons/md";
import { TbUserSearch } from "react-icons/tb";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { normalizeForSearch } from "@/lib/utils";
import { Loading } from "@/components/shared/loading";
import { ConfirmAlert } from "@/components/shared/dialogAlerts/confirmAlert";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { TreatmentsTable } from "@/components/treatments/ui/TreatmentsTable";
import { AddTreatmentForm } from "@/components/treatments/ui/AddTreatmentForm";
import { ImportTreatmentsModal } from "@/components/treatments/ui/ImportTreatmentsModal";
import { getTreatments, type Treatment } from "@/services/treatments/getTreatments";
import { addTreatment } from "@/services/treatments/addTreatment";
import { updateTreatment } from "@/services/treatments/updateTreatment";
import { deleteTreatment } from "@/services/treatments/deleteTreatment";
import type { TreatmentFields } from "@/services/treatments/addTreatment";

export default function TreatmentsPage() {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? null;
  const { showToast } = useToast();

  const [isLoad, setIsLoad] = useState(true);
  const [treatments, setTreatments] = useState<Treatment[] | null>(null);
  const [searchContent, setSearchContent] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Treatment | null>(null);
  const [openImportModal, setOpenImportModal] = useState(false);

  useEffect(() => {
    if (clinicId) fetchTreatments();
  }, [clinicId]);

  async function fetchTreatments() {
    if (!clinicId) return;
    const data = await getTreatments(clinicId);
    setTreatments(data ?? []);
    setIsLoad(false);
  }

  // Mismo criterio que el filtro por obra social de /patients: opciones derivadas de los
  // valores únicos ya presentes en el catálogo, sin ninguna query nueva a Firebase.
  const areaOptions = useMemo(() => {
    if (!treatments) return [{ value: "", label: "Todas las áreas" }];
    const names = Array.from(new Set(treatments.map((t) => t.area))).sort((a, b) => a.localeCompare(b));
    return [{ value: "", label: "Todas las áreas" }, ...names.map((name) => ({ value: name, label: name }))];
  }, [treatments]);

  const isFiltering = searchContent.trim() !== "" || selectedArea !== "";
  const filteredTreatments = useMemo(() => {
    if (!treatments) return null;
    let result = treatments;
    if (selectedArea !== "") {
      result = result.filter((t) => t.area === selectedArea);
    }
    const term = normalizeForSearch(searchContent.trim());
    if (term === "") return result;
    return result.filter((t) => normalizeForSearch(t.name).includes(term));
  }, [treatments, searchContent, selectedArea]);

  function clean() {
    setShowForm(false);
    setEditingTreatment(null);
  }

  function handleSelectTreatment(treatment: Treatment) {
    // Reclickear el tratamiento ya en edición cierra el panel, mismo criterio que
    // reclickear el turno activo en /agenda.
    if (editingTreatment?.id === treatment.id) {
      clean();
      return;
    }
    setEditingTreatment(treatment);
    setShowForm(true);
  }

  async function handleSave(fields: TreatmentFields) {
    if (!clinicId) return;
    const editing = editingTreatment;
    clean();
    const result = editing
      ? await updateTreatment(clinicId, editing.id, fields)
      : await addTreatment(clinicId, fields);
    await fetchTreatments();
    if (result === null) {
      showToast("error", editing ? "Error al editar el tratamiento" : "Error al crear el tratamiento");
    } else {
      showToast("success", editing ? "Tratamiento editado correctamente" : "Tratamiento creado correctamente");
    }
  }

  async function handleConfirmDelete() {
    if (!clinicId || !deleteTarget) return;
    await deleteTreatment(clinicId, deleteTarget.id);
    setDeleteTarget(null);
    clean();
    await fetchTreatments();
    showToast("success", "Tratamiento eliminado correctamente");
  }

  const totalCount = treatments?.length ?? 0;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden">
      {isLoad ? (
        <Loading />
      ) : (
        <>
          <div>
            <ConfirmAlert
              open={!!deleteTarget}
              setOpen={(open) => !open && setDeleteTarget(null)}
              title="¿Eliminar tratamiento?"
              description={
                deleteTarget ? (
                  <span>
                    Se eliminará <strong>{deleteTarget.name}</strong> del catálogo. Esto no afecta pagos ya registrados.
                  </span>
                ) : "Esta acción no se puede deshacer."
              }
              onConfirm={handleConfirmDelete}
              confirmText="Eliminar"
            />
            <ImportTreatmentsModal
              open={openImportModal}
              onClose={() => setOpenImportModal(false)}
              clinicId={clinicId}
              existingTreatments={treatments ?? []}
              onImported={fetchTreatments}
            />
          </div>

          <div className="flex flex-col h-full gap-4 px-4 pt-4 pb-4 animate-page-drop">
            {/* Page header */}
            <div className="shrink-0 flex items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-2xl font-bold text-black tracking-tight">Tratamientos</h1>
                <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                  {totalCount === 0 ? "Sin tratamientos" : `${totalCount} ${totalCount === 1 ? "tratamiento" : "tratamientos"}`}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setOpenImportModal(true)}
                  className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 border-2 text-sm font-semibold rounded-lg transition duration-150 text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-black"
                >
                  <MdOutlineFileUpload size={18} />
                  Importar PDF
                </button>
                <button
                  onClick={() => {
                    if (showForm) {
                      clean();
                    } else {
                      setEditingTreatment(null);
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
                      <MdOutlineAddCircle size={18} />
                      Agregar Tratamiento
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Body: tabla + panel lateral */}
            <div className="flex-1 min-h-0 flex gap-4">
              {/* Card de tratamientos */}
              <div className="flex-1 min-w-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="relative flex-1 min-w-0 md:flex-none md:w-[26rem] flex items-stretch h-9 border-2 border-gray-300 rounded-lg bg-white transition-colors focus-within:border-teal-700">
                    <TbUserSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-700 pointer-events-none"
                      size={17}
                    />
                    <input
                      autoComplete="off"
                      type="text"
                      placeholder="Buscar tratamiento..."
                      value={searchContent}
                      onChange={(e) => setSearchContent(e.target.value)}
                      className="flex-1 min-w-0 pl-9 pr-3 bg-transparent text-sm text-black placeholder:text-gray-400 outline-none rounded-lg"
                    />
                  </div>

                  <div className="shrink-0 w-48">
                    <CustomSelect
                      value={selectedArea}
                      onChange={setSelectedArea}
                      options={areaOptions}
                      placeholder="Todas las áreas"
                      size="sm"
                      triggerClassName="bg-white"
                    />
                  </div>
                </div>

                <TreatmentsTable
                  treatments={filteredTreatments}
                  isFiltering={isFiltering}
                  selectedId={editingTreatment?.id ?? null}
                  onSelect={handleSelectTreatment}
                />
              </div>

              {/* Panel lateral */}
              <div className="w-[360px] shrink-0 min-h-0 flex flex-col gap-4 overflow-hidden">
                {showForm ? (
                  <AddTreatmentForm
                    // Fuerza remount al pasar de un tratamiento a otro (o de edición a alta
                    // nueva) sin cerrar el panel — sin esto React reutiliza la misma instancia
                    // (mismos props, mismo lugar) y la animación de entrada, que dispara por
                    // mount, no vuelve a jugar. Mismo criterio que el key por fecha/hora del
                    // popover de Acciones y las filas de AppointmentsTable en /agenda.
                    key={editingTreatment?.id ?? "new"}
                    editingTreatment={editingTreatment}
                    existingTreatments={treatments ?? []}
                    onSave={handleSave}
                    onDelete={() => editingTreatment && setDeleteTarget(editingTreatment)}
                  />
                ) : (
                  <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 text-center p-6 bg-gray-50 border border-gray-200 rounded-2xl animate-move-from-right-form-2">
                    <MdMedicalServices size={64} className="text-gray-300" />
                    <p className="text-sm font-medium text-gray-500 select-none">
                      Elegí un tratamiento de la lista<br />para editarlo, o agregá uno nuevo
                    </p>
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
