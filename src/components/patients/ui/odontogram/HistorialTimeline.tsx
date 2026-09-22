'use client'

import { useState, type KeyboardEvent } from 'react'
import type { FocusEvent } from 'react'
import { ClipLoader } from 'react-spinners'
import { colorDe } from '@/lib/odontograma/caras'
import { type EntradaHistorial } from '@/lib/odontograma/historial'
import { FaTooth } from 'react-icons/fa'
import { BiSolidNote } from 'react-icons/bi'
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2'
import { Pencil, Trash2 } from 'lucide-react'
import { ConfirmAlert } from '@/components/shared/dialogAlerts/confirmAlert'

export type { EntradaHistorial }

interface HistorialTimelineProps {
  entradas: EntradaHistorial[]
  onAgregarNota: (texto: string) => Promise<void>
  onEditarTexto: (id: string, texto: string) => Promise<void>
  onEliminar: (id: string) => Promise<void>
}

/**
 * Mismo patrón que `ModalCreatePatient`/`AddAppointmentForm`: `ClipLoader` +
 * `disabled` mientras la promesa está en vuelo, nunca un botón mudo entre el click y
 * el toast. `ConfirmAlert` ya trae este mismo patrón resuelto adentro — ver el
 * `onConfirm` de más abajo, que le devuelve la promesa en vez de cerrar a mano.
 */
export function HistorialTimeline({ entradas, onAgregarNota, onEditarTexto, onEliminar }: HistorialTimelineProps) {
  const [nota, setNota] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [idEditando, setIdEditando] = useState<string | null>(null)
  const [textoEditando, setTextoEditando] = useState('')
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null)

  async function handleAgregar() {
    const texto = nota.trim()
    if (!texto || guardandoNota) return
    setGuardandoNota(true)
    try {
      await onAgregarNota(texto)
      setNota('')
    } finally {
      setGuardandoNota(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAgregar()
    }
  }

  function abrirEdicion(entrada: EntradaHistorial) {
    setIdEditando(entrada.id)
    setTextoEditando(entrada.texto)
  }

  async function guardarEdicion() {
    if (!idEditando) return
    setGuardandoEdicion(true)
    try {
      await onEditarTexto(idEditando, textoEditando.trim())
      setIdEditando(null)
    } finally {
      setGuardandoEdicion(false)
    }
  }

  const entradaAEliminar = entradas.find((e) => e.id === idAEliminar) ?? null
  const entradaEditando = entradas.find((e) => e.id === idEditando) ?? null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-4">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 select-none">
        <h2 className="text-base font-bold tracking-wide text-black flex items-center gap-2">
          <HiOutlineClipboardDocumentList className="text-teal-600" size={18} /> Historia Clínica
        </h2>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={guardandoNota}
          placeholder="Agregar una nota a la historia clínica, sin necesidad de tocar el odontograma…"
          rows={2}
          className="w-full text-sm text-gray-800 border border-gray-300 rounded-lg px-3 py-2 resize-none bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 disabled:opacity-60"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAgregar}
            disabled={!nota.trim() || guardandoNota}
            className="bg-teal-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-teal-600 transition disabled:opacity-40 disabled:cursor-not-allowed min-w-[112px] flex items-center justify-center"
          >
            {guardandoNota ? <ClipLoader color="white" size={16} /> : 'Agregar nota'}
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {entradas.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-8">Sin entradas todavía</p>
        ) : (
          entradas.map((entrada) => (
            <div
              key={entrada.id}
              className={`group pl-3 pr-4 py-3 flex gap-3 border-l-2 ${entrada.hallazgo ? colorDe(entrada.hallazgo.capa).borde : 'border-transparent'}`}
            >
              <div className="flex flex-col items-center pt-0.5">
                {entrada.hallazgo ? (
                  <FaTooth className={colorDe(entrada.hallazgo.capa).texto} size={15} />
                ) : (
                  <BiSolidNote className="text-gray-400" size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">{entrada.fecha} · {entrada.hora}</span>
                  {entrada.hallazgo && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border bg-white ${colorDe(entrada.hallazgo.capa).borde} ${colorDe(entrada.hallazgo.capa).texto}`}
                    >
                      Pieza {entrada.hallazgo.piezaCodigo} · {entrada.hallazgo.detalle}
                    </span>
                  )}
                </div>
                {entrada.hallazgo && (
                  <p className="text-sm font-semibold text-gray-800 mt-1">{entrada.hallazgo.nombreHallazgo}</p>
                )}
                {entrada.texto && <p className="text-sm text-gray-600 mt-1">{entrada.texto}</p>}
              </div>
              {/* Editar/eliminar solo aplica a notas libres: un hallazgo sale del log
                  append-only del odontograma, no se corrige acá — se corrige cargando
                  un nuevo hallazgo, que deja su propio asiento. */}
              {!entrada.hallazgo && (
                <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => abrirEdicion(entrada)}
                    title="Editar nota"
                    className="p-1.5 rounded-md text-gray-400 hover:text-teal-700 hover:bg-gray-100 transition"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setIdAEliminar(entrada.id)}
                    title="Eliminar entrada"
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Editar nota: mismo lenguaje visual que ConfirmAlert */}
      {idEditando && entradaEditando && (
        <>
          <div
            className="fixed inset-0 z-[60] backdrop-blur-sm bg-black/50 animate-fade-in"
            onClick={() => { if (!guardandoEdicion) setIdEditando(null) }}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90%] sm:w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl text-black animate-fade-in">
            <div className="px-6 pt-5 pb-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Editar nota</h2>
              <p className="text-xs text-gray-400 mt-0.5">{entradaEditando.fecha} · {entradaEditando.hora}</p>
            </div>
            <div className="p-6">
            <textarea
              autoFocus
              value={textoEditando}
              onChange={(e) => setTextoEditando(e.target.value)}
              onFocus={(e: FocusEvent<HTMLTextAreaElement>) => {
                const len = e.target.value.length
                e.target.setSelectionRange(len, len)
              }}
              disabled={guardandoEdicion}
              rows={4}
              className="w-full text-sm text-gray-800 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 disabled:opacity-60"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIdEditando(null)}
                disabled={guardandoEdicion}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-medium hover:bg-gray-50 transition duration-150 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={guardandoEdicion}
                className="px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-medium hover:bg-teal-600 transition duration-150 min-w-[92px] flex items-center justify-center disabled:opacity-60"
              >
                {guardandoEdicion ? <ClipLoader color="white" size={16} /> : 'Guardar'}
              </button>
            </div>
            </div>
          </div>
        </>
      )}

      {/* `ConfirmAlert` ya trae su propio loading (`ClipLoader` en el botón rojo) — alcanza
          con devolverle la promesa en `onConfirm` en vez de cerrar el diálogo a mano; el
          propio componente cierra recién cuando `onEliminar` resuelve. */}
      <ConfirmAlert
        open={!!entradaAEliminar}
        setOpen={(open) => !open && setIdAEliminar(null)}
        title="¿Eliminar esta nota?"
        description={entradaAEliminar ? `Nota del ${entradaAEliminar.fecha} · ${entradaAEliminar.hora}. Esta acción no se puede deshacer.` : 'Esta acción no se puede deshacer.'}
        onConfirm={() => (idAEliminar ? onEliminar(idAEliminar) : undefined)}
      />
    </div>
  )
}
