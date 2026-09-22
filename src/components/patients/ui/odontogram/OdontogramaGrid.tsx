'use client'

import React from 'react'
import type { Arcada, Pieza } from '@/lib/odontograma/piezas'
import { PIEZAS_POR_CLAVE } from '@/lib/odontograma/piezas'
import type { DientesPorClave, FacePosition, Vinculo } from '@/lib/odontograma/tipos'
import { filasDelArco, vinculosDeFila, type VisibilidadCapas, type VistaArcada } from '@/lib/odontograma/selectores'
import { Tooth } from './Tooth'
import { VinculoSpan } from './VinculoSpan'

interface OdontogramaGridProps {
  dientes: DientesPorClave
  visibilidad: VisibilidadCapas
  vista: VistaArcada
  vinculos: Record<string, Vinculo>
  piezasEnTramo: ReadonlySet<string>
  enModoTramo: boolean
  /** Clave de la pieza que tiene el picker abierto ahora mismo, si hay uno. */
  piezaActiva?: string
  onSelectCara: (pieza: Pieza, posicion: FacePosition, anchor: DOMRect) => void
  onSelectDiente: (pieza: Pieza, anchor: DOMRect) => void
  onToggleEnTramo: (pieza: Pieza) => void
  /** Sin diálogo de confirmación — clickear el propio grafismo del vínculo lo borra. */
  onQuitarVinculo: (id: string) => void
  /** Ids de vínculo cuya baja está en vuelo — `VinculoSpan` muestra su spinner en vez del grafismo. */
  vinculosPendientes?: ReadonlySet<string>
}

const COLUMNAS = 16

/**
 * Qué lado de la fila es el carril del vínculo, según la arcada de sus piezas —mismo eje
 * que `caraSemantica()` resuelve para el vestibular: arriba en la superior y abajo en la
 * inferior, porque el arco se dibuja con las dos arcadas enfrentadas. Acá se eligió el
 * lado externo (vestibular); **no está confirmado contra la foto de la ficha en papel**
 * cuál convención usa la clínica para dibujar una prótesis. Si hay que invertirlo, esta
 * es la única línea que cambia.
 */
const CARRIL_ARRIBA_EN_ARCADA: Readonly<Record<Arcada, boolean>> = Object.freeze({
  SUPERIOR: true,
  INFERIOR: false,
})

/**
 * Grilla fluida de 16 columnas (`fr`, no píxeles): cada pieza se ubica en su
 * `pieza.columna` real, así que escala con el ancho disponible sin scroll horizontal
 * y las piezas temporarias quedan alineadas debajo de su sucesora permanente, igual
 * que en la ficha en papel.
 */
export function OdontogramaGrid({
  dientes,
  visibilidad,
  vista,
  vinculos,
  piezasEnTramo,
  enModoTramo,
  piezaActiva,
  onSelectCara,
  onSelectDiente,
  onToggleEnTramo,
  onQuitarVinculo,
  vinculosPendientes,
}: OdontogramaGridProps) {
  const filas = filasDelArco(vista)
  const divisorTrasFila = Math.floor(filas.length / 2) - 1

  const renderFila = (fila: readonly string[]) => (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLUMNAS}, minmax(0, 1fr))` }}>
      {fila.map((clave) => {
        const pieza = PIEZAS_POR_CLAVE[clave as keyof typeof PIEZAS_POR_CLAVE]
        return (
          <div key={clave} style={{ gridColumnStart: pieza.columna }}>
            <Tooth
              pieza={pieza}
              estado={dientes}
              visibilidad={visibilidad}
              seleccionado={piezasEnTramo.has(clave)}
              enModoTramo={enModoTramo}
              activo={clave === piezaActiva}
              onSelectCara={onSelectCara}
              onSelectDiente={onSelectDiente}
              onToggleEnTramo={onToggleEnTramo}
            />
          </div>
        )
      })}
    </div>
  )

  const renderCarril = (items: ReturnType<typeof vinculosDeFila>) =>
    items.length > 0 && (
      <div className="flex flex-col gap-1">
        {items.map(({ id, vinculo, piezas }) => (
          <VinculoSpan
            key={id}
            piezas={piezas}
            tipo={vinculo.tipo}
            capa={vinculo.capa}
            onClick={() => onQuitarVinculo(id)}
            pendiente={vinculosPendientes?.has(id)}
          />
        ))}
      </div>
    )

  return (
    <div key={vista} className="w-full flex flex-col gap-3 animate-in fade-in duration-300">
      {filas.map((fila, i) => {
        const vinculosEnFila = vinculosDeFila(vinculos, fila)
        const carrilArriba = vinculosEnFila.filter((v) => CARRIL_ARRIBA_EN_ARCADA[v.piezas[0].arcada])
        const carrilAbajo = vinculosEnFila.filter((v) => !CARRIL_ARRIBA_EN_ARCADA[v.piezas[0].arcada])

        return (
          <React.Fragment key={i}>
            {renderCarril(carrilArriba)}
            {renderFila(fila)}
            {renderCarril(carrilAbajo)}
            {i === divisorTrasFila && <div className="border-t border-dashed border-gray-300" />}
          </React.Fragment>
        )
      })}
    </div>
  )
}
