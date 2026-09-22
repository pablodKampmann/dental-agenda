"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import dayjs, { Dayjs } from "dayjs";
import { MdClose, MdOutlinePayments } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { TbSearch } from "react-icons/tb";
import { CustomSelect } from "@/components/shared/CustomSelect";
import { useToast } from "@/context/ToastContext";
import { DateField } from "@/components/patients/ui/fields/dateField";
import { formatPriceInput, isValidPriceInput, parsePriceInput, sanitizePriceInput } from "@/components/treatments/priceInput";
import { normalizeForSearch } from "@/lib/utils";
import { getPatientAppointments } from "@/services/appointments/getPatientAppointments";
import { treatmentsLabel, type AppointmentTreatment } from "@/components/appointments/appointmentUtils";
import { appointmentBalance, computeAppointmentBalances } from "@/lib/paymentBalances";
import type { Treatment } from "@/services/treatments/getTreatments";
import type { Payment, PaymentMethod } from "@/services/payments/getPayments";

export interface PaymentPatientLite {
  id: number;
  name: string;
  lastName: string;
  dni?: string;
}

/** Turno ya conocido de antemano (viene del menú Acciones de /agenda) — se muestra fijo,
 *  no como picker, y ya trae sus tratamientos para no tener que volver a pedirlos. */
export interface PaymentFixedAppointment {
  id: number;
  date: string;
  time: string;
  treatments: import("@/components/appointments/appointmentUtils").AppointmentTreatment[];
}

export interface PaymentFormValues {
  patientId: number;
  date: string;
  amount: number;
  method: PaymentMethod;
  treatmentId?: string;
  treatmentName?: string;
  appointmentId?: number;
  appointmentDate?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  catalog: Treatment[];
  /** Pagos ya cargados (de la clínica o al menos del paciente en cuestión) — se usan para
   *  calcular el saldo de cada turno, sin ninguna lectura extra a Firebase. */
  payments: Payment[];
  /** Para el picker de paciente — `null` cuando el paciente ya viene fijo (tab del paciente,
   *  turno de agenda) y el picker no tiene sentido. */
  patients: PaymentPatientLite[] | null;
  editingPayment: Payment | null;
  fixedPatient: PaymentPatientLite | null;
  fixedAppointment: PaymentFixedAppointment | null;
  onSave: (values: PaymentFormValues) => void;
  onRequestDelete: (payment: Payment) => void;
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "Efectivo", label: "Efectivo" },
  { value: "Transferencia", label: "Transferencia" },
  { value: "Otro", label: "Otro" },
];

const INPUT_CLS =
  "w-full h-9 px-3 border-2 border-gray-300 rounded-lg bg-white text-sm text-black placeholder:text-gray-400 focus:outline-teal-700";
const LABEL_CLS = "text-xs font-semibold text-gray-500";
const BTN_GHOST = "px-4 py-2 text-sm font-semibold text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:text-black transition duration-150";
const BTN_PRIMARY = "px-4 py-2 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150 min-w-[132px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";
const READONLY_CLS = "h-9 px-3 flex items-center border-2 border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-600";

const PATIENT_SEARCH_LIMIT = 8;

