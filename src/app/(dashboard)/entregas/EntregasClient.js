'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  Package, CheckCircle2, Clock, Truck, X, Search,
  MapPin, Phone, FileText, User, AlertTriangle,
  ArrowUpRight, ArrowDownLeft, Filter, Calendar
} from 'lucide-react'

const ESTADOS_ENTREGA = {
  NoIniciada: '14b43a74-439d-4647-855e-4693339db133',
  EnProgreso: '00baf9e1-8e9d-4da5-b16d-acbfdf3b4354',
  Completada: 'b1f845f1-d69e-4ec8-985b-c7f27c50818c',
}
const ESTADO_OS_ENTREGADA = 'acafaf48-918e-4681-bf31-3111c218bcc9'

const TL_STEPS = ['Programada', 'En ruta', 'Entregada']

// ── CRONÓMETRO ──────────────────────────────────────────────
function calcDuracion(inicio, fin) {
  const ms = (fin ? new Date(fin) : new Date()) - new Date(inicio)
  const h  = Math.floor(ms / 3600000)
  const m  = Math.floor((ms % 3600000) / 60000)
  const s  = Math.floor((ms % 60000) / 1000)
  return `${h ? h + 'h ' : ''}${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`
}

function Cronometro({ inicio, fin, completada }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (completada || fin) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [completada, fin])
  const dur = calcDuracion(inicio, fin || null)
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-mono font-semibold px-2.5 py-1 rounded-[7px] ${
      completada || fin
        ? 'bg-[#ECFDF5] text-[#0F7B55]'
        : 'bg-[#FFFBEB] text-[#B45309]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${completada || fin ? 'bg-[#0F7B55]' : 'bg-[#F59E0B] animate-pulse'}`} />
      ⏱ {dur}
    </span>
  )
}

function TimelineHorizontal({ estadoNombre, inicio, fin, horaProg, alerta }) {
  // estados_entrega: 'No iniciada' → 0, 'En progreso' → 1, 'Completada' → 2
  const idx = estadoNombre === 'Completada' ? 2 : estadoNombre === 'En progreso' ? 1 : 0
  const horas = [
    horaProg || '—',
    inicio ? new Date(inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—',
    fin     ? new Date(fin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })   : '—',
  ]
  return (
    <div className="flex items-start gap-0">
      {TL_STEPS.map((paso, i) => {
        const st = i < idx ? 'done' : i === idx ? 'current' : 'pending'
        const isAlerta = alerta && i === idx
        return (
          <div key={paso} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <div className={`absolute top-[11px] right-1/2 w-full h-0.5 ${
                st === 'done' ? 'bg-[#25A9E0]' : isAlerta ? 'bg-[#D81B43]' : 'bg-slate-200'
              }`} />
            )}
            <div className={`w-6 h-6 rounded-full z-10 flex items-center justify-center flex-shrink-0 border-2 transition-all ${
              st === 'done'    ? 'bg-[#25A9E0] border-[#25A9E0]' :
              isAlerta         ? 'bg-[#D81B43] border-[#D81B43] animate-pulse' :
              st === 'current' ? 'bg-white border-[#25A9E0] shadow-[0_0_0_3px_rgba(37,169,224,0.18)]' :
              'bg-white border-slate-200'
            }`}>
              {st === 'done' && <CheckCircle2 size={11} className="text-white" />}
              {st === 'current' && !isAlerta && <div className="w-2 h-2 bg-[#25A9E0] rounded-full" />}
              {isAlerta && <AlertTriangle size={10} className="text-white" />}
            </div>
            <div className={`text-[9px] font-semibold mt-1 text-center leading-tight ${
              st === 'done' ? 'text-[#25A9E0]' : isAlerta ? 'text-[#D81B43]' : st === 'current' ? 'text-slate-700 font-bold' : 'text-slate-400'
            }`}>{paso}</div>
            <div className="text-[9px] text-slate-400 mt-0.5 text-center">{horas[i]}</div>
          </div>
        )
      })}
    </div>
  )
}

function nombreEquipo(eq) {
  return eq?.tipo_equipo?.atributos?.nombre || eq?.tipo_equipo?.nombre || '—'
}

function estaRetrasada(item) {
  if (!item.fecha_inicio || item.estado?.nombre === 'Completada') return false
  return (new Date() - new Date(item.fecha_inicio)) / 3600000 > 4
}

