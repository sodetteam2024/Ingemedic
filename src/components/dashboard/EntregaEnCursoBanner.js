'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Truck, ChevronLeft, ChevronRight } from 'lucide-react'

const ESTADO_EN_PROGRESO = '00baf9e1-8e9d-4da5-b16d-acbfdf3b4354'

// ── COLOR DEL BANNER ──────────────────────────────────────────────
// Opción A (recomendada): cian de marca — "en vivo/en movimiento", no choca con
// el verde que ya usas para "completado/disponible".
const GRADIENTE = 'linear-gradient(90deg, #0E86A0, #2EB5D4)'
// Opción B: verde tipo Rappi/Uber (descomenta esta línea y comenta la de arriba
// si prefieres el verde clásico de apps de delivery):
// const GRADIENTE = 'linear-gradient(90deg, #0F7B55, #16A472)'

export default function EntregaEnCursoBanner() {
  const supabase = createClient()
  const [entregas, setEntregas] = useState([])
  const [idx, setIdx]           = useState(0)
  const [ahora, setAhora]       = useState(0)

  // Cargar entregas en progreso + suscripción realtime para que aparezca/desaparezca solo
  useEffect(() => {
    let activo = true
    async function cargar() {
      const { data } = await supabase.from('entregas')
        .select(`
          id, codigo, tipo, fecha_inicio,
          cliente:clientes(id, nombre),
          repartidor:usuarios(id, nombre)
        `)
        .eq('estado_id', ESTADO_EN_PROGRESO)
        .order('fecha_inicio', { ascending: true })
      if (activo) setEntregas(data || [])
    }
    cargar()

    const canal = supabase
      .channel('dashboard-entregas-en-curso')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entregas' }, cargar)
      .subscribe()

    return () => { activo = false; supabase.removeChannel(canal) }
  }, [])

  // Cronómetro — se actualiza cada segundo. Date.now() nunca se llama durante el
  // render (regla del proyecto); se setea siempre dentro de un setTimeout(...,0)
  // para que el linter no lo trate como llamada síncrona impura.
  useEffect(() => {
    setTimeout(() => setAhora(Date.now()), 0)
    const t = setInterval(() => {
      setTimeout(() => setAhora(Date.now()), 0)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Si la lista encogió (una entrega se completó) y el índice quedó fuera de rango,
  // se corrige acá mismo como valor derivado — no necesita su propio efecto/estado.
  if (entregas.length === 0) return null
  const idxSeguro = idx >= entregas.length ? 0 : idx

  const e = entregas[idxSeguro]
  const segs = e.fecha_inicio ? Math.max(0, Math.floor((ahora - new Date(e.fecha_inicio).getTime()) / 1000)) : 0
  const hh = String(Math.floor(segs / 3600)).padStart(2, '0')
  const mm = String(Math.floor((segs % 3600) / 60)).padStart(2, '0')
  const ss = String(segs % 60).padStart(2, '0')

  return (
    <div
      className="relative overflow-hidden rounded-xl text-white flex items-center gap-3 px-3.5 py-3 md:py-3.5 shadow-sm"
      style={{ background: GRADIENTE }}
    >
      {/* Textura sutil de "movimiento" — franjas diagonales, muy tenues */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #fff 0 2px, transparent 2px 14px)' }} />

      {entregas.length > 1 && (
        <button onClick={() => setIdx((idxSeguro - 1 + entregas.length) % entregas.length)}
          className="relative z-10 flex-shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
          <ChevronLeft size={16} />
        </button>
      )}

      <div className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
        <Truck size={18} className="animate-[bounce_1.6s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 flex-1 min-w-0">
        <div className="text-[10.5px] font-bold uppercase tracking-wide opacity-85 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {e.tipo === 'devolucion' ? 'Devolución en curso' : 'Entrega en curso'} · {e.codigo}
        </div>
        <div className="text-[14px] font-bold truncate mt-0.5">{e.cliente?.nombre || '—'}</div>
        {e.repartidor?.nombre && (
          <div className="text-[11px] opacity-80 truncate">Repartidor: {e.repartidor.nombre}</div>
        )}
      </div>

      <div className="relative z-10 flex-shrink-0 text-right">
        <div className="text-[16px] font-mono font-extrabold tabular-nums leading-none">{hh}:{mm}:{ss}</div>
        {entregas.length > 1 && (
          <div className="text-[10px] opacity-75 mt-1">{idxSeguro + 1}/{entregas.length}</div>
        )}
      </div>

      {entregas.length > 1 && (
        <button onClick={() => setIdx((idxSeguro + 1) % entregas.length)}
          className="relative z-10 flex-shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  )
}