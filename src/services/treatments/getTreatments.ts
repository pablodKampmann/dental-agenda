import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";
import { getAreas, type Area } from "./getAreas";

export interface Treatment {
  id: string;
  name: string;
  price: number;
  /** Relación con `areas/{areaId}` — lo que se persiste. */
  areaId?: string;
  /** Nombre del área, resuelto al leer (no se persiste en el tratamiento). "Varios" si el
   *  tratamiento no tiene área o apunta a una que ya no existe. */
  area: string;
  /** Código del listado de origen (ej. "04.01.09" del colegio) — opcional y NO único: el
   *  colegio puede repetir un código por error, y eso no debe impedir cargar el tratamiento. */
  codigo?: string;
  /** Fecha de vigencia del arancel de origen (ej. "01/07/2026") — solo la traen los
   *  tratamientos que vinieron de un import de PDF, los cargados a mano no la tienen. */
  vigenteDesde?: string;
}

export async function getTreatments(
  clinicId: string,
): Promise<{ treatments: Treatment[]; areas: Area[] } | null> {
  try {
    if (!navigator.onLine) throw new Error();
    const [areas, snapshot] = await Promise.all([
      getAreas(clinicId),
      get(ref(db, `/clinics/${clinicId}/treatments/`)),
    ]);
    if (areas === null) throw new Error();
    if (!snapshot.exists()) return { treatments: [], areas };
    const data = snapshot.val();
    const areaNameById = new Map(areas.map((a) => [a.id, a.name]));
    const treatments = Object.keys(data)
      .map((id) => ({
        id,
        name: data[id]?.name,
        price: data[id]?.price,
        areaId: data[id]?.areaId as string | undefined,
        area: areaNameById.get(data[id]?.areaId) ?? "Varios",
        codigo: data[id]?.codigo,
        vigenteDesde: data[id]?.vigenteDesde,
      }))
      .filter((t) => typeof t.name === "string" && typeof t.price === "number");
    return { treatments, areas };
  } catch (error) {
    console.error(error);
    return null;
  }
}
