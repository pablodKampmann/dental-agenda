import { db } from '@/lib/firebase'
import { ref, update, push, child, serverTimestamp } from 'firebase/database'
import { piezaDeClave, type ClavePieza } from '@/lib/odontograma/piezas'
import { aplicaADenticion, hallazgoDe } from '@/lib/odontograma/catalogo'
import {
  SCHEMA_VERSION,
  type Capa,
  type CodigoHallazgoMulti,
  type EventoMulti,
  type PiezasSet,
  type Vinculo,
} from '@/lib/odontograma/tipos'
import { basePath, nuevaEventoKey, type ParaEscribir } from './setHallazgo'

/**
 * Alta de un vínculo multi-pieza (prótesis fija o removible).
 *
 * Este service es la autoridad sobre la validez del tramo — F3-1 va a repetir la
 * misma validación en pantalla para no dejar confirmar algo que va a rebotar, pero
 * la decisión final es de acá. Por eso `validarTramo` está exportada: la UI la
 * importa en vez de reimplementar el criterio por su cuenta.
 *
 * `validarTramo` solo juzga la geometría del tramo (cantidad, arcada, contigüidad) —
 * es independiente del tipo de vínculo. Si el tipo aplica a la dentición del tramo
 * (B4-1: una prótesis fija no va sobre piezas temporarias) se valida aparte, en
 * `setVinculo`, con el mismo `aplicaADenticion` que usa `setHallazgoDiente`.
 */

/**
 * Un tramo válido: al menos 2 piezas, sin repetidas, todas de la misma arcada y
 * **de la misma fila** — la fila no es un criterio que pida el issue en esas
 * palabras, pero `ordenVisual` está numerado por fila (1–16 en las permanentes,
 * 1–10 en las temporarias son dos escalas distintas), así que "contiguas según
 * ordenVisual" solo tiene sentido comparando piezas de la misma fila. Mezclar
 * dentición permanente y temporaria en el mismo tramo, aunque compartan arcada,
 * queda afuera por esto.
 */
export function validarTramo(piezas: readonly ClavePieza[]): { readonly ok: true } | { readonly ok: false; readonly error: string } {
  if (piezas.length < 2) {
    return { ok: false, error: 'Un vínculo necesita al menos 2 piezas.' }
  }

  if (new Set(piezas).size !== piezas.length) {
    return { ok: false, error: 'El vínculo tiene una pieza repetida.' }
  }

  const detalles = piezas.map((clave) => piezaDeClave(clave))

  if (new Set(detalles.map((p) => p.arcada)).size > 1) {
    return { ok: false, error: 'Todas las piezas del vínculo tienen que ser de la misma arcada.' }
  }

  if (new Set(detalles.map((p) => p.fila)).size > 1) {
    return {
      ok: false,
      error: 'Todas las piezas del vínculo tienen que ser de la misma dentición (no se puede mezclar permanente y temporaria).',
    }
  }

  const ordenados = [...detalles].sort((a, b) => a.ordenVisual - b.ordenVisual)
  for (let i = 1; i < ordenados.length; i++) {
    if (ordenados[i].ordenVisual !== ordenados[i - 1].ordenVisual + 1) {
      return { ok: false, error: 'Las piezas del vínculo tienen que ser contiguas, sin saltear piezas.' }
    }
  }

  return { ok: true }
}

function nuevoVinculoId(clinicId: string, pacienteId: string): string {
  const key = push(child(ref(db), `${basePath(clinicId, pacienteId)}/actual/vinculos`)).key
  if (!key) throw new Error('No se pudo generar el id del vínculo')
  return key
}

interface SetVinculoParams {
  readonly clinicId: string
  readonly pacienteId: string
  readonly tipo: CodigoHallazgoMulti
  readonly capa: Capa
  readonly piezas: readonly ClavePieza[]
  readonly uid: string
}

/**
 * `null` es fallo técnico (offline, error de Firebase) — mismo criterio que el
 * resto de los services. `{ ok: false, error }` es un tramo inválido: rechazado
 * con un mensaje que la UI puede mostrar tal cual, sin reventar.
 */
type SetVinculoResultado = { readonly ok: true; readonly vinculoId: string } | { readonly ok: false; readonly error: string } | null

export async function setVinculo(params: SetVinculoParams): Promise<SetVinculoResultado> {
  const { clinicId, pacienteId, tipo, capa, piezas, uid } = params

  const validacion = validarTramo(piezas)
  if (!validacion.ok) {
    return { ok: false, error: validacion.error }
  }

  // El tramo ya es geométricamente válido, así que todas sus piezas comparten fila —
  // y por lo tanto dentición (ver el chequeo de `fila` en validarTramo). Alcanza con
  // mirar la primera.
  const denticion = piezaDeClave(piezas[0]).denticion
  if (!aplicaADenticion(tipo, denticion)) {
    return {
      ok: false,
      error: `${hallazgoDe(tipo).nombre} no aplica a piezas de dentición ${denticion.toLowerCase()}.`,
    }
  }

  try {
    if (!navigator.onLine) throw new Error()

    const base = basePath(clinicId, pacienteId)
    const vinculoId = nuevoVinculoId(clinicId, pacienteId)
    const eventoKey = nuevaEventoKey(clinicId, pacienteId)

    const piezasSet: PiezasSet = Object.fromEntries(piezas.map((clave) => [clave, true]))
    const vinculo: Vinculo = { tipo, capa, piezas: piezasSet }

    const evento: ParaEscribir<EventoMulti> = {
      ts: serverTimestamp(),
      uid,
      alcance: 'MULTI',
      capa,
      diente: null,
      cara: null,
      piezas: piezasSet,
      de: null,
      a: tipo,
    }

    await update(ref(db), {
      [`${base}/actual/vinculos/${vinculoId}`]: vinculo,
      [`${base}/actual/meta/updatedAt`]: serverTimestamp(),
      [`${base}/actual/meta/updatedBy`]: uid,
      [`${base}/actual/meta/schemaVersion`]: SCHEMA_VERSION,
      [`${base}/eventos/${eventoKey}`]: evento,
    })

    return { ok: true, vinculoId }
  } catch (error) {
    console.error(error)
    return null
  }
}
