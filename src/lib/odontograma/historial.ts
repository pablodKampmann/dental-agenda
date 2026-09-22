/**
 * Traduce un `EventoOdontograma` del log append-only a una entrada legible de
 * Historia Clínica. Es el único lugar que decide el texto clínico de cada tipo de
 * transición — la UI (`clinicHistory/page.tsx`, `HistorialTimeline.tsx`) no arma
 * frases por su cuenta, solo pinta lo que esta función devuelve.
 *
 * Sin Firebase y sin React: recibe el evento ya leído (o ya compuesto en optimista)
 * y el `id` por separado, para no depender de `EventoOdontogramaConId` de
 * `services/odontograma/getEventos.ts` — el dominio no importa de los services
 * (`AGENTS.md`: "los services de odontograma/ lo consumen, nunca al revés").
 */

import dayjs from 'dayjs'
import { piezaDeClave } from './piezas'
import { etiquetaCara } from './caras'
import { hallazgoDe } from './catalogo'
import type { Capa, ClavePieza, CodigoHallazgo, EventoOdontograma } from './tipos'

export interface HallazgoDeEntrada {
  readonly piezaCodigo: number
  readonly detalle: string
  readonly nombreHallazgo: string
  readonly capa: Capa
}

export interface EntradaHistorial {
  readonly id: string
  readonly fecha: string
  readonly hora: string
  readonly texto: string
  readonly hallazgo?: HallazgoDeEntrada
}

/** Nombre del catálogo, o un texto de emergencia si el código no calza (no debería pasar con datos válidos). */
function nombreDe(codigo: CodigoHallazgo | null): string {
  if (codigo === null) return 'hallazgo'
  try {
    return hallazgoDe(codigo).nombre
  } catch {
    return codigo
  }
}

/**
 * `null` cuando el evento no tiene que verse en el timeline — hoy solo la mitad
 * `requerida` que cierra un plan (`origen: 'plan_realizado'`, `a: null`): la mitad
 * `existente` del mismo par ya documenta la misma acción con mejor sentido clínico
 * ("Plan realizado"), mostrar las dos sería el mismo bug de las dos entradas
 * "Caries" sueltas que motivó esta función.
 */
export function eventoAEntrada(id: string, evento: EventoOdontograma): EntradaHistorial | null {
  if (evento.origen === 'plan_realizado' && evento.capa === 'requerida') return null

  const fecha = dayjs(evento.ts).format('DD/MM/YYYY')
  const hora = dayjs(evento.ts).format('HH:mm')
  const texto = evento.nota ?? ''

  if (evento.alcance === 'MULTI') {
    const claves = Object.keys(evento.piezas) as ClavePieza[]
    const codigos = claves.map((c) => piezaDeClave(c).codigo).sort((a, b) => a - b)
    const detalle = `tramo ${codigos.join('-')}`
    const nombreHallazgo = evento.a === null
      ? `Se retiró: ${nombreDe(evento.de)}`
      : `Se colocó: ${nombreDe(evento.a)}`
    return { id, fecha, hora, texto, hallazgo: { piezaCodigo: codigos[0], detalle, nombreHallazgo, capa: evento.capa } }
  }

  const pieza = piezaDeClave(evento.diente)
  const detalle = evento.alcance === 'CARA' ? etiquetaCara(evento.cara, pieza.arcada, pieza.tipo) : 'pieza completa'

  let nombreHallazgo: string
  if (evento.origen === 'plan_realizado') {
    // Acá capa === 'existente' siempre: la otra mitad del par ya se filtró arriba.
    nombreHallazgo = `Plan realizado: ${nombreDe(evento.a)}`
  } else if (evento.a === null) {
    nombreHallazgo = evento.capa === 'requerida'
      ? `Plan descartado: ${nombreDe(evento.de)}`
      : `Se retiró el registro: ${nombreDe(evento.de)}`
  } else if (evento.de !== null && evento.de !== evento.a) {
    nombreHallazgo = `Actualizado: ${nombreDe(evento.de)} → ${nombreDe(evento.a)}`
  } else {
    nombreHallazgo = evento.capa === 'requerida' ? `Planificado: ${nombreDe(evento.a)}` : nombreDe(evento.a)
  }

  return { id, fecha, hora, texto, hallazgo: { piezaCodigo: pieza.codigo, detalle, nombreHallazgo, capa: evento.capa } }
}
