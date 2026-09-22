'use client'

import { memo, useRef } from 'react'
import type { Pieza } from '@/lib/odontograma/piezas'
import {
  CAPAS,
  type Capa,
  type CodigoHallazgoCara,
  type CodigoHallazgoDiente,
  type DientesPorClave,
  type FacePosition,
} from '@/lib/odontograma/tipos'
import { caraSemantica, colorDe, etiquetaCara } from '@/lib/odontograma/caras'
import { hallazgoDe } from '@/lib/odontograma/catalogo'
import {
  capasVisibles,
  hallazgoDeCara,
  hallazgoDeDiente,
  type VisibilidadCapas,
} from '@/lib/odontograma/selectores'
import { FindingGlyph } from './FindingGlyph'

/** Confirma con Enter o Espacio, igual que un click — Espacio se frena para que no scrollee la página. */
function activarConTeclado(e: React.KeyboardEvent, accion: () => void) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  e.stopPropagation()
  accion()
}

/** "caries existente", "endodoncia requerida y corona existente" — nunca el código crudo. */
function textoDeHallazgos(porCapa: Partial<Record<Capa, CodigoHallazgoCara | CodigoHallazgoDiente>>): string {
  return CAPAS.filter((capa) => porCapa[capa])
    .map((capa) => `${hallazgoDe(porCapa[capa]!).nombre.toLowerCase()} ${capa}`)
    .join(' y ')
}

/** Nombre accesible de una cara: pieza + cara clínica + qué hay cargado ahí, si hay algo. */
function etiquetaDeCara(pieza: Pieza, posicion: FacePosition, estado: DientesPorClave): string {
  const cara = caraSemantica(posicion, pieza.cuadrante)
  const etiqueta = etiquetaCara(cara, pieza.arcada, pieza.tipo)
  const porCapa: Partial<Record<Capa, CodigoHallazgoCara>> = {}
  for (const capa of CAPAS) {
    const codigo = hallazgoDeCara(estado, pieza.clave, posicion, capa)
    if (codigo) porCapa[capa] = codigo
  }
  const detalle = textoDeHallazgos(porCapa)
  return detalle ? `Pieza ${pieza.codigo}, ${etiqueta}: ${detalle}` : `Pieza ${pieza.codigo}, ${etiqueta}`
}

/** Nombre accesible de la pieza completa: igual criterio que `etiquetaDeCara`, a nivel diente. */
function etiquetaDePieza(pieza: Pieza, estado: DientesPorClave): string {
  const porCapa: Partial<Record<Capa, CodigoHallazgoDiente>> = {}
  for (const capa of CAPAS) {
    const codigo = hallazgoDeDiente(estado, pieza.clave, capa)
    if (codigo) porCapa[capa] = codigo
  }
  const detalle = textoDeHallazgos(porCapa)
  return detalle ? `Pieza ${pieza.codigo}, pieza completa: ${detalle}` : `Pieza ${pieza.codigo}, pieza completa`
}

const FOCUS_VISIBLE =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 focus-visible:outline-offset-1'

interface ToothProps {
  pieza: Pieza
  estado: DientesPorClave
  visibilidad: VisibilidadCapas
  seleccionado: boolean
  enModoTramo: boolean
  /** El diente que tiene el picker abierto: escapa del backdrop oscuro para quedar claro cuál se edita. */
  activo: boolean
  onSelectCara: (pieza: Pieza, posicion: FacePosition, anchor: DOMRect) => void
  onSelectDiente: (pieza: Pieza, anchor: DOMRect) => void
  onToggleEnTramo: (pieza: Pieza) => void
}

const FACES: readonly FacePosition[] = ['top', 'right', 'bottom', 'left', 'center']

/**
 * Hallazgos de pieza completa que dejan sin sentido clínico a las caras: no hay
 * superficie natural visible (ausente, extraída, retenida/impactada) o no queda corona
 * (remanente). Mientras uno de estos esté activo, las caras se ocultan de la vista
 * — nunca se borran — y reaparecen solas si se quita el hallazgo. Corona, implante y
 * endodoncia no entran acá: conviven con hallazgos de cara sin problema.
 */
const OCULTA_CARAS: ReadonlySet<CodigoHallazgoDiente> = new Set(['ausente', 'extraccion', 'retenida', 'remanente'])

/** Coordenadas fijas del viewBox: el SVG escala por CSS, la geometría no depende del tamaño en pantalla. */
const VB = 40
const INNER = VB * 0.4
const IM = (VB - INNER) / 2
const IS = VB - IM

const PATHS: Record<FacePosition, string> = {
  top: `M 0 0 L ${VB} 0 L ${IS} ${IM} L ${IM} ${IM} Z`,
  right: `M ${VB} 0 L ${VB} ${VB} L ${IS} ${IS} L ${IS} ${IM} Z`,
  bottom: `M ${VB} ${VB} L 0 ${VB} L ${IM} ${IS} L ${IS} ${IS} Z`,
  left: `M 0 ${VB} L 0 0 L ${IM} ${IM} L ${IM} ${IS} Z`,
  center: `M ${IM} ${IM} L ${IS} ${IM} L ${IS} ${IS} L ${IM} ${IS} Z`,
}

