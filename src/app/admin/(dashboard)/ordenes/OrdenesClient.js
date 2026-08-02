'use client'
import { registrarBitacora } from '@/lib/bitacora'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  Plus, X, Search, FileText, CheckCircle2, Package,
  AlertTriangle, Calendar, Clock, User, Edit3, Truck, ChevronRight,
  Building, Box, Layers
} from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

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

const BUCKETS = {
  en_curso: ['Borrador', 'Programada', 'En reparto', 'Entregada'],
  historial:['Finalizada'],
}

// Transiciones que puede hacer el ADMIN desde el drawer
// En reparto → Entregada lo hace el repartidor desde Entregas
const TRANSICIONES_ADMIN = {
  'Borrador':  { id: E.Programada, nombre: 'Programada', requiereRepartidor: true },
  'Entregada': { id: E.Finalizada, nombre: 'Finalizada',  requiereRepartidor: false },
}

// ── ZONA HORARIA ──────────────────────────────────────────────────
// Colombia es UTC-5 fijo (no tiene horario de verano). El input
// datetime-local da/recibe un string "naive" (sin zona horaria) que
// SIEMPRE representa hora de Bogotá — hay que convertirlo explícitamente
// a UTC antes de guardar, y de vuelta a "hora de Bogotá naive" al
// recargarlo en el input. Sin esto, Postgres interpreta el string como
// UTC directamente y la hora queda corrida por 5 horas (ej: 9pm se
// guarda como si fueran las 9pm UTC = 4pm Bogotá).
const TZ_BOGOTA = '-05:00'

// "2026-07-05T21:00" (asumido hora de Bogotá) → ISO UTC correcto para guardar en Supabase
function localBogotaToISO(str) {
  if (!str) return null
  return new Date(`${str}:00${TZ_BOGOTA}`).toISOString()
}

