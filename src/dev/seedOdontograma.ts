import { auth } from "../lib/firebase";
import { getUser } from "../services/auth/getUser";
import { getAllPatients } from "../services/patients/getAllPatients";
import { getOdontograma } from "../services/odontograma/getOdontograma";
import { setHallazgoCara, setHallazgoDiente, type ResultadoEscritura } from "../services/odontograma/setHallazgo";
import { setVinculo } from "../services/odontograma/setVinculo";
import { caraSemantica } from "../lib/odontograma/caras";
import { SEED_PATIENTS, SEED_PATIENT_PEDIATRICO } from "./seedPatients";

/**
 * Dos seeds de odontograma, cada uno sobre un paciente de dentición distinta:
 *
 * - `runSeedOdontograma` — adultos, sobre SEED_PATIENTS[0] (B3-1).
 * - `runSeedOdontogramaPediatrico` — dentición mixta, sobre SEED_PATIENT_PEDIATRICO (B4-3).
 *
 * Los dos ejercitan los mismos tres services reales -- setHallazgoCara,
 * setHallazgoDiente y setVinculo -- nunca escribiendo Firebase a mano. Si el seed
 * pasa, el contrato de los services pasó también.
 *
 * Lo común a los dos -- resolver clinicId/uid, encontrar al paciente y chequear
 * idempotencia -- vive en `prepararSeed()`. Cada uno arma solo su propia lista de
 * hallazgos.
 *
 * Idempotentes: si el paciente ya tiene algo en `dientes`, no se escribe nada --
 * ni se duplica un vínculo ni se pisa un dato real cargado a mano desde la UI.
 *
 * `uid` sale de `auth.currentUser` -- no de una constante inventada -- porque la
 * regla de Firebase sobre `odontogramas/$id/eventos/$evt` exige
 * `newData.child('uid').val() == auth.uid`. Un uid falso hace fallar la validación
 * del evento y, como el `update()` es multi-path atómico, no se escribe NADA: ni
 * el evento ni el estado. Sin sesión activa el seed corta temprano con un mensaje
 * claro, en vez de reportar éxito habiendo escrito basura (o nada).
 */

interface ResultadoSeed {
    ok: boolean;
    pacienteId?: string;
    mensaje: string;
    fallidos: string[];
}

interface ContextoSeed {
    readonly clinicId: string;
    readonly uid: string;
    readonly pacienteId: string;
}

/** Registra un fallo de escritura con el mismo formato en los dos seeds. */
function registrarFallo(fallidos: string[], etiqueta: string, resultado: ResultadoEscritura<object>): void {
    if (resultado === null || !resultado.ok) {
        fallidos.push(`${etiqueta}${resultado && !resultado.ok ? `: ${resultado.error}` : ""}`);
    }
}

/**
 * Resuelve clinicId + uid, busca al paciente por nombre/apellido y chequea
 * idempotencia. Si ya hay algo cargado, devuelve el resultado final directamente
 * (`listo: false`) y el caller no tiene que escribir nada. Si no, devuelve el
 * contexto (`listo: true`) para que el caller arme sus propios hallazgos.
 */
async function prepararSeed(
    objetivo: { name: string; lastName: string }
): Promise<{ listo: false; resultado: ResultadoSeed } | { listo: true; contexto: ContextoSeed }> {
    const clinicId = await getUser(true);
    if (!clinicId) throw new Error("No se pudo obtener el clinicId.");

    const usuario = auth.currentUser;
    if (!usuario) {
        throw new Error("No hay sesión activa -- iniciá sesión en la app antes de correr el seed.");
    }
    const uid = usuario.uid;

    const pacientes = await getAllPatients();
    if (!pacientes) throw new Error("No se pudieron leer los pacientes.");

    const paciente = pacientes.find((p) => p.name === objetivo.name && p.lastName === objetivo.lastName);
    if (!paciente) {
        throw new Error(`No se encontró a ${objetivo.name} ${objetivo.lastName} — corré primero "Seed Pacientes".`);
    }
    const pacienteId = paciente.id;

    const actual = await getOdontograma(pacienteId, clinicId);
    if (actual === null) throw new Error("No se pudo leer el odontograma actual.");
    if (Object.keys(actual.dientes).length > 0) {
        return {
            listo: false,
            resultado: {
                ok: true,
                pacienteId,
                mensaje: `${objetivo.name} ${objetivo.lastName} ya tenía un odontograma cargado — no se tocó nada.`,
                fallidos: [],
            },
        };
    }

    return { listo: true, contexto: { clinicId, uid, pacienteId } };
}

