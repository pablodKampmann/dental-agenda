'use client'

import React from 'react'
import type { Pieza } from '@/lib/odontograma/piezas'
import { PIEZAS_POR_CLAVE } from '@/lib/odontograma/piezas'
import type { DientesPorClave, FacePosition } from '@/lib/odontograma/tipos'
import { filasDelArco, type VisibilidadCapas, type VistaArcada } from '@/lib/odontograma/selectores'
import { Tooth } from './Tooth'

interface OdontogramaGridProps {
  dientes: DientesPorClave
  visibilidad: VisibilidadCapas
  vista: VistaArcada
  piezasEnTramo: ReadonlySet<string>
  enModoTramo: boolean
  /** Clave de la pieza que tiene el picker abierto ahora mismo, si hay uno. */
  piezaActiva?: string
  onSelectCara: (pieza: Pieza, posicion: FacePosition, anchor: DOMRect) => void
  onSelectDiente: (pieza: Pieza, anchor: DOMRect) => void
  onToggleEnTramo: (pieza: Pieza) => void
}

const COLUMNAS = 16

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
  piezasEnTramo,
  enModoTramo,
  piezaActiva,
  onSelectCara,
  onSelectDiente,
  onToggleEnTramo,
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

  return (
    <div key={vista} className="w-full flex flex-col gap-3 animate-in fade-in duration-300">
      {filas.map((fila, i) => (
        <React.Fragment key={i}>
          {renderFila(fila)}
          {i === divisorTrasFila && <div className="border-t border-dashed border-gray-300" />}
        </React.Fragment>
      ))}
    </div>
  )
}
