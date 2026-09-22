'use client'

import { HALLAZGOS } from '@/lib/odontograma/catalogo'
import { ROJO, AZUL, colorDe } from '@/lib/odontograma/caras'
import type { Capa } from '@/lib/odontograma/tipos'
import type { VisibilidadCapas } from '@/lib/odontograma/selectores'
import { FindingGlyph } from './FindingGlyph'
import { HelpCircle } from 'lucide-react'
import Tooltip from '@/components/shared/Tooltip'

interface LegendProps {
  visibilidad: VisibilidadCapas
  onToggle: (capa: Capa) => void
}

/**
 * Sub-header horizontal, debajo del header principal del odontograma — aprovecha el
 * ancho completo de la página en vez de una columna angosta al costado, así el
 * catálogo entra sin truncar nombres ("Remanente radicular" completo, no "Remanente
 * radic...") y `OdontogramaGrid` gana el ancho que antes le sacaba esta columna.
 * Ya no necesita altura propia ni scroll interno: al ser parte del flujo de la página,
 * el catálogo simplemente hace wrap a la siguiente línea si no entra.
 */
export function Legend({ visibilidad, onToggle }: LegendProps) {
  return (
    <div className="bg-gray-50/60 border-b border-gray-100 px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 select-none">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Capas</span>
        <div className="flex items-center gap-0.5 bg-gray-100/70 rounded p-0.5">
          {(['existente', 'requerida'] as Capa[]).map((capa) => (
            <button
              key={capa}
              onClick={() => onToggle(capa)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-all ${
                visibilidad[capa] ? 'bg-white shadow-sm text-gray-600' : 'text-gray-400'
              }`}
            >
              <span className={`shrink-0 w-1.5 h-1.5 rounded-sm ${colorDe(capa).fondo}`} />
              {capa === 'existente' ? 'Existente' : 'Requerida'}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden sm:block w-px h-3 bg-gray-200" />

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 flex-1 min-w-0">
        {HALLAZGOS.map((h) => {
          const color = h.capaPorDefecto === 'existente' ? ROJO : AZUL
          return (
            <div key={h.codigo} className="flex items-center gap-1 shrink-0" title={h.nombre}>
              <FindingGlyph
                grafismo={h.grafismo}
                abrev={h.abrev}
                colorRelleno={color.relleno}
                colorTrazo={color.trazo}
                size={12}
              />
              <span className="text-[11px] text-gray-500 whitespace-nowrap">{h.nombre}</span>
            </div>
          )
        })}
      </div>

      <Tooltip content="Clickeá una cara o pieza para cargar un hallazgo" side="left">
        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-teal-700 transition-colors shrink-0" />
      </Tooltip>
    </div>
  )
}
