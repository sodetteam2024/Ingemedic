'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  Plus, X, Search, FileText, CheckCircle2, Package,
  AlertTriangle, Calendar, Clock, User, Edit3, Truck
} from 'lucide-react'

const E = {
  Borrador:   'c0b30011-e902-437d-ab1b-b33f753a04d7',
  Programada: '9430f8fe-008f-494e-ada5-3c667799b26c',
  EnReparto:  'e87fa300-a4c7-4225-b618-faf162ccf7ef',
  Entregada:  'acafaf48-918e-4681-bf31-3111c218bcc9',
  Finalizada: '45383dd9-7f9a-426d-830e-d093f105bef9',
}

const FLUJO = ['Borrador', 'Programada', 'En reparto', 'Entregada', 'Finalizada']

const ESTADO_STYLES = {
  'Borrador':   { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
  'Programada': { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  'En reparto': { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  'Entregada':  { bg: '#E8F7FB', color: '#0E86A0', dot: '#25A9E0' },
  'Finalizada': { bg: '#ECFDF5', color: '#0F7B55', dot: '#0F7B55' },
}

// Transiciones que puede hacer el ADMIN desde el drawer
// En reparto → Entregada lo hace el repartidor desde Entregas
const TRANSICIONES_ADMIN = {
  'Borrador':  { id: E.Programada, nombre: 'Programada', requiereRepartidor: true },
  'Entregada': { id: E.Finalizada, nombre: 'Finalizada',  requiereRepartidor: false },
}

function estaRetrasada(orden) {
  if (!orden.fecha_entrega) return false
  if (orden.estado?.nombre !== 'Programada') return false
  return new Date(orden.fecha_entrega) < new Date()
}

function estaVencida(orden) {
  if (!orden.fecha_vigencia) return false
  return new Date(orden.fecha_vigencia) < new Date()
}

function estaIncompleta(orden) {
  return orden.estado?.nombre === 'Borrador' &&
    (!orden.repartidor_id || !orden.fecha_entrega)
}

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] text-slate-800 outline-none focus:border-[#D81B43] bg-white transition-colors placeholder:text-slate-400'
const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5'

function EstadoBadge({ orden, retrasada }) {
  const nombre = orden?.estado?.nombre || 'Borrador'
  const incompleta = estaIncompleta(orden || {})
  const s = ESTADO_STYLES[nombre] || ESTADO_STYLES['Borrador']

  if (retrasada) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#D81B43]">
      <AlertTriangle size={10} /> Retrasada
    </span>
  )
  if (incompleta) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-dashed border-slate-300">
      <AlertTriangle size={10} className="text-[#B45309]" /> Sin programar
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ background: s.bg, color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {nombre}
    </span>
  )
}

function TimelineBar({ estadoNombre }) {
  const idx = FLUJO.indexOf(estadoNombre)
  return (
    <div className="flex items-center gap-0.5">
      {FLUJO.map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
          i < idx ? 'bg-[#D81B43]' : i === idx ? 'bg-[#D81B43] opacity-40' : 'bg-slate-200'
        }`} />
      ))}
    </div>
  )
}

function nombreEquipo(eq) {
  return eq?.tipo_equipo?.atributos?.nombre || eq?.tipo_equipo?.nombre || '—'
}

export default function OrdenesClient({
  ordenesIniciales, clientes, estados, plantillas, equiposDisponibles, usuarios, tipos
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [ordenes, setOrdenes]           = useState(ordenesIniciales)
  const [search, setSearch]             = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [drawer, setDrawer]             = useState(null)
  const [editRepartidor, setEditRepartidor] = useState(false)
  const [nuevoRepartidor, setNuevoRepartidor] = useState('')
  const [editFecha, setEditFecha] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [wizardOpen, setWizardOpen]     = useState(false)
  const [wizardPaso, setWizardPaso]     = useState(1)
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState(null)
  const [modalConfirm, setModalConfirm] = useState(null)
  const [wForm, setWForm] = useState({
    tipo_orden_id: '', cliente_id: '', equipos_ids: [], observaciones: '',
    repartidor_id: '', recibido_por: '', fecha_entrega: '', fecha_vigencia: '',
    plantillas_ids: [],
  })

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3200)
  }

  const stats = useMemo(() => ({
    total:      ordenes.length,
    borrador:   ordenes.filter(o => o.estado?.nombre === 'Borrador').length,
    programada: ordenes.filter(o => o.estado?.nombre === 'Programada').length,
    enReparto:  ordenes.filter(o => o.estado?.nombre === 'En reparto').length,
    entregada:  ordenes.filter(o => o.estado?.nombre === 'Entregada').length,
    finalizada: ordenes.filter(o => o.estado?.nombre === 'Finalizada').length,
  }), [ordenes])

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      const mq = !search || [o.codigo, o.cliente?.nombre, o.repartidor?.nombre]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()))
      const me = !filtroEstado || o.estado?.nombre === filtroEstado
      return mq && me
    })
  }, [ordenes, search, filtroEstado])

  // ── ABRIR DRAWER ────────────────────────────────────────
  function abrirDrawer(orden) {
    setDrawer(orden)
    setEditRepartidor(false)
    setNuevoRepartidor(orden.repartidor_id || '')
    setEditFecha(false)
    setNuevaFecha(orden.fecha_entrega ? orden.fecha_entrega.slice(0, 16) : '')
  }

  // ── AVANZAR ESTADO ──────────────────────────────────────
  async function avanzarEstado(orden, transicion) {
    if (transicion.requiereRepartidor && !orden.repartidor_id) {
      showToast('Asigna un repartidor primero', 'error')
      return
    }
    const { error } = await supabase.from('ordenes_servicio')
      .update({ estado_id: transicion.id }).eq('id', orden.id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    const nuevoEstado = { id: transicion.id, nombre: transicion.nombre }
    setOrdenes(prev => prev.map(o => o.id === orden.id ? { ...o, estado: nuevoEstado } : o))
    setDrawer(prev => ({ ...prev, estado: nuevoEstado }))
    setModalConfirm(null)
    showToast(`Orden → ${transicion.nombre}`)
  }

  // ── GUARDAR FECHA ENTREGA ────────────────────────────────
  async function guardarFecha() {
    if (!nuevaFecha) { showToast('Selecciona fecha y hora', 'error'); return }
    const { data, error } = await supabase.from('ordenes_servicio')
      .update({ fecha_entrega: nuevaFecha })
      .eq('id', drawer.id)
      .select('estado_id, estado:estados_orden(id, nombre)')
      .single()
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    const nuevoEstado = data?.estado || drawer.estado
    const updOrden = { ...drawer, fecha_entrega: nuevaFecha, estado: nuevoEstado }
    setOrdenes(prev => prev.map(o => o.id === drawer.id ? updOrden : o))
    setDrawer(updOrden)
    setEditFecha(false)
    showToast(nuevoEstado?.nombre === 'Programada' ? '✓ Fecha guardada — orden programada' : 'Fecha guardada')
  }

  // ── REASIGNAR REPARTIDOR ─────────────────────────────────
  async function guardarRepartidor() {
    if (!nuevoRepartidor) { showToast('Selecciona un repartidor', 'error'); return }
    const { data, error } = await supabase.from('ordenes_servicio')
      .update({ repartidor_id: nuevoRepartidor })
      .eq('id', drawer.id)
      .select('estado_id, estado:estados_orden(id, nombre)')
      .single()
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    const rep = usuarios.find(u => u.id === nuevoRepartidor)
    // El trigger puede haber cambiado el estado a Programada
    const nuevoEstado = data?.estado || drawer.estado
    const updOrden = { ...drawer, repartidor_id: nuevoRepartidor, repartidor: rep || drawer.repartidor, estado: nuevoEstado }
    setOrdenes(prev => prev.map(o => o.id === drawer.id ? updOrden : o))
    setDrawer(updOrden)
    setEditRepartidor(false)
    showToast(nuevoEstado?.nombre === 'Programada' ? '✓ Repartidor asignado — orden programada' : 'Repartidor asignado')
  }

  // ── WIZARD ──────────────────────────────────────────────
  function abrirWizard() {
    setWForm({
      tipo_orden_id: '', cliente_id: '', equipos_ids: [], observaciones: '',
      repartidor_id: '', recibido_por: '', fecha_entrega: '', fecha_vigencia: '',
      plantillas_ids: [],
    })
    setWizardPaso(1)
    setWizardOpen(true)
  }

  function toggleEquipo(id) {
    setWForm(f => ({
      ...f,
      equipos_ids: f.equipos_ids.includes(id)
        ? f.equipos_ids.filter(x => x !== id)
        : [...f.equipos_ids, id]
    }))
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
    if (!wForm.tipo_orden_id)           { showToast('Selecciona el tipo de orden', 'error'); return }
    if (!wForm.cliente_id)              { showToast('Selecciona un cliente', 'error'); return }
    if (wForm.equipos_ids.length === 0) { showToast('Selecciona al menos un equipo', 'error'); return }
    setSaving(true)

    const anio   = new Date().getFullYear()
    const { count } = await supabase.from('ordenes_servicio').select('*', { count: 'exact', head: true })
    const codigo = `OS-${anio}-${String((count || 0) + 1).padStart(3, '0')}`

    const { data: nuevaOrden, error: errOrden } = await supabase
      .from('ordenes_servicio')
      .insert({
        codigo,
        tipo_orden_id:  wForm.tipo_orden_id,
        cliente_id:     wForm.cliente_id,
        estado_id:      E.Borrador,
        repartidor_id:  wForm.repartidor_id  || null,
        recibido_por:   wForm.recibido_por   || null,
        observaciones:  wForm.observaciones  || null,
        fecha_entrega:  wForm.fecha_entrega  || null,
        fecha_vigencia: wForm.fecha_vigencia || null,
      })
      .select(`
        *,
        cliente:clientes(id, nombre, tipo_persona, nit_cc),
        estado:estados_orden(id, nombre),
        repartidor:usuarios!ordenes_servicio_repartidor_id_fkey(id, nombre),
        equipos:orden_equipos(
          id, equipo_id, fecha_entrega, fecha_devolucion,
          equipo:equipos(id, codigo, serial,
            tipo_equipo:tipos_equipo(id, nombre, atributos,
              categoria:categorias_equipo(id, nombre)
            )
          )
        ),
        plantillas:orden_plantillas(
          id, plantilla_id, firmado, firmado_por, firma_iniciales, fecha_firma,
          plantilla:plantillas_orden(id, nombre)
        )
      `)
      .single()

    if (errOrden) { showToast('Error: ' + errOrden.message, 'error'); setSaving(false); return }

    if (wForm.equipos_ids.length > 0) {
      await supabase.from('orden_equipos').insert(
        wForm.equipos_ids.map(eqId => ({
          orden_id:  nuevaOrden.id,
          equipo_id: eqId,
        }))
      )
    }

    if (wForm.plantillas_ids.length > 0) {
      await supabase.from('orden_plantillas').insert(
        wForm.plantillas_ids.map(pid => ({
          orden_id:     nuevaOrden.id,
          plantilla_id: pid,
          firmado:      false,
        }))
      )
    }

    setOrdenes(prev => [nuevaOrden, ...prev])
    setSaving(false)
    setWizardOpen(false)
    // Abrir drawer automáticamente con la orden recién creada
    abrirDrawer(nuevaOrden)
    showToast('Orden creada')
  }

  const PASOS = ['Tipo y cliente', 'Equipos', 'Logística', 'Documentos']

  // ── DRAWER: info de la orden ─────────────────────────────
  const drawerEstado    = drawer?.estado?.nombre || 'Borrador'
  const drawerRetrasada = drawer ? estaRetrasada(drawer) : false
  const drawerVencida   = drawer ? estaVencida(drawer) : false
  const drawerIncompleta = drawer ? estaIncompleta(drawer) : false
  // Admin solo puede finalizar (Entregada → Finalizada)
  // Borrador → Programada es automático vía trigger al asignar repartidor + fecha
  const transicion      = drawer && drawerEstado === 'Entregada'
    ? { id: E.Finalizada, nombre: 'Finalizada', requiereRepartidor: false }
    : null
  const puedeEdRep      = drawer && ['Borrador', 'Programada'].includes(drawerEstado)

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Topbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-slate-800">Órdenes de servicio</div>
          <div className="text-[12px] text-slate-400 mt-0.5">{ordenes.length} órdenes registradas</div>
        </div>
        <button data-tour="btn-nueva-orden" onClick={abrirWizard}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F] transition-colors">
          <Plus size={14} strokeWidth={2.5} /> Nueva orden
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 flex-shrink-0">
          {[
            { label: 'Total',       value: stats.total,      color: '#1E293B', f: '' },
            { label: 'Borrador',    value: stats.borrador,   color: '#64748B', f: 'Borrador' },
            { label: 'Programada',  value: stats.programada, color: '#1D4ED8', f: 'Programada' },
            { label: 'En reparto',  value: stats.enReparto,  color: '#B45309', f: 'En reparto' },
            { label: 'Entregada',   value: stats.entregada,  color: '#0E86A0', f: 'Entregada' },
            { label: 'Finalizada',  value: stats.finalizada, color: '#0F7B55', f: 'Finalizada' },
          ].map(s => (
            <div key={s.label}
              onClick={() => setFiltroEstado(prev => prev === s.f ? '' : s.f)}
              className={`bg-white rounded-xl border p-3 shadow-sm cursor-pointer transition-all hover:shadow-md ${filtroEstado === s.f && s.f ? 'border-[#D81B43]' : 'border-slate-200'}`}>
              <div className="text-xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10.5px] text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Buscador */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-1 max-w-[320px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código, cliente o repartidor..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white" />
          </div>
          {filtroEstado && (
            <button onClick={() => setFiltroEstado('')}
              className="flex items-center gap-1 text-[12px] text-slate-400 hover:text-red-500">
              <X size={12} /> Limpiar filtro
            </button>
          )}
          <div className="text-[12px] text-slate-400 ml-auto">
            {ordenesFiltradas.length} orden{ordenesFiltradas.length !== 1 ? 'es' : ''}
          </div>
        </div>

        {/* Tabla */}
        <div data-tour="tabla-ordenes" className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse min-w-[860px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b-2 border-slate-200">
                  {['Código', 'Cliente', 'Equipos', 'Repartidor', 'Estado', 'Progreso', 'Entrega', 'Vigencia', 'Docs'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-400">
                    {search || filtroEstado ? 'Sin resultados' : 'Sin órdenes registradas'}
                  </td></tr>
                )}
                {ordenesFiltradas.map(o => {
                  const nEquipos   = o.equipos?.length || 0
                  const retrasada  = estaRetrasada(o)
                  const vencida    = estaVencida(o)
                  const incompleta = estaIncompleta(o)
                  return (
                    <tr key={o.id}
                      onClick={() => abrirDrawer(o)}
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                        retrasada   ? 'border-l-4 border-l-[#D81B43]' :
                        incompleta  ? 'border-l-4 border-l-[#B45309] opacity-70' : ''
                      }`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12.5px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{o.codigo || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold text-slate-700 max-w-[150px] truncate">{o.cliente?.nombre || '—'}</div>
                        <div className="text-[11px] text-slate-400">{o.cliente?.tipo_persona}</div>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-slate-600">
                        {nEquipos === 0 ? '—' : nEquipos === 1
                          ? <span className="truncate max-w-[120px] block">{nombreEquipo(o.equipos[0]?.equipo)}</span>
                          : `${nEquipos} equipos`}
                      </td>
                      <td className="px-4 py-3 text-[12.5px]">
                        {o.repartidor?.nombre
                          ? <span className="text-slate-500">{o.repartidor.nombre}</span>
                          : <span className="text-[#B45309] text-[11.5px] font-medium flex items-center gap-1"><AlertTriangle size={10} /> Sin asignar</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge orden={o} retrasada={retrasada} />
                      </td>
                      <td className="px-4 py-3 min-w-[100px]"><TimelineBar estadoNombre={o.estado?.nombre} /></td>
                      <td className="px-4 py-3">
                        {o.fecha_entrega
                          ? <span className={`text-[12px] font-mono flex items-center gap-1 ${retrasada ? 'text-[#D81B43] font-bold' : 'text-slate-400'}`}>
                              {retrasada && <AlertTriangle size={10} />}
                              {new Date(o.fecha_entrega).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          : <span className="text-[#B45309] text-[11.5px] font-medium">Sin programar</span>}
                      </td>
                      <td className="px-4 py-3">
                        {o.fecha_vigencia
                          ? <span className={`text-[12px] font-mono ${vencida ? 'text-red-500 font-bold' : 'text-slate-400'}`}>{o.fecha_vigencia}</span>
                          : <span className="text-slate-300 text-[12px]">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-[12px] text-slate-400">
                          <FileText size={12} />{o.plantillas?.length || 0}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── DRAWER DETALLE OS ── */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-full md:w-[500px] bg-white z-30 flex flex-col shadow-2xl">

            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-start justify-between flex-shrink-0 ${drawerRetrasada ? 'bg-[#D81B43]' : 'bg-[#D81B43]'}`}>
              <div>
                <div className="text-[11px] text-white/60">Orden de servicio</div>
                <div className="text-[15px] font-bold text-white font-mono">{drawer.codigo}</div>
                <div className="text-[12px] text-white/70 mt-0.5">{drawer.cliente?.nombre}</div>
              </div>
              <button onClick={() => setDrawer(null)} className="text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">

              {/* Estado + timeline + acción */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <EstadoBadge orden={drawer} retrasada={drawerRetrasada} />
                  {transicion && (
                    <button onClick={() => setModalConfirm({ orden: drawer, transicion })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D81B43] text-white text-[12px] font-semibold rounded-[7px] hover:bg-[#B0172F]">
                      → {transicion.nombre}
                    </button>
                  )}
                  {drawerEstado === 'En reparto' && (
                    <span className="text-[12px] text-[#B45309] bg-[#FFFBEB] px-3 py-1.5 rounded-[7px] border border-[#F59E0B]/30 font-medium flex items-center gap-1.5">
                      <Truck size={12} /> En ruta con el repartidor
                    </span>
                  )}
                </div>

                {/* Aviso orden incompleta */}
                {drawerIncompleta && (
                  <div className="mb-4 p-3 bg-[#FFFBEB] border border-[#F59E0B]/40 rounded-[9px]">
                    <div className="text-[12.5px] font-semibold text-[#B45309] mb-1 flex items-center gap-1.5">
                      <AlertTriangle size={13} /> Orden sin programar
                    </div>
                    <div className="text-[12px] text-[#B45309]/80 space-y-0.5">
                      {!drawer.repartidor_id && <div>• Falta asignar repartidor</div>}
                      {!drawer.fecha_entrega && <div>• Falta fecha y hora de entrega</div>}
                    </div>
                    <div className="text-[11.5px] text-slate-400 mt-2">
                      Esta orden no aparecerá en Entregas hasta que tenga repartidor y fecha programada.
                    </div>
                  </div>
                )}

                {/* Timeline visual */}
                <div className="flex items-start mt-3">
                  {FLUJO.map((paso, i) => {
                    const idx = FLUJO.indexOf(drawerEstado)
                    const st  = i < idx ? 'done' : i === idx ? 'active' : 'pending'
                    return (
                      <div key={paso} className="flex-1 flex flex-col items-center relative">
                        {i > 0 && (
                          <div className={`absolute top-3 right-1/2 w-full h-0.5 ${st === 'done' || st === 'active' ? 'bg-[#D81B43]' : 'bg-slate-200'}`} />
                        )}
                        <div className={`w-6 h-6 rounded-full z-10 flex items-center justify-center flex-shrink-0 ${
                          st === 'done'   ? 'bg-[#D81B43]' :
                          st === 'active' ? 'bg-white border-2 border-[#D81B43]' :
                          'bg-white border-2 border-slate-200'
                        }`}>
                          {st === 'done'   && <CheckCircle2 size={10} className="text-white" />}
                          {st === 'active' && <div className="w-2 h-2 bg-[#D81B43] rounded-full" />}
                        </div>
                        <div className={`text-[9px] font-semibold mt-1 text-center leading-tight ${
                          st === 'done' || st === 'active' ? 'text-[#D81B43]' : 'text-slate-400'
                        }`}>{paso}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Alertas */}
                {drawerRetrasada && (
                  <div className="mt-4 flex items-center gap-2 text-[12px] text-[#D81B43] bg-[#FEF2F2] px-3 py-2.5 rounded-[8px] border border-[#D81B43]/20">
                    <AlertTriangle size={13} /> Entrega retrasada — la hora programada ya pasó
                  </div>
                )}
                {drawerVencida && drawerEstado !== 'Finalizada' && (
                  <div className="mt-3 flex items-center gap-2 text-[12px] text-red-500 bg-red-50 px-3 py-2.5 rounded-[8px] border border-red-200">
                    <Clock size={13} /> Vigencia vencida
                  </div>
                )}
              </div>

              {/* Repartidor — editable */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Repartidor</div>
                  {puedeEdRep && !editRepartidor && (
                    <button onClick={() => { setEditRepartidor(true); setNuevoRepartidor(drawer.repartidor_id || '') }}
                      className="flex items-center gap-1 text-[11.5px] text-[#D81B43] font-semibold hover:underline">
                      <Edit3 size={11} /> {drawer.repartidor ? 'Cambiar' : 'Asignar'}
                    </button>
                  )}
                </div>
                {!editRepartidor ? (
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${drawer.repartidor ? 'bg-[#D81B43]/10 text-[#D81B43]' : 'bg-slate-100 text-slate-400'}`}>
                      {drawer.repartidor ? drawer.repartidor.nombre.charAt(0).toUpperCase() : <User size={14} />}
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-slate-700">{drawer.repartidor?.nombre || 'Sin asignar'}</div>
                      {!drawer.repartidor && drawerEstado === 'Borrador' && (
                        <div className="text-[11px] text-[#B45309]">Requerido para programar</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select value={nuevoRepartidor} onChange={e => setNuevoRepartidor(e.target.value)} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={guardarRepartidor}
                        className="flex-1 py-2 bg-[#D81B43] text-white rounded-[8px] text-[12.5px] font-semibold hover:bg-[#B0172F]">
                        Guardar
                      </button>
                      <button onClick={() => setEditRepartidor(false)}
                        className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-[8px] text-[12.5px] hover:border-slate-300">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Fecha entrega — editable si está en Borrador/Programada */}
              {['Borrador', 'Programada'].includes(drawerEstado) && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">Fecha y hora de entrega</div>
                    {!editFecha && (
                      <button onClick={() => { setEditFecha(true); setNuevaFecha(drawer.fecha_entrega ? drawer.fecha_entrega.slice(0,16) : '') }}
                        className="flex items-center gap-1 text-[11.5px] text-[#D81B43] font-semibold hover:underline">
                        <Edit3 size={11} /> {drawer.fecha_entrega ? 'Cambiar' : 'Programar'}
                      </button>
                    )}
                  </div>
                  {!editFecha ? (
                    drawer.fecha_entrega
                      ? <div className={`text-[13.5px] font-semibold ${drawerRetrasada ? 'text-[#D81B43]' : 'text-slate-700'}`}>
                          {new Date(drawer.fecha_entrega).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      : <div className="text-[12.5px] text-[#B45309] font-medium flex items-center gap-1.5">
                          <AlertTriangle size={12} /> Sin programar
                        </div>
                  ) : (
                    <div className="space-y-2">
                      <input type="datetime-local" value={nuevaFecha}
                        onChange={e => setNuevaFecha(e.target.value)} className={inputCls} />
                      <div className="flex gap-2">
                        <button onClick={guardarFecha}
                          className="flex-1 py-2 bg-[#D81B43] text-white rounded-[8px] text-[12.5px] font-semibold hover:bg-[#B0172F]">
                          Guardar
                        </button>
                        <button onClick={() => setEditFecha(false)}
                          className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-[8px] text-[12.5px] hover:border-slate-300">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Datos generales */}
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Detalles</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Cliente',        value: drawer.cliente?.nombre },
                    { label: 'Recibido por',   value: drawer.recibido_por || '—' },
                    { label: 'Fecha entrega',  value: drawer.fecha_entrega ? new Date(drawer.fecha_entrega).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
                    { label: 'Vigencia',       value: drawer.fecha_vigencia || '—' },
                    { label: 'Fecha creación', value: drawer.fecha_creacion?.split('T')[0] || '—' },
                  ].map(f => (
                    <div key={f.label}>
                      <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1">{f.label}</div>
                      <div className={`text-[13px] font-medium ${
                        f.label === 'Vigencia' && drawerVencida ? 'text-red-500' :
                        f.label === 'Fecha entrega' && drawerRetrasada ? 'text-[#D81B43]' :
                        'text-slate-700'
                      }`}>{f.value}</div>
                    </div>
                  ))}
                  {drawer.observaciones && (
                    <div className="col-span-2">
                      <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Observaciones</div>
                      <div className="text-[13px] text-slate-600 italic">{drawer.observaciones}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Equipos */}
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">
                  Equipos ({drawer.equipos?.length || 0})
                </div>
                {!drawer.equipos?.length
                  ? <div className="text-[13px] text-slate-400">Sin equipos asociados</div>
                  : <div className="space-y-2">
                      {drawer.equipos.map(oe => (
                        <div key={oe.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-[9px] border border-slate-200">
                          <Package size={14} className="text-slate-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-slate-700 truncate">{nombreEquipo(oe.equipo)}</div>
                            <div className="text-[11px] font-mono text-slate-400">{oe.equipo?.serial} · {oe.equipo?.codigo}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>

              {/* Documentos */}
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">
                  Documentos ({drawer.plantillas?.length || 0})
                </div>
                {!drawer.plantillas?.length
                  ? <div className="text-[13px] text-slate-400">Sin documentos asignados</div>
                  : <div className="space-y-2">
                      {drawer.plantillas.map(op => (
                        <div key={op.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-[9px]">
                          <FileText size={14} className="text-slate-400 flex-shrink-0" />
                          <div className="flex-1 text-[13px] font-medium text-slate-700">{op.plantilla?.nombre || '—'}</div>
                          <span className={`text-[11px] font-semibold ${op.firmado ? 'text-[#0F7B55]' : 'text-slate-400'}`}>
                            {op.firmado ? '✓ Firmado' : 'Pendiente'}
                          </span>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── WIZARD ── */}
      {wizardOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setWizardOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[calc(100vh-2rem)] flex flex-col shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>

              <div className="px-6 py-4 border-b flex items-center gap-3 flex-shrink-0 bg-[#D81B43]">
                <div className="flex-1">
                  <div className="text-[11px] text-white/60">Paso {wizardPaso} de {PASOS.length}</div>
                  <div className="text-[15px] font-bold text-white">{PASOS[wizardPaso - 1]}</div>
                </div>
                <div className="flex gap-1.5">
                  {PASOS.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i + 1 === wizardPaso ? 'w-6 bg-white' : i + 1 < wizardPaso ? 'w-2 bg-white/60' : 'w-2 bg-white/25'}`} />
                  ))}
                </div>
                <button onClick={() => setWizardOpen(false)} className="text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">

                {/* PASO 1 — Tipo y cliente */}
                {wizardPaso === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Tipo de orden <span className="text-[#D81B43]">*</span></label>
                      <select value={wForm.tipo_orden_id} onChange={e => setWForm(f => ({ ...f, tipo_orden_id: e.target.value }))} className={inputCls}>
                        <option value="">Seleccionar...</option>
                        {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Cliente <span className="text-[#D81B43]">*</span></label>
                      <select value={wForm.cliente_id} onChange={e => setWForm(f => ({ ...f, cliente_id: e.target.value }))} className={inputCls}>
                        <option value="">Seleccionar cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Observaciones</label>
                      <textarea value={wForm.observaciones} onChange={e => setWForm(f => ({ ...f, observaciones: e.target.value }))}
                        placeholder="Notas adicionales..." rows={3}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#D81B43] resize-none placeholder:text-slate-400" />
                    </div>
                  </div>
                )}

                {/* PASO 2 — Equipos */}
                {wizardPaso === 2 && (
                  <div className="space-y-3">
                    <label className={labelCls}>Equipos disponibles <span className="text-[#D81B43]">*</span></label>
                    {equiposDisponibles.length === 0 ? (
                      <div className="text-[13px] text-slate-400 py-6 text-center border border-slate-200 rounded-[9px]">
                        No hay equipos disponibles en inventario
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[340px] overflow-y-auto border border-slate-200 rounded-[9px] p-2">
                        {equiposDisponibles.map(eq => {
                          const sel = wForm.equipos_ids.includes(eq.id)
                          return (
                            <button key={eq.id} onClick={() => toggleEquipo(eq.id)}
                              className={`w-full flex items-center gap-2.5 p-2.5 rounded-[8px] border-[1.5px] text-left transition-all ${sel ? 'border-[#D81B43] bg-[#D81B43]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                              <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center ${sel ? 'bg-[#D81B43]' : 'border-[1.5px] border-slate-300'}`}>
                                {sel && <CheckCircle2 size={10} className="text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-slate-700 truncate">{nombreEquipo(eq)}</div>
                                <div className="text-[11px] font-mono text-slate-400">{eq.serial} · {eq.codigo}</div>
                              </div>
                              <div className="text-[11px] text-slate-400 flex-shrink-0">{eq.tipo_equipo?.categoria?.nombre}</div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {wForm.equipos_ids.length > 0 && (
                      <div className="text-[12px] text-[#D81B43] font-semibold">
                        {wForm.equipos_ids.length} equipo{wForm.equipos_ids.length !== 1 ? 's' : ''} seleccionado{wForm.equipos_ids.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* PASO 3 — Logística */}
                {wizardPaso === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Repartidor asignado</label>
                      <select value={wForm.repartidor_id} onChange={e => setWForm(f => ({ ...f, repartidor_id: e.target.value }))} className={inputCls}>
                        <option value="">Sin asignar (se puede asignar luego)</option>
                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Recibido por</label>
                      <input value={wForm.recibido_por} onChange={e => setWForm(f => ({ ...f, recibido_por: e.target.value }))}
                        placeholder="Nombre de quien recibe" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Fecha y hora de entrega</label>
                        <input type="datetime-local" value={wForm.fecha_entrega}
                          onChange={e => setWForm(f => ({ ...f, fecha_entrega: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Fecha de vigencia</label>
                        <input type="date" value={wForm.fecha_vigencia}
                          onChange={e => setWForm(f => ({ ...f, fecha_vigencia: e.target.value }))} className={inputCls} />
                      </div>
                    </div>
                    {wForm.fecha_vigencia && (
                      <div className="flex items-center gap-2 text-[12px] text-[#0E86A0] bg-[#E8F7FB] px-3 py-2 rounded-[8px]">
                        <Calendar size={13} />
                        La orden se finalizará automáticamente el {wForm.fecha_vigencia}
                      </div>
                    )}
                  </div>
                )}

                {/* PASO 4 — Documentos */}
                {wizardPaso === 4 && (
                  <div>
                    <p className="text-[13px] text-slate-500 mb-4">Selecciona los documentos que aplican para esta orden.</p>
                    {plantillas.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 border border-slate-200 rounded-[9px]">
                        <FileText size={32} className="mx-auto mb-2 opacity-30" />
                        <div className="text-[13px]">No hay plantillas configuradas</div>
                        <div className="text-[12px] mt-1">Ve a Configuración → Plantillas</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {plantillas.map(p => {
                          const sel = wForm.plantillas_ids.includes(p.id)
                          return (
                            <button key={p.id} onClick={() => togglePlantilla(p.id)}
                              className={`flex items-center gap-2.5 p-3 rounded-[9px] border-[1.5px] text-left transition-all ${sel ? 'border-[#D81B43] bg-[#D81B43]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                              <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center ${sel ? 'bg-[#D81B43]' : 'border-[1.5px] border-slate-300'}`}>
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

              <div className="px-6 py-4 border-t border-slate-200 flex justify-between flex-shrink-0 bg-white">
                <button onClick={() => wizardPaso > 1 ? setWizardPaso(p => p - 1) : setWizardOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">
                  {wizardPaso === 1 ? 'Cancelar' : '← Anterior'}
                </button>
                <button onClick={() => wizardPaso < PASOS.length ? setWizardPaso(p => p + 1) : crearOrden()}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F] disabled:opacity-50">
                  {saving ? 'Creando...' : wizardPaso < PASOS.length ? 'Siguiente →' : '✓ Crear orden'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL CONFIRMACIÓN CAMBIO ESTADO ── */}
      {modalConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[380px] p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-[#D81B43]/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={22} className="text-[#D81B43]" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-2 text-center">Cambiar estado</h3>
              <p className="text-[13px] text-slate-500 text-center mb-1">
                <span className="font-semibold text-slate-700">{modalConfirm.orden.codigo}</span>
              </p>
              <p className="text-[13px] text-center text-slate-400 mb-2">
                {modalConfirm.orden.estado?.nombre} → <span className="font-bold text-[#D81B43]">{modalConfirm.transicion.nombre}</span>
              </p>
              {modalConfirm.transicion.nombre === 'Programada' && !modalConfirm.orden.fecha_entrega && (
                <div className="text-[12px] text-[#B45309] bg-[#FFFBEB] px-3 py-2 rounded-[8px] mb-4 text-center">
                  No hay fecha de entrega programada
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => avanzarEstado(modalConfirm.orden, modalConfirm.transicion)}
                  className="flex-1 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F]">
                  Confirmar
                </button>
                <button onClick={() => setModalConfirm(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-[9px] text-[13px] font-semibold hover:bg-slate-200">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[70] px-4 py-3 rounded-[10px] text-[13px] font-medium text-white shadow-lg ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-[#0F7B55]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}