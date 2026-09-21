/**
 * Traduce un `EventoOdontogramaConId` crudo (F4-2) al texto clínico de un asiento del
 * historial: qué pieza(s), qué cara (si aplica) y qué pasó en la transición `de` → `a`.
 *
 * Presentación pura de esta pantalla, no dominio compartido — por eso vive acá y no en
 * `src/lib/odontograma/`. Igual de puro: sin Firebase, sin React, fácil de testear con
 * casos concretos.
 */

import { piezaDeClave, type ClavePieza } from '@/lib/odontograma/piezas'
import { etiquetaCara } from '@/lib/odontograma/caras'
import { hallazgoDe } from '@/lib/odontograma/catalogo'
import type { Capa, CodigoHallazgo } from '@/lib/odontograma/tipos'
import type { EventoOdontogramaConId } from '@/services/odontograma/getEventos'

export interface DescripcionEvento {
  readonly id: string
  readonly ts: number
  /** Código(s) FDI, ya en `ordenVisual` para el caso MULTI: "16" o "45-46-47". */
  readonly piezas: string
  /** Nombre clínico de la cara, o `null` en DIENTE/MULTI (no hay una cara puntual). */
  readonly ubicacion: string | null
  readonly capa: Capa
  /** Redactado distinto según sea alta, borrado o reemplazo — nunca un "cambió" genérico. */
  readonly transicion: string
}

function transicionTexto(de: CodigoHallazgo | null, a: CodigoHallazgo | null): string {
  if (de === null && a !== null) return `Se registró ${hallazgoDe(a).nombre}`
  if (de !== null && a === null) return `Se quitó ${hallazgoDe(de).nombre}`
  if (de !== null && a !== null) return `${hallazgoDe(de).nombre} pasó a ${hallazgoDe(a).nombre}`
  return 'Sin cambios registrados'
}

export function describirEvento(evento: EventoOdontogramaConId): DescripcionEvento {
  const { id, ts, capa, de, a } = evento

  if (evento.alcance === 'MULTI') {
    const piezas = (Object.keys(evento.piezas) as ClavePieza[])
      .map(piezaDeClave)
      .sort((x, y) => x.ordenVisual - y.ordenVisual)

    return { id, ts, piezas: piezas.map((p) => p.codigo).join('-'), ubicacion: null, capa, transicion: transicionTexto(de, a) }
  }

  const pieza = piezaDeClave(evento.diente)
  const ubicacion = evento.alcance === 'CARA' ? etiquetaCara(evento.cara, pieza.arcada, pieza.tipo) : null

  return { id, ts, piezas: String(pieza.codigo), ubicacion, capa, transicion: transicionTexto(de, a) }
}
