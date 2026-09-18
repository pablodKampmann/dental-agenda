import { db } from "@/lib/firebase";
import { push, ref, update } from "firebase/database";
import type { Treatment } from "./getTreatments";
import type { ParsedTreatmentRow } from "@/lib/treatmentsPdfParser";

export interface ImportResult {
  created: number;
  updated: number;
}

/**
 * El código es la única clave de identidad entre una fila importada y un tratamiento ya
 * cargado — un nombre repetido nunca dispara un update (ver AGENTS.md, "Tratamientos y
 * Pagos"). Filas sin código siempre se crean nuevas. Un solo `update()` multi-path para
 * todo el lote, misma lógica que el resto del proyecto para escrituras batch.
 */
export async function importTreatments(
  clinicId: string,
  existing: Treatment[],
  rows: ParsedTreatmentRow[],
): Promise<ImportResult | null> {
  try {
    if (!navigator.onLine) throw new Error();
    const byCodigo = new Map(existing.filter((t) => t.codigo).map((t) => [t.codigo, t]));
    const updates: Record<string, unknown> = {};
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const match = row.codigo ? byCodigo.get(row.codigo) : undefined;
      const payload: Record<string, unknown> = { name: row.name, price: row.price, area: row.area };
      if (row.codigo) payload.codigo = row.codigo;
      if (row.vigenteDesde) payload.vigenteDesde = row.vigenteDesde;

      if (match) {
        updates[`/clinics/${clinicId}/treatments/${match.id}/`] = payload;
        updated++;
      } else {
        const newId = push(ref(db, `/clinics/${clinicId}/treatments/`)).key;
        updates[`/clinics/${clinicId}/treatments/${newId}/`] = payload;
        created++;
      }
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
    return { created, updated };
  } catch (error) {
    console.error(error);
    return null;
  }
}
