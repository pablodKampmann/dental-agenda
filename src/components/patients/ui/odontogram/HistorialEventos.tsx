'use client'

import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2'
import { getEventos, type EventoOdontogramaConId } from '@/services/odontograma/getEventos'
import { conMotivo, mensajeDeFallo, type MotivoFallo } from '@/services/odontograma/fallos'
import { colorDe } from '@/lib/odontograma/caras'
import { describirEvento } from './formatoHistorialEventos'

interface HistorialEventosProps {
  pacienteId: string
  clinicId: string
}

/**
 * Panel de solo lectura del log append-only del odontograma (F4-2). No confundir con
 * `HistorialTimeline.tsx`: ese es notas de texto libre que el usuario edita/borra a mano
 * y vive en `useState` local; este lee `getEventos()` de Firebase y no tiene forma de
 * mutar lo que lista — sin botón de editar, sin botón de borrar, sin input.
 *
 * Si la lectura falla, el panel dice **por qué**: `getEventos` reporta el motivo por
 * `onFallo` y acá se traduce con `mensajeDeFallo()`. Un "intentá de nuevo" genérico
 * manda a reintentar a alguien que en realidad no tiene permiso sobre la ficha.
 */
export function HistorialEventos({ pacienteId, clinicId }: HistorialEventosProps) {
  const [eventos, setEventos] = useState<readonly EventoOdontogramaConId[] | 'cargando' | 'error'>('cargando')
  const [motivo, setMotivo] = useState<MotivoFallo>('DESCONOCIDO')

  useEffect(() => {
    let cancelado = false
    setEventos('cargando')
    conMotivo((onFallo) => getEventos(pacienteId, clinicId, undefined, onFallo)).then(
      ({ resultado, motivo: motivoDelFallo }) => {
        if (cancelado) return
        if (resultado === null) {
          setMotivo(motivoDelFallo)
          setEventos('error')
          return
        }
        setEventos(resultado)
      }
    )
    return () => {
      cancelado = true
    }
  }, [pacienteId, clinicId])

  return (
    <div className="border-2 border-gray-300 rounded-xl overflow-hidden mt-4">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 select-none">
        <h2 className="text-base font-bold tracking-wide text-black flex items-center gap-2">
          <HiOutlineClipboardDocumentList className="text-teal-600" size={18} /> Registro del odontograma
        </h2>
      </div>

      {eventos === 'cargando' && <p className="text-sm text-gray-400 italic text-center py-8">Cargando…</p>}
      {eventos === 'error' && (
        <p className="text-sm text-red-500 text-center py-8">{mensajeDeFallo(motivo, 'cargar_registro')}</p>
      )}
      {eventos !== 'cargando' && eventos !== 'error' && eventos.length === 0 && (
        <p className="text-sm text-gray-400 italic text-center py-8">Sin eventos todavía</p>
      )}
      {eventos !== 'cargando' && eventos !== 'error' && eventos.length > 0 && (
        <div className="divide-y divide-gray-100">
          {eventos.map((evento) => {
            const { piezas, ubicacion, capa, transicion } = describirEvento(evento)
            const color = colorDe(capa)
            return (
              <div key={evento.id} className="px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">{dayjs(evento.ts).format('DD/MM/YYYY HH:mm')}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${color.fondo} text-white`}>
                    Pieza {piezas}
                    {ubicacion ? ` · ${ubicacion}` : ''}
                  </span>
                  <span className={`text-[10px] font-medium ${color.texto}`}>
                    {capa === 'existente' ? 'Existente' : 'Requerida'}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mt-0.5">{transicion}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
