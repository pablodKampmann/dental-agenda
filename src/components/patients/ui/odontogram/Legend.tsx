'use client'

import { HALLAZGOS } from '@/lib/odontograma/catalogo'
import { ROJO, AZUL, colorDe } from '@/lib/odontograma/caras'
import type { Capa } from '@/lib/odontograma/tipos'
import type { VisibilidadCapas } from '@/lib/odontograma/selectores'
import { FindingGlyph } from './FindingGlyph'
import { HelpCircle } from 'lucide-react'

interface LegendProps {
  visibilidad: VisibilidadCapas
  onToggle: (capa: Capa) => void
}

export function Legend({ visibilidad, onToggle }: LegendProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden select-none h-full flex flex-col">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Capas visibles</span>
        <div className="grid grid-cols-2 gap-0.5 bg-gray-100 rounded-md p-0.5">
          {(['existente', 'requerida'] as Capa[]).map((capa) => (
            <button
              key={capa}
              onClick={() => onToggle(capa)}
              className={`flex items-center justify-center gap-1 min-w-0 px-1.5 py-1 rounded text-[11px] font-medium transition-all ${
                visibilidad[capa] ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400'
              }`}
            >
              <span className={`shrink-0 w-2 h-2 rounded-sm ${colorDe(capa).fondo}`} />
              <span className="truncate">{capa === 'existente' ? 'Existente' : 'Requerida'}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-2.5 space-y-1.5 flex-1 overflow-y-auto">
        {HALLAZGOS.map((h) => {
          const color = h.capaPorDefecto === 'existente' ? ROJO : AZUL
          return (
            <div key={h.codigo} className="flex items-center gap-2">
              <FindingGlyph
                grafismo={h.grafismo}
                abrev={h.abrev}
                colorRelleno={color.relleno}
                colorTrazo={color.trazo}
                size={18}
              />
              <span className="text-xs text-gray-600 font-medium flex-1 min-w-0 truncate" title={h.nombre}>{h.nombre}</span>
              <span className="text-[10px] text-gray-400 font-mono shrink-0">{h.abrev}</span>
            </div>
          )
        })}
      </div>
      <div className="px-2.5 py-2 border-t border-gray-100 flex items-start gap-1.5 text-[10px] leading-relaxed text-gray-500">
        <HelpCircle className="w-3 h-3 mt-0.5 shrink-0" />
        Clickeá una cara o pieza para cargar un hallazgo
      </div>
    </div>
  )
}
