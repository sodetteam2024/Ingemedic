// src/components/tour/TourWidget.js
'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { X, ChevronRight, ChevronLeft, Map, SkipForward } from 'lucide-react'
import { PASOS_TOUR } from '@/hooks/useTour'

const TOUR_KEY      = 'ingemedic_tour_completado'
const TOUR_PASO_KEY = 'ingemedic_tour_paso'

const BLOQUES = [
  { nombre: 'Configuración', pasos: ['bienvenida','empresa','categorias','tipos','listas','usuarios'],          color: '#1B3A6B' },
  { nombre: 'Inventario',    pasos: ['inventario-intro','nueva-unidad'],                                        color: '#25A9E0' },
  { nombre: 'Órdenes',       pasos: ['ordenes-intro','ordenes-flujo'],                                          color: '#D81B43' },
  { nombre: 'Entregas',      pasos: ['entregas-intro','entregas-iniciar','entregas-completar'],                  color: '#B45309' },
  { nombre: 'Mantenimientos',pasos: ['mantenimientos-intro','mantenimientos-checklist','mantenimientos-acta'],   color: '#0F7B55' },
  { nombre: 'Fin',           pasos: ['fin'],                                                                     color: '#D81B43' },
]

function getBloqueColor(id) { return BLOQUES.find(b => b.pasos.includes(id))?.color || '#D81B43' }
function getBloqueNombre(id) { return BLOQUES.find(b => b.pasos.includes(id))?.nombre || '' }

function getCardStyle(rect) {
  const vw    = window.innerWidth
  const vh    = window.innerHeight
  const cardW = Math.min(380, vw - 32)

  if (!rect) {
    return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: cardW, maxHeight: vh - 32 }
  }

  const spaceBottom = vh - (rect.top + rect.height)
  const spaceTop    = rect.top
  let top = spaceBottom >= 220 || spaceBottom > spaceTop
    ? Math.min(rect.top + rect.height + 12, vh - 220)
    : Math.max(rect.top - 220, 8)

  let left = rect.left + rect.width / 2 - cardW / 2
  left = Math.max(16, Math.min(left, vw - cardW - 16))

  return { position: 'fixed', top, left, width: cardW, maxHeight: vh - top - 16 }
}

