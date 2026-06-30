// src/components/tour/TourWidget.js
'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { X, ChevronRight, ChevronLeft, Map, SkipForward } from 'lucide-react'
import { PASOS_TOUR } from '@/hooks/useTour'

const TOUR_KEY      = 'ingemedic_tour_completado'
const TOUR_PASO_KEY = 'ingemedic_tour_paso'

const BLOQUES = [
  { nombre: 'Configuración', pasos: ['bienvenida','empresa','categorias','tipos','listas','usuarios'],                       color: '#7C3AED' },
  { nombre: 'Inventario',    pasos: ['inventario-intro','nueva-unidad'],                                                     color: '#25A9E0' },
  { nombre: 'Órdenes',       pasos: ['ordenes-intro','ordenes-flujo'],                                                       color: '#D81B43' },
  { nombre: 'Entregas',      pasos: ['entregas-intro','entregas-iniciar','entregas-completar'],                              color: '#B45309' },
  { nombre: 'Mantenimientos',pasos: ['mantenimientos-intro','mantenimientos-checklist','mantenimientos-acta'],               color: '#0F7B55' },
  { nombre: 'Fin',           pasos: ['fin'],                                                                                 color: '#1E293B' },
]

function getBloqueColor(id) { return BLOQUES.find(b => b.pasos.includes(id))?.color || '#D81B43' }
function getBloqueNombre(id) { return BLOQUES.find(b => b.pasos.includes(id))?.nombre || '' }

function getCardStyle(rect, posicion) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cardW = Math.min(380, vw - 32) // máx 380px, mínimo 16px de margen a cada lado

  if (posicion === 'center' || !rect) {
    return {
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: cardW,
      maxHeight: vh - 32,
    }
  }

  // Calcular posición óptima
  const spaceBottom = vh - (rect.top + rect.height)
  const spaceTop    = rect.top
  const spaceRight  = vw - rect.left
  const spaceLeft   = rect.left

  let top, left

  if (spaceBottom >= 220 || spaceBottom > spaceTop) {
    top = Math.min(rect.top + rect.height + 12, vh - 220)
  } else {
    top = Math.max(rect.top - 220, 8)
  }

  // Centrar horizontalmente respecto al elemento, pero dentro de la pantalla
  left = rect.left + rect.width / 2 - cardW / 2
  left = Math.max(16, Math.min(left, vw - cardW - 16))

  return {
    position: 'fixed',
    top, left,
    width: cardW,
    maxHeight: vh - top - 16,
  }
}

function HighlightOverlay({ onNext, onPrev, onSkip, paso, totalPasos, pasoData }) {
  const [rect, setRect]       = useState(null)
  const [visible, setVisible] = useState(false)
  const [cardStyle, setCardStyle] = useState({})
  const color  = getBloqueColor(pasoData.id)
  const bloque = getBloqueNombre(pasoData.id)
  const progress = ((paso + 1) / totalPasos) * 100

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pasoData.posicion === 'center' || !pasoData.elemento || pasoData.elemento === 'body') {
        setRect(null)
        setCardStyle(getCardStyle(null, 'center'))
        setVisible(true)
        return
      }
      const el = document.querySelector(pasoData.elemento)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          const r = el.getBoundingClientRect()
          const elRect = { top: r.top, left: r.left, width: r.width, height: r.height }
          setRect(elRect)
          setCardStyle(getCardStyle(elRect, pasoData.posicion))
          setVisible(true)
        }, 400)
      } else {
        setRect(null)
        setCardStyle(getCardStyle(null, 'center'))
        setVisible(true)
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [pasoData.id, pasoData.elemento, pasoData.posicion])

  return (
    <div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9000] pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.6)' }} />

      {/* Highlight del elemento */}
      {rect && (
        <div className="fixed z-[9001] pointer-events-none rounded-[8px]"
          style={{
            top:    rect.top - 6,
            left:   rect.left - 6,
            width:  rect.width + 12,
            height: rect.height + 12,
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.6), 0 0 0 3px ${color}, 0 0 20px ${color}40`,
            background: 'transparent',
            transition: 'all 0.3s ease',
          }} />
      )}

      {/* Tarjeta tour */}
      <div className="z-[9002] pointer-events-auto overflow-y-auto"
        style={{ ...cardStyle, position: 'fixed' }}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
            style={{ background: color }}>
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
          <div className="h-1 bg-slate-100 flex-shrink-0">
            <div className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, background: color }} />
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
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-shrink-0">
            <button onClick={onSkip}
              className="text-[11.5px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
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
  const [activo, setActivo]       = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(TOUR_KEY) !== 'true'
  })
  const [pasoIdx, setPasoIdx]     = useState(() => {
    if (typeof window === 'undefined') return 0
    return parseInt(localStorage.getItem(TOUR_PASO_KEY) || '0', 10)
  })
  const [navegando, setNavegando] = useState(false)

  useEffect(() => {
    function onReiniciar() {
      localStorage.removeItem(TOUR_KEY)
      localStorage.setItem(TOUR_PASO_KEY, '0')
      setPasoIdx(0); setActivo(true)
    }
    window.addEventListener('reiniciar-tour', onReiniciar)
    return () => window.removeEventListener('reiniciar-tour', onReiniciar)
  }, [])

  const pasoActual = PASOS_TOUR[pasoIdx]

  useEffect(() => {
    if (!activo || !pasoActual) return
    if (navegando) return
    if (pasoActual.ruta && pathname !== pasoActual.ruta) {
      const t = setTimeout(() => {
        setNavegando(true)
        router.push(pasoActual.ruta)
        setTimeout(() => setNavegando(false), 900)
      }, 0)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, pasoIdx, pathname])

  function siguiente() {
    if (pasoIdx >= PASOS_TOUR.length - 1) { terminar(); return }
    const n = pasoIdx + 1
    setPasoIdx(n); localStorage.setItem(TOUR_PASO_KEY, String(n))
  }
  function anterior() {
    if (pasoIdx <= 0) return
    const n = pasoIdx - 1
    setPasoIdx(n); localStorage.setItem(TOUR_PASO_KEY, String(n))
  }
  function terminar() {
    localStorage.setItem(TOUR_KEY, 'true')
    localStorage.removeItem(TOUR_PASO_KEY)
    setActivo(false)
  }

  if (!activo || !pasoActual) return null

  return (
    <HighlightOverlay
      onNext={siguiente} onPrev={anterior} onSkip={terminar}
      paso={pasoIdx} totalPasos={PASOS_TOUR.length} pasoData={pasoActual}
    />
  )
}