// ISO guardado en BD (UTC) → "2026-07-05T21:00" para poblar el input datetime-local,
// ya expresado en hora de Bogotá (independiente de la zona horaria del navegador)
function isoToLocalBogotaInput(iso) {
  if (!iso) return ''
  const d = new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
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
  ordenesIniciales, clientes, pacientes, estados, estadosEquipo, plantillas, equiposDisponibles, usuarios, tipos
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [ordenes, setOrdenes]           = useState(ordenesIniciales)
  const [pacientesLocal, setPacientesLocal] = useState(pacientes)

  // Sincronizar con datos frescos del servidor tras router.refresh()
  useEffect(() => {
    const t = setTimeout(() => setOrdenes(ordenesIniciales), 0)
    return () => clearTimeout(t)
  }, [ordenesIniciales])

  useEffect(() => {
    const t = setTimeout(() => setPacientesLocal(pacientes), 0)
    return () => clearTimeout(t)
  }, [pacientes])

  // ── SINCRONIZACIÓN EN TIEMPO REAL ─────────────────────────
  // Refleja cambios hechos desde Entregas (iniciar/completar) sin recargar
  useEffect(() => {
    const canal = supabase
      .channel('ordenes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes_servicio' }, () => {
        router.refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entregas' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [search, setSearch]                           = useState('')
  const [tabPrincipal, setTabPrincipal]               = useState('en_curso')
  const [filtroEstadoDetalle, setFiltroEstadoDetalle] = useState('')
  const [filtroCliente, setFiltroCliente]             = useState('')
  const [filtroMarca, setFiltroMarca]                 = useState('')
  const [filtroCategoria, setFiltroCategoria]         = useState('')
  const [drawer, setDrawer]             = useState(null)
  const [editRepartidor, setEditRepartidor] = useState(false)
  const [nuevoRepartidor, setNuevoRepartidor] = useState('')
  const [editFecha, setEditFecha] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [pacienteFiltro, setPacienteFiltro] = useState('')

  // Si el drawer está abierto y esa orden cambió (ej. entrega completada desde otro dispositivo), refrescar su vista
  useEffect(() => {
    if (!drawer) return
    const actualizada = ordenes.find(o => o.id === drawer.id)
    if (actualizada && JSON.stringify(actualizada) !== JSON.stringify(drawer)) {
      const t = setTimeout(() => setDrawer(actualizada), 0)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenes])

  const [wizardOpen, setWizardOpen]         = useState(false)
  const [wizardPaso, setWizardPaso]         = useState(1)
  const [saving, setSaving]                 = useState(false)
  const [toast, setToast]                   = useState(null)
  const [modalConfirm, setModalConfirm]     = useState(null)
  const [formDirty, setFormDirty]           = useState(false)
  const [confirmarSalirWizard, setConfirmarSalirWizard] = useState(false)
  const [wForm, setWForm] = useState({
    cliente_id: '', equipo_id: '', tiene_paciente: false, paciente_id: '',
    pacienteNuevo: { nombre: '', cedula: '', direccion: '', ciudad: '', telefono: '', correo: '' },
    fecha_inicio: '', domicilio: false, repartidor_id: '', observaciones: '',
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

  const bucketCounts = useMemo(() => ({
    todos:    stats.total,
    en_curso: stats.borrador + stats.programada + stats.enReparto + stats.entregada,
    historial: stats.finalizada,
  }), [stats])

  const pacienteSeleccionado = useMemo(
    () => pacientesLocal.find(p => p.id === wForm.paciente_id) || null,
    [pacientesLocal, wForm.paciente_id]
  )

  const pacientesFiltrados = useMemo(() => {
    const q = pacienteFiltro.trim().toLowerCase()
    if (!q) return []
    return pacientesLocal.filter(p => [p.nombre, p.cedula]
      .some(v => v?.toLowerCase().includes(q)))
  }, [pacientesLocal, pacienteFiltro])

  // Reset filtros detalle al cambiar de pestaña
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      if (!cancelled) { setFiltroEstadoDetalle(''); setFiltroCliente(''); setFiltroMarca(''); setFiltroCategoria('') }
    }, 0)
    return () => { cancelled = true; clearTimeout(t) }
  }, [tabPrincipal])

  // Órdenes de la pestaña activa (para calcular opciones de selects)
  const ordenesPorTab = useMemo(() => {
    if (tabPrincipal === 'todos') return ordenes
    const bucket = BUCKETS[tabPrincipal] || []
    return ordenes.filter(o => bucket.includes(o.estado?.nombre))
  }, [ordenes, tabPrincipal])

  const opcionesEstado     = useMemo(() => [...new Set(ordenesPorTab.map(o => o.estado?.nombre).filter(Boolean))].sort(), [ordenesPorTab])
  const opcionesCliente    = useMemo(() => [...new Set(ordenesPorTab.map(o => o.cliente?.nombre).filter(Boolean))].sort(), [ordenesPorTab])
  const opcionesMarca      = useMemo(() => [...new Set(ordenesPorTab.flatMap(o => (o.equipos || []).map(oe => oe.equipo?.tipo_equipo?.nombre).filter(Boolean)))].sort(), [ordenesPorTab])
  const opcionesCategoria  = useMemo(() => [...new Set(ordenesPorTab.flatMap(o => (o.equipos || []).map(oe => oe.equipo?.tipo_equipo?.categoria?.nombre).filter(Boolean)))].sort(), [ordenesPorTab])

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter(o => {
      if (tabPrincipal !== 'todos') {
        const bucket = BUCKETS[tabPrincipal] || []
        if (!bucket.includes(o.estado?.nombre)) return false
      }
      if (search) {
        const q = search.toLowerCase()
        const pasa = [o.codigo, o.cliente?.nombre, o.paciente?.nombre, o.repartidor?.nombre]
          .some(v => v?.toLowerCase().includes(q))
        if (!pasa) return false
      }
      if (filtroEstadoDetalle && o.estado?.nombre !== filtroEstadoDetalle) return false
      if (filtroCliente      && o.cliente?.nombre !== filtroCliente)        return false
      if (filtroMarca) {
        const tiene = (o.equipos || []).some(oe => oe.equipo?.tipo_equipo?.nombre === filtroMarca)
        if (!tiene) return false
      }
      if (filtroCategoria) {
        const tiene = (o.equipos || []).some(oe => oe.equipo?.tipo_equipo?.categoria?.nombre === filtroCategoria)
        if (!tiene) return false
      }
      return true
    })
  }, [ordenes, search, tabPrincipal, filtroEstadoDetalle, filtroCliente, filtroMarca, filtroCategoria])

  // ── ABRIR DRAWER ────────────────────────────────────────
  function abrirDrawer(orden) {
    setDrawer(orden)
    setEditRepartidor(false)
    setNuevoRepartidor(orden.repartidor_id || '')
    setEditFecha(false)
    setNuevaFecha(orden.fecha_entrega ? isoToLocalBogotaInput(orden.fecha_entrega) : '')
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

    // Al finalizar la orden, los equipos vuelven a "Disponible" y se desvinculan del paciente/cliente
    if (transicion.nombre === 'Finalizada') {
      const idsEquipos = (orden.equipos || []).map(oe => oe.equipo_id || oe.equipo?.id).filter(Boolean)
      const estadoDisponible = (estadosEquipo || []).find(e => e.nombre === 'Disponible')
      if (idsEquipos.length > 0 && estadoDisponible) {
        await supabase.from('equipos')
          .update({
            estado_id:          estadoDisponible.id,
            paciente_actual_id: null,
            cliente_actual_id:  null,
          })
          .in('id', idsEquipos)
      }
    }

    const nuevoEstado = { id: transicion.id, nombre: transicion.nombre }
    setOrdenes(prev => prev.map(o => o.id === orden.id ? { ...o, estado: nuevoEstado } : o))
    setDrawer(prev => ({ ...prev, estado: nuevoEstado }))
    setModalConfirm(null)
    showToast(transicion.nombre === 'Finalizada' ? 'Orden finalizada — equipos disponibles' : `Orden → ${transicion.nombre}`)
  }

  // ── GUARDAR FECHA ENTREGA ────────────────────────────────
  async function guardarFecha() {
    if (!nuevaFecha) { showToast('Selecciona fecha y hora', 'error'); return }
    const fechaISO = localBogotaToISO(nuevaFecha)
    const { data, error } = await supabase.from('ordenes_servicio')
      .update({ fecha_entrega: fechaISO })
      .eq('id', drawer.id)
      .select('estado_id, estado:estados_orden(id, nombre)')
      .single()
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    const nuevoEstado = data?.estado || drawer.estado
    const updOrden = { ...drawer, fecha_entrega: fechaISO, estado: nuevoEstado }
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
      cliente_id: '', equipo_id: '', tiene_paciente: false, paciente_id: '',
      pacienteNuevo: { nombre: '', cedula: '', direccion: '', ciudad: '', telefono: '', correo: '' },
      fecha_inicio: '', domicilio: false, repartidor_id: '', observaciones: '',
    })
    setPacienteFiltro('')
    setWizardPaso(1)
    setFormDirty(false)
    setWizardOpen(true)
  }

  function cerrarWizard() { setWizardOpen(false); setFormDirty(false) }
  function intentarCerrarWizard() { if (formDirty) setConfirmarSalirWizard(true); else cerrarWizard() }

  function seleccionarEquipo(id) {
    setWForm(f => ({ ...f, equipo_id: id }))
  }

  function seleccionarPaciente(paciente) {
    setWForm(f => ({
      ...f,
      paciente_id: paciente.id,
      pacienteNuevo: { nombre: '', cedula: '', direccion: '', ciudad: '', telefono: '', correo: '' },
    }))
    setPacienteFiltro('')
  }

  function limpiarPacienteSeleccionado() {
    setWForm(f => ({ ...f, paciente_id: '', pacienteNuevo: { nombre: '', cedula: '', direccion: '', ciudad: '', telefono: '', correo: '' } }))
  }

  async function crearOrden() {
    if (!wForm.cliente_id) {
      showToast('Selecciona un cliente', 'error'); return
    }
    if (!wForm.equipo_id) {
      showToast('Selecciona un equipo', 'error'); return
    }
    if (!wForm.fecha_inicio) {
      showToast('Ingresa la fecha de inicio', 'error'); return
    }
    if (wForm.tiene_paciente && !wForm.paciente_id && !wForm.pacienteNuevo.nombre.trim()) {
      showToast('Completa los datos del paciente o desmarca la casilla', 'error'); return
    }
    if (wForm.tiene_paciente && !wForm.paciente_id) {
      if (!wForm.pacienteNuevo.direccion.trim()) {
        showToast('La dirección del paciente es obligatoria', 'error'); return
      }
    }
    if (wForm.domicilio && !wForm.repartidor_id) {
      showToast('Selecciona un repartidor', 'error'); return
    }
    setSaving(true)

    const tipoOrden = tipos.find(t => {
      const nombre = t.nombre?.toLowerCase() || ''
      return nombre.includes('arrendamiento') || nombre.includes('préstamo') || nombre.includes('prestamo')
    })
    if (!tipoOrden) {
      showToast('No se encontró el tipo de orden de préstamo/arrendamiento', 'error'); setSaving(false); return
    }

    let pacienteId = wForm.tiene_paciente ? wForm.paciente_id : null
    if (wForm.tiene_paciente && !pacienteId) {
      const { data: nuevoPaciente, error: errPac } = await supabase.from('pacientes')
        .insert({
          nombre:    wForm.pacienteNuevo.nombre.trim(),
          cedula:    wForm.pacienteNuevo.cedula.trim() || null,
          direccion: wForm.pacienteNuevo.direccion.trim(),
          ciudad:    wForm.pacienteNuevo.ciudad.trim() || null,
          telefono:  wForm.pacienteNuevo.telefono.trim() || null,
          correo:    wForm.pacienteNuevo.correo.trim() || null,
        }).select('id').single()
      if (errPac) {
        showToast('Error creando paciente: ' + errPac.message, 'error'); setSaving(false); return
      }
      pacienteId = nuevoPaciente.id
      setPacientesLocal(prev => [...prev, {
        id: nuevoPaciente.id,
        nombre: wForm.pacienteNuevo.nombre.trim(),
        cedula: wForm.pacienteNuevo.cedula.trim() || null,
        activo: true,
      }])
    }

    const estadoProgramada = estados.find(e => e.nombre === 'Programada')
    const estadoEntregada  = estados.find(e => e.nombre === 'Entregada')
    if (!estadoProgramada || !estadoEntregada) {
      showToast('No se encontraron los estados de orden necesarios (Programada/Entregada) — revisa la tabla estados_orden', 'error')
      setSaving(false); return
    }
    const estadoInicial = wForm.domicilio ? estadoProgramada.id : estadoEntregada.id

    const { data: orden, error: errOrden } = await supabase.from('ordenes_servicio')
      .insert({
        tipo_orden_id: tipoOrden.id,
        cliente_id:    wForm.cliente_id,
        paciente_id:   pacienteId,
        estado_id:     estadoInicial,
        repartidor_id: wForm.domicilio ? wForm.repartidor_id : null,
        fecha_entrega: wForm.fecha_inicio,
        observaciones: wForm.observaciones || null,
      }).select('id').single()

    if (errOrden) { showToast('Error: ' + errOrden.message, 'error'); setSaving(false); return }

    const { error: errEq } = await supabase.from('orden_equipos').insert({
      orden_id: orden.id,
      equipo_id: wForm.equipo_id,
      fecha_entrega: wForm.domicilio ? null : wForm.fecha_inicio,
    })
    if (errEq) { showToast('Error vinculando equipo: ' + errEq.message, 'error'); setSaving(false); return }

    if (!wForm.domicilio) {
      const estadoPrestamo = (estadosEquipo || estados).find(e => e.nombre === 'En préstamo')
      if (!estadoPrestamo) {
        showToast('No se encontró el estado "En préstamo" en estados_equipo — revisa el nombre exacto', 'error')
      } else {
        await supabase.from('equipos').update({
          estado_id:         estadoPrestamo.id,
          paciente_actual_id: pacienteId,
          cliente_actual_id:  wForm.cliente_id,
        }).eq('id', wForm.equipo_id)
      }
    }

    registrarBitacora({
      modulo: 'ordenes', accion: 'crear', entidad: 'préstamo', entidad_id: orden.id,
      detalle: { cliente_id: wForm.cliente_id, equipo_id: wForm.equipo_id, con_domicilio: wForm.domicilio }
    })

    showToast(wForm.domicilio ? 'Préstamo creado — pendiente de entrega' : 'Préstamo registrado y activo')
    setSaving(false)
    setWizardOpen(false)
    router.refresh()
  }

  const PASOS = ['Cliente y paciente', 'Equipo', 'Fecha y domicilio']

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
      <div className="h-14 md:h-16 md:bg-white md:border-b md:border-slate-200 flex items-center px-4 md:px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-slate-800">Préstamos</div>
          <div className="text-[12px] text-slate-400 mt-0.5">Gestión de préstamos de equipos biomédicos</div>
        </div>
        <button onClick={abrirWizard}
          className="ml-auto hidden md:flex items-center gap-1.5 px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F] transition-colors">
          <Plus size={14} strokeWidth={2.5} /> Nuevo préstamo
        </button>
      </div>

      {/* FAB móvil */}
      <button onClick={abrirWizard}
        className="fixed bottom-[calc(var(--mobile-nav-space,0px)+16px)] right-4 z-30 md:hidden shadow-lg rounded-full w-14 h-14 bg-[#D81B43] text-white flex items-center justify-center">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-3 md:p-6 pb-3 md:pb-4 flex-shrink-0">
          {/* Stats — solo desktop */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Total préstamos', value: stats.total,            color: '#1E293B', iconBg: '#F1F5F9', icon: <Box size={16} color="#64748B" /> },
              { label: 'En curso',        value: bucketCounts.en_curso,  color: '#1D4ED8', iconBg: '#EFF6FF', icon: <Clock size={16} color="#1D4ED8" /> },
              { label: 'Finalizados',     value: bucketCounts.historial, color: '#0F7B55', iconBg: '#ECFDF5', icon: <CheckCircle2 size={16} color="#0F7B55" /> },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 p-4"
                style={{ borderLeft: `3px solid ${s.color}` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.iconBg }}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[11.5px] text-slate-400 mt-1">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <div className="relative flex-1 md:max-w-[340px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por código o cliente..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 overflow-x-auto flex-1">
                {[
                  { key: 'todos',    label: 'Todos'    },
                  { key: 'en_curso', label: 'En curso' },
                  { key: 'historial',label: 'Historial'},
                ].map(t => (
                  <button key={t.key} onClick={() => setTabPrincipal(t.key)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all whitespace-nowrap ${
                      tabPrincipal === t.key
                        ? 'bg-[#D81B43] text-white'
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-[#D81B43] hover:text-[#D81B43]'
                    }`}>
                    {t.label}
                    <span className="ml-1 text-[10.5px] opacity-70">({bucketCounts[t.key]})</span>
                  </button>
                ))}
              </div>
              <div className="hidden md:block text-[12px] text-slate-400 flex-shrink-0 md:ml-auto">
                {ordenesFiltradas.length} préstamo{ordenesFiltradas.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Panel de filtros */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              <select value={filtroEstadoDetalle} onChange={e => setFiltroEstadoDetalle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[9px] text-[12.5px] text-slate-700 outline-none focus:border-[#D81B43] bg-white h-[38px]">
                <option value="">Estado</option>
                {opcionesEstado.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[9px] text-[12.5px] text-slate-700 outline-none focus:border-[#D81B43] bg-white h-[38px]">
                <option value="">Cliente</option>
                {opcionesCliente.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[9px] text-[12.5px] text-slate-700 outline-none focus:border-[#D81B43] bg-white h-[38px]">
                <option value="">Tipo de equipo</option>
                {opcionesMarca.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-[9px] text-[12.5px] text-slate-700 outline-none focus:border-[#D81B43] bg-white h-[38px]">
                <option value="">Categoría</option>
                {opcionesCategoria.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 pb-28 md:pb-6">
          {ordenesFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="text-center py-16 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <div className="font-semibold mb-1">
                  {search || filtroEstadoDetalle || filtroCliente || filtroMarca ? 'Sin resultados' : (
                    tabPrincipal === 'todos'    ? 'Sin préstamos registrados' :
                    tabPrincipal === 'en_curso' ? 'Sin préstamos en curso' :
                    'Sin préstamos en historial'
                  )}
                </div>
                <div className="text-[13px]">
                  {search || filtroEstadoDetalle || filtroCliente || filtroMarca ? 'Intenta con otros filtros' :
                   tabPrincipal === 'todos'    ? 'Usa "Nuevo préstamo" para registrar uno' :
                   tabPrincipal === 'en_curso' ? 'Usa "Nuevo préstamo" para registrar uno' :
                   'Los préstamos finalizados aparecerán aquí'}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Cards móvil */}
              <div className="md:hidden space-y-2">
                {ordenesFiltradas.map(o => {
                  const retrasada  = estaRetrasada(o)
                  const incompleta = estaIncompleta(o)
                  return (
                    <div key={o.id} onClick={() => abrirDrawer(o)}
                      className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer active:bg-slate-50 transition-colors ${
                        retrasada  ? 'border-l-4 border-l-[#D81B43] border-slate-200' :
                        incompleta ? 'border-l-4 border-l-[#B45309] border-slate-200' : 'border-slate-200'
                      }`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="font-mono text-[12.5px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {o.codigo || '—'}
                          </span>
                          <div className="text-[13px] font-semibold text-slate-700 mt-1 truncate max-w-[200px]">
                            {o.cliente?.nombre || '—'}
                          </div>
                        </div>
                        <EstadoBadge orden={o} retrasada={retrasada} />
                      </div>
                      <div className="flex items-center justify-between text-[11.5px] text-slate-400">
                        <span>{o.repartidor?.nombre || <span className="text-[#B45309]">Sin repartidor</span>}</span>
                        {o.fecha_entrega && (
                          <span className={retrasada ? 'text-[#D81B43] font-semibold' : ''}>
                            {new Date(o.fecha_entrega).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Tabla desktop */}
              <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      {['Cliente', 'Paciente', 'Equipo', 'Estado', 'Dirección', 'Fecha entrega', 'Docs', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ordenesFiltradas.map(o => {
                      const nEquipos   = o.equipos?.length || 0
                      const retrasada  = estaRetrasada(o)
                      const incompleta = estaIncompleta(o)
                      return (
                        <tr key={o.id} onClick={() => abrirDrawer(o)}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                            retrasada  ? 'border-l-4 border-l-[#D81B43]' :
                            incompleta ? 'border-l-4 border-l-[#B45309] opacity-70' : ''
                          }`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#D81B43]/10 flex items-center justify-center text-[12px] font-bold text-[#D81B43] flex-shrink-0">
                                {o.cliente?.nombre?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="text-[13px] font-semibold text-slate-700">{o.cliente?.nombre || '—'}</div>
                                <div className="text-[11px] font-mono text-slate-400">{o.codigo || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {o.paciente?.nombre
                              ? <span className="text-[12.5px] font-semibold text-slate-700 leading-snug">{o.paciente.nombre}</span>
                              : <span className="text-slate-300 text-[12.5px]">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {nEquipos === 0 ? <span className="text-slate-300 text-[12.5px]">—</span> :
                             nEquipos === 1 ? (
                               <div>
                                 <div className="text-[12.5px] font-semibold text-slate-700 leading-tight">{nombreEquipo(o.equipos[0]?.equipo)}</div>
                                 <div className="text-[11px] text-slate-400 mt-0.5">
                                   {[o.equipos[0]?.equipo?.tipo_equipo?.nombre, o.equipos[0]?.equipo?.codigo].filter(Boolean).join(' · ')}
                                 </div>
                               </div>
                             ) : (
                               <span className="text-[12.5px] text-slate-500">{nEquipos} equipos</span>
                             )}
                          </td>
                          <td className="px-4 py-3">
                            <EstadoBadge orden={o} retrasada={retrasada} />
                          </td>
                          <td className="px-4 py-3 text-[12.5px]">
                            {o.paciente?.direccion
                              ? <span className="text-slate-500 leading-snug">{o.paciente.direccion}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {o.fecha_entrega
                              ? <span className={`text-[12px] font-mono ${retrasada ? 'text-[#D81B43] font-bold' : 'text-slate-400'}`}>
                                  {new Date(o.fecha_entrega).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </span>
                              : <span className="text-[#B45309] text-[11.5px]">Sin programar</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-[12px] text-slate-400">
                              <FileText size={12} />{o.plantillas?.length || 0}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-300"><ChevronRight size={14} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── DRAWER DETALLE OS ── */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[45] backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="fixed inset-x-0 bottom-0 h-[92vh] rounded-t-2xl md:rounded-none md:inset-x-auto md:top-0 md:right-0 md:bottom-0 md:h-full md:w-[500px] bg-white z-[50] flex flex-col shadow-2xl">

            {/* Header — blanco como Clientes */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D81B43]/10 flex items-center justify-center text-[15px] font-bold text-[#D81B43] flex-shrink-0">
                  {drawer.cliente?.nombre?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-slate-800 leading-tight">{drawer.cliente?.nombre || '—'}</div>
                  <div className="font-mono text-[11.5px] text-slate-400 mt-0.5">{drawer.codigo}</div>
                </div>
              </div>
              <button onClick={() => setDrawer(null)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
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
                      <button onClick={() => { setEditFecha(true); setNuevaFecha(drawer.fecha_entrega ? isoToLocalBogotaInput(drawer.fecha_entrega) : '') }}
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
                            <div className="text-[11px] font-mono text-slate-400">{oe.equipo?.codigo}</div>
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
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => intentarCerrarWizard()} />
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
                <button onClick={() => intentarCerrarWizard()} className="text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5" onChange={() => setFormDirty(true)}>

                {/* PASO 1 — Cliente + Paciente */}
                {wizardPaso === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Cliente <span className="text-[#D81B43]">*</span></label>
                      <select value={wForm.cliente_id} onChange={e => setWForm(f => ({ ...f, cliente_id: e.target.value }))} className={inputCls}>
                        <option value="">Seleccionar cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={wForm.tiene_paciente}
                          onChange={e => setWForm(f => ({ ...f, tiene_paciente: e.target.checked, paciente_id: e.target.checked ? f.paciente_id : '', pacienteNuevo: e.target.checked ? f.pacienteNuevo : { nombre: '', cedula: '', direccion: '', ciudad: '', telefono: '', correo: '' } }))} />
                        <span className="text-[13.5px] font-medium text-slate-700">¿Tiene paciente asociado?</span>
                      </label>

                      {wForm.tiene_paciente && (
                        <div className="space-y-3">
                          {!wForm.paciente_id ? (
                            <>
                              <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={pacienteFiltro} onChange={e => setPacienteFiltro(e.target.value)}
                                  placeholder="Buscar paciente por nombre o cédula..."
                                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#D81B43] bg-white" />
                              </div>
                              {pacientesFiltrados.length > 0 && (
                                <div className="border border-slate-200 rounded-[9px] bg-white shadow-sm max-h-[220px] overflow-y-auto">
                                  {pacientesFiltrados.map(p => (
                                    <button key={p.id} type="button" onClick={() => seleccionarPaciente(p)}
                                      className="w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-slate-50">
                                      <div className="text-[13px] font-semibold text-slate-800 truncate">{p.nombre}</div>
                                      <div className="text-[11px] text-slate-500">{p.cedula || 'Sin cédula'}</div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button type="button" onClick={() => setWForm(f => ({ ...f, pacienteNuevo: { nombre: '', cedula: '', direccion: '', ciudad: '', telefono: '', correo: '' } }))}
                                className="text-[13px] text-[#D81B43] font-semibold hover:underline">
                                + Crear paciente nuevo
                              </button>
                            </>
                          ) : (
                            <div className="border border-slate-200 rounded-[9px] p-3 bg-slate-50">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-[13px] font-semibold text-slate-800">{pacienteSeleccionado?.nombre || 'Paciente seleccionado'}</div>
                                  <div className="text-[11px] text-slate-500">{pacienteSeleccionado?.cedula || 'Sin cédula'}</div>
                                </div>
                                <button type="button" onClick={limpiarPacienteSeleccionado}
                                  className="text-[12px] text-slate-500 hover:text-[#D81B43]">Cambiar</button>
                              </div>
                            </div>
                          )}

                          {!wForm.paciente_id && (
                            <div className="grid grid-cols-1 gap-3">
                              <div>
                                <label className={labelCls}>Nombre <span className="text-[#D81B43]">*</span></label>
                                <input value={wForm.pacienteNuevo.nombre} onChange={e => setWForm(f => ({ ...f, pacienteNuevo: { ...f.pacienteNuevo, nombre: e.target.value } }))}
                                  type="text" className={inputCls} />
                              </div>
                              <div>
                                <label className={labelCls}>Cédula</label>
                                <input value={wForm.pacienteNuevo.cedula} onChange={e => setWForm(f => ({ ...f, pacienteNuevo: { ...f.pacienteNuevo, cedula: e.target.value } }))}
                                  type="text" className={inputCls} />
                              </div>
                              <div>
                                <label className={labelCls}>Dirección <span className="text-[#D81B43]">*</span></label>
                                <input value={wForm.pacienteNuevo.direccion} onChange={e => setWForm(f => ({ ...f, pacienteNuevo: { ...f.pacienteNuevo, direccion: e.target.value } }))}
                                  type="text" className={inputCls} />
                              </div>
                              <div>
                                <label className={labelCls}>Ciudad</label>
                                <input value={wForm.pacienteNuevo.ciudad} onChange={e => setWForm(f => ({ ...f, pacienteNuevo: { ...f.pacienteNuevo, ciudad: e.target.value } }))}
                                  type="text" className={inputCls} />
                              </div>
                              <div>
                                <label className={labelCls}>Teléfono</label>
                                <input value={wForm.pacienteNuevo.telefono} onChange={e => setWForm(f => ({ ...f, pacienteNuevo: { ...f.pacienteNuevo, telefono: e.target.value } }))}
                                  type="text" className={inputCls} />
                              </div>
                              <div>
                                <label className={labelCls}>Correo</label>
                                <input value={wForm.pacienteNuevo.correo} onChange={e => setWForm(f => ({ ...f, pacienteNuevo: { ...f.pacienteNuevo, correo: e.target.value } }))}
                                  type="email" className={inputCls} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>Observaciones</label>
                      <textarea value={wForm.observaciones} onChange={e => setWForm(f => ({ ...f, observaciones: e.target.value }))}
                        placeholder="Notas adicionales..." rows={3}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#D81B43] resize-none placeholder:text-slate-400" />
                    </div>
                  </div>
                )}

                {/* PASO 2 — Equipo */}
                {wizardPaso === 2 && (
                  <div className="space-y-3">
                    <label className={labelCls}>Equipo disponible <span className="text-[#D81B43]">*</span></label>
                    {equiposDisponibles.length === 0 ? (
                      <div className="text-[13px] text-slate-400 py-6 text-center border border-slate-200 rounded-[9px]">
                        No hay equipos disponibles en inventario
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[340px] overflow-y-auto border border-slate-200 rounded-[9px] p-2">
                        {equiposDisponibles.map(eq => {
                          const sel = wForm.equipo_id === eq.id
                          return (
                            <button key={eq.id} onClick={() => seleccionarEquipo(eq.id)}
                              className={`w-full flex items-center gap-2.5 p-2.5 rounded-[8px] border-[1.5px] text-left transition-all ${sel ? 'border-[#D81B43] bg-[#D81B43]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                              <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center ${sel ? 'bg-[#D81B43]' : 'border-[1.5px] border-slate-300'}`}>
                                {sel && <CheckCircle2 size={10} className="text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-semibold text-slate-700 truncate">{nombreEquipo(eq)}</div>
                                <div className="text-[11px] font-mono text-slate-400">{eq.codigo}</div>
                              </div>
                              <div className="text-[11px] text-slate-400 flex-shrink-0">{eq.tipo_equipo?.categoria?.nombre}</div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {wForm.equipo_id && (
                      <div className="text-[12px] text-[#D81B43] font-semibold">
                        Equipo seleccionado
                      </div>
                    )}
                  </div>
                )}

                {/* PASO 3 — Fecha y domicilio */}
                {wizardPaso === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Fecha de inicio del préstamo <span className="text-[#D81B43]">*</span></label>
                      <input type="date" value={wForm.fecha_inicio}
                        onChange={e => setWForm(f => ({ ...f, fecha_inicio: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={wForm.domicilio}
                          onChange={e => setWForm(f => ({ ...f, domicilio: e.target.checked, repartidor_id: e.target.checked ? f.repartidor_id : '' }))} />
                        <span className="text-[13.5px] font-medium text-slate-700">¿Entrega a domicilio?</span>
                      </label>
                    </div>
                    {wForm.domicilio && (
                      <div>
                        <label className={labelCls}>Repartidor <span className="text-[#D81B43]">*</span></label>
                        <select value={wForm.repartidor_id} onChange={e => setWForm(f => ({ ...f, repartidor_id: e.target.value }))} className={inputCls}>
                          <option value="">Seleccionar repartidor...</option>
                          {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-between flex-shrink-0 bg-white">
                <button onClick={() => wizardPaso > 1 ? setWizardPaso(p => p - 1) : intentarCerrarWizard()}
                  className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">
                  {wizardPaso === 1 ? 'Cancelar' : '← Anterior'}
                </button>
                <button onClick={() => wizardPaso < PASOS.length ? setWizardPaso(p => p + 1) : crearOrden()}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F] disabled:opacity-50">
                  {saving ? 'Creando...' : wizardPaso < PASOS.length ? 'Siguiente →' : '✓ Crear préstamo'}
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

      <ConfirmDialog
        abierto={confirmarSalirWizard}
        titulo="¿Descartar cambios?"
        mensaje="Tienes cambios sin guardar. ¿Deseas salir sin guardar?"
        textoConfirmar="Sí, salir"
        textoCancelar="Seguir editando"
        tipo="default"
        onConfirmar={() => { setConfirmarSalirWizard(false); cerrarWizard() }}
        onCancelar={() => setConfirmarSalirWizard(false)}
      />
      
    </div>

  )
}
