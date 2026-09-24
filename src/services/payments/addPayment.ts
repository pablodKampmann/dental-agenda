import { db } from "@/lib/firebase";
import { push, ref } from "firebase/database";
import type { PaymentMethod } from "./getPayments";

export interface PaymentFields {
  patientId: number;
  date: string;
  amount: number;
  method: PaymentMethod;
  treatmentId?: string;
  treatmentName?: string;
  appointmentId?: number;
  appointmentDate?: string;
}

export async function addPayment(clinicId: string, fields: PaymentFields) {
  try {
    if (!navigator.onLine) throw new Error();
    const payload: Record<string, unknown> = {
      patientId: fields.patientId,
      date: fields.date,
      amount: fields.amount,
      method: fields.method,
      ts: Date.now(),
    };
    if (fields.treatmentId) payload.treatmentId = fields.treatmentId;
    if (fields.treatmentName) payload.treatmentName = fields.treatmentName;
    if (fields.appointmentId !== undefined) payload.appointmentId = fields.appointmentId;
    if (fields.appointmentDate) payload.appointmentDate = fields.appointmentDate;
    const result = await push(ref(db, `/clinics/${clinicId}/payments/`), payload);
    return result.key;
  } catch (error) {
    console.error(error);
    return null;
  }
}
