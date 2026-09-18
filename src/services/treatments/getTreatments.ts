import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";

export interface Treatment {
  id: string;
  name: string;
  price: number;
  area: string;
  /** Código del listado de origen (ej. "04.01.09" del colegio) — opcional, referencia
   *  para reimportar sin duplicar. Único entre los tratamientos que lo tienen cargado. */
  codigo?: string;
  /** Fecha de vigencia del arancel de origen (ej. "01/07/2026") — solo la traen los
   *  tratamientos que vinieron de un import de PDF, los cargados a mano no la tienen. */
  vigenteDesde?: string;
}

export async function getTreatments(clinicId: string): Promise<Treatment[] | null> {
  try {
    if (!navigator.onLine) throw new Error();
    const snapshot = await get(ref(db, `/clinics/${clinicId}/treatments/`));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data)
      .map((id) => ({
        id,
        name: data[id]?.name,
        price: data[id]?.price,
        area: data[id]?.area || "Varios",
        codigo: data[id]?.codigo,
        vigenteDesde: data[id]?.vigenteDesde,
      }))
      .filter((t) => typeof t.name === "string" && typeof t.price === "number");
  } catch (error) {
    console.error(error);
    return null;
  }
}
