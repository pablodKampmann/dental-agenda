import { getUser } from "../services/auth/getUser";
import { getAllPatients } from "../services/patients/getAllPatients";
import { getOdontograma } from "../services/odontograma/getOdontograma";
import { setHallazgoCara, setHallazgoDiente } from "../services/odontograma/setHallazgo";
import { setVinculo } from "../services/odontograma/setVinculo";
import { caraSemantica } from "../lib/odontograma/caras";
import { SEED_PATIENTS } from "./seedPatients";

/**
 * Carga un odontograma de ejemplo sobre el primer paciente de SEED_PATIENTS
 * (correr "Seed Pacientes" antes, si todavía no existe).
 *
 * Ejercita los siete casos que pide el issue usando los services reales --
 * setHallazgoCara, setHallazgoDiente y setVinculo -- nunca escribiendo
 * Firebase a mano. Si el seed pasa, el contrato de los services pasó
 * también: el puente de tres piezas lo valida el propio setVinculo, no un
 * atajo acá.
 *
 * Idempotente: si el paciente ya tiene algo en `dientes`, no vuelve a
 * escribir nada -- ni duplica el puente ni pisa datos reales que alguien
 * haya cargado a mano desde la UI.
 */
const UID_SEED = "seed-dev";

export async function runSeedOdontograma(): Promise<{
    ok: boolean;
    pacienteId?: string;
    mensaje: string;
    fallidos: string[];
}> {
    const clinicId = await getUser(true);
    if (!clinicId) throw new Error("No se pudo obtener el clinicId.");

    const pacientes = await getAllPatients();
    if (!pacientes) throw new Error("No se pudieron leer los pacientes.");

    const objetivo = SEED_PATIENTS[0];
    const paciente = pacientes.find((p) => p.name === objetivo.name && p.lastName === objetivo.lastName);
    if (!paciente) {
        throw new Error(`No se encontró a ${objetivo.name} ${objetivo.lastName} — corré primero "Seed Pacientes".`);
    }
    const pacienteId = paciente.id;

    const actual = await getOdontograma(pacienteId, clinicId);
    if (actual === null) throw new Error("No se pudo leer el odontograma actual.");
    if (Object.keys(actual.dientes).length > 0) {
        return {
            ok: true,
            pacienteId,
            mensaje: `${objetivo.name} ${objetivo.lastName} ya tenía un odontograma cargado — no se tocó nada.`,
            fallidos: [],
        };
    }

    const fallidos: string[] = [];

    // Dos caries en piezas y caras distintas.
    const cara16 = caraSemantica("top", 1); // hacia afuera, en la arcada superior
    if (
        !(await setHallazgoCara({
            clinicId, pacienteId, pieza: "t16", cara: cara16,
            capa: "requerida", codigo: "caries", de: null, uid: UID_SEED,
        }))
    ) fallidos.push("caries t16");

    const caraOclusal36 = caraSemantica("center", 3); // center es invariante de cuadrante
    if (
        !(await setHallazgoCara({
            clinicId, pacienteId, pieza: "t36", cara: caraOclusal36,
            capa: "requerida", codigo: "caries", de: null, uid: UID_SEED,
        }))
    ) fallidos.push("caries t36");

    // Obturación existente.
    const caraOclusal26 = caraSemantica("center", 2);
    if (
        !(await setHallazgoCara({
            clinicId, pacienteId, pieza: "t26", cara: caraOclusal26,
            capa: "existente", codigo: "obturacion", de: null, uid: UID_SEED,
        }))
    ) fallidos.push("obturación t26");

    // Dos capas sobre la misma cara: obturación existente + caries requerida encima.
    const caraOclusal46 = caraSemantica("center", 4);
    if (
        !(await setHallazgoCara({
            clinicId, pacienteId, pieza: "t46", cara: caraOclusal46,
            capa: "existente", codigo: "obturacion", de: null, uid: UID_SEED,
        }))
    ) fallidos.push("obturación existente t46");
    if (
        !(await setHallazgoCara({
            clinicId, pacienteId, pieza: "t46", cara: caraOclusal46,
            capa: "requerida", codigo: "caries", de: null, uid: UID_SEED,
        }))
    ) fallidos.push("caries requerida t46");

    // Pieza ausente.
    if (
        !(await setHallazgoDiente({
            clinicId, pacienteId, pieza: "t18",
            capa: "existente", codigo: "ausente", de: null, uid: UID_SEED,
        }))
    ) fallidos.push("ausente t18");

    // Extracción pendiente.
    if (
        !(await setHallazgoDiente({
            clinicId, pacienteId, pieza: "t48",
            capa: "requerida", codigo: "extraccion", de: null, uid: UID_SEED,
        }))
    ) fallidos.push("extracción t48");

    // Corona.
    if (
        !(await setHallazgoDiente({
            clinicId, pacienteId, pieza: "t11",
            capa: "existente", codigo: "corona", de: null, uid: UID_SEED,
        }))
    ) fallidos.push("corona t11");

    // Puente de tres piezas: t24, t25, t26 son contiguas en la misma arcada
    // (fila 1) -- setVinculo valida esto por su cuenta, acá no se repite el chequeo.
    const vinculo = await setVinculo({
        clinicId, pacienteId,
        tipo: "protesis_fija", capa: "existente",
        piezas: ["t24", "t25", "t26"], uid: UID_SEED,
    });
    if (vinculo === null || !vinculo.ok) {
        fallidos.push(`puente t24-t25-t26${vinculo && !vinculo.ok ? `: ${vinculo.error}` : ""}`);
    }

    return {
        ok: fallidos.length === 0,
        pacienteId,
        mensaje:
            fallidos.length === 0
                ? `Odontograma de ejemplo cargado sobre ${objetivo.name} ${objetivo.lastName}.`
                : `Se cargó con errores en: ${fallidos.join(", ")}`,
        fallidos,
    };
}
