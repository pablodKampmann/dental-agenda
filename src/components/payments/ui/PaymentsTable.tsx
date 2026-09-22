import { useEffect, useRef, useState } from "react";
import { LuSearchX } from "react-icons/lu";
import { MdOutlinePayments } from "react-icons/md";
import type { Payment } from "@/services/payments/getPayments";

interface Props {
  payments: Payment[] | null;
  patientsById: Map<number, { name: string; lastName: string }>;
  isFiltering: boolean;
  selectedId: string | null;
  onSelect: (payment: Payment) => void;
}

const TH = "px-4 py-2.5 bg-gray-100 border-b border-gray-200 font-bold";
const TD = "px-4";

const METHOD_CLS: Record<string, string> = {
  Efectivo: "bg-teal-50 text-teal-700 border-teal-200",
  Transferencia: "bg-blue-50 text-blue-700 border-blue-200",
  Otro: "bg-gray-100 text-gray-600 border-gray-200",
};

// Mismo bug que Table de /patients y TreatmentsTable: header en su propia tabla (fuera del
// div con scroll) + colgroup compartido + medición del ancho real de la scrollbar.
export function PaymentsTable({ payments, patientsById, isFiltering, selectedId, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setScrollbarWidth(el.offsetWidth - el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [payments]);

  const isEmpty = payments !== null && payments.length === 0;

  function ColGroup() {
    return (
      <colgroup>
        <col style={{ width: "13%" }} />
        <col style={{ width: "24%" }} />
        <col style={{ width: "28%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "20%" }} />
      </colgroup>
    );
  }

  return (
    <>
      <div className="bg-gray-100" style={{ paddingRight: scrollbarWidth }}>
        <table className="w-full table-fixed select-none">
          <ColGroup />
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest text-gray-400">
              <th className={TH}>Fecha</th>
              <th className={TH}>Paciente</th>
              <th className={TH}>Detalle</th>
              <th className={TH}>Método</th>
              <th className={`${TH} text-right`}>Monto</th>
            </tr>
          </thead>
        </table>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <table className="w-full table-fixed select-none">
          <ColGroup />
          {payments && (
            <tbody>
              {payments.map((payment, index) => {
                const patient = patientsById.get(payment.patientId);
                return (
                  <tr
                    key={payment.id}
                    onClick={() => onSelect(payment)}
                    className={`
                      ${index !== payments.length - 1 ? "border-b border-gray-100" : ""}
                      ${selectedId === payment.id ? "bg-teal-50" : "hover:bg-gray-50"}
                      text-sm h-12 cursor-pointer transition duration-150
                    `}
                  >
                    <td className={TD}>
                      <span className="text-gray-600">{payment.date}</span>
                    </td>
                    <td className={TD}>
                      <span className="font-semibold text-black truncate block">
                        {patient ? `${patient.name} ${patient.lastName}` : "Paciente eliminado"}
                      </span>
                    </td>
                    <td className={TD}>
                      {payment.treatmentName ? (
                        <span className="text-gray-600 truncate block">{payment.treatmentName}</span>
                      ) : payment.appointmentDate ? (
                        <span className="text-gray-400 truncate block">Turno del {payment.appointmentDate}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className={TD}>
                      <span className={`inline-block text-xs font-medium border rounded-full px-2 py-0.5 ${METHOD_CLS[payment.method] ?? METHOD_CLS.Otro}`}>
                        {payment.method}
                      </span>
                    </td>
                    <td className={`${TD} text-right font-semibold text-black`}>${payment.amount.toLocaleString("es-AR")}</td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>

        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 select-none">
            {!isFiltering ? (
              <>
                <MdOutlinePayments size={28} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">Todavía no hay pagos registrados</p>
                <p className="text-xs text-gray-400">Registrá el primero desde el botón de arriba.</p>
              </>
            ) : (
              <>
                <LuSearchX size={28} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">Sin resultados</p>
                <p className="text-xs text-gray-400">Probá con otro filtro.</p>
              </>
            )}
          </div>
        )}
      </div>

      {payments && payments.length > 0 && (
        <div className="shrink-0 px-4 py-2.5 border-t border-gray-200 bg-gray-50 select-none flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">
            {payments.length} {payments.length === 1 ? "pago" : "pagos"}
          </span>
          <span className="text-xs font-semibold text-gray-600">
            Total ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString("es-AR")}
          </span>
        </div>
      )}
    </>
  );
}
