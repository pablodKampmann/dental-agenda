"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MdOutlinePayments, MdOutlineAddCircle } from "react-icons/md";
import { getPatient } from "@/services/patients/getPatient";
import { PatientRecord } from "@/components/patients/ui/patientRecord";
import { PatientRecordSkeleton } from "@/components/patients/ui/patientRecordSkeleton";
import { PaymentsList } from "@/components/patients/ui/payments/PaymentsList";
import { getPayments, type Payment } from "@/services/payments/getPayments";
import { addPayment, type PaymentFields } from "@/services/payments/addPayment";
import { updatePayment } from "@/services/payments/updatePayment";
import { deletePayment } from "@/services/payments/deletePayment";
import { getPatientAppointments } from "@/services/appointments/getPatientAppointments";
import { getTreatments, type Treatment } from "@/services/treatments/getTreatments";
import { computeAppointmentBalances } from "@/lib/paymentBalances";
import { PaymentFormModal, type PaymentFormValues } from "@/components/payments/ui/PaymentFormModal";
import { ConfirmAlert } from "@/components/shared/dialogAlerts/confirmAlert";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function PatientPayments() {
  const pathname = usePathname();
  const id = pathname.split("/").slice(-2, -1)[0] || null;
  const [isLoad, setIsLoad] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  useDocumentTitle(patient?.name ? `${patient.name} ${patient.lastName} — Pagos` : "Pagos");

  const { user } = useAuth();
  const clinicId = user?.clinicId ?? null;
  const { showToast } = useToast();

  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [appointments, setAppointments] = useState<any[] | null>(null);
  const [catalog, setCatalog] = useState<Treatment[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    getPatient(id, clinicId).then((data) => {
      setPatient(data);
      setIsLoad(false);
    });
  }, [id, clinicId]);

  useEffect(() => {
    if (clinicId && patient?.id) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, patient?.id]);

  async function fetchAll() {
    if (!clinicId || !patient?.id) return;
    const [allPayments, patientAppointments, treatmentsData] = await Promise.all([
      getPayments(clinicId),
      getPatientAppointments(patient.id),
      getTreatments(clinicId),
    ]);
    setPayments(allPayments ?? []);
    setAppointments(patientAppointments ?? []);
    setCatalog(treatmentsData?.treatments ?? []);
  }

  const patientPayments = useMemo(
    () => (payments ?? []).filter((p) => p.patientId === patient?.id).sort((a, b) => b.ts - a.ts),
    [payments, patient?.id],
  );

  const balances = useMemo(
    () => (appointments ? computeAppointmentBalances(appointments, payments ?? []) : []),
    [appointments, payments],
  );
  const totalSaldo = balances.reduce((sum, b) => sum + Math.max(b.saldo, 0), 0);

  function openNew() {
    setEditingPayment(null);
    setShowModal(true);
  }

  function handleSelectPayment(payment: Payment) {
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

  if (id === null) return null;

  return (
    <div className="h-[calc(100vh-56px)] overflow-y-auto">
      <div className="px-4 pb-4 pt-4">
        {isLoad ? (
          <PatientRecordSkeleton />
        ) : (
          <div className="animate-fade-in">
            <PatientRecord patient={patient} />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between gap-2 bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="text-base font-bold tracking-wide text-black flex items-center gap-2">
                  <MdOutlinePayments className="text-teal-600" size={18} /> Pagos
                </h2>
                <button
                  type="button"
                  onClick={openNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150"
                >
                  <MdOutlineAddCircle size={18} /> Registrar pago
                </button>
              </div>

              {balances.length > 0 && (
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Turnos y saldos</span>
                    {totalSaldo > 0 && (
                      <span className="text-xs font-semibold text-red-600 whitespace-nowrap">
                        Saldo pendiente: ${totalSaldo.toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {balances.map((b) => (
                      <div
                        key={`${b.date}-${b.id}`}
                        className="flex items-center justify-between gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                      >
                        <span className="text-gray-600 truncate">
                          {b.date} · {b.treatments.map((t) => t.name).join(", ")}
                        </span>
                        <span
                          className={`text-xs font-medium shrink-0 border rounded-full px-2 py-0.5 ${
                            b.saldo <= 0
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : b.paid > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-600 border-red-200"
                          }`}
                        >
                          {b.saldo <= 0
                            ? "Pagado"
                            : b.paid > 0
                            ? `Parcial · $${b.saldo.toLocaleString("es-AR")}`
                            : `Pendiente · $${b.total.toLocaleString("es-AR")}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <PaymentsList payments={patientPayments} selectedId={editingPayment?.id ?? null} onSelect={handleSelectPayment} />
            </div>
          </div>
        )}
      </div>

      <PaymentFormModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingPayment(null);
        }}
        catalog={catalog}
        payments={payments ?? []}
        patients={null}
        editingPayment={editingPayment}
        fixedPatient={patient ? { id: patient.id, name: patient.name, lastName: patient.lastName } : null}
        fixedAppointment={null}
        onSave={handleSave}
        onRequestDelete={(payment) => setDeleteTarget(payment)}
      />

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
    </div>
  );
}
