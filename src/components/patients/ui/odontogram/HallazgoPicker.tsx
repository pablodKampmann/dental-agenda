'use client'

import { useEffect, useRef, useState } from 'react'
import { ClipLoader } from 'react-spinners'
import type { Pieza } from '@/lib/odontograma/piezas'
import { hallazgosPorAlcance, hallazgoDe, type EntradaDelCatalogo } from '@/lib/odontograma/catalogo'
import { caraSemantica, colorDe, etiquetaCara } from '@/lib/odontograma/caras'
import type { Alcance, Capa, CodigoHallazgo, FacePosition } from '@/lib/odontograma/tipos'
import { Trash2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { FindingGlyph } from './FindingGlyph'
import { FloatingAnchor } from './FloatingAnchor'
import { ConfirmAlert } from '@/components/shared/dialogAlerts/confirmAlert'

export type PickerContexto =
  | { alcance: 'CARA'; pieza: Pieza; posicion: FacePosition; anchor: DOMRect }
  | { alcance: 'DIENTE'; pieza: Pieza; anchor: DOMRect }
  | { alcance: 'MULTI'; piezas: Pieza[]; anchor: DOMRect }

interface HallazgoPickerProps {
  contexto: PickerContexto | null
  hallazgoActual: Partial<Record<Capa, CodigoHallazgo>>
  onGuardar: (codigo: CodigoHallazgo, capa: Capa, nota: string) => void
  /** Destructivo — se dispara solo tras confirmar en el `ConfirmAlert` de este componente. */
  onQuitar: (capa: Capa) => Promise<void>
  /**
   * Cierra un plan: borra `requerida` y escribe `codigo` en `existente`, atómico.
   * Solo se ofrece cuando la capa activa es `requerida` y ya hay algo cargado ahí —
   * `codigo` puede ser distinto de lo planeado (una extracción requerida puede resolver
   * en `ausente`), por eso sigue pasando por el mismo paso "elegir" del picker.
   */
  onEjecutar: (codigo: CodigoHallazgo, nota: string) => void
  onClose: () => void
  /** Solo tiene sentido cuando `contexto.alcance === 'CARA'`: salta al picker de la pieza entera. */
  onVerPiezaCompleta: (pieza: Pieza, anchor: DOMRect) => void
  /** Presente solo si se llegó acá vía "Hallazgos de pieza completa": vuelve a la cara de origen. */
  onVolver?: () => void
  /**
   * El padre la prende antes de llamar a Firebase y la apaga (junto con el cierre del
   * panel) recién cuando la escritura resuelve — antes el panel se cerraba solo, sin
   * ningún estado intermedio visible. `Guardar`/`Quitar hallazgo` muestran `ClipLoader`
   * (mismo componente que ya usa `ModalCreatePatient`/`AddAppointmentForm`) y el resto
   * del cuerpo se bloquea para no permitir un segundo click mientras el primero vuela.
   */
  guardando: boolean
}

/** El flujo es lineal: se elige la acción, se confirma, y recién ahí se ofrece la nota. */
type Paso = 'elegir' | 'confirmar' | 'nota'

/** Header: padding + hasta dos líneas de texto (el título puede saltar de línea, ej. "Vestibular"). */
const ALTO_HEADER = 58
/** Alto de una fila de opción o de un botón de footer — mismos paddings en los dos. */
const ALTO_FILA = 34
/** Piso y techo del cuerpo: nunca tan chico que se vea aplastado, nunca más que el viejo fijo. */
const ALTO_CUERPO_MIN = 140
const ALTO_CUERPO_MAX = 320
/** Los pasos "confirmar" y "nota" no varían por pieza — su contenido es siempre el mismo layout. */
const ALTO_CONFIRMAR_BASE = 150
const ALTO_CONFIRMAR_CON_CHECKBOX = 194
const ALTO_NOTA = 210

/**
 * Alto del cuerpo por paso, calculado de antemano a partir de datos ya conocidos
 * antes de pintar (cantidad de opciones, si hay botones de footer) — nunca midiendo
 * el DOM después del render. Es la misma razón por la que `FloatingAnchor` nunca mide:
 * medir después de pintar causa un "teletransporte" visible de un frame.
 */
function altoCuerpo(paso: Paso, opciones: number, footers: number, puedeEjecutar: boolean): number {
  if (paso === 'confirmar') return puedeEjecutar ? ALTO_CONFIRMAR_CON_CHECKBOX : ALTO_CONFIRMAR_BASE
  if (paso === 'nota') return ALTO_NOTA
  return Math.min(Math.max(altoNaturalElegir(opciones, footers), ALTO_CUERPO_MIN), ALTO_CUERPO_MAX)
}

/** Alto que el contenido de "elegir" ocupa de verdad, sin clampear — para saber si el techo lo recorta. */
function altoNaturalElegir(opciones: number, footers: number): number {
  return 8 + opciones * ALTO_FILA + footers * ALTO_FILA
}

/**
 * Solo "elegir" con muchas opciones puede llegar a necesitar scroll (cuando el contenido
 * natural supera `ALTO_CUERPO_MAX`); "confirmar" y "nota" están diseñados para entrar
 * siempre en su alto fijo. Calcularlo así (en vez de dejar `overflow-y-auto` siempre
 * puesto) evita que el navegador dibuje el scrollbar a mitad de la transición de alto,
 * cuando el contenido ya renderizado momentáneamente no entra en el alto todavía en
 * camino hacia su valor final — la barra aparecía y desaparecía sola con cada paso.
 */
function necesitaScroll(paso: Paso, opciones: number, footers: number): boolean {
  return paso === 'elegir' && altoNaturalElegir(opciones, footers) > ALTO_CUERPO_MAX
}

function tituloDeContexto(contexto: PickerContexto): string {
  if (contexto.alcance === 'DIENTE') return `Pieza ${contexto.pieza.codigo} · completa`
  if (contexto.alcance === 'MULTI') return `Tramo de ${contexto.piezas.length} piezas`
  const cara = caraSemantica(contexto.posicion, contexto.pieza.cuadrante)
  const etiqueta = etiquetaCara(cara, contexto.pieza.arcada, contexto.pieza.tipo)
  return `Pieza ${contexto.pieza.codigo} · ${etiqueta}`
}

export function HallazgoPicker({ contexto, hallazgoActual, onGuardar, onQuitar, onEjecutar, onClose, onVerPiezaCompleta, onVolver, guardando }: HallazgoPickerProps) {
  const [capa, setCapa] = useState<Capa>('existente')
  const [paso, setPaso] = useState<Paso>('elegir')
  const [seleccion, setSeleccion] = useState<EntradaDelCatalogo | null>(null)
  const [nota, setNota] = useState('')
  const [marcarComoRealizado, setMarcarComoRealizado] = useState(false)
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false)
  /** Identifica la pieza del contexto anterior — navegar cara↔pieza completa de la misma
      pieza no debe resetear la capa elegida, solo abrir un picker distinto de verdad. */
  const piezaAnteriorRef = useRef<string | null>(null)
  /**
   * `hallazgoActual` cambia por el update optimista apenas se guarda (antes de que
   * Firebase confirme), con el mismo `contexto` todavía abierto — si el efecto de abajo
   * dependiera de `hallazgoActual` directamente, ese cambio lo dispararía de nuevo y el
   * panel volvería a "elegir" un instante antes de cerrarse. Guardado en un ref para
   * leerlo sin que dispare el efecto — el efecto solo debe correr cuando `contexto`
   * cambia de verdad (una pieza/cara distinta), nunca por los propios datos que el picker
   * termina de escribir.
   */
  const hallazgoActualRef = useRef(hallazgoActual)
  hallazgoActualRef.current = hallazgoActual

  useEffect(() => {
    if (!contexto) return
    const piezaClave = contexto.alcance === 'MULTI' ? null : contexto.pieza.clave
    const esMismaPieza = piezaClave !== null && piezaClave === piezaAnteriorRef.current
    piezaAnteriorRef.current = piezaClave
    if (!esMismaPieza) {
      const capaConDatos = (['existente', 'requerida'] as Capa[]).find((c) => hallazgoActualRef.current[c])
      setCapa(capaConDatos ?? 'existente')
    }
    setPaso('elegir')
    setSeleccion(null)
    setNota('')
    setMarcarComoRealizado(false)
    setConfirmandoQuitar(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contexto])

  if (!contexto) return null

  const opciones = hallazgosPorAlcance(contexto.alcance as Alcance)
  const codigoActual = hallazgoActual[capa]
  /** Solo tiene sentido "ejecutar" un plan que ya existe — nunca al elegir la capa Existente. */
  const puedeEjecutar = capa === 'requerida' && !!codigoActual
  const footers = (codigoActual ? 1 : 0) + (contexto.alcance === 'CARA' ? 1 : 0) + (onVolver ? 1 : 0)
  const altoTotal = ALTO_HEADER + altoCuerpo(paso, opciones.length, footers, puedeEjecutar)
  const conScroll = necesitaScroll(paso, opciones.length, footers)
  /**
   * Arriba/abajo se decide una sola vez con el alto más grande que el picker puede llegar
   * a pedir en esta apertura (no el del paso actual) — si no, un paso más chico "cabe
   * abajo" cuando el más grande no cabía y el panel salta de lugar entre pasos.
   */
  const altoMaximoPosible = Math.max(
    ALTO_HEADER + altoCuerpo('elegir', opciones.length, footers, puedeEjecutar),
    ALTO_HEADER + ALTO_CONFIRMAR_CON_CHECKBOX,
    ALTO_HEADER + ALTO_NOTA,
  )

  function handleConfirmar() {
    setPaso('nota')
  }

  function handleGuardarFinal() {
    if (!seleccion) return
    if (marcarComoRealizado) onEjecutar(seleccion.codigo, nota.trim())
    else onGuardar(seleccion.codigo, capa, nota.trim())
  }

  return (
    <>
    <FloatingAnchor anchor={contexto.anchor} onClose={onClose} width={300} height={altoTotal} alturaReferencia={altoMaximoPosible} pausado={confirmandoQuitar}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
        {/* Header: pieza/cara + capa. Misma estructura en los tres pasos, para que el alto nunca cambie. */}
        <div
          className={`flex items-center justify-between gap-2 px-3 py-2.5 border-b border-b-gray-100 border-t-2 ${
            capa === 'existente' ? 'border-t-red-600' : 'border-t-blue-600'
          }`}
        >
          <span className="text-xs font-semibold text-gray-700 leading-tight">{tituloDeContexto(contexto)}</span>
          <div className="flex items-center gap-0.5 bg-gray-50 rounded-md p-0.5 shrink-0">
            {(['existente', 'requerida'] as Capa[]).map((c) => (
              <button
                key={c}
                onClick={() => setCapa(c)}
                className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
                  capa === c ? `bg-white shadow-sm ${colorDe(c).texto}` : 'text-gray-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${colorDe(c).fondo}`} />
                {c === 'existente' ? 'Existente' : 'Requerida'}
              </button>
            ))}
          </div>
        </div>

        {/* El alto del cuerpo lo decide `altoCuerpo()` de antemano por paso — el panel
            se ajusta a su contenido en vez de quedar con el viejo alto fijo de 320px
            siempre. `FloatingAnchor` anima la transición de alto/posición.
            Bloqueado mientras `guardando` — evita un segundo click mientras el primero
            todavía está en vuelo (el panel ahora sigue abierto hasta que resuelve). */}
        <div className={`flex-1 min-h-0 flex flex-col ${conScroll ? 'overflow-y-auto' : 'overflow-hidden'} ${guardando ? 'opacity-60 pointer-events-none' : ''}`}>
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
                      title={activo ? `${h.nombre} (actual)` : h.nombre}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition ${
                        activo ? 'bg-teal-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <FindingGlyph
                        grafismo={h.grafismo}
                        abrev={h.abrev}
                        colorRelleno={colorDe(capa).relleno}
                        colorTrazo={colorDe(capa).trazo}
                        size={18}
                      />
                      <span className="text-sm text-gray-700 flex-1 truncate">{h.nombre}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-auto">
                {codigoActual && (
                  <button
                    onClick={() => setConfirmandoQuitar(true)}
                    disabled={guardando}
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
              {puedeEjecutar && (
                <label className="flex items-start gap-2 mb-3 px-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marcarComoRealizado}
                    onChange={(e) => setMarcarComoRealizado(e.target.checked)}
                    className="mt-0.5 accent-teal-700"
                  />
                  <span className="text-xs text-gray-600">
                    Marcar la planificación como realizada — pasa de <b>Requerida</b> a <b>Existente</b>
                  </span>
                </label>
              )}
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
                disabled={guardando}
                className="w-full mt-2.5 bg-teal-700 text-white text-sm font-semibold py-2 rounded-lg hover:bg-teal-600 transition shrink-0 flex items-center justify-center min-h-[36px]"
              >
                {guardando ? <ClipLoader color="white" size={16} /> : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </FloatingAnchor>

    {/* `ConfirmAlert` trae su propio loading (`ClipLoader`) — le alcanza con recibir la
        promesa de `onQuitar` para mostrar el spinner y cerrarse sola al resolver. */}
    <ConfirmAlert
      open={confirmandoQuitar}
      setOpen={setConfirmandoQuitar}
      title="¿Quitar este hallazgo?"
      description={codigoActual ? `Se va a borrar "${hallazgoDe(codigoActual).nombre}" de ${tituloDeContexto(contexto)}. Esta acción no se puede deshacer.` : 'Esta acción no se puede deshacer.'}
      onConfirm={() => onQuitar(capa)}
    />
    </>
  )
}
