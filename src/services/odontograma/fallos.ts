/**
 * Por qué el motivo del fallo vive acá y no en el valor de retorno de los services.
 *
 * Los services de escritura devuelven `null` ante un fallo técnico y `{ ok: false,
 * error }` ante un rechazo de negocio (ver `ResultadoEscritura` en `setHallazgo.ts`,
 * que documenta el contrato de los siete). Ese contrato **no cambia**: `null` sigue
 * siendo `null`, y ningún caller tiene que reescribir sus comparaciones ni arriesgarse
 * al problema de "`{ ok: false }` es truthy" que ese comentario advierte.
 *
 * Lo que faltaba no era la forma del retorno, era el *motivo*. Y el motivo solo existe
 * adentro del `catch`: una vez que el service devolvió `null`, el objeto de error ya se
 * perdió y ningún caller puede reconstruirlo. Chequear `navigator.onLine` desde afuera
 * tampoco alcanza — con el navegador online, un permiso denegado y una caída de la
 * conexión con Firebase devuelven exactamente el mismo `null`.
 *
 * Por eso los services aceptan un `onFallo` opcional: se llama con el motivo ya
 * clasificado, sin tocar el valor de retorno. Quien no lo pasa se comporta igual que
 * antes, y los tests de B2-3/B2-4 siguen valiendo tal como están escritos.
 *
 * Esto es, concretamente, no repetir el bug de `signIn.ts:37` (docs/odontograma-pendientes.md
 * §1.5 B): ese `catch` devuelve `'network-error'` ante un permission-denied, o sea que le
 * miente al usuario sobre el motivo. Acá no, porque son dos situaciones que se resuelven
 * distinto: con un permiso denegado hay que hablar con quien administra la clínica, con
 * una caída de red hay que esperar y reintentar. Decirle "revisá tu conexión" a alguien
 * que no tiene permiso lo manda a buscar el problema donde no está.
 */

/** Los tres motivos por los que una lectura o una escritura del odontograma puede fallar. */
export type MotivoFallo = 'SIN_CONEXION' | 'SIN_PERMISO' | 'DESCONOCIDO'

/** Lo que los services llaman con el motivo ya clasificado. El `error` crudo va por si el caller quiere loguearlo. */
export type ReportarFallo = (motivo: MotivoFallo, error: unknown) => void

/**
 * Lo que tiran los guards de `!navigator.onLine` de los services. Antes tiraban un
 * `new Error()` sin mensaje, que era indistinguible de cualquier otra falla; esto lo
 * hace reconocible sin depender de leer `navigator.onLine` de nuevo más tarde (para
 * entonces la conexión pudo haber vuelto).
 */
export class ErrorSinConexion extends Error {
  constructor() {
    super('Sin conexión')
    this.name = 'ErrorSinConexion'
  }
}

/**
 * Junta todo lo que un error puede traer escrito. Firebase pone el motivo en `.code`
 * (`'PERMISSION_DENIED'`) o en el mensaje (`'PERMISSION_DENIED: Permission denied'`)
 * según la operación, así que se miran los dos.
 */
function textoDelError(error: unknown): string {
  if (typeof error === 'string') return error.toLowerCase()
  if (typeof error !== 'object' || error === null) return ''

  const candidato = error as { name?: unknown; message?: unknown; code?: unknown }
  return [candidato.code, candidato.name, candidato.message]
    .filter((parte): parte is string => typeof parte === 'string')
    .join(' ')
    .toLowerCase()
}

/**
 * El permiso se chequea **antes** de `navigator.onLine`: un permission-denied es una
 * señal explícita del servidor y manda sobre cualquier inferencia. Si la conexión se
 * cortó justo después de que el servidor rechazara la escritura, el motivo sigue siendo
 * el permiso — es lo que hay que arreglar para que la operación funcione.
 */
export function clasificarFallo(error: unknown): MotivoFallo {
  if (error instanceof ErrorSinConexion) return 'SIN_CONEXION'

  const texto = textoDelError(error)
  if (texto.includes('permission_denied') || texto.includes('permission denied')) {
    return 'SIN_PERMISO'
  }

  // La conexión se cayó en vuelo: el guard de arriba no la vio porque al empezar estaba.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'SIN_CONEXION'

  return 'DESCONOCIDO'
}

/** Qué se estaba intentando hacer. Decide el verbo y si el mensaje habla de deshacer algo. */
export type AccionOdontograma = 'guardar' | 'borrar' | 'cargar'

const VERBOS: Readonly<Record<AccionOdontograma, string>> = {
  guardar: 'guardar el cambio',
  borrar: 'borrar el hallazgo',
  cargar: 'cargar el odontograma',
}

const CAUSAS: Readonly<Record<MotivoFallo, string>> = {
  SIN_CONEXION: 'no hay conexión',
  SIN_PERMISO: 'tu usuario no tiene permiso sobre esta ficha',
  DESCONOCIDO: 'el servidor devolvió un error',
}

/**
 * Qué hacer al respecto. Es la parte que el mensaje genérico ("intentá de nuevo") se
 * comía: reintentar sirve si se cayó la red y no sirve si falta un permiso.
 */
const SALIDAS: Readonly<Record<MotivoFallo, string>> = {
  SIN_CONEXION: 'Revisá la conexión y probá de nuevo.',
  SIN_PERMISO: 'Avisale a quien administra la clínica; reintentar no lo va a resolver.',
  DESCONOCIDO: 'Probá de nuevo; si sigue igual, avisale a quien administra la clínica.',
}

/**
 * El mensaje que ve la odontóloga. En una escritura dice explícitamente que el cambio
 * se deshizo, porque el hallazgo ya estaba dibujado en pantalla cuando la escritura
 * falló (actualización optimista) y desaparecer sin explicación se lee como un bug.
 */
export function mensajeDeFallo(motivo: MotivoFallo, accion: AccionOdontograma): string {
  const deshizo = accion === 'cargar' ? '' : ' El cambio se deshizo.'
  return `No se pudo ${VERBOS[accion]}: ${CAUSAS[motivo]}.${deshizo} ${SALIDAS[motivo]}`
}

/**
 * Envuelve una llamada a un service para quedarse con el motivo del fallo además del
 * resultado. Existe para que cada call site no repita las tres líneas del `let motivo`.
 *
 * El motivo arranca en `DESCONOCIDO` y solo cambia si el service reporta: si la llamada
 * salió bien, nadie lo lee.
 */
export async function conMotivo<R>(
  llamar: (onFallo: ReportarFallo) => Promise<R>
): Promise<{ readonly resultado: R; readonly motivo: MotivoFallo }> {
  let motivo: MotivoFallo = 'DESCONOCIDO'
  const resultado = await llamar((m) => {
    motivo = m
  })
  return { resultado, motivo }
}
