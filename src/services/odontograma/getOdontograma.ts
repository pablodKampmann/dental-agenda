import { db } from '@/lib/firebase'
import { get, ref } from 'firebase/database'
import { esClavePieza, type ClavePieza } from '@/lib/odontograma/piezas'
import { hallazgosPorAlcance } from '@/lib/odontograma/catalogo'
import {
  esCapa,
  esCara,
  SCHEMA_VERSION,
  type Capa,
  type Cara,
  type CodigoHallazgoCara,
  type CodigoHallazgoDiente,
  type CodigoHallazgoMulti,
  type DientesPorClave,
  type EstadoDiente,
  type HallazgoCara,
  type HallazgoDiente,
  type MetaOdontograma,
  type OdontogramaActual,
  type PiezasSet,
  type Vinculo,
} from '@/lib/odontograma/tipos'

/**
 * Lectura del odontograma de un paciente.
 *
 * Lee `/clinics/{clinicId}/odontogramas/{pacienteId}/actual` y devuelve algo que
 * cumple `OdontogramaActual` de verdad: es el único lugar que valida el dato crudo
 * de Firebase antes de que llegue a los selectores de `selectores.ts` (B1-5), que
 * confían ciegamente en esa forma.
 *
 * Un paciente sin odontograma cargado da `{ dientes: {}, vinculos: {}, meta: null }`,
 * nunca `null` — la pantalla dibuja la boca sana sin ramas especiales. `null` es
 * solo para cuando la lectura en sí falla (offline, error de Firebase).
 *
 * Si aparece una clave o un código inválido en el nodo crudo, esa pieza/vínculo
 * puntual se descarta y se loguea con `console.error` — el resto del odontograma
 * se devuelve igual. Mismo criterio que ya usan `getPatient` y `getPatients`.
 */

const CODIGOS_CARA_VALIDOS: ReadonlySet<string> = new Set(
  hallazgosPorAlcance('CARA').map((entrada) => entrada.codigo)
)
const CODIGOS_DIENTE_VALIDOS: ReadonlySet<string> = new Set(
  hallazgosPorAlcance('DIENTE').map((entrada) => entrada.codigo)
)
const CODIGOS_MULTI_VALIDOS: ReadonlySet<string> = new Set(
  hallazgosPorAlcance('MULTI').map((entrada) => entrada.codigo)
)

const ODONTOGRAMA_VACIO: OdontogramaActual = Object.freeze({
  dientes: Object.freeze({}) as DientesPorClave,
  vinculos: Object.freeze({}) as Record<string, Vinculo>,
  meta: null,
})

/** Valida una hoja `caras/{CARA}/` — una capa por hallazgo de alcance CARA. */
function validarHallazgoCara(raw: unknown, contexto: string): HallazgoCara | null {
  if (typeof raw !== 'object' || raw === null) {
    console.error(`getOdontograma: hallazgo de cara con forma inválida en ${contexto}`, raw)
    return null
  }

  const resultado: Partial<Record<Capa, CodigoHallazgoCara>> = {}
  for (const [capa, codigo] of Object.entries(raw as Record<string, unknown>)) {
    if (!esCapa(capa)) {
      console.error(`getOdontograma: capa inválida "${capa}" en ${contexto}, se descarta`)
      continue
    }
    if (typeof codigo !== 'string' || !CODIGOS_CARA_VALIDOS.has(codigo)) {
      console.error(
        `getOdontograma: código de hallazgo de cara inválido "${String(codigo)}" en ${contexto}.${capa}, se descarta`
      )
      continue
    }
    resultado[capa] = codigo as CodigoHallazgoCara
  }

  return Object.keys(resultado).length > 0 ? resultado : null
}

/** Valida una hoja `diente/` — una capa por hallazgo de alcance DIENTE. */
function validarHallazgoDiente(raw: unknown, contexto: string): HallazgoDiente | null {
  if (typeof raw !== 'object' || raw === null) {
    console.error(`getOdontograma: hallazgo de diente con forma inválida en ${contexto}`, raw)
    return null
  }

  const resultado: Partial<Record<Capa, CodigoHallazgoDiente>> = {}
  for (const [capa, codigo] of Object.entries(raw as Record<string, unknown>)) {
    if (!esCapa(capa)) {
      console.error(`getOdontograma: capa inválida "${capa}" en ${contexto}, se descarta`)
      continue
    }
    if (typeof codigo !== 'string' || !CODIGOS_DIENTE_VALIDOS.has(codigo)) {
      console.error(
        `getOdontograma: código de hallazgo de diente inválido "${String(codigo)}" en ${contexto}.${capa}, se descarta`
      )
      continue
    }
    resultado[capa] = codigo as CodigoHallazgoDiente
  }

  return Object.keys(resultado).length > 0 ? resultado : null
}

/** Valida el nodo entero de una pieza: `caras/` y `diente/`. Descarta la pieza si queda vacía. */
function validarEstadoDiente(raw: unknown, clave: ClavePieza): EstadoDiente | null {
  if (typeof raw !== 'object' || raw === null) {
    console.error(`getOdontograma: estado inválido para la pieza "${clave}", se descarta`, raw)
    return null
  }

  const nodo = raw as Record<string, unknown>
  const estado: { caras?: Partial<Record<Cara, HallazgoCara>>; diente?: HallazgoDiente } = {}

  if (nodo.caras !== undefined) {
    if (typeof nodo.caras !== 'object' || nodo.caras === null) {
      console.error(`getOdontograma: nodo "caras" inválido en la pieza "${clave}"`, nodo.caras)
    } else {
      const carasValidadas: Partial<Record<Cara, HallazgoCara>> = {}
      for (const [cara, valor] of Object.entries(nodo.caras as Record<string, unknown>)) {
        if (!esCara(cara)) {
          console.error(`getOdontograma: cara inválida "${cara}" en la pieza "${clave}", se descarta`)
          continue
        }
        const hallazgo = validarHallazgoCara(valor, `${clave}.caras.${cara}`)
        if (hallazgo) carasValidadas[cara] = hallazgo
      }
      if (Object.keys(carasValidadas).length > 0) estado.caras = carasValidadas
    }
  }

  if (nodo.diente !== undefined) {
    const hallazgo = validarHallazgoDiente(nodo.diente, `${clave}.diente`)
    if (hallazgo) estado.diente = hallazgo
  }

  // Una pieza sin nada válido en caras ni diente no aporta nada al render — se
  // descarta entera en vez de dejar un EstadoDiente vacío en el árbol.
  if (!estado.caras && !estado.diente) return null

  return estado
}

