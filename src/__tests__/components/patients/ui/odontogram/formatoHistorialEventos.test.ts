import { describe, it, expect } from 'vitest'
import { describirEvento } from '@/components/patients/ui/odontogram/formatoHistorialEventos'
import type { EventoOdontogramaConId } from '@/services/odontograma/getEventos'
import type { CodigoHallazgoCara, CodigoHallazgoDiente, CodigoHallazgoMulti } from '@/lib/odontograma/tipos'

const BASE = { id: 'evt-1', ts: 1700000000000, uid: 'uid-1' } as const

// 'OCLUSAL_INCISAL' y no otra cara: es la única sin riesgo del bug de posición que cubre
// el guard de caras.test.ts (LITERAL_DE_CARA), y acá no hace falta ninguna otra — el
// mapeo posición→cara ya lo prueba ese archivo, este test prueba el formateo del evento.
function eventoCara(de: CodigoHallazgoCara | null, a: CodigoHallazgoCara | null): EventoOdontogramaConId {
  return { ...BASE, alcance: 'CARA', capa: 'requerida', diente: 't16', cara: 'OCLUSAL_INCISAL', piezas: null, de, a }
}

function eventoDiente(de: CodigoHallazgoDiente | null, a: CodigoHallazgoDiente | null): EventoOdontogramaConId {
  return { ...BASE, alcance: 'DIENTE', capa: 'existente', diente: 't11', cara: null, piezas: null, de, a }
}

function eventoMulti(de: CodigoHallazgoMulti | null, a: CodigoHallazgoMulti | null): EventoOdontogramaConId {
  return {
    ...BASE,
    alcance: 'MULTI',
    capa: 'existente',
    diente: null,
    cara: null,
    // A propósito fuera de orden: describirEvento tiene que ordenar por ordenVisual, no por Object.keys().
    piezas: { t47: true, t45: true, t46: true },
    de,
    a,
  }
}

describe('describirEvento — CARA', () => {
  it('alta: de null a un código', () => {
    const r = describirEvento(eventoCara(null, 'caries'))
    expect(r.piezas).toBe('16')
    expect(r.ubicacion).toBe('Oclusal')
    expect(r.capa).toBe('requerida')
    expect(r.transicion).toBe('Se registró Caries')
  })

  it('borrado: de un código a null', () => {
    const r = describirEvento(eventoCara('caries', null))
    expect(r.transicion).toBe('Se quitó Caries')
  })

  it('reemplazo: de un código a otro', () => {
    const r = describirEvento(eventoCara('caries', 'obturacion'))
    expect(r.transicion).toBe('Caries pasó a Obturación')
  })
})

describe('describirEvento — DIENTE', () => {
  it('alta', () => {
    const r = describirEvento(eventoDiente(null, 'corona'))
    expect(r.piezas).toBe('11')
    expect(r.ubicacion).toBeNull()
    expect(r.transicion).toBe('Se registró Corona')
  })

  it('borrado', () => {
    const r = describirEvento(eventoDiente('corona', null))
    expect(r.transicion).toBe('Se quitó Corona')
  })

  it('reemplazo', () => {
    const r = describirEvento(eventoDiente('corona', 'endodoncia'))
    expect(r.transicion).toBe('Corona pasó a Endodoncia')
  })
})

describe('describirEvento — MULTI', () => {
  it('alta: piezas ordenadas por ordenVisual, no por orden de las claves', () => {
    // Cuadrante 4: la numeración decrece de izquierda a derecha (ver piezas.ts), así
    // que el orden visual correcto es 47, 46, 45 — no el ascendente por código.
    const r = describirEvento(eventoMulti(null, 'protesis_fija'))
    expect(r.piezas).toBe('47-46-45')
    expect(r.ubicacion).toBeNull()
    expect(r.transicion).toBe('Se registró Prótesis fija')
  })

  it('borrado', () => {
    const r = describirEvento(eventoMulti('protesis_fija', null))
    expect(r.transicion).toBe('Se quitó Prótesis fija')
  })

  it('reemplazo', () => {
    const r = describirEvento(eventoMulti('protesis_fija', 'protesis_removible'))
    expect(r.transicion).toBe('Prótesis fija pasó a Prótesis removible')
  })
})
