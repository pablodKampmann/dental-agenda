import { db } from "@/lib/firebase";
import { ref, update } from "firebase/database";
import type { PaymentMethod } from "./getPayments";

/** Un pago solo es editable en fecha/monto/método — el vínculo a turno/tratamiento se fija
 *  al crearlo. Si el vínculo estaba mal, se borra y se registra de nuevo: es un caso raro y
 *  mantenerlo inmutable evita tener que resolver la baja/alta de un turno vinculado a mitad
 *  de una edición. */
export interface PaymentEditableFields {
  date: string;
  amount: number;
  method: PaymentMethod;
}

export async function updatePayment(clinicId: string, id: string, fields: PaymentEditableFields) {
  try {
    if (!navigator.onLine) throw new Error();
    await update(ref(db, `/clinics/${clinicId}/payments/${id}/`), {
      date: fields.date,
      amount: fields.amount,
      method: fields.method,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}