/**
 * Valida `dientes/` completo. Devuelve siempre un objeto (nunca un array): es el
 * contrato que exige `DientesPorClave`, y el motivo por el que las claves llevan
 * el prefijo `t` — un nodo con las 32 piezas permanentes cargadas no puede
 * convertirse en array en este camino.
 */
function validarDientes(raw: unknown): DientesPorClave {
  const dientes: Record<string, EstadoDiente> = {}
  if (typeof raw !== 'object' || raw === null) return dientes

  for (const [clave, valor] of Object.entries(raw as Record<string, unknown>)) {
    if (!esClavePieza(clave)) {
      console.error(`getOdontograma: clave de pieza inválida "${clave}", se descarta`)
      continue
    }
    const estado = validarEstadoDiente(valor, clave)
    if (estado) dientes[clave] = estado
  }

  return dientes
}

function validarPiezasSet(raw: unknown, contexto: string): PiezasSet {
  const piezas: Partial<Record<ClavePieza, true>> = {}
  if (typeof raw !== 'object' || raw === null) {
    console.error(`getOdontograma: "piezas" inválido en ${contexto}`, raw)
    return piezas
  }

  for (const clave of Object.keys(raw as Record<string, unknown>)) {
    if (esClavePieza(clave)) {
      piezas[clave] = true
    } else {
      console.error(`getOdontograma: clave de pieza inválida "${clave}" en ${contexto}, se descarta`)
    }
  }

  return piezas
}

/** Valida un vínculo multi-pieza. Se descarta entero si el tipo, la capa o las piezas no cierran. */
function validarVinculo(raw: unknown, pushId: string): Vinculo | null {
  if (typeof raw !== 'object' || raw === null) {
    console.error(`getOdontograma: vínculo "${pushId}" con forma inválida, se descarta`, raw)
    return null
  }

  const nodo = raw as Record<string, unknown>

  if (typeof nodo.tipo !== 'string' || !CODIGOS_MULTI_VALIDOS.has(nodo.tipo)) {
    console.error(`getOdontograma: tipo inválido "${String(nodo.tipo)}" en el vínculo "${pushId}", se descarta`)
    return null
  }

  if (!esCapa(nodo.capa)) {
    console.error(`getOdontograma: capa inválida "${String(nodo.capa)}" en el vínculo "${pushId}", se descarta`)
    return null
  }

  const piezas = validarPiezasSet(nodo.piezas, `vínculo "${pushId}"`)
  if (Object.keys(piezas).length === 0) {
    console.error(`getOdontograma: vínculo "${pushId}" sin piezas válidas, se descarta`)
    return null
  }

  return {
    tipo: nodo.tipo as CodigoHallazgoMulti,
    capa: nodo.capa,
    piezas,
  }
}

/** Valida `vinculos/`, indexado por el `pushId` que generó cada alta. */
function validarVinculos(raw: unknown): Record<string, Vinculo> {
  const vinculos: Record<string, Vinculo> = {}
  if (typeof raw !== 'object' || raw === null) return vinculos

  for (const [pushId, valor] of Object.entries(raw as Record<string, unknown>)) {
    const vinculo = validarVinculo(valor, pushId)
    if (vinculo) vinculos[pushId] = vinculo
  }

  return vinculos
}

/** Valida `meta/`. Se descarta entera (vuelve a `null`) si la forma no cierra. */
function validarMeta(raw: unknown): MetaOdontograma | null {
  if (raw === null || raw === undefined) return null

  if (typeof raw !== 'object') {
    console.error('getOdontograma: nodo "meta" con forma inválida, se descarta', raw)
    return null
  }

  const nodo = raw as Record<string, unknown>
  if (
    typeof nodo.updatedAt !== 'number' ||
    typeof nodo.updatedBy !== 'string' ||
    nodo.schemaVersion !== SCHEMA_VERSION
  ) {
    console.error('getOdontograma: nodo "meta" con forma inválida, se descarta', nodo)
    return null
  }

  return {
    updatedAt: nodo.updatedAt,
    updatedBy: nodo.updatedBy,
    schemaVersion: SCHEMA_VERSION,
  }
}

export async function getOdontograma(
  pacienteId: string,
  clinicId: string
): Promise<OdontogramaActual | null> {
  try {
    if (!navigator.onLine) {
      throw new Error()
    }

    const dbRef = ref(db, `/clinics/${clinicId}/odontogramas/${pacienteId}/actual`)
    const snapshot = await get(dbRef)

    if (!snapshot.exists()) {
      return ODONTOGRAMA_VACIO
    }

    const raw = (snapshot.val() ?? {}) as Record<string, unknown>

    return {
      dientes: validarDientes(raw.dientes),
      vinculos: validarVinculos(raw.vinculos),
      meta: validarMeta(raw.meta),
    }
  } catch (error) {
    console.error(error)
    return null
  }
}