function ToothImpl({
  pieza,
  estado,
  visibilidad,
  seleccionado,
  enModoTramo,
  activo,
  onSelectCara,
  onSelectDiente,
  onToggleEnTramo,
}: ToothProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  /** El rect del diente entero (cuadrado + número), no del elemento puntual clickeado: así el picker que se ancla acá siempre deja ver la pieza completa. */
  const anchorDelDiente = () => wrapperRef.current!.getBoundingClientRect()

  const capasDiente = capasVisibles(estado, pieza.clave, visibilidad)
  const codigoDiente = capasDiente
    .map((capa) => hallazgoDeDiente(estado, pieza.clave, capa))
    .find((codigo): codigo is NonNullable<typeof codigo> => codigo !== undefined)
  const capaDelCodigoDiente = capasDiente.find(
    (capa) => hallazgoDeDiente(estado, pieza.clave, capa) === codigoDiente
  )
  const ocultaCaras = codigoDiente !== undefined && OCULTA_CARAS.has(codigoDiente)

  function handleClick(e: React.MouseEvent<SVGPathElement>, posicion: FacePosition) {
    e.stopPropagation()
    onSelectCara(pieza, posicion, anchorDelDiente())
  }

  return (
    <div
      ref={wrapperRef}
      className={`flex flex-col items-center w-full ${activo ? 'relative z-[45]' : ''}`}
    >
      <div className="relative w-full aspect-square">
        <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-full overflow-visible cursor-pointer">
          {!ocultaCaras &&
            FACES.map((posicion) => {
              const capas = capasVisibles(estado, pieza.clave, visibilidad).filter((capa) =>
                hallazgoDeCara(estado, pieza.clave, posicion, capa)
              )
              return (
                <g key={`fill-${posicion}`} style={{ pointerEvents: 'none' }}>
                  {capas.map((capa) => (
                    <path key={capa} d={PATHS[posicion]} className={colorDe(capa).relleno} opacity={0.75} />
                  ))}
                </g>
              )
            })}

          <rect x={0} y={0} width={VB} height={VB} fill="none" stroke="#94a3b8" strokeWidth={1} rx={2} style={{ pointerEvents: 'none' }} />
          {/* Detalle de caras: sin sentido una vez que un hallazgo de pieza completa cubre todo el diente. */}
          <g opacity={codigoDiente ? 0.25 : 1} style={{ pointerEvents: 'none' }}>
            <line x1={0} y1={0} x2={IM} y2={IM} stroke="#cbd5e1" strokeWidth={0.7} />
            <line x1={VB} y1={0} x2={IS} y2={IM} stroke="#cbd5e1" strokeWidth={0.7} />
            <line x1={VB} y1={VB} x2={IS} y2={IS} stroke="#cbd5e1" strokeWidth={0.7} />
            <line x1={0} y1={VB} x2={IM} y2={IS} stroke="#cbd5e1" strokeWidth={0.7} />
            <rect x={IM} y={IM} width={IS - IM} height={IS - IM} fill="none" stroke="#cbd5e1" strokeWidth={0.7} />
          </g>

          {!enModoTramo && !codigoDiente &&
            FACES.map((posicion) => (
              <path
                key={`hit-${posicion}`}
                d={PATHS[posicion]}
                fill="transparent"
                className={`hover:fill-teal-600/10 transition-colors ${FOCUS_VISIBLE}`}
                style={{ cursor: 'pointer' }}
                tabIndex={0}
                role="button"
                aria-label={etiquetaDeCara(pieza, posicion, estado)}
                onClick={(e) => handleClick(e, posicion)}
                onKeyDown={(e) => activarConTeclado(e, () => onSelectCara(pieza, posicion, anchorDelDiente()))}
              />
            ))}

          {/* Hallazgo de pieza completa: grafismo del catálogo a tamaño real, no un badge chico */}
          {codigoDiente && capaDelCodigoDiente && (
            <g style={{ pointerEvents: 'none' }}>
              <FindingGlyph
                grafismo={hallazgoDe(codigoDiente).grafismo}
                abrev={hallazgoDe(codigoDiente).abrev}
                colorRelleno={colorDe(capaDelCodigoDiente).relleno}
                colorTrazo={colorDe(capaDelCodigoDiente).trazo}
                size={VB}
              />
            </g>
          )}

          {!enModoTramo && codigoDiente && (
            <rect
              x={0}
              y={0}
              width={VB}
              height={VB}
              fill="transparent"
              className={`cursor-pointer hover:fill-teal-600/10 transition-colors ${FOCUS_VISIBLE}`}
              tabIndex={0}
              role="button"
              aria-label={etiquetaDePieza(pieza, estado)}
              onClick={(e) => {
                e.stopPropagation()
                onSelectDiente(pieza, anchorDelDiente())
              }}
              onKeyDown={(e) => activarConTeclado(e, () => onSelectDiente(pieza, anchorDelDiente()))}
            />
          )}

          {enModoTramo && (
            <rect
              x={0}
              y={0}
              width={VB}
              height={VB}
              fill="transparent"
              className={`cursor-pointer ${FOCUS_VISIBLE}`}
              tabIndex={0}
              role="button"
              aria-pressed={seleccionado}
              aria-label={`Pieza ${pieza.codigo}, tramo`}
              onClick={(e) => {
                e.stopPropagation()
                onToggleEnTramo(pieza)
              }}
              onKeyDown={(e) => activarConTeclado(e, () => onToggleEnTramo(pieza))}
            />
          )}

          {seleccionado && (
            <rect x={0} y={0} width={VB} height={VB} fill="none" stroke="#0d9488" strokeWidth={2} rx={2} style={{ pointerEvents: 'none' }} />
          )}
        </svg>
      </div>
      <span
        className="text-[10px] font-medium select-none mt-0.5"
        style={{ color: codigoDiente ? '#0f766e' : '#6b7280' }}
      >
        {pieza.codigo}
      </span>
    </div>
  )
}

export const Tooth = memo(ToothImpl)