/**
 * Carga un odontograma de ejemplo sobre el primer paciente de SEED_PATIENTS
 * (correr "Seed Pacientes" antes, si todavía no existe).
 *
 * Ejercita los siete casos que pide el issue original (B3-1): el puente de tres
 * piezas lo valida el propio `setVinculo`, no un atajo acá.
 */
export async function runSeedOdontograma(): Promise<ResultadoSeed> {
    const objetivo = SEED_PATIENTS[0];
    const preparacion = await prepararSeed(objetivo);
    if (!preparacion.listo) return preparacion.resultado;
    const { clinicId, pacienteId, uid } = preparacion.contexto;

    const fallidos: string[] = [];

    // Dos caries en piezas y caras distintas.
    const cara16 = caraSemantica("top", 1); // hacia afuera, en la arcada superior
    const caries16 = await setHallazgoCara({
        clinicId, pacienteId, pieza: "t16", cara: cara16,
        capa: "requerida", codigo: "caries", de: null, uid,
    });
    registrarFallo(fallidos, "caries t16", caries16);

    const caraOclusal36 = caraSemantica("center", 3); // center es invariante de cuadrante
    const caries36 = await setHallazgoCara({
        clinicId, pacienteId, pieza: "t36", cara: caraOclusal36,
        capa: "requerida", codigo: "caries", de: null, uid,
    });
    registrarFallo(fallidos, "caries t36", caries36);

    // Obturación existente.
    const caraOclusal26 = caraSemantica("center", 2);
    const obturacion26 = await setHallazgoCara({
        clinicId, pacienteId, pieza: "t26", cara: caraOclusal26,
        capa: "existente", codigo: "obturacion", de: null, uid,
    });
    registrarFallo(fallidos, "obturación t26", obturacion26);

    // Dos capas sobre la misma cara: obturación existente + caries requerida encima.
    const caraOclusal46 = caraSemantica("center", 4);
    const obturacion46 = await setHallazgoCara({
        clinicId, pacienteId, pieza: "t46", cara: caraOclusal46,
        capa: "existente", codigo: "obturacion", de: null, uid,
    });
    registrarFallo(fallidos, "obturación existente t46", obturacion46);

    const caries46 = await setHallazgoCara({
        clinicId, pacienteId, pieza: "t46", cara: caraOclusal46,
        capa: "requerida", codigo: "caries", de: null, uid,
    });
    registrarFallo(fallidos, "caries requerida t46", caries46);

    // Pieza ausente.
    const ausente = await setHallazgoDiente({
        clinicId, pacienteId, pieza: "t18",
        capa: "existente", codigo: "ausente", de: null, uid,
    });
    registrarFallo(fallidos, "ausente t18", ausente);

    // Extracción pendiente.
    const extraccion = await setHallazgoDiente({
        clinicId, pacienteId, pieza: "t48",
        capa: "requerida", codigo: "extraccion", de: null, uid,
    });
    registrarFallo(fallidos, "extracción t48", extraccion);

    // Corona.
    const corona = await setHallazgoDiente({
        clinicId, pacienteId, pieza: "t11",
        capa: "existente", codigo: "corona", de: null, uid,
    });
    registrarFallo(fallidos, "corona t11", corona);

    // Puente de tres piezas: t24, t25, t26 son contiguas en la misma arcada
    // (fila 1) -- setVinculo valida esto por su cuenta, acá no se repite el chequeo.
    const vinculo = await setVinculo({
        clinicId, pacienteId,
        tipo: "protesis_fija", capa: "existente",
        piezas: ["t24", "t25", "t26"], uid,
    });
    registrarFallo(fallidos, "puente t24-t25-t26", vinculo);

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

/**
 * Carga un odontograma de dentición mixta sobre SEED_PATIENT_PEDIATRICO (B4-3):
 * las cuatro filas de la ficha, caries y obturaciones en temporarias, y un
 * recambio en curso (t55 exfoliada + su sucesora permanente t15 ya con un
 * hallazgo propio).
 *
 * El par sucesora t55/t15 se eligió a mano: la relación no existe como dato en
 * `piezas.ts` (se deduce de que comparten `columna` y `arcada` -- el propio
 * comentario de `COLUMNA_INICIAL` ahí usa "55 cae debajo de 15" como ejemplo).
 * No se agregó una función `sucesora()` al dominio para esto -- es un fixture,
 * no una regla de negocio nueva.
 *
 * Sin implante ni protesis_fija: B4-1 los restringe a dentición permanente y acá
 * hay piezas temporarias de por medio. No se cargó ningún vínculo multi-pieza --
 * `setVinculo` ya lo ejercita el seed de adultos y el issue no lo pide acá, así
 * que no sumar uno de más solo para "completar servicios".
 */
export async function runSeedOdontogramaPediatrico(): Promise<ResultadoSeed> {
    const objetivo = SEED_PATIENT_PEDIATRICO;
    const preparacion = await prepararSeed(objetivo);
    if (!preparacion.listo) return preparacion.resultado;
    const { clinicId, pacienteId, uid } = preparacion.contexto;

    const fallidos: string[] = [];

    // --- Fila 1 (permanente superior): sucesora de t55, con un hallazgo propio
    // para que se note que es una pieza distinta de la que reemplaza.
    const obturacion15 = await setHallazgoCara({
        clinicId, pacienteId, pieza: "t15", cara: caraSemantica("center", 1),
        capa: "existente", codigo: "obturacion", de: null, uid,
    });
    registrarFallo(fallidos, "obturación t15", obturacion15);

    // --- Fila 2 (permanente inferior): sellante en el primer molar permanente.
    const sellante46 = await setHallazgoCara({
        clinicId, pacienteId, pieza: "t46", cara: caraSemantica("center", 4),
        capa: "existente", codigo: "sellante", de: null, uid,
    });
    registrarFallo(fallidos, "sellante t46", sellante46);

    // --- Fila 3 (temporaria superior): la otra mitad del recambio -- t55 ya
    // exfoliada -- más caries y obturación en piezas y caras distintas.
    const ausente55 = await setHallazgoDiente({
        clinicId, pacienteId, pieza: "t55",
        capa: "existente", codigo: "ausente", de: null, uid,
    });
    registrarFallo(fallidos, "ausente t55", ausente55);

    const caries54 = await setHallazgoCara({
        clinicId, pacienteId, pieza: "t54", cara: caraSemantica("center", 5),
        capa: "requerida", codigo: "caries", de: null, uid,
    });
    registrarFallo(fallidos, "caries t54", caries54);

    const obturacion64 = await setHallazgoCara({
        clinicId, pacienteId, pieza: "t64", cara: caraSemantica("top", 6),
        capa: "existente", codigo: "obturacion", de: null, uid,
    });
    registrarFallo(fallidos, "obturación t64", obturacion64);

    // --- Fila 4 (temporaria inferior): caries en un molar temporario inferior.
    const caries74 = await setHallazgoCara({
        clinicId, pacienteId, pieza: "t74", cara: caraSemantica("center", 7),
        capa: "requerida", codigo: "caries", de: null, uid,
    });
    registrarFallo(fallidos, "caries t74", caries74);

    return {
        ok: fallidos.length === 0,
        pacienteId,
        mensaje:
            fallidos.length === 0
                ? `Odontograma pediátrico cargado sobre ${objetivo.name} ${objetivo.lastName}.`
                : `Se cargó con errores en: ${fallidos.join(", ")}`,
        fallidos,
    };
}