// ── PAD DE FIRMA ────────────────────────────────────────────
function FirmaPad({ onFirma, onLimpiar }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const [vacio, setVacio] = useState(true)

  function getPos(e, canvas) {
    const r  = canvas.getBoundingClientRect()
    const sx = canvas.width / r.width
    const sy = canvas.height / r.height
    const src = e.touches ? e.touches[0] : e
    return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy }
  }
  function start(e) {
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e, canvasRef.current)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    drawing.current = true; setVacio(false)
  }
  function move(e) {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e, canvasRef.current)
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1B3A6B'
    ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
  }
  function end() {
    drawing.current = false
    onFirma(canvasRef.current.toDataURL())
  }
  function limpiar() {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setVacio(true); onLimpiar()
  }
  return (
    <div>
      <div className="border-2 border-dashed border-slate-300 rounded-[10px] overflow-hidden bg-[#F8FAFC] relative">
        <canvas ref={canvasRef} width={480} height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        {vacio && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[12px] text-slate-300 font-medium">Firme aquí</span>
          </div>
        )}
      </div>
      <button onClick={limpiar} className="mt-1.5 text-[12px] text-slate-400 hover:text-red-500 transition-colors">
        Limpiar firma
      </button>
    </div>
  )
}

export default function EntregasClient({ entregasIniciales, ordenesEnReparto, estados }) {
  const router   = useRouter()
  const supabase = createClient()

  const [entregas, setEntregas]           = useState(entregasIniciales)
  const [ordenes, setOrdenes]             = useState(ordenesEnReparto)
  const [search, setSearch]               = useState('')
  const [filtroEstado, setFiltroEstado]   = useState('')
  const [filtroRep, setFiltroRep]         = useState('')
  const [filtroFecha, setFiltroFecha]     = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [showFiltros, setShowFiltros]     = useState(false)
  const [drawer, setDrawer]               = useState(null)
  const [modalOrden, setModalOrden]       = useState(null)
  const [modalRegistro, setModalRegistro] = useState(null)
  const [paso, setPaso]                   = useState(0) // 0=nombre, 1..n=docs
  const [saving, setSaving]               = useState(false)
  const [toast, setToast]                 = useState(null)
  const [regForm, setRegForm]             = useState({ recibido_por: '', observaciones: '', firmas: {} })

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3200)
  }

  // Repartidores únicos para filtro
  const repartidores = useMemo(() => {
    const set = new Set()
    ordenes.forEach(o => o.repartidor?.nombre && set.add(o.repartidor.nombre))
    entregas.forEach(e => e.repartidor?.nombre && set.add(e.repartidor.nombre))
    return [...set].sort()
  }, [ordenes, entregas])

  const stats = useMemo(() => ({
    totalHoy:    ordenes.length + entregas.filter(e => e.estado?.nombre === 'En progreso').length,
    pendientes:  ordenes.length,
    enRuta:      entregas.filter(e => e.estado?.nombre === 'En progreso').length,
    completadas: entregas.filter(e => e.estado?.nombre === 'Completada').length,
  }), [entregas, ordenes])

  // Órdenes sin entrega activa
  const ordenesConEntrega = useMemo(() => new Set(entregas.map(e => e.orden_id)), [entregas])

  const porRepartidor = useMemo(() => {
    const todos = [
      ...ordenes.filter(o => !ordenesConEntrega.has(o.id)).map(o => ({
        _tipo: 'pendiente',
        _repartidor: o.repartidor?.nombre || 'Sin asignar',
        _rid: o.repartidor?.id || 'none',
        ...o
      })),
      ...entregas.map(e => ({
        _tipo: 'entrega',
        _repartidor: e.repartidor?.nombre || 'Sin asignar',
        _rid: e.repartidor?.id || 'none',
        ...e
      })),
    ].filter(item => {
      const codigo   = item._tipo === 'pendiente' ? item.codigo : item.orden?.codigo
      const cliente  = item._tipo === 'pendiente' ? item.cliente?.nombre : item.cliente?.nombre
      const estadoN  = item._tipo === 'pendiente' ? 'No iniciada' : item.estado?.nombre
      const fechaRaw = item._tipo === 'pendiente' ? item.fecha_creacion : item.fecha_creacion
      const fecha    = fechaRaw?.split('T')[0] || ''

      const mq  = !search || [codigo, cliente, item._repartidor].some(v => v?.toLowerCase().includes(search.toLowerCase()))
      const me  = !filtroEstado  || estadoN === filtroEstado
      const mr  = !filtroRep     || item._repartidor === filtroRep
      const mf  = !filtroFecha   || fecha === filtroFecha
      const mc  = !filtroCliente || cliente?.toLowerCase().includes(filtroCliente.toLowerCase())
      return mq && me && mr && mf && mc
    })

    // Ordenar: En progreso primero, pendiente, completada
    const orden = { 'En progreso': 0, 'No iniciada': 1, 'Completada': 2 }
    todos.sort((a, b) => {
      const ea = a._tipo === 'pendiente' ? 'No iniciada' : a.estado?.nombre
      const eb = b._tipo === 'pendiente' ? 'No iniciada' : b.estado?.nombre
      return (orden[ea] ?? 1) - (orden[eb] ?? 1)
    })

    const grupos = {}
    todos.forEach(item => {
      const key = item._rid
      if (!grupos[key]) grupos[key] = { nombre: item._repartidor, items: [] }
      grupos[key].items.push(item)
    })
    return Object.values(grupos)
  }, [ordenes, entregas, ordenesConEntrega, search, filtroEstado, filtroRep, filtroFecha, filtroCliente])

  // ── INICIAR ENTREGA ──────────────────────────────────────
  async function iniciarEntrega(orden) {
    setSaving(true)
    const codigo = `ENT-${new Date().getFullYear()}-${String(entregas.length + 1).padStart(3, '0')}`

    // Cambiar OS a "En reparto"
    await supabase.from('ordenes_servicio')
      .update({ estado_id: 'e87fa300-a4c7-4225-b618-faf162ccf7ef' })
      .eq('id', orden.id)

    const { data, error } = await supabase.from('entregas').insert({
      codigo,
      orden_id:         orden.id,
      cliente_id:       orden.cliente?.id,
      repartidor_id:    orden.repartidor?.id || null,
      tipo:             'entrega',
      estado_id:        ESTADOS_ENTREGA.EnProgreso,
      fecha_asignacion: new Date().toISOString(),
      fecha_inicio:     new Date().toISOString(),
    })
    .select(`
      *,
      orden:ordenes_servicio(
        id, codigo, fecha_vigencia, fecha_entrega, observaciones,
        cliente:clientes(id, nombre, tipo_persona, nit_cc, direccion, telefono),
        equipos:orden_equipos(id, equipo_id, equipo:equipos(id, codigo, serial, tipo_equipo:tipos_equipo(id, nombre, atributos))),
        plantillas:orden_plantillas(id, plantilla_id, firmado, firmado_por, firma_iniciales, fecha_firma, plantilla:plantillas_orden(id, nombre))
      ),
      cliente:clientes(id, nombre),
      repartidor:usuarios!entregas_repartidor_id_fkey(id, nombre),
      estado:estados_entrega(id, nombre)
    `)
    .single()

    if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
    setOrdenes(prev => prev.filter(o => o.id !== orden.id))
    setEntregas(prev => [data, ...prev])
    setSaving(false)
    setModalOrden(null)
    showToast('Entrega iniciada — en ruta 🚚')
    setDrawer(data)
  }

  // ── ABRIR MODAL FIRMA ────────────────────────────────────
  function abrirRegistro(entrega) {
    setModalRegistro(entrega)
    setPaso(0)
    setRegForm({ recibido_por: entrega.recibido_por || '', observaciones: '', firmas: {} })
  }

  // ── COMPLETAR ENTREGA ────────────────────────────────────
  async function completarEntrega() {
    if (!regForm.recibido_por?.trim()) { showToast('Ingresa quién recibe', 'error'); return }
    setSaving(true)
    const ahora   = new Date().toISOString()
    const inicio  = modalRegistro.fecha_inicio ? new Date(modalRegistro.fecha_inicio) : new Date()
    const duracion = Math.round((new Date() - inicio) / 60000)

    const { error } = await supabase.from('entregas').update({
      estado_id:        ESTADOS_ENTREGA.Completada,
      recibido_por:     regForm.recibido_por.trim(),
      firma_iniciales:  Object.values(regForm.firmas)[0] || null,
      observaciones:    regForm.observaciones || null,
      fecha_completada: ahora,
      duracion_minutos: duracion,
    }).eq('id', modalRegistro.id)

    if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }

    await supabase.from('ordenes_servicio')
      .update({ estado_id: ESTADO_OS_ENTREGADA, recibido_por: regForm.recibido_por.trim() })
      .eq('id', modalRegistro.orden?.id)

    const nuevoEstado = { id: ESTADOS_ENTREGA.Completada, nombre: 'Completada' }
    setEntregas(prev => prev.map(e => e.id === modalRegistro.id
      ? { ...e, estado: nuevoEstado, recibido_por: regForm.recibido_por, fecha_completada: ahora }
      : e
    ))
    if (drawer?.id === modalRegistro.id) setDrawer(prev => ({ ...prev, estado: nuevoEstado }))
    setSaving(false)
    setModalRegistro(null)
    showToast('Entrega completada ✓')
    router.refresh()
  }

  const plantillasOrden = modalRegistro?.orden?.plantillas || []
  const totalPasos      = plantillasOrden.length + 1 // paso 0 + un paso por doc
  const docActual       = paso > 0 ? plantillasOrden[paso - 1] : null

  const hayFiltros = filtroEstado || filtroRep || filtroFecha || filtroCliente

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-slate-800">Entregas</div>
          <div className="text-[12px] text-slate-400 mt-0.5">Rutas del día · En tiempo real</div>
        </div>
        {ordenes.length > 0 && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-[#FFFBEB] border border-[#F59E0B]/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
            <span className="text-[12px] font-semibold text-[#B45309]">{ordenes.length} pendiente{ordenes.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: 'Total hoy',   value: stats.totalHoy,    color: '#1E293B', f: '' },
            { label: 'Programadas', value: stats.pendientes,  color: '#64748B', f: 'No iniciada' },
            { label: 'En ruta',     value: stats.enRuta,      color: '#B45309', f: 'En progreso' },
            { label: 'Completadas', value: stats.completadas, color: '#0F7B55', f: 'Completada'  },
          ].map(s => (
            <div key={s.label}
              onClick={() => setFiltroEstado(prev => prev === s.f ? '' : s.f)}
              className={`bg-white rounded-xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${filtroEstado === s.f && s.f ? 'border-[#D81B43]' : 'border-slate-200'}`}>
              <div className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11.5px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Buscador + filtros */}
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          <div className="relative flex-1 max-w-[300px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código, cliente..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white" />
          </div>

          <button onClick={() => setShowFiltros(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-[9px] text-[12.5px] font-medium transition-all ${
              hayFiltros ? 'border-[#D81B43] text-[#D81B43] bg-[#D81B43]/5' : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}>
            <Filter size={13} /> Filtros {hayFiltros && '•'}
          </button>

          {hayFiltros && (
            <button onClick={() => { setFiltroEstado(''); setFiltroRep(''); setFiltroFecha(''); setFiltroCliente('') }}
              className="text-[12px] text-slate-400 hover:text-red-500 flex items-center gap-1">
              <X size={12} /> Limpiar
            </button>
          )}
        </div>

        {/* Panel filtros */}
        {showFiltros && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-4 gap-3 flex-shrink-0 shadow-sm">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400 mb-1.5">Repartidor</label>
              <select value={filtroRep} onChange={e => setFiltroRep(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:border-[#D81B43] bg-white">
                <option value="">Todos</option>
                {repartidores.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400 mb-1.5">Estado</label>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:border-[#D81B43] bg-white">
                <option value="">Todos</option>
                <option value="No iniciada">Programada</option>
                <option value="En progreso">En ruta</option>
                <option value="Completada">Completada</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400 mb-1.5">Fecha</label>
              <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:border-[#D81B43] bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.07em] text-slate-400 mb-1.5">Cliente</label>
              <input value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
                placeholder="Nombre cliente..."
                className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-[13px] outline-none focus:border-[#D81B43] bg-white placeholder:text-slate-400" />
            </div>
          </div>
        )}

        {/* Lista agrupada */}
        <div data-tour="entregas-lista" className="flex-1 overflow-y-auto space-y-5">
          {porRepartidor.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <div className="font-semibold mb-1">Sin entregas</div>
              <div className="text-[13px]">Las órdenes en reparto aparecerán aquí</div>
            </div>
          )}

          {porRepartidor.map(grupo => {
            const enRuta      = grupo.items.filter(i => i.estado?.nombre === 'En progreso').length
            const completadas = grupo.items.filter(i => i.estado?.nombre === 'Completada').length
            return (
              <div key={grupo.nombre}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-[#D81B43]/10 flex items-center justify-center text-[12px] font-bold text-[#D81B43] flex-shrink-0">
                    {grupo.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">{grupo.nombre}</span>
                  <span className="text-[11px] text-slate-400">{grupo.items.length} asignación{grupo.items.length !== 1 ? 'es' : ''}</span>
                  {enRuta > 0 && <span className="text-[11px] font-semibold text-[#25A9E0]">🚚 {enRuta} en ruta</span>}
                  {completadas > 0 && <span className="text-[11px] font-semibold text-[#0F7B55]">✅ {completadas} completada{completadas !== 1 ? 's' : ''}</span>}
                  <div className="flex-1 h-px bg-slate-200 ml-1" />
                </div>

                <div className="space-y-2 ml-2">
                  {grupo.items.map(item => {
                    const esPendiente = item._tipo === 'pendiente'
                    const codigo      = esPendiente ? item.codigo : (item.orden?.codigo || item.codigo)
                    const cliente     = esPendiente ? item.cliente : item.cliente
                    const nEquipos    = esPendiente ? (item.equipos?.length || 0) : (item.orden?.equipos?.length || 0)
                    const estadoN     = esPendiente ? 'No iniciada' : item.estado?.nombre
                    const retrasada   = !esPendiente && estaRetrasada(item)
                    const esRetiro    = item.tipo === 'retiro'
                    const tieneInicio = !esPendiente && item.fecha_inicio

                    return (
                      <div key={item.id}
                        onClick={() => esPendiente ? setModalOrden(item) : setDrawer(item)}
                        className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
                          retrasada
                            ? 'border-l-4 border-l-[#D81B43] border border-t-slate-200 border-r-slate-200 border-b-slate-200'
                            : 'border border-slate-200 hover:border-slate-300'
                        }`}>

                        {/* Fila superior */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                            esRetiro ? 'bg-[#F5F3FF] text-[#6D28D9]' : 'bg-[#E8F7FB] text-[#0E86A0]'
                          }`}>
                            {esRetiro ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                            {esRetiro ? 'Retiro' : 'Entrega'}
                          </span>
                          <span className="font-mono text-[12px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{codigo}</span>
                          {/* Identificador OS */}
                          {!esPendiente && item.orden?.codigo && item.orden.codigo !== codigo && (
                            <span className="text-[11px] text-slate-400 font-mono">OS: {item.orden.codigo}</span>
                          )}
                          {tieneInicio && (
                            <Cronometro inicio={item.fecha_inicio} fin={item.fecha_completada} completada={estadoN === 'Completada'} />
                          )}
                          {retrasada && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-[#D81B43] ml-auto">
                              <AlertTriangle size={11} /> ¡Retraso detectado!
                            </span>
                          )}
                        </div>

                        {/* Cliente + equipo */}
                        <div className="mb-3">
                          <div className="text-[13.5px] font-semibold text-slate-700">{cliente?.nombre}</div>
                          <div className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
                            <span>{nEquipos} equipo{nEquipos !== 1 ? 's' : ''}</span>
                            {(esPendiente ? item.fecha_vigencia : item.orden?.fecha_vigencia) && (
                              <span className="flex items-center gap-1"><Clock size={10} /> Vigencia: {esPendiente ? item.fecha_vigencia : item.orden?.fecha_vigencia}</span>
                            )}
                          </div>
                          {estadoN === 'Completada' && item.recibido_por && (
                            <div className="mt-1 text-[12px] text-[#0F7B55] flex items-center gap-1 font-medium">
                              <CheckCircle2 size={11} /> Recibido por <strong>{item.recibido_por}</strong>
                            </div>
                          )}
                        </div>

                        {/* Timeline */}
                        <TimelineHorizontal
                          estadoNombre={estadoN}
                          inicio={item.fecha_inicio}
                          fin={item.fecha_completada}
                          alerta={retrasada}
                        />

                        {/* Acciones */}
                        <div className="mt-3 flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {esPendiente && (
                            <button onClick={() => setModalOrden(item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D81B43] text-white text-[12px] font-semibold rounded-[7px] hover:bg-[#B0172F]">
                              <Truck size={12} /> Ver y empezar
                            </button>
                          )}
                          {!esPendiente && estadoN !== 'Completada' && (
                            <button onClick={() => abrirRegistro(item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F7B55] text-white text-[12px] font-semibold rounded-[7px] hover:bg-[#0a5c3f]">
                              <CheckCircle2 size={12} /> Registrar entrega
                            </button>
                          )}
                          {estadoN === 'Completada' && (
                            <button onClick={() => setDrawer(item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-500 text-[12px] font-medium rounded-[7px] hover:border-slate-300">
                              Ver detalle
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MODAL DETALLE ORDEN (antes de iniciar) ── */}
      {modalOrden && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setModalOrden(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[calc(100vh-2rem)] flex flex-col shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0 bg-[#D81B43]">
                <div>
                  <div className="text-[11px] text-white/60">Orden de servicio</div>
                  <div className="text-[15px] font-bold text-white font-mono">{modalOrden.codigo}</div>
                </div>
                <button onClick={() => setModalOrden(null)} className="text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                <div className="p-5">
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Cliente</div>
                  <div className="space-y-2">
                    {[
                      { icon: <User size={12} />,   label: 'Nombre',    value: modalOrden.cliente?.nombre },
                      { icon: <Phone size={12} />,  label: 'Teléfono',  value: modalOrden.cliente?.telefono },
                      { icon: <MapPin size={12} />, label: 'Dirección', value: modalOrden.cliente?.direccion },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label} className="flex justify-between text-[12.5px]">
                        <span className="text-slate-400 flex items-center gap-1">{f.icon}{f.label}</span>
                        <span className="font-medium text-slate-700 text-right ml-4 max-w-[260px]">{f.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">
                    Equipos a entregar ({modalOrden.equipos?.length || 0})
                  </div>
                  <div className="space-y-2">
                    {(modalOrden.equipos || []).map(oe => (
                      <div key={oe.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-[9px] border border-slate-200">
                        <Package size={13} className="text-slate-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-slate-700 truncate">{nombreEquipo(oe.equipo)}</div>
                          <div className="text-[11px] font-mono text-slate-400">{oe.equipo?.serial} · {oe.equipo?.codigo}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {(modalOrden.plantillas?.length || 0) > 0 && (
                  <div className="p-5">
                    <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">
                      Documentos a firmar ({modalOrden.plantillas.length})
                    </div>
                    <div className="space-y-2">
                      {modalOrden.plantillas.map(op => (
                        <div key={op.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-[9px]">
                          <FileText size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="text-[13px] font-medium text-slate-700">{op.plantilla?.nombre || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {modalOrden.observaciones && (
                  <div className="p-5">
                    <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">Observaciones</div>
                    <div className="text-[13px] text-slate-600 italic">{modalOrden.observaciones}</div>
                  </div>
                )}
                {modalOrden.fecha_vigencia && (
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[12.5px] text-[#0E86A0] bg-[#E8F7FB] px-3 py-2.5 rounded-[9px]">
                      <Clock size={13} /> Vigencia hasta el <span className="font-bold">{modalOrden.fecha_vigencia}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex gap-2 flex-shrink-0 bg-white">
                <button onClick={() => setModalOrden(null)} className="flex-1 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">Cancelar</button>
                <button onClick={() => iniciarEntrega(modalOrden)} disabled={saving}
                  className="flex-1 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F] disabled:opacity-50 flex items-center justify-center gap-2">
                  <Truck size={14} /> {saving ? 'Iniciando...' : 'Iniciar entrega'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── DRAWER DETALLE ENTREGA ── */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-[480px] bg-white z-30 flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b flex items-start justify-between flex-shrink-0 bg-[#D81B43]">
              <div>
                <div className="text-[11px] text-white/60">Entrega · OS: {drawer.orden?.codigo}</div>
                <div className="text-[15px] font-bold text-white font-mono">{drawer.codigo}</div>
                <div className="text-[12px] text-white/60 mt-0.5">{drawer.cliente?.nombre}</div>
              </div>
              <button onClick={() => setDrawer(null)} className="text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {/* Timeline + cronómetro */}
              <div className="p-5">
                <TimelineHorizontal
                  estadoNombre={drawer.estado?.nombre || 'No iniciada'}
                  inicio={drawer.fecha_inicio}
                  fin={drawer.fecha_completada}
                  alerta={estaRetrasada(drawer)}
                />
                {drawer.fecha_inicio && (
                  <div className="mt-3">
                    <Cronometro inicio={drawer.fecha_inicio} fin={drawer.fecha_completada} completada={drawer.estado?.nombre === 'Completada'} />
                  </div>
                )}
                {drawer.estado?.nombre !== 'Completada' && (
                  <button onClick={() => { abrirRegistro(drawer); }}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-[#0F7B55] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#0a5c3f]">
                    <CheckCircle2 size={14} /> Registrar entrega
                  </button>
                )}
              </div>

              {/* Datos */}
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Detalles</div>
                <div className="space-y-2">
                  {[
                    { icon: <User size={12} />,   label: 'Cliente',      value: drawer.cliente?.nombre },
                    { icon: <Phone size={12} />,  label: 'Teléfono',     value: drawer.orden?.cliente?.telefono },
                    { icon: <MapPin size={12} />, label: 'Dirección',    value: drawer.orden?.cliente?.direccion },
                    { icon: <Truck size={12} />,  label: 'Repartidor',   value: drawer.repartidor?.nombre },
                    { icon: <User size={12} />,   label: 'Recibido por', value: drawer.recibido_por },
                    { icon: <Clock size={12} />,  label: 'Vigencia',     value: drawer.orden?.fecha_vigencia },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className="flex justify-between text-[12.5px]">
                      <span className="text-slate-400 flex items-center gap-1">{f.icon}{f.label}</span>
                      <span className="font-medium text-slate-700 text-right ml-4 max-w-[240px]">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipos */}
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">
                  Equipos ({drawer.orden?.equipos?.length || 0})
                </div>
                <div className="space-y-2">
                  {(drawer.orden?.equipos || []).map(oe => (
                    <div key={oe.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-[9px] border border-slate-200">
                      <Package size={13} className="text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-slate-700 truncate">{nombreEquipo(oe.equipo)}</div>
                        <div className="text-[11px] font-mono text-slate-400">{oe.equipo?.serial} · {oe.equipo?.codigo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documentos con estado de firma */}
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">
                  Documentos ({drawer.orden?.plantillas?.length || 0})
                </div>
                <div className="space-y-2">
                  {(drawer.orden?.plantillas || []).map(op => (
                    <div key={op.id} className="p-3 border border-slate-200 rounded-[9px]">
                      <div className="flex items-center gap-3">
                        <FileText size={13} className="text-slate-400 flex-shrink-0" />
                        <div className="flex-1 text-[13px] font-medium text-slate-700">{op.plantilla?.nombre || '—'}</div>
                        <span className={`text-[11px] font-semibold ${op.firmado ? 'text-[#0F7B55]' : 'text-slate-400'}`}>
                          {op.firmado ? '✓ Firmado' : 'Pendiente'}
                        </span>
                      </div>
                      {/* Vista previa firma */}
                      {op.firma_iniciales && (
                        <div className="mt-2 border border-slate-100 rounded-[7px] overflow-hidden bg-slate-50">
                          <img src={op.firma_iniciales} alt="Firma" className="w-full h-[60px] object-contain" />
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Firma de recepción general */}
                  {drawer.firma_iniciales && (
                    <div className="p-3 border border-[#0F7B55]/20 bg-[#ECFDF5] rounded-[9px]">
                      <div className="text-[11px] font-bold text-[#0F7B55] mb-2">Firma de recepción</div>
                      <img src={drawer.firma_iniciales} alt="Firma recepción" className="w-full h-[70px] object-contain bg-white rounded-[6px] border border-[#0F7B55]/10" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL WIZARD FIRMA ── */}
      {modalRegistro && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setModalRegistro(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[calc(100vh-2rem)] flex flex-col shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="px-6 py-4 border-b flex items-center gap-3 flex-shrink-0 bg-[#D81B43]">
                <div className="flex-1">
                  <div className="text-[11px] text-white/60">Paso {paso + 1} de {totalPasos}</div>
                  <div className="text-[15px] font-bold text-white">
                    {paso === 0 ? '✍️ Registrar recepción' : `Documento: ${docActual?.plantilla?.nombre}`}
                  </div>
                </div>
                {/* Steps indicator */}
                <div className="flex gap-1.5">
                  {Array.from({ length: totalPasos }).map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${
                      i === paso ? 'w-6 bg-white' : i < paso ? 'w-2 bg-white/60' : 'w-2 bg-white/25'
                    }`} />
                  ))}
                </div>
                <button onClick={() => setModalRegistro(null)} className="text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* PASO 0 — Nombre receptor */}
                {paso === 0 && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-[10px] p-4 border border-slate-200">
                      <div className="text-[12px] font-bold text-slate-500 mb-1">Orden: {modalRegistro.orden?.codigo}</div>
                      <div className="text-[13px] font-semibold text-slate-700">{modalRegistro.orden?.cliente?.nombre || modalRegistro.cliente?.nombre}</div>
                      <div className="text-[12px] text-slate-400 mt-0.5">
                        {modalRegistro.orden?.equipos?.length || 0} equipo{(modalRegistro.orden?.equipos?.length || 0) !== 1 ? 's' : ''}
                        {plantillasOrden.length > 0 && ` · ${plantillasOrden.length} documento${plantillasOrden.length !== 1 ? 's' : ''} a firmar`}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">
                        Nombre de quien recibe <span className="text-[#D81B43]">*</span>
                      </label>
                      <input value={regForm.recibido_por}
                        onChange={e => setRegForm(f => ({ ...f, recibido_por: e.target.value }))}
                        placeholder="Nombre completo"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#D81B43] bg-white placeholder:text-slate-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Observaciones</label>
                      <textarea value={regForm.observaciones}
                        onChange={e => setRegForm(f => ({ ...f, observaciones: e.target.value }))}
                        placeholder="Notas de la entrega..." rows={3}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#D81B43] resize-none placeholder:text-slate-400" />
                    </div>
                    {/* Si no hay docs, pedir firma aquí */}
                    {plantillasOrden.length === 0 && (
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Firma de recepción</label>
                        <FirmaPad
                          onFirma={d => setRegForm(f => ({ ...f, firmas: { ...f.firmas, recepcion: d } }))}
                          onLimpiar={() => setRegForm(f => { const nf = { ...f.firmas }; delete nf.recepcion; return { ...f, firmas: nf } })}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* PASOS DE DOCUMENTOS */}
                {paso > 0 && docActual && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[12px] text-slate-500 bg-slate-50 px-3 py-2 rounded-[8px] border border-slate-200">
                      <User size={12} /> Firmante: <span className="font-semibold text-slate-700">{regForm.recibido_por}</span>
                    </div>
                    {/* Vista previa del documento */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-2">Vista previa</div>
                      <div className="border border-slate-200 rounded-[9px] overflow-hidden bg-slate-50 h-[200px] flex items-center justify-center">
                        <div className="text-center text-slate-400">
                          <FileText size={32} className="mx-auto mb-2 opacity-30" />
                          <div className="text-[13px] font-medium">{docActual?.plantilla?.nombre}</div>
                          <div className="text-[11px] mt-1">Vista previa disponible en Fase 2</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Firma a mano alzada</label>
                      <FirmaPad
                        onFirma={d => setRegForm(f => ({ ...f, firmas: { ...f.firmas, [docActual.id]: d } }))}
                        onLimpiar={() => setRegForm(f => { const nf = { ...f.firmas }; delete nf[docActual.id]; return { ...f, firmas: nf } })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-between flex-shrink-0 bg-white">
                <button onClick={() => paso > 0 ? setPaso(p => p - 1) : setModalRegistro(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">
                  {paso === 0 ? 'Cancelar' : '← Anterior'}
                </button>
                <button
                  onClick={() => {
                    if (!regForm.recibido_por?.trim()) { showToast('Ingresa quién recibe', 'error'); return }
                    if (paso < totalPasos - 1) setPaso(p => p + 1)
                    else completarEntrega()
                  }}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#0F7B55] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#0a5c3f] disabled:opacity-50">
                  {saving ? 'Guardando...' : paso < totalPasos - 1 ? 'Continuar →' : '✓ Completar entrega'}
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