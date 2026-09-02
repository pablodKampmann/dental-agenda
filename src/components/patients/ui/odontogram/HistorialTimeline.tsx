'use client'

import { useState, type KeyboardEvent } from 'react'
import type { FocusEvent } from 'react'
import { colorDe } from '@/lib/odontograma/caras'
import type { Capa } from '@/lib/odontograma/tipos'
import { FaTooth } from 'react-icons/fa'
import { BiSolidNote } from 'react-icons/bi'
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2'
import { Pencil, Trash2 } from 'lucide-react'
import { ConfirmAlert } from '@/components/shared/dialogAlerts/confirmAlert'

export interface EntradaHistorial {
  id: string
  fecha: string
  hora: string
  texto: string
  hallazgo?: {
    piezaCodigo: number
    detalle: string
    nombreHallazgo: string
    capa: Capa
  }
}

interface HistorialTimelineProps {
  entradas: EntradaHistorial[]
  onAgregarNota: (texto: string) => void
  onEditarTexto: (id: string, texto: string) => void
  onEliminar: (id: string) => void
}

export function HistorialTimeline({ entradas, onAgregarNota, onEditarTexto, onEliminar }: HistorialTimelineProps) {
  const [nota, setNota] = useState('')
  const [idEditando, setIdEditando] = useState<string | null>(null)
  const [textoEditando, setTextoEditando] = useState('')
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null)

  function handleAgregar() {
    const texto = nota.trim()
    if (!texto) return
    onAgregarNota(texto)
    setNota('')
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

  function guardarEdicion() {
    if (!idEditando) return
    onEditarTexto(idEditando, textoEditando.trim())
    setIdEditando(null)
  }

  const entradaAEliminar = entradas.find((e) => e.id === idAEliminar) ?? null

  return (
    <div className="border-2 border-gray-300 rounded-xl overflow-hidden mt-4">
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
          placeholder="Agregar una nota a la historia clínica, sin necesidad de tocar el odontograma…"
          rows={2}
          className="w-full text-sm text-gray-800 border border-gray-300 rounded-lg px-3 py-2 resize-none bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAgregar}
            disabled={!nota.trim()}
            className="bg-teal-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-teal-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Agregar nota
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {entradas.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-8">Sin entradas todavía</p>
        ) : (
          entradas.map((entrada) => (
            <div key={entrada.id} className="group px-4 py-3 flex gap-3">
              <div className="flex flex-col items-center pt-0.5">
                {entrada.hallazgo ? (
                  <FaTooth className="text-teal-600" size={15} />
                ) : (
                  <BiSolidNote className="text-gray-400" size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">{entrada.fecha} · {entrada.hora}</span>
                  {entrada.hallazgo && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colorDe(entrada.hallazgo.capa).fondo} text-white`}
                    >
                      Pieza {entrada.hallazgo.piezaCodigo} · {entrada.hallazgo.detalle}
                    </span>
                  )}
                </div>
                {entrada.hallazgo && (
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{entrada.hallazgo.nombreHallazgo}</p>
                )}
                {entrada.texto && <p className="text-sm text-gray-600 mt-0.5">{entrada.texto}</p>}
              </div>
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
            </div>
          ))
        )}
      </div>

      {/* Editar nota: mismo lenguaje visual que ConfirmAlert */}
      {idEditando && (
        <>
          <div
            className="fixed top-[68px] left-0 sm:left-56 right-0 bottom-0 z-40 backdrop-blur-sm bg-black/20"
            onClick={() => setIdEditando(null)}
          />
          <div className="fixed left-1/2 sm:left-[calc(50%+7rem)] top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] sm:w-full max-w-md bg-white rounded-xl border-2 border-gray-300 shadow-lg p-6 text-black">
            <h2 className="text-lg font-semibold mb-3">Editar nota</h2>
            <textarea
              autoFocus
              value={textoEditando}
              onChange={(e) => setTextoEditando(e.target.value)}
              onFocus={(e: FocusEvent<HTMLTextAreaElement>) => {
                const len = e.target.value.length
                e.target.setSelectionRange(len, len)
              }}
              rows={4}
              className="w-full text-sm text-gray-800 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIdEditando(null)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-medium hover:bg-gray-50 transition duration-150"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                className="px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-medium hover:bg-teal-600 transition duration-150"
              >
                Guardar
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmAlert
        open={!!entradaAEliminar}
        setOpen={(open) => !open && setIdAEliminar(null)}
        title="¿Eliminar esta entrada?"
        description={
          entradaAEliminar?.hallazgo
            ? `Se va a borrar el registro de "${entradaAEliminar.hallazgo.nombreHallazgo}" en la pieza ${entradaAEliminar.hallazgo.piezaCodigo} de la Historia Clínica. Esta acción no se puede deshacer.`
            : 'Esta acción no se puede deshacer.'
        }
        onConfirm={() => {
          if (idAEliminar) onEliminar(idAEliminar)
          setIdAEliminar(null)
        }}
      />
    </div>
  )
}
