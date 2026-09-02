import { db } from '@/lib/firebase'
import { ref, update, serverTimestamp } from 'firebase/database'
import type {
  Capa,
  Cara,
  ClavePieza,
  CodigoHallazgoCara,
  CodigoHallazgoDiente,
  EventoCara,
  EventoDiente,
} from '@/lib/odontograma/tipos'
import { basePath, nuevaEventoKey, type ParaEscribir } from './setHallazgo'
import { SCHEMA_VERSION } from '@/lib/odontograma/tipos'

/**
 * Borra un hallazgo: escribe `null` en la hoja (`caras/{cara}/{capa}` o
 * `diente/{capa}`) y agrega un evento nuevo con `a: null` — nunca borra el evento
 * anterior. El log es append-only: la historia de "hubo una caries acá y se sacó"
 * tiene que quedar, no desaparecer con el dato.
 *
 * Discriminado por `alcance`, igual que `EventoOdontograma` en `tipos.ts`.
 */
type RemoveHallazgoParams =
  | {
      readonly alcance: 'CARA'
      readonly clinicId: string
      readonly pacienteId: string
      readonly pieza: ClavePieza
      readonly cara: Cara
      readonly capa: Capa
      /** Lo que había en esa hoja antes de borrar. */
      readonly de: CodigoHallazgoCara
      readonly uid: string
    }
  | {
      readonly alcance: 'DIENTE'
      readonly clinicId: string
      readonly pacienteId: string
      readonly pieza: ClavePieza
      readonly capa: Capa
      readonly de: CodigoHallazgoDiente
      readonly uid: string
    }

export async function removeHallazgo(params: RemoveHallazgoParams): Promise<boolean | null> {
  try {
    if (!navigator.onLine) throw new Error()

    const { clinicId, pacienteId, capa, uid } = params
    const base = basePath(clinicId, pacienteId)
    const eventoKey = nuevaEventoKey(clinicId, pacienteId)

    const hojaPath =
      params.alcance === 'CARA'
        ? `${base}/actual/dientes/${params.pieza}/caras/${params.cara}/${capa}`
        : `${base}/actual/dientes/${params.pieza}/diente/${capa}`

    const evento: ParaEscribir<EventoCara> | ParaEscribir<EventoDiente> =
      params.alcance === 'CARA'
        ? {
            ts: serverTimestamp(),
            uid,
            alcance: 'CARA',
            capa,
            diente: params.pieza,
            cara: params.cara,
            piezas: null,
            de: params.de,
            a: null,
          }
        : {
            ts: serverTimestamp(),
            uid,
            alcance: 'DIENTE',
            capa,
            diente: params.pieza,
            cara: null,
            piezas: null,
            de: params.de,
            a: null,
          }

    await update(ref(db), {
      [hojaPath]: null,
      [`${base}/actual/meta/updatedAt`]: serverTimestamp(),
      [`${base}/actual/meta/updatedBy`]: uid,
      [`${base}/actual/meta/schemaVersion`]: SCHEMA_VERSION,
      [`${base}/eventos/${eventoKey}`]: evento,
    })

    return true
  } catch (error) {
    console.error(error)
    return null
  }
}
