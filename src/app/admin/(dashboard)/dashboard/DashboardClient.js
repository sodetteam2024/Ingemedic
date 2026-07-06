'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, Truck, Wrench, FileText, AlertTriangle,
  Clock, CheckCircle2, TrendingUp, Calendar, ChevronRight,
  ArrowUpRight, Users, X
} from 'lucide-react'
import EntregaEnCursoBanner from '@/components/dashboard/EntregaEnCursoBanner'

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
  const [alertaAbierta, setAlertaAbierta] = useState(false)

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
      <div className="h-14 md:h-16 md:bg-white md:border-b md:border-slate-200 flex items-center px-4 md:px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-slate-800">Dashboard</div>
          <div className="text-[12px] text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        {totalAlertas > 0 && (
          <div className="ml-auto relative">
            <button onClick={() => setAlertaAbierta(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#FEF2F2] border border-[#D81B43]/20 rounded-full hover:bg-[#FEE2E2] transition-colors">
              <AlertTriangle size={13} className="text-[#D81B43]" />
              <span className="text-[12px] font-semibold text-[#D81B43]">{totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''}</span>
            </button>

            {alertaAbierta && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setAlertaAbierta(false)} />
                <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                  {ordenesRetrasadas.length > 0 && (
                    <button onClick={() => { setAlertaAbierta(false); router.push('/admin/ordenes') }}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 text-left">
                      <span className="text-[12.5px] text-slate-600 flex items-center gap-2">
                        <AlertTriangle size={13} className="text-[#D81B43]" /> Entregas retrasadas
                      </span>
                      <span className="text-[12px] font-bold text-[#D81B43]">{ordenesRetrasadas.length}</span>
                    </button>
                  )}
                  {vigenciasProximas.length > 0 && (
                    <button onClick={() => { setAlertaAbierta(false); router.push('/admin/ordenes') }}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 border-b border-slate-100 text-left">
                      <span className="text-[12.5px] text-slate-600 flex items-center gap-2">
                        <Clock size={13} className="text-[#B45309]" /> Vigencias por vencer
                      </span>
                      <span className="text-[12px] font-bold text-[#B45309]">{vigenciasProximas.length}</span>
                    </button>
                  )}
                  {conNovedad > 0 && (
                    <button onClick={() => { setAlertaAbierta(false); router.push('/admin/inventario') }}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 text-left">
                      <span className="text-[12.5px] text-slate-600 flex items-center gap-2">
                        <Package size={13} className="text-[#D81B43]" /> Equipos con novedad
                      </span>
                      <span className="text-[12px] font-bold text-[#D81B43]">{conNovedad}</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-28 md:pb-6 space-y-5">

        {/* ── BANNER ENTREGA EN CURSO — solo aparece si hay entregas activas, en cualquier tamaño de pantalla ── */}
        <EntregaEnCursoBanner />

        {/* ── FILA 1 (MÓVIL): 3 KPIs esenciales — Disponibles / En préstamo / Mantenimientos ── */}
        <div className="grid grid-cols-3 gap-2 md:hidden">
          {[
            { label: 'Mantenimiento', value: mantenimientosActivos.length, color: '#B45309', icon: Wrench },
            { label: 'Disponibles',   value: disponibles,                  color: '#0F7B55', icon: CheckCircle2 },
            { label: 'En préstamo',   value: enPrestamo,                   color: '#0E86A0', icon: ArrowUpRight },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: s.color + '15' }}>
                  <Icon size={13} style={{ color: s.color }} />
                </div>
                <div className="text-lg font-extrabold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10.5px] font-semibold text-slate-500 mt-1 leading-tight">{s.label}</div>
              </div>
            )
          })}
        </div>

        {/* ── FILA 1 (DESKTOP): 6 KPIs completos ── */}
        <div className="hidden md:grid md:grid-cols-6 gap-3">
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
                <div className="text-[10.5px] text-slate-400 mt-0.5 hidden md:block">{s.sub}</div>
              </div>
            )
          })}
        </div>

        {/* ── ENTREGAS HOY — ahora primero, es lo más urgente del día a día ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-bold text-slate-800">Entregas hoy</div>
              <div className="text-[11.5px] text-slate-400 mt-0.5">
                {entregasCompletadas} completadas · {entregasPendientes} en curso
              </div>
            </div>
            <button onClick={() => router.push('/admin/entregas')} className="text-[12px] text-[#D81B43] font-semibold hover:underline flex items-center gap-1">
              Ver todas <ChevronRight size={13} />
            </button>
          </div>
          {entregasHoy.length === 0 ? (
            <div className="px-5 py-8 text-center text-[13px] text-slate-400">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-20" />
              Sin entregas hoy
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[280px] overflow-y-auto">
              {entregasHoy.map(e => (
                <div key={e.id} onClick={() => router.push('/admin/entregas')}
                  className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[12px] font-bold text-slate-600">{e.codigo}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      e.estado?.nombre === 'Completada' ? 'bg-[#ECFDF5] text-[#0F7B55]' : 'bg-[#FFFBEB] text-[#B45309]'
                    }`}>{e.estado?.nombre}</span>
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span className="truncate max-w-[200px]">{e.cliente?.nombre}</span>
                    <span className="text-[11px] text-slate-400">{e.repartidor?.nombre}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ALERTAS — solo se muestran las que tienen datos, para no ocupar espacio en vano ── */}
        {(ordenesRetrasadas.length > 0 || vigenciasProximas.length > 0 || conNovedad > 0) && (
          <div className={`grid grid-cols-1 gap-4 ${
            [ordenesRetrasadas.length > 0, vigenciasProximas.length > 0, conNovedad > 0].filter(Boolean).length >= 2
              ? 'md:grid-cols-2' : ''
          } ${[ordenesRetrasadas.length > 0, vigenciasProximas.length > 0, conNovedad > 0].filter(Boolean).length >= 3 ? 'md:grid-cols-3' : ''}`}>

            {ordenesRetrasadas.length > 0 && (
              <div className="bg-white rounded-xl border border-[#D81B43]/30 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#D81B43]" />
                  <div className="text-[13px] font-bold text-slate-800">Entregas retrasadas</div>
                  <span className="ml-auto text-[11px] font-bold text-white bg-[#D81B43] px-2 py-0.5 rounded-full">{ordenesRetrasadas.length}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {ordenesRetrasadas.map(o => (
                    <div key={o.id} onClick={() => router.push('/admin/ordenes')}
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
              </div>
            )}

            {vigenciasProximas.length > 0 && (
              <div className="bg-white rounded-xl border border-[#F59E0B]/40 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                  <Clock size={14} className="text-[#B45309]" />
                  <div className="text-[13px] font-bold text-slate-800">Vigencias — 7 días</div>
                  <span className="ml-auto text-[11px] font-bold text-white bg-[#B45309] px-2 py-0.5 rounded-full">{vigenciasProximas.length}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {vigenciasProximas.map(o => {
                    const dias = diasRestantes(o.fecha_vigencia)
                    return (
                      <div key={o.id} onClick={() => router.push('/admin/ordenes')}
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
              </div>
            )}

            {conNovedad > 0 && (
              <div className="bg-white rounded-xl border border-[#D81B43]/30 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                  <Package size={14} className="text-[#D81B43]" />
                  <div className="text-[13px] font-bold text-slate-800">Equipos con novedad</div>
                  <span className="ml-auto text-[11px] font-bold text-white bg-[#D81B43] px-2 py-0.5 rounded-full">{conNovedad}</span>
                </div>
                <div className="px-5 py-5 text-center">
                  <div className="text-3xl font-extrabold text-[#D81B43] mb-1">{conNovedad}</div>
                  <div className="text-[12.5px] text-slate-500">equipo{conNovedad !== 1 ? 's' : ''} requieren atención</div>
                  <button onClick={() => router.push('/admin/inventario')}
                    className="mt-3 text-[12px] text-[#D81B43] font-semibold hover:underline">
                    Ver en inventario →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ÓRDENES ACTIVAS — top 3 + ver todas, prioridad menor que Entregas ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-[14px] font-bold text-slate-800">Órdenes activas</div>
              <div className="text-[11.5px] text-slate-400 mt-0.5">{ordenesActivas.length} en curso</div>
            </div>
            <button onClick={() => router.push('/admin/ordenes')} className="text-[12px] text-[#D81B43] font-semibold hover:underline flex items-center gap-1">
              Ver todas <ChevronRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {ordenesActivas.length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-slate-400">Sin órdenes activas</div>
            )}
            {ordenesActivas.slice(0, 3).map(o => {
              const retrasada = o.fecha_entrega && new Date(o.fecha_entrega) < new Date() && o.estado?.nombre === 'Programada'
              const s = ESTADO_OS_STYLES[o.estado?.nombre] || ESTADO_OS_STYLES['Borrador']
              return (
                <div key={o.id} onClick={() => router.push('/admin/ordenes')}
                  className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[12px] font-bold text-slate-600">{o.codigo}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
                      {o.estado?.nombre}
                    </span>
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span className="truncate max-w-[200px]">{o.cliente?.nombre}</span>
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
                  <div key={o.id} onClick={() => router.push('/admin/ordenes')}
                    className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-0.5"
                      style={{ background: s.bg }}>
                      <FileText size={12} style={{ color: s.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[13px] font-semibold text-slate-700">
                          <span className="font-mono">{o.codigo}</span>
                          <span className="text-slate-400 font-normal ml-2 hidden sm:inline">— {o.cliente?.nombre}</span>
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