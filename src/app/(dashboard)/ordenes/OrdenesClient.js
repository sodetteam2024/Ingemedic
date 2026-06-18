'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, X, ChevronRight, FileText,
  Truck, CheckCircle2, AlertCircle, Clock, XCircle
} from 'lucide-react'

const ESTADO_COLORS = {
  'Borrador':              { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
  'En espera de firma':    { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  'Activo':                { bg: '#E8F7FB', color: '#0E86A0', dot: '#2EB5D4' },
  'Finalizado':            { bg: '#ECFDF5', color: '#0F7B55', dot: '#0F7B55' },
}

const PASOS = ['Borrador', 'En espera de firma', 'Activo', 'Finalizado']

function MiniTimeline({ estadoNombre }) {
  const idx = estadoNombre === 'Alerta' ? PASOS.indexOf('Activo') : PASOS.indexOf(estadoNombre)
  return (
    <div className="flex items-center gap-1">
      {PASOS.map((_, i) => {
        const isAlerta = estadoNombre === 'Alerta' && i === PASOS.indexOf('Activo')
        return (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
            isAlerta ? 'bg-red-400' :
            i < idx ? 'bg-[#2EB5D4]' :
            i === idx ? 'bg-[#2EB5D4] animate-pulse' :
            'bg-slate-200'
          }`} />
        )
      })}
    </div>
  )
}

function EstadoBadge({ nombre }) {
  const s = ESTADO_COLORS[nombre] || ESTADO_COLORS['Borrador']
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {nombre}
    </span>
  )
}

function BtnAccion({ orden, avanzarEstado }) {
  const est = orden.estado?.nombre
  const map = {
    'Borrador':            { label: 'Aprobar',    bg: '#1B3A6B' },
    'En espera de firma':  { label: 'Enviar',     bg: '#2EB5D4' },
    'Activo':              { label: 'Finalizar',  bg: '#0F7B55' },
    'Finalizado':          { label: 'Ver',        bg: '#64748B' },
    'Alerta':              { label: 'Resolver',   bg: '#C0392B' },
  }
  const btn = map[est]
  if (!btn) return null
  return (
    <button onClick={e => { e.stopPropagation(); avanzarEstado(orden) }}
      className="px-3 py-1.5 rounded-[7px] text-[11.5px] font-bold text-white whitespace-nowrap transition-opacity hover:opacity-80"
      style={{ background: btn.bg }}>
      {btn.label}
    </button>
  )
}

export default function OrdenesClient({
  ordenesIniciales, clientes, estados, tipos,
  plantillas, equiposDisponibles, usuarios
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [ordenes, setOrdenes]   = useState(ordenesIniciales)
  const [search, setSearch]     = useState('')
  const [filtroEst, setFiltroEst] = useState('')
  const [drawer, setDrawer]     = useState(null)
  const [toast, setToast]       = useState(null)

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardPaso, setWizardPaso] = useState(1)
  const [wForm, setWForm] = useState({
    cliente_id: '', equipo_id: '', observaciones: '',
    repartidor_id: '', fecha: new Date().toISOString().split('T')[0],
    plantillas_ids: [],
  })
  const [saving, setSaving] = useState(false)

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      const mq = !search || [o.codigo, o.cliente?.nombre, o.repartidor?.nombre]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()))
      const me = !filtroEst || o.estado?.nombre === filtroEst
      return mq && me
    })
  }, [ordenes, search, filtroEst])

  const stats = useMemo(() => ({
    total:       ordenes.length,
    activas:     ordenes.filter(o => o.estado?.nombre !== 'Finalizado').length,
    firma:       ordenes.filter(o => o.estado?.nombre === 'En espera de firma').length,
    alertas:     ordenes.filter(o => o.estado?.nombre === 'Alerta').length,
    finalizadas: ordenes.filter(o => o.estado?.nombre === 'Finalizado').length,
  }), [ordenes])

  // Avanzar estado
  const SIGUIENTE = {
    'Borrador': 'En espera de firma',
    'En espera de firma': 'Activo',
    'Activo': 'Finalizado',
  }

  async function avanzarEstado(orden) {
    const siguiente = SIGUIENTE[orden.estado?.nombre]
    if (!siguiente) return
    const estadoObj = estados.find(e => e.nombre === siguiente)
    if (!estadoObj) return
    const { error } = await supabase
      .from('ordenes_servicio')
      .update({ estado_id: estadoObj.id })
      .eq('id', orden.id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setOrdenes(prev => prev.map(o =>
      o.id === orden.id ? { ...o, estado: estadoObj } : o
    ))
    if (drawer?.id === orden.id) setDrawer(prev => ({ ...prev, estado: estadoObj }))
    showToast(`Orden → ${siguiente}`)
  }

  // ── WIZARD ────────────────────────────────────────────────────
  function abrirWizard() {
    setWForm({
      cliente_id: '', equipo_id: '', observaciones: '',
      repartidor_id: '', fecha: new Date().toISOString().split('T')[0],
      plantillas_ids: [],
    })
    setWizardPaso(1)
    setWizardOpen(true)
  }

  function togglePlantilla(id) {
    setWForm(f => ({
      ...f,
      plantillas_ids: f.plantillas_ids.includes(id)
        ? f.plantillas_ids.filter(x => x !== id)
        : [...f.plantillas_ids, id]
    }))
  }

  async function crearOrden() {
    if (!wForm.cliente_id) { showToast('Selecciona un cliente', 'error'); return }
    if (!wForm.equipo_id)  { showToast('Selecciona un equipo', 'error'); return }
    setSaving(true)

    const estadoCreada = estados.find(e => e.nombre === 'Borrador')

    // Generar código
    const codigo = `OS-${new Date().getFullYear()}-${String(ordenes.length + 1).padStart(3, '0')}`

    // Crear orden
    const { data: nuevaOrden, error: errOrden } = await supabase
      .from('ordenes_servicio')
      .insert({
        codigo,
        cliente_id:     wForm.cliente_id,
        estado_id:      estadoCreada?.id,
        repartidor_id:  wForm.repartidor_id || null,
        observaciones:  wForm.observaciones,
      })
      .select()
      .single()

    if (errOrden) { showToast('Error: ' + errOrden.message, 'error'); setSaving(false); return }

    // Asociar equipo
    await supabase.from('orden_equipos').insert({
      orden_id: nuevaOrden.id,
      equipo_id: wForm.equipo_id,
      fecha_entrega: wForm.fecha,
    })

    // Asociar plantillas
    if (wForm.plantillas_ids.length > 0) {
      await supabase.from('orden_plantillas').insert(
        wForm.plantillas_ids.map(pid => ({
          orden_id: nuevaOrden.id,
          plantilla_id: pid,
          firmado: false,
        }))
      )
    }

    showToast('Orden creada')
    setSaving(false)
    setWizardOpen(false)
    router.refresh()
  }

  const PASO_LABELS = ['Cliente y equipo', 'Repartidor', 'Documentos']

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-[#1B3A6B]">Órdenes de servicio</div>
          <div className="text-[12px] text-slate-400 mt-0.5">{ordenes.length} órdenes en total</div>
        </div>
        <button onClick={abrirWizard}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
          <Plus size={14} strokeWidth={2.5} /> Nueva O.S.
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 flex-shrink-0">
          {[
            { label: 'Total',                 value: stats.total,       color: '#1B3A6B', f: '' },
            { label: 'Activas',               value: stats.activas,     color: '#B45309', f: 'activas' },
            { label: 'En espera de firma',    value: stats.firma,       color: '#2EB5D4', f: 'En espera de firma' },
            { label: 'Alertas',               value: stats.alertas,     color: '#C0392B', f: 'Alerta' },
            { label: 'Finalizadas',           value: stats.finalizadas, color: '#64748B', f: 'Finalizado' },
          ].map(s => (
            <div key={s.label} onClick={() => setFiltroEst(prev => prev === s.f ? '' : s.f)}
              className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm cursor-pointer hover:border-[#2EB5D4] transition-all">
              <div className="text-xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative flex-1 max-w-[300px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar O.S., cliente, repartidor..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#2EB5D4] bg-white" />
          </div>
          {['', ...PASOS, 'Alerta'].map(e => (
            <button key={e} onClick={() => setFiltroEst(prev => prev === e ? '' : e)}
              className={`px-3 py-2 text-[12px] font-medium rounded-[9px] border transition-all ${filtroEst === e && e !== '' ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : e === '' ? (filtroEst === '' ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-slate-500 border-slate-200 hover:border-[#2EB5D4]') : 'bg-white text-slate-500 border-slate-200 hover:border-[#2EB5D4]'}`}>
              {e || 'Todas'}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b-2 border-slate-200">
                  {['Código', 'Cliente', 'Equipo', 'Repartidor', 'Estado', 'Progreso', 'Fecha', 'Docs', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-400">No se encontraron órdenes</td></tr>
                )}
                {ordenesFiltradas.map(o => {
                  const equipo = o.equipos?.[0]?.equipo
                  return (
                    <tr key={o.id} onClick={() => setDrawer(o)}
                      className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12.5px] font-bold bg-slate-100 text-[#1B3A6B] px-2 py-0.5 rounded">{o.codigo || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold text-slate-700 max-w-[150px] truncate">{o.cliente?.nombre || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        {equipo ? (
                          <div>
                            <div className="text-[12.5px] text-slate-600 max-w-[160px] truncate">{equipo.tipo_equipo?.marca} {equipo.tipo_equipo?.modelo}</div>
                            <div className="text-[11px] font-mono text-slate-400">{equipo.serial}</div>
                          </div>
                        ) : <span className="text-slate-400 text-[12px]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-slate-500">{o.repartidor?.nombre || '—'}</td>
                      <td className="px-4 py-3"><EstadoBadge nombre={o.estado?.nombre || 'Borrador'} /></td>
                      <td className="px-4 py-3 min-w-[100px]"><MiniTimeline estadoNombre={o.estado?.nombre} /></td>
                      <td className="px-4 py-3 font-mono text-[12px] text-slate-400">{o.fecha_creacion?.split('T')[0] || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-[12px] text-slate-400">
                          <FileText size={12} />{o.plantillas?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <BtnAccion orden={o} avanzarEstado={avanzarEstado} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-[#0F2448]/30 z-20 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-[500px] bg-white z-30 flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b flex items-start justify-between flex-shrink-0 bg-[#1B3A6B]">
              <div>
                <div className="text-[15px] font-bold text-white font-mono">{drawer.codigo}</div>
                <div className="text-[12px] text-white/50 mt-0.5">{drawer.cliente?.nombre}</div>
              </div>
              <button onClick={() => setDrawer(null)} className="text-white/50 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {/* Estado y progreso */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <EstadoBadge nombre={drawer.estado?.nombre || 'Borrador'} />
                  {SIGUIENTE[drawer.estado?.nombre] && (
                    <button onClick={() => avanzarEstado(drawer)}
                      className="px-3 py-1.5 bg-[#1B3A6B] text-white text-[12px] font-semibold rounded-[7px] hover:bg-[#1E4D8C] transition-colors">
                      → {SIGUIENTE[drawer.estado?.nombre]}
                    </button>
                  )}
                </div>
                {/* Timeline horizontal */}
                <div className="flex items-start gap-0 mt-2">
                  {PASOS.map((p, i) => {
                    const est = drawer.estado?.nombre
                    const idx = est === 'Alerta' ? PASOS.indexOf('Activo') : PASOS.indexOf(est)
                    const isAlerta = est === 'Alerta' && i === PASOS.indexOf('Activo')
                    const st = isAlerta ? 'alerta' : i < idx ? 'done' : i === idx ? 'active' : 'pending'
                    return (
                      <div key={p} className="flex-1 flex flex-col items-center relative">
                        {i > 0 && (
                          <div className={`absolute top-3 right-1/2 w-full h-0.5 ${st === 'done' || st === 'active' ? 'bg-[#2EB5D4]' : st === 'alerta' ? 'bg-red-400' : 'bg-slate-200'}`} />
                        )}
                        <div className={`w-6 h-6 rounded-full z-10 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                          st === 'done' ? 'bg-[#2EB5D4]' :
                          st === 'active' ? 'bg-white border-2 border-[#2EB5D4]' :
                          st === 'alerta' ? 'bg-red-500' :
                          'bg-white border-2 border-slate-200'
                        }`}>
                          {st === 'done' && <CheckCircle2 size={10} />}
                          {st === 'active' && <div className="w-2 h-2 bg-[#2EB5D4] rounded-full" />}
                          {st === 'alerta' && <AlertCircle size={10} />}
                        </div>
                        <div className={`text-[9.5px] font-semibold mt-1 text-center ${st === 'done' || st === 'active' ? 'text-[#2EB5D4]' : st === 'alerta' ? 'text-red-500' : 'text-slate-400'}`}>{p}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Datos */}
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Detalles</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Cliente</div>
                    <div className="text-[13.5px] text-slate-700 font-medium">{drawer.cliente?.nombre || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Repartidor</div>
                    <div className="text-[13.5px] text-slate-700">{drawer.repartidor?.nombre || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Fecha creación</div>
                    <div className="text-[13px] font-mono text-slate-600">{drawer.fecha_creacion?.split('T')[0] || '—'}</div>
                  </div>
                  {drawer.observaciones && (
                    <div className="col-span-2">
                      <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Observaciones</div>
                      <div className="text-[13px] text-slate-600 italic">{drawer.observaciones}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipos */}
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Equipos ({drawer.equipos?.length || 0})</div>
                {drawer.equipos?.length === 0
                  ? <div className="text-[13px] text-slate-400">Sin equipos asociados</div>
                  : drawer.equipos?.map(oe => (
                    <div key={oe.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-[9px] mb-2">
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-slate-700">{oe.equipo?.tipo_equipo?.marca} {oe.equipo?.tipo_equipo?.modelo}</div>
                        <div className="text-[11px] font-mono text-slate-400">{oe.equipo?.serial} · {oe.equipo?.codigo}</div>
                      </div>
                      {oe.fecha_entrega && <div className="text-[11px] font-mono text-slate-400">{oe.fecha_entrega}</div>}
                    </div>
                  ))
                }
              </div>

              {/* Plantillas */}
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Documentos ({drawer.plantillas?.length || 0})</div>
                {drawer.plantillas?.length === 0
                  ? <div className="text-[13px] text-slate-400">Sin documentos asignados</div>
                  : drawer.plantillas?.map(op => (
                    <div key={op.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-[9px] mb-2">
                      <FileText size={14} className="text-slate-400 flex-shrink-0" />
                      <div className="flex-1 text-[13px] font-medium text-slate-700">{op.plantilla?.nombre || '—'}</div>
                      <span className={`text-[11px] font-semibold ${op.firmado ? 'text-[#0F7B55]' : 'text-slate-400'}`}>
                        {op.firmado ? '✓ Firmado' : 'Pendiente'}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex-shrink-0">
              <button onClick={() => setDrawer(null)}
                className="w-full py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300 transition-all">
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}

      {/* WIZARD NUEVA OS */}
      {wizardOpen && (
        <>
          <div className="fixed inset-0 bg-[#0F2448]/40 z-40 backdrop-blur-sm" onClick={() => setWizardOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[580px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header wizard */}
              <div className="px-6 py-4 border-b flex items-center gap-3 flex-shrink-0 bg-[#1B3A6B]">
                <div className="flex-1">
                  <div className="text-[12px] text-white/50">Paso {wizardPaso} de {PASO_LABELS.length}</div>
                  <div className="text-[15px] font-bold text-white">{PASO_LABELS[wizardPaso - 1]}</div>
                </div>
                {/* Indicadores */}
                <div className="flex gap-1.5">
                  {PASO_LABELS.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i + 1 === wizardPaso ? 'w-6 bg-white' : i + 1 < wizardPaso ? 'w-2 bg-white/60' : 'w-2 bg-white/25'}`} />
                  ))}
                </div>
                <button onClick={() => setWizardOpen(false)} className="text-white/50 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* PASO 1 — Cliente y equipo */}
                {wizardPaso === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Cliente</label>
                      <select value={wForm.cliente_id} onChange={e => setWForm(f => ({ ...f, cliente_id: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4] bg-white">
                        <option value="">Seleccionar cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Equipo</label>
                      <select value={wForm.equipo_id} onChange={e => setWForm(f => ({ ...f, equipo_id: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4] bg-white">
                        <option value="">Seleccionar equipo disponible...</option>
                        {equiposDisponibles.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.tipo_equipo?.marca} {e.tipo_equipo?.modelo} — {e.serial} ({e.codigo})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">
                        Observaciones <span className="text-slate-300 font-normal normal-case">(opcional)</span>
                      </label>
                      <textarea value={wForm.observaciones} onChange={e => setWForm(f => ({ ...f, observaciones: e.target.value }))}
                        placeholder="Notas adicionales..." rows={3}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4] resize-none" />
                    </div>
                  </div>
                )}

                {/* PASO 2 — Repartidor */}
                {wizardPaso === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Repartidor asignado</label>
                      <select value={wForm.repartidor_id} onChange={e => setWForm(f => ({ ...f, repartidor_id: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4] bg-white">
                        <option value="">Sin asignar</option>
                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Fecha programada</label>
                      <input type="date" value={wForm.fecha} onChange={e => setWForm(f => ({ ...f, fecha: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4]" />
                    </div>
                  </div>
                )}

                {/* PASO 3 — Documentos */}
                {wizardPaso === 3 && (
                  <div>
                    <p className="text-[13px] text-slate-500 mb-4">Selecciona los documentos que aplican para esta orden.</p>
                    {plantillas.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <FileText size={32} className="mx-auto mb-2 opacity-40" />
                        <div className="text-[13px]">No hay plantillas configuradas</div>
                        <div className="text-[12px] mt-1">Ve a Configuración → Plantillas para agregarlas</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {plantillas.map(p => {
                          const sel = wForm.plantillas_ids.includes(p.id)
                          return (
                            <button key={p.id} onClick={() => togglePlantilla(p.id)}
                              className={`flex items-center gap-2.5 p-3 rounded-[9px] border-[1.5px] text-left transition-all ${sel ? 'border-[#1B3A6B] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                              <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center ${sel ? 'bg-[#1B3A6B]' : 'border-[1.5px] border-slate-300'}`}>
                                {sel && <CheckCircle2 size={10} className="text-white" />}
                              </div>
                              <span className="text-[12.5px] font-medium text-slate-700">{p.nombre}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 flex justify-between flex-shrink-0">
                <button onClick={() => wizardPaso > 1 ? setWizardPaso(p => p - 1) : setWizardOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300 transition-all">
                  {wizardPaso === 1 ? 'Cancelar' : '← Anterior'}
                </button>
                <button
                  onClick={() => wizardPaso < PASO_LABELS.length ? setWizardPaso(p => p + 1) : crearOrden()}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#1B3A6B] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#1E4D8C] transition-colors disabled:opacity-50">
                  {saving ? 'Creando...' : wizardPaso < PASO_LABELS.length ? 'Siguiente →' : '✓ Crear orden'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-[10px] text-[13px] font-medium text-white shadow-lg ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-[#0F7B55]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}