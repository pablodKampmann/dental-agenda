import { db } from "@/lib/firebase";
import { push, ref } from "firebase/database";

export interface TreatmentFields {
  name: string;
  price: number;
  area: string;
  codigo?: string;
  vigenteDesde?: string;
}

export async function addTreatment(clinicId: string, fields: TreatmentFields) {
  try {
    if (!navigator.onLine) throw new Error();
    const payload: Record<string, unknown> = { name: fields.name, price: fields.price, area: fields.area };
    if (fields.codigo) payload.codigo = fields.codigo;
    if (fields.vigenteDesde) payload.vigenteDesde = fields.vigenteDesde;
    const result = await push(ref(db, `/clinics/${clinicId}/treatments/`), payload);
    return result.key;
  } catch (error) {
    console.error(error);
    return null;
  }
}
