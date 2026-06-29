'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, Truck, Wrench, FileText, AlertTriangle,
  Clock, CheckCircle2, TrendingUp, Calendar, ChevronRight,
  ArrowUpRight, Users
} from 'lucide-react'

const ESTADO_EQUIPO_STYLES = {
  'Disponible':       { bg: '#ECFDF5', color: '#0F7B55', dot: '#0F7B55' },
  'En préstamo':      { bg: '#E8F7FB', color: '#0E86A0', dot: '#25A9E0' },
  'En mantenimiento': { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  'Con novedad':      { bg: '#FEF2F2', color: '#D81B43', dot: '#D81B43' },
  'Baja':             { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
}

const ESTADO_OS_STYLES = {
  'Borrador':   { bg: '#F1F5F9', color: '#64748B' },
  'Programada': { bg: '#EFF6FF', color: '#1D4ED8' },
  'En reparto': { bg: '#FFFBEB', color: '#B45309' },
  'Entregada':  { bg: '#E8F7FB', color: '#0E86A0' },
  'Finalizada': { bg: '#ECFDF5', color: '#0F7B55' },
}

function nombreEquipo(eq) {
  return eq?.tipo_equipo?.atributos?.nombre || eq?.tipo_equipo?.nombre || '—'
}

function diasRestantes(fecha) {
  if (!fecha) return null
  const diff = Math.ceil((new Date(fecha) - new Date()) / 86400000)
  return diff
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function formatHora(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export default function DashboardClient({
  totalEquipos, estadosEquipo,
  ordenesActivas, mantenimientosActivos,
  entregasHoy, vigenciasProximas,
  ordenesRetrasadas, actividadReciente
}) {
  const router = useRouter()

  const disponibles    = estadosEquipo['Disponible'] || 0
  const enPrestamo     = estadosEquipo['En préstamo'] || 0
  const enMant         = estadosEquipo['En mantenimiento'] || 0
  const conNovedad     = estadosEquipo['Con novedad'] || 0
  const baja           = estadosEquipo['Baja'] || 0

  const entregasPendientes  = entregasHoy.filter(e => e.estado?.nombre !== 'Completada').length
  const entregasCompletadas = entregasHoy.filter(e => e.estado?.nombre === 'Completada').length
  const totalAlertas = ordenesRetrasadas.length + vigenciasProximas.length + conNovedad

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-slate-800">Dashboard</div>
          <div className="text-[12px] text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        {totalAlertas > 0 && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-[#FEF2F2] border border-[#D81B43]/20 rounded-full">
            <AlertTriangle size={13} className="text-[#D81B43]" />
            <span className="text-[12px] font-semibold text-[#D81B43]">{totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── FILA 1: KPIs equipos ── */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Total equipos',    value: totalEquipos, color: '#1E293B', icon: Package,       sub: 'en inventario' },
            { label: 'Disponibles',      value: disponibles,  color: '#0F7B55', icon: CheckCircle2,  sub: 'listos para préstamo' },
            { label: 'En préstamo',      value: enPrestamo,   color: '#0E86A0', icon: ArrowUpRight,  sub: 'fuera del almacén' },
            { label: 'Mantenimiento',    value: enMant,       color: '#B45309', icon: Wrench,        sub: 'en servicio técnico' },
            { label: 'Con novedad',      value: conNovedad,   color: '#D81B43', icon: AlertTriangle, sub: 'requieren atención' },
            { label: 'Baja',             value: baja,         color: '#64748B', icon: Package,       sub: 'fuera de servicio' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.color + '15' }}>
                    <Icon size={15} style={{ color: s.color }} />
                  </div>
                  <div className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                </div>
                <div className="text-[12px] font-semibold text-slate-700">{s.label}</div>
                <div className="text-[10.5px] text-slate-400 mt-0.5">{s.sub}</div>
              </div>
            )
          })}
        </div>

        {/* ── FILA 2: Estado operacional ── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Órdenes activas */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[14px] font-bold text-slate-800">Órdenes activas</div>
                <div className="text-[11.5px] text-slate-400 mt-0.5">{ordenesActivas.length} en curso</div>
              </div>
              <button onClick={() => router.push('/ordenes')} className="text-[12px] text-[#D81B43] font-semibold hover:underline flex items-center gap-1">
                Ver todas <ChevronRight size={13} />
              </button>
            </div>
            <div className="divide-y divide-slate-50 max-h-[260px] overflow-y-auto">
              {ordenesActivas.length === 0 && (
                <div className="px-5 py-8 text-center text-[13px] text-slate-400">Sin órdenes activas</div>
              )}
              {ordenesActivas.map(o => {
                const retrasada = o.fecha_entrega && new Date(o.fecha_entrega) < new Date() && o.estado?.nombre === 'Programada'
                const s = ESTADO_OS_STYLES[o.estado?.nombre] || ESTADO_OS_STYLES['Borrador']
                return (
                  <div key={o.id} onClick={() => router.push('/ordenes')}
                    className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] font-bold text-slate-600">{o.codigo}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
                        {o.estado?.nombre}
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span className="truncate max-w-[140px]">{o.cliente?.nombre}</span>
                      {o.fecha_entrega && (
                        <span className={`flex items-center gap-1 text-[11px] ${retrasada ? 'text-[#D81B43] font-bold' : 'text-slate-400'}`}>
                          {retrasada && <AlertTriangle size={10} />}
                          {formatFecha(o.fecha_entrega)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mantenimientos en curso */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[14px] font-bold text-slate-800">Mantenimientos</div>
                <div className="text-[11.5px] text-slate-400 mt-0.5">{mantenimientosActivos.length} activos</div>
              </div>
              <button onClick={() => router.push('/mantenimientos')} className="text-[12px] text-[#D81B43] font-semibold hover:underline flex items-center gap-1">
                Ver todos <ChevronRight size={13} />
              </button>
            </div>
            <div className="divide-y divide-slate-50 max-h-[260px] overflow-y-auto">
              {mantenimientosActivos.length === 0 && (
                <div className="px-5 py-8 text-center text-[13px] text-slate-400">Sin mantenimientos activos</div>
              )}
              {mantenimientosActivos.map(m => (
                <div key={m.id} onClick={() => router.push('/mantenimientos')}
                  className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[12px] font-bold text-slate-600">{m.codigo}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      m.tipo?.nombre === 'Correctivo' ? 'bg-[#FEF2F2] text-[#D81B43]' : 'bg-[#E8F7FB] text-[#0E86A0]'
                    }`}>{m.tipo?.nombre}</span>
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span className="truncate max-w-[140px]">{nombreEquipo(m.equipo)}</span>
                    <span className="text-[11px] text-slate-400">{formatFecha(m.fecha_apertura)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Entregas del día */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[14px] font-bold text-slate-800">Entregas hoy</div>
                <div className="text-[11.5px] text-slate-400 mt-0.5">
                  {entregasCompletadas} completadas · {entregasPendientes} en curso
                </div>
              </div>
              <button onClick={() => router.push('/entregas')} className="text-[12px] text-[#D81B43] font-semibold hover:underline flex items-center gap-1">
                Ver <ChevronRight size={13} />
              </button>
            </div>
            {entregasHoy.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-slate-400">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                Sin entregas hoy
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[260px] overflow-y-auto">
                {entregasHoy.map(e => (
                  <div key={e.id} onClick={() => router.push('/entregas')}
                    className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] font-bold text-slate-600">{e.codigo}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        e.estado?.nombre === 'Completada' ? 'bg-[#ECFDF5] text-[#0F7B55]' : 'bg-[#FFFBEB] text-[#B45309]'
                      }`}>{e.estado?.nombre}</span>
                    </div>
                    <div className="text-[12px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span className="truncate max-w-[140px]">{e.cliente?.nombre}</span>
                      <span className="text-[11px] text-slate-400">{e.repartidor?.nombre}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── FILA 3: Alertas ── */}
        {(ordenesRetrasadas.length > 0 || vigenciasProximas.length > 0 || conNovedad > 0) && (
          <div className="grid grid-cols-3 gap-4">

            {/* Órdenes retrasadas */}
            <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${ordenesRetrasadas.length > 0 ? 'border-[#D81B43]/30' : 'border-slate-200'}`}>
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <AlertTriangle size={14} className={ordenesRetrasadas.length > 0 ? 'text-[#D81B43]' : 'text-slate-400'} />
                <div className="text-[13px] font-bold text-slate-800">Entregas retrasadas</div>
                {ordenesRetrasadas.length > 0 && (
                  <span className="ml-auto text-[11px] font-bold text-white bg-[#D81B43] px-2 py-0.5 rounded-full">{ordenesRetrasadas.length}</span>
                )}
              </div>
              {ordenesRetrasadas.length === 0 ? (
                <div className="px-5 py-5 text-center text-[12.5px] text-[#0F7B55] flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Sin retrasos
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {ordenesRetrasadas.map(o => (
                    <div key={o.id} onClick={() => router.push('/ordenes')}
                      className="px-5 py-3 hover:bg-red-50/50 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[12px] font-bold text-[#D81B43]">{o.codigo}</span>
                        <span className="text-[11px] text-[#D81B43] font-semibold">
                          {Math.abs(diasRestantes(o.fecha_entrega))}d retraso
                        </span>
                      </div>
                      <div className="text-[12px] text-slate-500 mt-0.5 truncate">{o.cliente?.nombre}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vigencias próximas */}
            <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${vigenciasProximas.length > 0 ? 'border-[#F59E0B]/40' : 'border-slate-200'}`}>
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <Clock size={14} className={vigenciasProximas.length > 0 ? 'text-[#B45309]' : 'text-slate-400'} />
                <div className="text-[13px] font-bold text-slate-800">Vigencias — 7 días</div>
                {vigenciasProximas.length > 0 && (
                  <span className="ml-auto text-[11px] font-bold text-white bg-[#B45309] px-2 py-0.5 rounded-full">{vigenciasProximas.length}</span>
                )}
              </div>
              {vigenciasProximas.length === 0 ? (
                <div className="px-5 py-5 text-center text-[12.5px] text-[#0F7B55] flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Sin vencimientos próximos
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {vigenciasProximas.map(o => {
                    const dias = diasRestantes(o.fecha_vigencia)
                    return (
                      <div key={o.id} onClick={() => router.push('/ordenes')}
                        className="px-5 py-3 hover:bg-amber-50/50 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[12px] font-bold text-slate-600">{o.codigo}</span>
                          <span className={`text-[11px] font-semibold ${dias <= 2 ? 'text-[#D81B43]' : 'text-[#B45309]'}`}>
                            {dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `${dias}d`}
                          </span>
                        </div>
                        <div className="text-[12px] text-slate-500 mt-0.5 truncate">{o.cliente?.nombre}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Equipos con novedad */}
            <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${conNovedad > 0 ? 'border-[#D81B43]/30' : 'border-slate-200'}`}>
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                <Package size={14} className={conNovedad > 0 ? 'text-[#D81B43]' : 'text-slate-400'} />
                <div className="text-[13px] font-bold text-slate-800">Equipos con novedad</div>
                {conNovedad > 0 && (
                  <span className="ml-auto text-[11px] font-bold text-white bg-[#D81B43] px-2 py-0.5 rounded-full">{conNovedad}</span>
                )}
              </div>
              {conNovedad === 0 ? (
                <div className="px-5 py-5 text-center text-[12.5px] text-[#0F7B55] flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Sin novedades
                </div>
              ) : (
                <div className="px-5 py-5 text-center">
                  <div className="text-3xl font-extrabold text-[#D81B43] mb-1">{conNovedad}</div>
                  <div className="text-[12.5px] text-slate-500">equipo{conNovedad !== 1 ? 's' : ''} requieren atención</div>
                  <button onClick={() => router.push('/inventario')}
                    className="mt-3 text-[12px] text-[#D81B43] font-semibold hover:underline">
                    Ver en inventario →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FILA 4: Actividad reciente ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="text-[14px] font-bold text-slate-800">Actividad reciente</div>
            <div className="text-[11.5px] text-slate-400 mt-0.5">Últimas órdenes de servicio</div>
          </div>
          <div className="relative">
            <div className="absolute left-[28px] top-0 bottom-0 w-px bg-slate-100" />
            <div className="divide-y divide-slate-50">
              {actividadReciente.length === 0 && (
                <div className="px-5 py-8 text-center text-[13px] text-slate-400">Sin actividad reciente</div>
              )}
              {actividadReciente.map((o, i) => {
                const s = ESTADO_OS_STYLES[o.estado?.nombre] || ESTADO_OS_STYLES['Borrador']
                return (
                  <div key={o.id} onClick={() => router.push('/ordenes')}
                    className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-0.5"
                      style={{ background: s.bg }}>
                      <FileText size={12} style={{ color: s.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[13px] font-semibold text-slate-700">
                          <span className="font-mono">{o.codigo}</span>
                          <span className="text-slate-400 font-normal ml-2">— {o.cliente?.nombre}</span>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: s.bg, color: s.color }}>
                          {o.estado?.nombre}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-slate-400 mt-0.5">
                        {o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleString('es-CO', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        }) : '—'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}