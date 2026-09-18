import { db } from "@/lib/firebase";
import { ref, update } from "firebase/database";
import type { TreatmentFields } from "./addTreatment";

export async function updateTreatment(clinicId: string, id: string, fields: TreatmentFields) {
  try {
    if (!navigator.onLine) throw new Error();
    // `update()` no borra claves ausentes del objeto — si el tratamiento tenía `codigo` y se
    // saca en la edición, hay que mandarlo en `null` explícito para que Firebase lo elimine.
    const payload: Record<string, unknown> = {
      name: fields.name,
      price: fields.price,
      area: fields.area,
      codigo: fields.codigo ?? null,
    };
    if (fields.vigenteDesde) payload.vigenteDesde = fields.vigenteDesde;
    await update(ref(db, `/clinics/${clinicId}/treatments/${id}/`), payload);
  } catch (error) {
    console.error(error);
    return null;
  }
}
