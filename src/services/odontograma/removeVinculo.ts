import { db } from '@/lib/firebase'
import { ref, update, serverTimestamp } from 'firebase/database'
import { SCHEMA_VERSION, type Capa, type CodigoHallazgoMulti, type EventoMulti, type PiezasSet } from '@/lib/odontograma/tipos'
import { basePath, nuevaEventoKey, type ParaEscribir } from './setHallazgo'

/**
 * Baja de un vínculo multi-pieza: escribe `null` en `vinculos/{vinculoId}` y agrega
 * un evento con el tramo completo en `piezas` y `a: null` — el log tiene que poder
 * reconstruir qué piezas abarcaba el puente que se dio de baja, no solo que "algo"
 * se borró.
 *
 * Quien llama ya tiene el vínculo completo (`tipo`, `capa`, `piezas`) — lo leyó vía
 * `getOdontograma` para poder mostrarlo en pantalla — así que no hace falta una
 * lectura extra acá. Mismo criterio que `removeHallazgo`.
 */
interface RemoveVinculoParams {
  readonly clinicId: string
  readonly pacienteId: string
  readonly vinculoId: string
  readonly tipo: CodigoHallazgoMulti
  readonly capa: Capa
  readonly piezas: PiezasSet
  readonly uid: string
}

export async function removeVinculo(params: RemoveVinculoParams): Promise<boolean | null> {
  const { clinicId, pacienteId, vinculoId, tipo, capa, piezas, uid } = params
  try {
    if (!navigator.onLine) throw new Error()

    const base = basePath(clinicId, pacienteId)
    const eventoKey = nuevaEventoKey(clinicId, pacienteId)

    const evento: ParaEscribir<EventoMulti> = {
      ts: serverTimestamp(),
      uid,
      alcance: 'MULTI',
      capa,
      diente: null,
      cara: null,
      piezas,
      de: tipo,
      a: null,
    }

    await update(ref(db), {
      [`${base}/actual/vinculos/${vinculoId}`]: null,
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
