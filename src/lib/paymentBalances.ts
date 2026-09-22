import { getAppointmentTreatments, type AppointmentTreatment } from "@/components/appointments/appointmentUtils";
import type { Payment } from "@/services/payments/getPayments";

export interface AppointmentBalance {
  id: number;
  date: string;
  time: string;
  treatments: AppointmentTreatment[];
  total: number;
  paid: number;
  saldo: number;
}

/** Saldo de un turno puntual: total de sus tratamientos menos lo ya cobrado en pagos
 *  vinculados a ese turno (`appointmentId` + `appointmentDate`, el par que lo identifica —
 *  el id solo es único dentro de su fecha). */
export function appointmentBalance(appointment: any, payments: Payment[]): AppointmentBalance {
  const treatments = getAppointmentTreatments(appointment);
  const total = treatments.reduce((sum, t) => sum + t.price, 0);
  const paid = payments
    .filter((p) => p.appointmentId === appointment.id && p.appointmentDate === appointment.date)
    .reduce((sum, p) => sum + p.amount, 0);
  return { id: appointment.id, date: appointment.date, time: appointment.time, treatments, total, paid, saldo: total - paid };
}

/** Turnos con al menos un tratamiento cargado — un turno sin tratamientos no tiene nada que
 *  cobrar, así que no aporta al saldo del paciente. */
export function computeAppointmentBalances(appointments: any[], payments: Payment[]): AppointmentBalance[] {
  return appointments.map((a) => appointmentBalance(a, payments)).filter((b) => b.total > 0);
}
