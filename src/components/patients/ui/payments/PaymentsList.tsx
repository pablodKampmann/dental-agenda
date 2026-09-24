import { MdOutlinePayments } from "react-icons/md";
import type { Payment } from "@/services/payments/getPayments";

interface Props {
  payments: Payment[];
  selectedId: string | null;
  onSelect: (payment: Payment) => void;
}

const METHOD_CLS: Record<string, string> = {
  Efectivo: "bg-teal-50 text-teal-700 border-teal-200",
  Transferencia: "bg-blue-50 text-blue-700 border-blue-200",
  Otro: "bg-gray-100 text-gray-600 border-gray-200",
};

/** Lista simple del tab Pagos del paciente — a diferencia de PaymentsTable (global, con
 *  scroll interno propio), esta vive dentro de una página que ya scrollea entera, así que
 *  no necesita ninguno de los trucos de header fijo/scrollbar de esa tabla. */
export function PaymentsList({ payments, selectedId, onSelect }: Props) {
  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 select-none">
        <MdOutlinePayments size={28} className="text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">Todavía no hay pagos registrados</p>
        <p className="text-xs text-gray-400">Registrá el primero desde el botón de arriba.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {payments.map((payment) => (
        <button
          key={payment.id}
          type="button"
          onClick={() => onSelect(payment)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition duration-150 ${
            selectedId === payment.id ? "bg-teal-50" : "hover:bg-gray-50"
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">{payment.date}</span>
              <span className={`text-[10px] font-medium border rounded-full px-1.5 py-0.5 ${METHOD_CLS[payment.method] ?? METHOD_CLS.Otro}`}>
                {payment.method}
              </span>
            </div>
            <p className="text-sm text-gray-700 truncate mt-0.5">
              {payment.treatmentName ?? (payment.appointmentDate ? `Turno del ${payment.appointmentDate}` : "Pago general")}
            </p>
          </div>
          <span className="text-sm font-semibold text-black shrink-0">${payment.amount.toLocaleString("es-AR")}</span>
        </button>
      ))}
    </div>
  );
}
