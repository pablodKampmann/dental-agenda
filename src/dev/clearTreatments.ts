import { db } from "../lib/firebase";
import { get, ref, remove } from "firebase/database";
import { getUser } from "../services/auth/getUser";

// Borra TODOS los tratamientos de la clínica del admin logueado. Irreversible — Realtime
// Database no tiene papelera. Uso exclusivo de /dev, para resetear datos de prueba. No toca
// `areas/`: quedan disponibles para el próximo import o alta.
export async function runClearAllTreatments(): Promise<{ treatments: number }> {
    const clinicId = await getUser(true);
    if (!clinicId) throw new Error("No se pudo obtener el clinicId.");

    const snap = await get(ref(db, `/clinics/${clinicId}/treatments/`));
    const count = snap.exists() ? Object.keys(snap.val()).length : 0;
    if (count > 0) await remove(ref(db, `/clinics/${clinicId}/treatments/`));
    return { treatments: count };
}
