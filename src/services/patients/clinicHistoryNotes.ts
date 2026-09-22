import { db } from '@/lib/firebase'
import { get, ref, push, child, update, remove, serverTimestamp, query, orderByKey } from 'firebase/database'
import type { ResultadoEscritura } from '@/services/odontograma/setHallazgo'

/**
 * Notas libres de la Historia Clínica: la única excepción a "todo lo de la HC sale del
 * odontograma" (ver AGENTS.md) — cuando el administrador anota algo sin tocar ningún
 * diente. Viven en `/clinics/{clinicId}/patients/{pacienteId}/clinicHistory/notas/{id}`,
 * el nodo que ya estaba reservado (vacío) en el árbol documentado en AGENTS.md.
 *
 * A diferencia de `eventos/` del odontograma, este nodo **no** es append-only: una nota
 * de texto es editable/borrable de verdad (no tiene el peso legal de un asiento clínico
 * sobre un diente), así que no hace falta el patrón `de`/`a`. Reusa `ResultadoEscritura`
 * de `services/odontograma/setHallazgo.ts` como contrato de retorno — mismo criterio
 * `null` = fallo técnico / `{ok:false}` = rechazo de negocio / `{ok:true}` = éxito, para
 * que el caller (`clinicHistory/page.tsx`) no tenga que manejar dos protocolos distintos
 * en la misma pantalla. Ninguna de estas funciones usa la rama `ok: false` hoy — no hay
 * ninguna regla de negocio que pueda rechazar un texto libre — pero la forma es la misma.
 */

export interface NotaHistorial {
  readonly id: string
  readonly texto: string
  readonly ts: number
  readonly uid: string
}

function basePath(clinicId: string, pacienteId: string): string {
  return `/clinics/${clinicId}/patients/${pacienteId}/clinicHistory/notas`
}

interface AddNotaParams {
  readonly clinicId: string
  readonly pacienteId: string
  readonly texto: string
  readonly uid: string
}

export async function addNotaHistorial(params: AddNotaParams): Promise<ResultadoEscritura<{ notaId: string }>> {
  const { clinicId, pacienteId, texto, uid } = params
  try {
    if (!navigator.onLine) throw new Error()

    const base = basePath(clinicId, pacienteId)
    const notaId = push(child(ref(db), base)).key
    if (!notaId) throw new Error('No se pudo generar el id de la nota')

    await update(ref(db), {
      [`${base}/${notaId}`]: { texto, ts: serverTimestamp(), uid },
    })

    return { ok: true, notaId }
  } catch (error) {
    console.error(error)
    return null
  }
}

interface EditarNotaParams {
  readonly clinicId: string
  readonly pacienteId: string
  readonly notaId: string
  readonly texto: string
}

export async function updateNotaHistorial(params: EditarNotaParams): Promise<ResultadoEscritura> {
  const { clinicId, pacienteId, notaId, texto } = params
  try {
    if (!navigator.onLine) throw new Error()
    await update(ref(db), { [`${basePath(clinicId, pacienteId)}/${notaId}/texto`]: texto })
    return { ok: true }
  } catch (error) {
    console.error(error)
    return null
  }
}

interface EliminarNotaParams {
  readonly clinicId: string
  readonly pacienteId: string
  readonly notaId: string
}

export async function deleteNotaHistorial(params: EliminarNotaParams): Promise<ResultadoEscritura> {
  const { clinicId, pacienteId, notaId } = params
  try {
    if (!navigator.onLine) throw new Error()
    await remove(ref(db, `${basePath(clinicId, pacienteId)}/${notaId}`))
    return { ok: true }
  } catch (error) {
    console.error(error)
    return null
  }
}

/**
 * Mismo criterio de validación que `getOdontograma`/`getEventos`: una nota con forma
 * inválida se descarta sola, sin romper la lectura del resto.
 */
export async function getNotasHistorial(clinicId: string, pacienteId: string): Promise<NotaHistorial[] | null> {
  try {
    if (!navigator.onLine) throw new Error()

    const dbRef = query(ref(db, basePath(clinicId, pacienteId)), orderByKey())
    const snapshot = await get(dbRef)
    if (!snapshot.exists()) return []

    const notas: NotaHistorial[] = []
    snapshot.forEach((child) => {
      const val = child.val()
      if (!child.key || typeof val?.texto !== 'string' || typeof val?.ts !== 'number' || typeof val?.uid !== 'string') {
        console.error(`getNotasHistorial: nota "${child.key}" con forma inválida, se descarta`, val)
        return
      }
      notas.push({ id: child.key, texto: val.texto, ts: val.ts, uid: val.uid })
    })

    return notas
  } catch (error) {
    console.error(error)
    return null
  }
}
