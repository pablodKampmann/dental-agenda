import { db } from "../lib/firebase";
import { ref, get, update } from "firebase/database";
import { getUser } from "../services/auth/getUser";

export async function runMigrateAddTimestamps(): Promise<{ updated: number; skipped: number; failed: string[] }> {
    const clinicId = await getUser(true);
    if (!clinicId) throw new Error("No se pudo obtener el clinicId.");

    const dbRef = ref(db, `/clinics/${clinicId}/patients/`);
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) throw new Error("No se encontraron pacientes.");

    const data = snapshot.val();
    let updated = 0;
    let skipped = 0;
    const failed: string[] = [];

    const entries = Object.entries(data) as [string, any][];
    // Ordenar por id numérico para asignar timestamps secuenciales
    entries.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

    for (let i = 0; i < entries.length; i++) {
        const [key, patient] = entries[i];
        if (patient.timestamp !== undefined) {
            console.log(`Paciente ${key} (${patient.name} ${patient.lastName}) — ya tiene timestamp, saltando.`);
            skipped++;
            continue;
        }
        try {
            // timestamp secuencial basado en posición para preservar orden aproximado
            await update(ref(db, `/clinics/${clinicId}/patients/${key}`), {
                timestamp: i + 1,
            });
            console.log(`Paciente ${key} (${patient.name} ${patient.lastName}) — timestamp asignado: ${i + 1}`);
            updated++;
        } catch (e: any) {
            console.error(`Error en paciente ${key}:`, e);
            failed.push(`${key} — ${patient.name} ${patient.lastName}`);
        }
    }

    return { updated, skipped, failed };
}