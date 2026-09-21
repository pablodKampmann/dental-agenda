import { db } from "@/lib/firebase";
import { push, ref, update } from "firebase/database";
import { normalizeForSearch } from "@/lib/utils";
import type { Treatment } from "./getTreatments";
import type { Area } from "./getAreas";
import type { ParsedTreatmentRow } from "@/lib/treatmentsPdfParser";

export interface ImportResult {
  created: number;
  updated: number;
}

/**
 * Un tratamiento importado es "el mismo" que uno ya cargado solo si coinciden código Y
 * nombre (normalizado) — el código ya no es único, así que un código repetido con otro
 * nombre crea un tratamiento nuevo en vez de pisar uno equivocado. Filas sin código
 * siempre se crean nuevas. Las áreas se resuelven por nombre contra `areas/` (sin importar
 * tilde/mayúscula) y las que no existen se crean en el mismo `update()` multi-path.
 */
export async function importTreatments(
  clinicId: string,
  existing: Treatment[],
  areas: Area[],
  rows: ParsedTreatmentRow[],
): Promise<ImportResult | null> {
  try {
    if (!navigator.onLine) throw new Error();
    const key = (codigo: string, name: string) => `${codigo}|${normalizeForSearch(name)}`;
    const byCodigoYNombre = new Map(existing.filter((t) => t.codigo).map((t) => [key(t.codigo!, t.name), t]));
    const areaIdByName = new Map(areas.map((a) => [normalizeForSearch(a.name), a.id]));
    const updates: Record<string, unknown> = {};
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const match = row.codigo ? byCodigoYNombre.get(key(row.codigo, row.name)) : undefined;

      const areaKey = normalizeForSearch(row.area);
      let areaId = areaIdByName.get(areaKey);
      if (!areaId) {
        areaId = push(ref(db, `/clinics/${clinicId}/areas/`)).key!;
        areaIdByName.set(areaKey, areaId);
        updates[`/clinics/${clinicId}/areas/${areaId}/`] = { name: row.area };
      }

      const payload: Record<string, unknown> = { name: row.name, price: row.price, areaId };
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
