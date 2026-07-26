'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ESTADO_CONFIG = {
  completado:   { icon: <CheckCircle2 size={14} className="text-[#0F7B55]" />,    label: 'Completado',  cls: 'text-[#0F7B55]'  },
  procesando:   { icon: <Clock size={14} className="text-[#B45309] animate-pulse" />, label: 'Procesando', cls: 'text-[#B45309]'  },
  con_errores:  { icon: <AlertTriangle size={14} className="text-[#D81B43]" />,   label: 'Con errores', cls: 'text-[#D81B43]'  },
}

function FilaCarga({ carga }) {
  const [abierto, setAbierto] = useState(false)
  const cfg = ESTADO_CONFIG[carga.estado] || ESTADO_CONFIG.procesando
  const errores = Array.isArray(carga.errores) ? carga.errores : []

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
        <div className="flex-shrink-0">{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12.5px] font-semibold text-slate-700 truncate">
              {carga.categoria?.nombre || '—'}
            </span>
            <span className="text-[11px] text-slate-400 truncate">{carga.nombre_archivo}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {formatFecha(carga.fecha_inicio)}
            {' · '}
            <span className={`font-semibold ${cfg.cls}`}>{carga.exitosos ?? 0}</span>
            <span className="text-slate-400"> / {carga.total_filas ?? 0} exitosos</span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className={`text-[11px] font-semibold ${cfg.cls}`}>{cfg.label}</span>
        </div>
        {errores.length > 0 && (
          <button onClick={() => setAbierto(v => !v)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
      {abierto && errores.length > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-red-50 border border-red-100 rounded-[8px] p-3 space-y-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-red-400 mb-2">
              {errores.length} error{errores.length !== 1 ? 'es' : ''}
            </div>
            {errores.map((err, i) => (
              <div key={i} className="text-[11.5px] text-red-700">· {err}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HistorialCargas() {
  const supabase = createClient()
  const [cargas, setCargas] = useState([])
  const [cargando, setCargando] = useState(true)

  async function cargarHistorial() {
    const { data } = await supabase
      .from('cargas_masivas')
      .select('*, categoria:categorias_equipo(id, nombre)')
      .order('fecha_inicio', { ascending: false })
      .limit(20)
    setCargas(data || [])
    setCargando(false)
  }

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('cargas_masivas')
        .select('*, categoria:categorias_equipo(id, nombre)')
        .order('fecha_inicio', { ascending: false })
        .limit(20)
      setCargas(data || [])
      setCargando(false)
    })()
    const canal = supabase
      .channel('historial-cargas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cargas_masivas' }, cargarHistorial)
      .subscribe()
    return () => supabase.removeChannel(canal)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (cargando) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-8 text-center text-[12px] text-slate-400">Cargando historial...</div>
      </div>
    )
  }

  if (cargas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-4 py-8 text-center text-[12px] text-slate-400">Sin cargas registradas aún</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="text-[13px] font-bold text-slate-700">Últimas {cargas.length} cargas</div>
        <button onClick={cargarHistorial} className="text-[11.5px] text-slate-400 hover:text-[#D81B43] transition-colors">
          Actualizar
        </button>
      </div>
      <div>
        {cargas.map(c => <FilaCarga key={c.id} carga={c} />)}
      </div>
    </div>
  )
}