function HighlightOverlay({ onNext, onPrev, onSkip, paso, totalPasos, pasoData }) {
  const [rect, setRect]           = useState(null)
  const [cardStyle, setCardStyle] = useState({ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 380 })
  const [visible, setVisible]     = useState(false)
  const color   = getBloqueColor(pasoData.id)
  const bloque  = getBloqueNombre(pasoData.id)
  const progress = ((paso + 1) / totalPasos) * 100

  useEffect(() => {
    const delay = pasoData.posicion === 'center' || !pasoData.elemento || pasoData.elemento === 'body' ? 100 : 600

    const t = setTimeout(() => {
      setVisible(false)
      setRect(null)

      if (pasoData.posicion === 'center' || !pasoData.elemento || pasoData.elemento === 'body') {
        setCardStyle(getCardStyle(null))
        setTimeout(() => setVisible(true), 50)
        return
      }
      const el = document.querySelector(pasoData.elemento)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          const r = el.getBoundingClientRect()
          const elRect = { top: r.top, left: r.left, width: r.width, height: r.height }
          setRect(elRect)
          setCardStyle(getCardStyle(elRect))
          setTimeout(() => setVisible(true), 50)
        }, 350)
      } else {
        setCardStyle(getCardStyle(null))
        setTimeout(() => setVisible(true), 50)
      }
    }, delay)

    return () => clearTimeout(t)
  }, [pasoData.id])

  return (
    <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}>
      {/* Overlay bloquea interacción */}
      <div className="fixed inset-0 z-[9000]"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()} />

      {/* Highlight del elemento */}
      {rect && visible && (
        <div className="fixed z-[9001] pointer-events-none rounded-[8px]"
          style={{
            top:       rect.top - 6,
            left:      rect.left - 6,
            width:     rect.width + 12,
            height:    rect.height + 12,
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.6), 0 0 0 3px ${color}, 0 0 20px ${color}40`,
            background: 'transparent',
          }} />
      )}

      {/* Tarjeta */}
      <div className="z-[9002] pointer-events-auto overflow-y-auto" style={{ ...cardStyle, position: 'fixed' }}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: color }}>
            <div className="flex items-center gap-2 min-w-0">
              <Map size={13} className="text-white/70 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-white/80 truncate">{bloque}</span>
              <span className="text-[11px] text-white/50 flex-shrink-0">· {paso + 1}/{totalPasos}</span>
            </div>
            <button onClick={onSkip} className="text-white/60 hover:text-white ml-2 flex-shrink-0">
              <X size={15} />
            </button>
          </div>

          {/* Progreso */}
          <div className="h-1 bg-slate-100">
            <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: color }} />
          </div>

          {/* Contenido */}
          <div className="px-4 py-4">
            <div className="text-[14px] font-bold text-slate-800 mb-2 leading-tight">{pasoData.titulo}</div>
            <div className="text-[12.5px] text-slate-500 leading-relaxed whitespace-pre-line">{pasoData.descripcion}</div>
          </div>

          {/* Dots bloques */}
          <div className="px-4 pb-2 flex items-center gap-1.5 flex-wrap">
            {BLOQUES.map(b => {
              const activo = b.pasos.includes(pasoData.id)
              return (
                <div key={b.nombre} className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: activo ? 18 : 5, background: activo ? b.color : '#E2E8F0' }} />
              )
            })}
          </div>

          {/* Acciones */}
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button onClick={onSkip} className="text-[11.5px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
              <SkipForward size={11} /> Saltar
            </button>
            <div className="flex gap-2">
              {paso > 0 && (
                <button onClick={onPrev}
                  className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-[8px] text-[12px] font-medium text-slate-600 hover:border-slate-300">
                  <ChevronLeft size={12} /> Atrás
                </button>
              )}
              <button onClick={onNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[12px] font-semibold text-white hover:opacity-90"
                style={{ background: color }}>
                {paso === totalPasos - 1 ? '¡Listo! 🎉' : <>Siguiente <ChevronRight size={12} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TourWidget() {
  const router   = useRouter()
  const pathname = usePathname()

  const [activo, setActivo]   = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(TOUR_KEY) !== 'true'
  })
  const [pasoIdx, setPasoIdx] = useState(() => {
    if (typeof window === 'undefined') return 0
    return parseInt(localStorage.getItem(TOUR_PASO_KEY) || '0', 10)
  })
  const [listo, setListo]     = useState(false) // true cuando la ruta ya coincide

  useEffect(() => {
    function onReiniciar() {
      localStorage.removeItem(TOUR_KEY)
      localStorage.setItem(TOUR_PASO_KEY, '0')
      setTimeout(() => {
        setPasoIdx(0)
        setActivo(true)
        setListo(false)
      }, 0)
    }
    window.addEventListener('reiniciar-tour', onReiniciar)
    return () => window.removeEventListener('reiniciar-tour', onReiniciar)
  }, [])

  const pasoActual = PASOS_TOUR[pasoIdx]

  // Navegar si la ruta no coincide
  useEffect(() => {
    if (!activo || !pasoActual) return

    const rutaEsperada = pasoActual.ruta
    if (!rutaEsperada || pathname === rutaEsperada) {
      const t = setTimeout(() => {
        // Si el paso requiere una sección específica en Configuración, cambiarla
        if (pasoActual.seccion) {
          window.dispatchEvent(new CustomEvent('tour-seccion', { detail: pasoActual.seccion }))
        }
        setListo(true)
      }, 100)
      return () => clearTimeout(t)
    }

    // Ruta no coincide — ocultar y navegar
    const t = setTimeout(() => {
      setListo(false)
      router.push(rutaEsperada)
    }, 50)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, pasoIdx, pathname])

  function siguiente() {
    if (pasoIdx >= PASOS_TOUR.length - 1) { terminar(); return }
    setListo(false)
    const n = pasoIdx + 1
    setPasoIdx(n)
    localStorage.setItem(TOUR_PASO_KEY, String(n))
  }
  function anterior() {
    if (pasoIdx <= 0) return
    setListo(false)
    const n = pasoIdx - 1
    setPasoIdx(n)
    localStorage.setItem(TOUR_PASO_KEY, String(n))
  }
  function terminar() {
    localStorage.setItem(TOUR_KEY, 'true')
    localStorage.removeItem(TOUR_PASO_KEY)
    setActivo(false)
  }

  // Solo renderizar cuando estamos en la ruta correcta
  if (!activo || !pasoActual || !listo) return null

  return (
    <HighlightOverlay
      onNext={siguiente} onPrev={anterior} onSkip={terminar}
      paso={pasoIdx} totalPasos={PASOS_TOUR.length} pasoData={pasoActual}
    />
  )
}