export function PaymentFormModal({
  open, onClose, catalog, payments, patients, editingPayment, fixedPatient, fixedAppointment,
  onSave, onRequestDelete,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  const [patientSearch, setPatientSearch] = useState("");
  const [pickedPatient, setPickedPatient] = useState<PaymentPatientLite | null>(null);

  const [appointmentsOfPatient, setAppointmentsOfPatient] = useState<any[] | null>(null);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [appointmentId, setAppointmentId] = useState("");
  const [treatmentSel, setTreatmentSel] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [amount, setAmount] = useState("");

  const effectivePatient = fixedPatient ?? pickedPatient;

  // Entrada: mismo patrón que TreatmentsPickerModal — un frame apagado y después se prende,
  // partiendo siempre de un estado limpio (o el del pago a editar).
  useEffect(() => {
    if (!open) {
      setMounted(false);
      return;
    }
    setPatientSearch("");
    setPickedPatient(fixedPatient);
    setAppointmentsOfPatient(null);
    setAppointmentId(fixedAppointment ? String(fixedAppointment.id) : "");
    setTreatmentSel(editingPayment?.treatmentId ?? "");
    setMethod(editingPayment?.method ?? "Efectivo");
    setDate(editingPayment ? dayjs(editingPayment.date, "DD/MM/YYYY") : dayjs());
    if (editingPayment) {
      setAmount(String(editingPayment.amount).replace(".", ","));
    } else if (fixedAppointment) {
      const balance = appointmentBalance(fixedAppointment, payments);
      setAmount(String(balance.saldo > 0 ? balance.saldo : balance.total).replace(".", ","));
    } else {
      setAmount("");
    }
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Turnos del paciente efectivo — solo hace falta pedirlos en alta nueva, sin turno ya
  // fijo (el de agenda ya viene resuelto con sus tratamientos incluidos).
  useEffect(() => {
    if (!open || editingPayment || fixedAppointment || !effectivePatient) {
      setAppointmentsOfPatient(null);
      return;
    }
    let cancelled = false;
    setLoadingAppointments(true);
    getPatientAppointments(effectivePatient.id).then((result) => {
      if (cancelled) return;
      setAppointmentsOfPatient(result ?? []);
      setLoadingAppointments(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, editingPayment, fixedAppointment, effectivePatient]);

  const balances = useMemo(
    () => (appointmentsOfPatient ? computeAppointmentBalances(appointmentsOfPatient, payments) : []),
    [appointmentsOfPatient, payments],
  );

  const fixedBalance = useMemo(
    () => (fixedAppointment ? appointmentBalance(fixedAppointment, payments) : null),
    [fixedAppointment, payments],
  );

  const selectedAppointmentBalance = fixedAppointment
    ? fixedBalance
    : balances.find((b) => String(b.id) === appointmentId) ?? null;

  const treatmentSource = selectedAppointmentBalance ? selectedAppointmentBalance.treatments : catalog;
  const treatmentOptions = treatmentSource.map((t) => ({
    value: t.id,
    label: `${t.name} — $${t.price.toLocaleString("es-AR")}`,
  }));

  const matchingPatients = useMemo(() => {
    if (!patients || patientSearch.trim() === "") return [];
    const term = normalizeForSearch(patientSearch.trim());
    return patients
      .filter((p) => normalizeForSearch(`${p.name} ${p.lastName}`).includes(term) || (p.dni ?? "").includes(term))
      .slice(0, PATIENT_SEARCH_LIMIT);
  }, [patients, patientSearch]);

  function handleAmountKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "." || e.key === ",") {
      e.preventDefault();
      setAmount((prev) => (prev.includes(",") ? prev : `${prev},`));
    }
  }

  function handleAppointmentChange(value: string) {
    setAppointmentId(value);
    setTreatmentSel("");
    const balance = balances.find((b) => String(b.id) === value);
    if (balance) setAmount(String(balance.saldo > 0 ? balance.saldo : balance.total).replace(".", ","));
  }

  function handleTreatmentChange(value: string) {
    setTreatmentSel(value);
    const t = treatmentSource.find((x) => x.id === value);
    if (t) setAmount(String(t.price).replace(".", ","));
  }

  const amountValid = isValidPriceInput(amount);
  const hasChanges =
    !editingPayment ||
    !amountValid ||
    date.format("DD/MM/YYYY") !== editingPayment.date ||
    parsePriceInput(amount) !== editingPayment.amount ||
    method !== editingPayment.method;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const missing: string[] = [];
    if (!effectivePatient) missing.push("el paciente");
    if (!amountValid || parsePriceInput(amount) <= 0) missing.push("el monto");
    if (missing.length > 0) {
      showToast("error", `Completá ${missing.join(" y ")}`, "payment-form-validation");
      return;
    }
    const chosenTreatment = !editingPayment ? treatmentSource.find((t) => t.id === treatmentSel) : undefined;
    const chosenAppointment = fixedAppointment ?? (!editingPayment ? balances.find((b) => String(b.id) === appointmentId) : undefined);
    onSave({
      patientId: effectivePatient!.id,
      date: date.format("DD/MM/YYYY"),
      amount: parsePriceInput(amount),
      method,
      ...(chosenTreatment ? { treatmentId: chosenTreatment.id, treatmentName: chosenTreatment.name } : {}),
      ...(chosenAppointment ? { appointmentId: chosenAppointment.id, appointmentDate: chosenAppointment.date } : {}),
    });
  }

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 ${mounted ? "opacity-100" : "opacity-0"}`} />
      <div
        className="fixed inset-0 z-[65] flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <form
          onSubmit={handleSubmit}
          className={`w-full max-w-[440px] max-h-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-xl transition-all duration-200 ease-out ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center gap-3 px-6 pt-5 pb-4 border-b border-gray-200">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl">
              <MdOutlinePayments size={20} />
            </div>
            <div className="flex-1 min-w-0 select-none">
              <h2 className="text-base font-bold text-black tracking-tight">
                {editingPayment ? "Editar pago" : "Registrar pago"}
              </h2>
              <p className="text-xs text-gray-400">
                {editingPayment ? "Fecha, monto y método." : "Con o sin turno/tratamiento vinculado."}
              </p>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 text-gray-400 hover:text-black transition duration-150">
              <MdClose size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-3">
            {/* Paciente */}
            <div className="flex flex-col gap-1">
              <label className={LABEL_CLS}>
                Paciente <span className="text-red-500">*</span>
              </label>
              {effectivePatient ? (
                <div className="flex items-center justify-between h-9 px-3 border-2 border-teal-200 bg-teal-50 rounded-lg text-sm">
                  <span className="font-medium text-black truncate">
                    {effectivePatient.name} {effectivePatient.lastName}
                  </span>
                  {!fixedPatient && !editingPayment && (
                    <button
                      type="button"
                      onClick={() => setPickedPatient(null)}
                      className="text-teal-700 hover:text-teal-900 text-xs font-semibold shrink-0 ml-2"
                    >
                      Cambiar
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative flex items-stretch h-9 border-2 border-gray-300 rounded-lg bg-white transition-colors focus-within:border-teal-700">
                    <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-700 pointer-events-none" size={15} />
                    <input
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      type="text"
                      autoComplete="off"
                      placeholder="Buscar por nombre o DNI..."
                      className="flex-1 min-w-0 pl-8 pr-3 bg-transparent text-sm text-black placeholder:text-gray-400 outline-none rounded-lg"
                    />
                  </div>
                  {patientSearch.trim() !== "" && (
                    <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg bg-white animate-fade-in">
                      {matchingPatients.length > 0 ? (
                        matchingPatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setPickedPatient(p);
                              setPatientSearch("");
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-black hover:bg-gray-50 border-b border-gray-100 last:border-none transition duration-100"
                          >
                            {p.name} {p.lastName}
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 p-3 text-center">Sin resultados</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {effectivePatient && (
              <>
                {/* Turno */}
                {fixedAppointment ? (
                  <div className="flex flex-col gap-1">
                    <label className={LABEL_CLS}>Turno</label>
                    <div className={READONLY_CLS}>
                      <span className="truncate">
                        {fixedAppointment.date} {fixedAppointment.time}
                        {fixedBalance && fixedBalance.total > 0 ? ` · saldo $${fixedBalance.saldo.toLocaleString("es-AR")}` : ""}
                      </span>
                    </div>
                  </div>
                ) : editingPayment ? (
                  (editingPayment.treatmentName || editingPayment.appointmentDate) && (
                    <div className="flex flex-col gap-1">
                      <label className={LABEL_CLS}>Vinculado a</label>
                      <div className={READONLY_CLS}>
                        <span className="truncate">
                          {[editingPayment.treatmentName, editingPayment.appointmentDate ? `Turno del ${editingPayment.appointmentDate}` : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className={LABEL_CLS}>
                      Turno <span className="font-normal text-gray-400">(opcional)</span>
                    </label>
                    <CustomSelect
                      value={appointmentId}
                      onChange={handleAppointmentChange}
                      disabled={loadingAppointments || balances.length === 0}
                      placeholder={loadingAppointments ? "Cargando turnos..." : balances.length === 0 ? "Sin turnos con tratamientos" : "Ninguno"}
                      options={balances.map((b) => ({
                        value: String(b.id),
                        label: `${b.date} ${b.time} — ${treatmentsLabel(b.treatments)} (saldo $${b.saldo.toLocaleString("es-AR")})`,
                      }))}
                      triggerClassName="bg-white"
                    />
                  </div>
                )}

                {/* Tratamiento */}
                {!editingPayment && (
                  <div className="flex flex-col gap-1">
                    <label className={LABEL_CLS}>
                      Tratamiento <span className="font-normal text-gray-400">(opcional)</span>
                    </label>
                    <CustomSelect
                      value={treatmentSel}
                      onChange={handleTreatmentChange}
                      options={[{ value: "", label: "Ninguno" }, ...treatmentOptions]}
                      placeholder="Ninguno"
                      triggerClassName="bg-white"
                    />
                  </div>
                )}

                {/* Método */}
                <div className="flex flex-col gap-1">
                  <label className={LABEL_CLS}>
                    Método <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={method}
                    onChange={(v) => setMethod(v as PaymentMethod)}
                    options={METHODS}
                    triggerClassName="bg-white"
                  />
                </div>

                {/* Fecha */}
                <div className="flex flex-col gap-1">
                  <label className={LABEL_CLS}>
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <DateField value={date} onChange={setDate} />
                </div>

                {/* Monto */}
                <div className="flex flex-col gap-1">
                  <label className={LABEL_CLS}>
                    Monto <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">$</span>
                    <input
                      value={formatPriceInput(amount)}
                      onChange={(e) => setAmount(sanitizePriceInput(e.target.value))}
                      onKeyDown={handleAmountKeyDown}
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      className={`${INPUT_CLS} pl-6`}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex justify-between items-center gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            {editingPayment ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestDelete(editingPayment);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition duration-150"
              >
                <FaRegTrashCan size={14} />
                Eliminar pago
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className={BTN_GHOST}>
                Cancelar
              </button>
              <button type="submit" disabled={editingPayment ? !hasChanges : false} className={BTN_PRIMARY}>
                {editingPayment ? "Guardar cambios" : "Registrar pago"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>,
    document.body,
  );
}
