'use client'

import type { Grafismo } from '@/lib/odontograma/catalogo'

interface FindingGlyphProps {
  grafismo: Grafismo
  abrev: string
  colorRelleno: string
  colorTrazo: string
  size?: number
}

/**
 * Ícono chico del hallazgo, para la leyenda y el picker. Reproduce el `grafismo` del
 * catálogo (`fill`, `cross`, `box`, `letter`, `screw`, `stump`, `equals`, `span`) con
 * las clases de color que ya resuelve `colorDe()` — nunca un hex suelto.
 */
export function FindingGlyph({ grafismo, abrev, colorRelleno, colorTrazo, size = 22 }: FindingGlyphProps) {
  const half = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {grafismo === 'fill' && (
        <rect x={2} y={2} width={size - 4} height={size - 4} rx={2} className={colorRelleno} opacity={0.75} />
      )}
      {grafismo === 'cross' && (
        <g className={colorTrazo} strokeWidth={2} strokeLinecap="round" opacity={0.85}>
          <line x1={4} y1={4} x2={size - 4} y2={size - 4} />
          <line x1={size - 4} y1={4} x2={4} y2={size - 4} />
        </g>
      )}
      {grafismo === 'box' && (
        <rect x={3} y={3} width={size - 6} height={size - 6} rx={2} fill="none" className={colorTrazo} strokeWidth={2} />
      )}
      {grafismo === 'letter' && (
        <text
          x={half}
          y={half + size * 0.16}
          textAnchor="middle"
          fontSize={size * 0.5}
          fontWeight={700}
          className={colorRelleno}
        >
          {abrev.slice(0, 1)}
        </text>
      )}
      {grafismo === 'screw' && (
        <g className={colorTrazo} strokeWidth={1.5} fill="none">
          <line x1={half} y1={4} x2={half} y2={size - 4} />
          {[-0.22, 0, 0.22].map((o) => (
            <line key={o} x1={half + o * size - size * 0.16} y1={6} x2={half + o * size + size * 0.16} y2={6} />
          ))}
          <path d={`M ${half - size * 0.1} 6 L ${half} ${size - 4} L ${half + size * 0.1} 6`} />
        </g>
      )}
      {grafismo === 'stump' && (
        <g className={colorTrazo} strokeWidth={1.5} fill="none" strokeLinecap="round">
          <line x1={4} y1={half} x2={size - 4} y2={half} />
          <line x1={6} y1={half - size * 0.18} x2={size - 6} y2={half - size * 0.18} />
          <line x1={6} y1={half + size * 0.18} x2={size - 6} y2={half + size * 0.18} />
        </g>
      )}
      {grafismo === 'equals' && (
        <g className={colorTrazo} strokeWidth={2.5} strokeLinecap="round">
          <line x1={4} y1={half - 3} x2={size - 4} y2={half - 3} />
          <line x1={4} y1={half + 3} x2={size - 4} y2={half + 3} />
        </g>
      )}
      {grafismo === 'span' && (
        <rect x={2} y={half - 3} width={size - 4} height={6} rx={1.5} className={colorRelleno} opacity={0.75} />
      )}
    </svg>
  )
}
