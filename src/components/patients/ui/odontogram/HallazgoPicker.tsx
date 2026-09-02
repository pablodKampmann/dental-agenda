'use client'

import { useEffect, useState } from 'react'
import type { Pieza } from '@/lib/odontograma/piezas'
import { hallazgosPorAlcance, type EntradaDelCatalogo } from '@/lib/odontograma/catalogo'
import { caraSemantica, colorDe, etiquetaCara } from '@/lib/odontograma/caras'
import type { Alcance, Capa, CodigoHallazgo, FacePosition } from '@/lib/odontograma/tipos'
import { Trash2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { FindingGlyph } from './FindingGlyph'
import { FloatingAnchor } from './FloatingAnchor'

export type PickerContexto =
  | { alcance: 'CARA'; pieza: Pieza; posicion: FacePosition; anchor: DOMRect }
  | { alcance: 'DIENTE'; pieza: Pieza; anchor: DOMRect }
  | { alcance: 'MULTI'; piezas: Pieza[]; anchor: DOMRect }

interface HallazgoPickerProps {
  contexto: PickerContexto | null
  hallazgoActual: Partial<Record<Capa, CodigoHallazgo>>
  onGuardar: (codigo: CodigoHallazgo, capa: Capa, nota: string) => void
  onQuitar: (capa: Capa) => void
  onClose: () => void
  /** Solo tiene sentido cuando `contexto.alcance === 'CARA'`: salta al picker de la pieza entera. */
  onVerPiezaCompleta: (pieza: Pieza, anchor: DOMRect) => void
  /** Presente solo si se llegó acá vía "Hallazgos de pieza completa": vuelve a la cara de origen. */
  onVolver?: () => void
}

/** El flujo es lineal: se elige la acción, se confirma, y recién ahí se ofrece la nota. */
type Paso = 'elegir' | 'confirmar' | 'nota'

/** Altura fija del cuerpo del pill: ningún paso cambia el tamaño del panel, solo su contenido. */
const ALTO_CUERPO = 320
/** Header: padding + una línea de texto. */
const ALTO_HEADER = 45
const ALTO_TOTAL = ALTO_HEADER + ALTO_CUERPO

function tituloDeContexto(contexto: PickerContexto): string {
  if (contexto.alcance === 'DIENTE') return `Pieza ${contexto.pieza.codigo} · completa`
  if (contexto.alcance === 'MULTI') return `Tramo de ${contexto.piezas.length} piezas`
  const cara = caraSemantica(contexto.posicion, contexto.pieza.cuadrante)
  const etiqueta = etiquetaCara(cara, contexto.pieza.arcada, contexto.pieza.tipo)
  return `Pieza ${contexto.pieza.codigo} · ${etiqueta}`
}

export function HallazgoPicker({ contexto, hallazgoActual, onGuardar, onQuitar, onClose, onVerPiezaCompleta, onVolver }: HallazgoPickerProps) {
  const [capa, setCapa] = useState<Capa>('existente')
  const [paso, setPaso] = useState<Paso>('elegir')
  const [seleccion, setSeleccion] = useState<EntradaDelCatalogo | null>(null)
  const [nota, setNota] = useState('')

  useEffect(() => {
    if (!contexto) return
    const capaConDatos = (['existente', 'requerida'] as Capa[]).find((c) => hallazgoActual[c])
    setCapa(capaConDatos ?? 'existente')
    setPaso('elegir')
    setSeleccion(null)
    setNota('')
  }, [contexto, hallazgoActual])

  if (!contexto) return null

  const opciones = hallazgosPorAlcance(contexto.alcance as Alcance)
  const codigoActual = hallazgoActual[capa]

  function handleConfirmar() {
    setPaso('nota')
  }

  function handleGuardarFinal() {
    if (!seleccion) return
    onGuardar(seleccion.codigo, capa, nota.trim())
  }

  return (
    <FloatingAnchor anchor={contexto.anchor} onClose={onClose} width={300} height={ALTO_TOTAL}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
        {/* Header: pieza/cara + capa. Misma estructura en los tres pasos, para que el alto nunca cambie. */}
        <div
          className={`flex items-center justify-between gap-2 px-3 py-2.5 border-b border-b-gray-100 border-t-2 ${
            capa === 'existente' ? 'border-t-red-600' : 'border-t-blue-600'
          }`}
        >
          <span className="text-xs font-semibold text-gray-700 truncate">{tituloDeContexto(contexto)}</span>
          <div className="flex items-center gap-0.5 bg-gray-50 rounded-md p-0.5 shrink-0">
            {(['existente', 'requerida'] as Capa[]).map((c) => (
              <button
                key={c}
                disabled={paso !== 'elegir'}
                onClick={() => setCapa(c)}
                className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
                  capa === c ? `bg-white shadow-sm ${colorDe(c).texto}` : 'text-gray-400'
                } ${paso !== 'elegir' ? 'cursor-default' : ''}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${colorDe(c).fondo}`} />
                {c === 'existente' ? 'Existente' : 'Requerida'}
              </button>
            ))}
          </div>
        </div>

        {/* Cuerpo de altura fija: el paso cambia el contenido, nunca el tamaño del panel. */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {/* Paso 1: elegir la acción */}
          {paso === 'elegir' && (
            <div className="flex flex-col flex-1 animate-in fade-in duration-150">
              <div className="py-1">
                {opciones.map((h) => {
                  const activo = codigoActual === h.codigo
                  return (
                    <button
                      key={h.codigo}
                      onClick={() => { setSeleccion(h); setPaso('confirmar') }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                        activo ? 'bg-teal-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <FindingGlyph
                        grafismo={h.grafismo}
                        abrev={h.abrev}
                        colorRelleno={colorDe(capa).relleno}
                        colorTrazo={colorDe(capa).trazo}
                        size={22}
                      />
                      <span className="text-sm text-gray-700 flex-1">{h.nombre}</span>
                      {activo && <span className={`text-[10px] font-semibold ${colorDe(capa).texto}`}>actual</span>}
                    </button>
                  )
                })}
              </div>

              <div className="mt-auto">
                {codigoActual && (
                  <button
                    onClick={() => onQuitar(capa)}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-2 border-t border-gray-100 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                  >
                    <Trash2 size={12} /> Quitar hallazgo
                  </button>
                )}

                {contexto.alcance === 'CARA' && (
                  <button
                    onClick={() => onVerPiezaCompleta(contexto.pieza, contexto.anchor)}
                    className="w-full flex items-center justify-between px-3 py-2 border-t border-gray-100 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-teal-700 transition"
                  >
                    Hallazgos de pieza completa
                    <ChevronRight size={13} />
                  </button>
                )}

                {onVolver && (
                  <button
                    onClick={onVolver}
                    className="w-full flex items-center gap-1.5 px-3 py-2 border-t border-gray-100 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-teal-700 transition"
                  >
                    <ChevronLeft size={13} /> Volver a la cara
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: confirmar lo elegido, rápido y sin vueltas */}
          {paso === 'confirmar' && seleccion && (
            <div className="flex-1 flex flex-col p-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 mb-3">
                <FindingGlyph
                  grafismo={seleccion.grafismo}
                  abrev={seleccion.abrev}
                  colorRelleno={colorDe(capa).relleno}
                  colorTrazo={colorDe(capa).trazo}
                  size={26}
                />
                <span className="text-sm font-semibold text-gray-800 flex-1">{seleccion.nombre}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaso('elegir')}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={14} /> Cambiar
                </button>
                <button
                  onClick={handleConfirmar}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-teal-700 text-white text-sm font-semibold py-2 rounded-lg hover:bg-teal-600 transition"
                >
                  <Check size={15} /> Confirmar
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: nota opcional, recién después de confirmar */}
          {paso === 'nota' && seleccion && (
            <div className="flex-1 flex flex-col p-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 shrink-0">
                <Check size={13} className="text-teal-600" />
                <span className="font-medium text-gray-700">{seleccion.nombre}</span> confirmado
              </div>
              <textarea
                autoFocus
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleGuardarFinal()
                  }
                }}
                placeholder="¿Algo para agregar? (opcional)"
                className="w-full flex-1 text-sm text-gray-800 border border-gray-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
              />
              <button
                onClick={handleGuardarFinal}
                className="w-full mt-2.5 bg-teal-700 text-white text-sm font-semibold py-2 rounded-lg hover:bg-teal-600 transition shrink-0"
              >
                Guardar
              </button>
            </div>
          )}
        </div>
      </div>
    </FloatingAnchor>
  )
}
