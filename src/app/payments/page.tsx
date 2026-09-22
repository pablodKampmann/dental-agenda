"use client";

import { useEffect, useMemo, useState } from "react";
import { MdOutlineAddCircle } from "react-icons/md";
import { TbSearch } from "react-icons/tb";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { normalizeForSearch } from "@/lib/utils";
import { Loading } from "@/components/shared/loading";
import { ConfirmAlert } from "@/components/shared/dialogAlerts/confirmAlert";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { PaymentsTable } from "@/components/payments/ui/PaymentsTable";
import { PaymentFormModal, type PaymentFormValues } from "@/components/payments/ui/PaymentFormModal";
import { getPayments, type Payment } from "@/services/payments/getPayments";
import { addPayment, type PaymentFields } from "@/services/payments/addPayment";
import { updatePayment } from "@/services/payments/updatePayment";
import { deletePayment } from "@/services/payments/deletePayment";
import { getAllPatientsFull } from "@/services/patients/getAllPatientsFull";
import { getTreatments, type Treatment } from "@/services/treatments/getTreatments";

const METHOD_OPTIONS = [
  { value: "", label: "Todos los métodos" },
  { value: "Efectivo", label: "Efectivo" },
  { value: "Transferencia", label: "Transferencia" },
  { value: "Otro", label: "Otro" },
];

export default function PaymentsPage() {
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? null;
  const { showToast } = useToast();

  const [isLoad, setIsLoad] = useState(true);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<Treatment[]>([]);

  const [searchContent, setSearchContent] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  useEffect(() => {
    if (clinicId) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  async function fetchAll() {
    if (!clinicId) return;
    const [paymentsData, patientsData, treatmentsData] = await Promise.all([
      getPayments(clinicId),
      getAllPatientsFull(clinicId),
      getTreatments(clinicId),
    ]);
    setPayments(paymentsData ?? []);
    setPatients(patientsData ?? []);
    setCatalog(treatmentsData?.treatments ?? []);
    setIsLoad(false);
  }

  const patientsById = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const isFiltering = searchContent.trim() !== "" || selectedMethod !== "";
  const filteredPayments = useMemo(() => {
    if (!payments) return null;
    let result = payments;
    if (selectedMethod !== "") result = result.filter((p) => p.method === selectedMethod);
    const term = normalizeForSearch(searchContent.trim());
    if (term !== "") {
      result = result.filter((p) => {
        const patient = patientsById.get(p.patientId);
        const name = patient ? normalizeForSearch(`${patient.name} ${patient.lastName}`) : "";
        return name.includes(term) || (patient?.dni ?? "").includes(term);
      });
    }
    return [...result].sort((a, b) => b.ts - a.ts);
  }, [payments, searchContent, selectedMethod, patientsById]);

  function openNew() {
    setEditingPayment(null);
    setShowModal(true);
  }

  function handleSelect(payment: Payment) {
    if (editingPayment?.id === payment.id) {
      setShowModal(false);
      setEditingPayment(null);
      return;
    }
    setEditingPayment(payment);
    setShowModal(true);
  }

  async function handleSave(values: PaymentFormValues) {
    if (!clinicId) return;
    const editing = editingPayment;
    setShowModal(false);
    setEditingPayment(null);
    const result = editing
      ? await updatePayment(clinicId, editing.id, { date: values.date, amount: values.amount, method: values.method })
      : await addPayment(clinicId, values as PaymentFields);
    await fetchAll();
    if (result === null) {
      showToast("error", editing ? "Error al editar el pago" : "Error al registrar el pago");
    } else {
      showToast("success", editing ? "Pago editado correctamente" : "Pago registrado correctamente");
    }
  }

  async function handleConfirmDelete() {
    if (!clinicId || !deleteTarget) return;
    await deletePayment(clinicId, deleteTarget.id);
    setDeleteTarget(null);
    setShowModal(false);
    setEditingPayment(null);
    await fetchAll();
    showToast("success", "Pago eliminado correctamente");
  }

  const totalCount = payments?.length ?? 0;

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
              title="¿Eliminar pago?"
              description={
                deleteTarget ? (
                  <span>
                    Se eliminará el pago de <strong>${deleteTarget.amount.toLocaleString("es-AR")}</strong> del {deleteTarget.date}.
                  </span>
                ) : (
                  "Esta acción no se puede deshacer."
                )
              }
              onConfirm={handleConfirmDelete}
              confirmText="Eliminar"
            />
            <PaymentFormModal
              open={showModal}
              onClose={() => {
                setShowModal(false);
                setEditingPayment(null);
              }}
              catalog={catalog}
              payments={payments ?? []}
              patients={patients.map((p) => ({ id: p.id, name: p.name, lastName: p.lastName, dni: p.dni }))}
              editingPayment={editingPayment}
              fixedPatient={editingPayment ? patientsById.get(editingPayment.patientId) ?? null : null}
              fixedAppointment={null}
              onSave={handleSave}
              onRequestDelete={(payment) => setDeleteTarget(payment)}
            />
          </div>

          <div className="flex flex-col h-full gap-4 px-4 pt-4 pb-4 animate-page-drop">
            <div className="shrink-0 flex items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-2xl font-bold text-black tracking-tight">Pagos</h1>
                <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                  {totalCount === 0 ? "Sin pagos" : `${totalCount} ${totalCount === 1 ? "pago" : "pagos"}`}
                </span>
              </div>
              <button
                type="button"
                onClick={openNew}
                className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 border-2 border-teal-700 bg-teal-700 text-sm font-semibold text-white rounded-lg hover:bg-teal-600 transition duration-150"
              >
                <MdOutlineAddCircle size={18} />
                Registrar pago
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="relative flex-1 min-w-0 md:flex-none md:w-[26rem] flex items-stretch h-9 border-2 border-gray-300 rounded-lg bg-white transition-colors focus-within:border-teal-700">
                  <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-700 pointer-events-none" size={17} />
                  <input
                    autoComplete="off"
                    type="text"
                    placeholder="Buscar por paciente o DNI..."
                    value={searchContent}
                    onChange={(e) => setSearchContent(e.target.value)}
                    className="flex-1 min-w-0 pl-9 pr-3 bg-transparent text-sm text-black placeholder:text-gray-400 outline-none rounded-lg"
                  />
                </div>
                <div className="shrink-0 w-52">
                  <CustomSelect
                    value={selectedMethod}
                    onChange={setSelectedMethod}
                    options={METHOD_OPTIONS}
                    placeholder="Todos los métodos"
                    size="sm"
                    triggerClassName="bg-white"
                  />
                </div>
              </div>

              <PaymentsTable
                payments={filteredPayments}
                patientsById={patientsById}
                isFiltering={isFiltering}
                selectedId={editingPayment?.id ?? null}
                onSelect={handleSelect}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
