import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";

export type PaymentMethod = "Efectivo" | "Transferencia" | "Otro";

export interface Payment {
  id: string;
  /** Mismo criterio que `appointment.patientId`: number, no la key string de `patients/`. */
  patientId: number;
  /** Fecha en que se registra el pago (DD/MM/YYYY) — no necesariamente la del turno. */
  date: string;
  amount: number;
  method: PaymentMethod;
  /** Snapshot del tratamiento elegido al registrar — igual que `AppointmentTreatment`, para
   *  que un cambio de precio o un borrado posterior no altere lo que se cobró. */
  treatmentId?: string;
  treatmentName?: string;
  /** Turno al que se vincula el pago. El `id` de un turno solo es único dentro de su fecha,
   *  así que hacen falta los dos campos juntos para identificarlo. */
  appointmentId?: number;
  appointmentDate?: string;
  /** Momento en que se registró el pago (`Date.now()`) — para ordenar el listado. */
  ts: number;
}

export async function getPayments(clinicId: string): Promise<Payment[] | null> {
  try {
    if (!navigator.onLine) throw new Error();
    const snapshot = await get(ref(db, `/clinics/${clinicId}/payments/`));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data)
      .map((id) => ({
        id,
        patientId: data[id]?.patientId,
        date: data[id]?.date,
        amount: data[id]?.amount,
        method: data[id]?.method,
        treatmentId: data[id]?.treatmentId,
        treatmentName: data[id]?.treatmentName,
        appointmentId: data[id]?.appointmentId,
        appointmentDate: data[id]?.appointmentDate,
        ts: data[id]?.ts,
      }))
      .filter(
        (p) =>
          typeof p.patientId === "number" &&
          typeof p.date === "string" &&
          typeof p.amount === "number" &&
          typeof p.method === "string",
      );
  } catch (error) {
    console.error(error);
    return null;
  }
}
