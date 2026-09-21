'use client'

import type { Pieza } from '@/lib/odontograma/piezas'
import type { Capa, CodigoHallazgoMulti } from '@/lib/odontograma/tipos'
import { colorDe } from '@/lib/odontograma/caras'
import { hallazgoDe } from '@/lib/odontograma/catalogo'

interface VinculoSpanProps {
  /** Ya ordenadas por `ordenVisual` (`vinculosDeFila`), nunca por el orden de selección ni de Firebase. */
  piezas: readonly Pieza[]
  tipo: CodigoHallazgoMulti
  capa: Capa
  /** Clickear el propio grafismo borra el vínculo. Sin diálogo de confirmación. */
  onClick: () => void
}

const COLUMNAS = 16

/**
 * El grafismo `span`: la barra que abarca el tramo de una prótesis multi-pieza. Vive en
 * su propio carril sobre el arco —nunca adentro de un diente— y comparte la misma grilla
 * de 16 columnas y el mismo `gap` que `OdontogramaGrid`: misma cantidad de columnas y
 * mismo `gap` producen los mismos bordes de columna, así que la barra queda alineada con
 * los dientes reales sin medir un solo píxel.
 */
export function VinculoSpan({ piezas, tipo, capa, onClick }: VinculoSpanProps) {
  const primera = piezas[0]
  const ultima = piezas[piezas.length - 1]
  const color = colorDe(capa)
  const esFija = tipo === 'protesis_fija'
  const abrev = hallazgoDe(tipo).abrev
  const nombre = hallazgoDe(tipo).nombre

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLUMNAS}, minmax(0, 1fr))` }}>
      <button
        type="button"
        onClick={onClick}
        title={`Quitar ${nombre.toLowerCase()}`}
        aria-label={`Quitar ${nombre.toLowerCase()} de las piezas ${primera.codigo} a ${ultima.codigo}`}
        style={{ gridColumnStart: primera.columna, gridColumnEnd: ultima.columna + 1 }}
        className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-60 transition-opacity"
      >
        <span className={`text-[9px] font-bold leading-none ${color.texto}`}>{abrev}</span>
        <span
          className={
            esFija
              ? `h-1.5 w-full rounded-full ${color.fondo} opacity-80`
              : `h-1.5 w-full rounded-full border-2 border-dashed bg-white ${color.borde}`
          }
        />
      </button>
    </div>
  )
}
