'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { registrarBitacora } from '@/lib/bitacora'
import {
  Plus, X, Edit3, Search, Building2, User,
  Phone, Mail, MapPin, FileText, AlertTriangle, ChevronRight,
  Package, Truck, Clock, ArrowDownLeft, ArrowUpRight, Download, UserPlus, Loader2
} from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/logos/logo-ingemedic.png`

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] text-slate-800 outline-none focus:border-[#D81B43] bg-white transition-colors placeholder:text-slate-400'
const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5'

const TIPO_STYLES = {
  'Jurídica': { bg: '#E8F7FB', color: '#0E86A0', icon: <Building2 size={14} /> },
  'Natural': { bg: '#F1F5F9', color: '#475569', icon: <User size={14} /> },
}

export default function ClientesClient({ clientesIniciales, departamentos, municipios }) {
  const router = useRouter()
  const supabase = createClient()
  const skipSyncUntil = useRef(0)

  const [clientes, setClientes] = useState(clientesIniciales)

  // Mantener el estado local sincronizado cuando el servidor manda datos frescos
  // (esto se dispara después de router.refresh(), incluido el que llega por realtime)
  useEffect(() => {
    const t = setTimeout(() => {
      if (Date.now() < skipSyncUntil.current) return
      setClientes(clientesIniciales)
    }, 0)
    return () => clearTimeout(t)
  }, [clientesIniciales])

  // ── SINCRONIZACIÓN EN TIEMPO REAL ─────────────────────────
  // Sin esto, un dispositivo no se entera de cambios hechos en otro
  // (ej. otro usuario creó o editó un cliente) hasta recargar la página.
  useEffect(() => {
    let debounceTimer = null
    function refrescarConDebounce() {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (Date.now() < skipSyncUntil.current) return
        router.refresh()
      }, 500)
    }

    const canal = supabase
      .channel('clientes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, refrescarConDebounce)
      .subscribe()

    return () => { clearTimeout(debounceTimer); supabase.removeChannel(canal) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [drawer, setDrawer] = useState(null)
  const [modal, setModal] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({})
  const [formDirty, setFormDirty] = useState(false)
  const [confirmarSalir, setConfirmarSalir] = useState(false)
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([])
  const [historial, setHistorial] = useState({ loading: false, ordenes: [], entregas: [] })
  const [tabHoja, setTabHoja] = useState('prestamo') // 'prestamo' | 'ordenes' | 'linea'
  const [pdfGenerando, setPdfGenerando] = useState(false)

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  function cerrarModal() { setModal(false); setFormDirty(false) }
  function intentarCerrarModal() { if (formDirty) setConfirmarSalir(true); else cerrarModal() }

  function abrirModal(cliente = null) {
    setFormDirty(false)
    if (cliente) {
      setForm({
        id: cliente.id,
        tipo_persona: cliente.tipo_persona || '',
        nombre: cliente.nombre || '',
        nit_cc: cliente.nit_cc || '',
        digito_verificacion: cliente.digito_verificacion || '',
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        departamento_id: cliente.departamento_id || '',
        municipio_id: cliente.municipio_id || '',
      })
      if (cliente.departamento_id)
        setMunicipiosFiltrados(municipios.filter(m => m.departamento_id === cliente.departamento_id))
    } else {
      setForm({ tipo_persona: '', nombre: '', nit_cc: '', digito_verificacion: '', direccion: '', telefono: '', email: '', departamento_id: '', municipio_id: '' })
      setMunicipiosFiltrados([])
    }
    setModal(true)
  }

  function onChangeDepartamento(depId) {
    setForm(f => ({ ...f, departamento_id: depId, municipio_id: '' }))
    setMunicipiosFiltrados(municipios.filter(m => m.departamento_id === depId))
  }

  // ── HOJA DE VIDA DEL CLIENTE — órdenes, entregas y equipos en préstamo ──
  async function abrirDrawer(cliente) {
    setDrawer(cliente)
    setTabHoja('prestamo')
    setHistorial({ loading: true, ordenes: [], entregas: [] })

    const [{ data: ordenes }, { data: entregas }] = await Promise.all([
      supabase.from('ordenes_servicio').select(`
        id, codigo, fecha_creacion, fecha_vigencia, observaciones,
        tipo:tipos_orden(id, nombre),
        estado:estados_orden(id, nombre),
        equipos:orden_equipos(
          id, fecha_entrega, fecha_devolucion,
          equipo:equipos(id, codigo, tipo_equipo:tipos_equipo(id, nombre, atributos))
        )
      `).eq('cliente_id', cliente.id).order('fecha_creacion', { ascending: false }),
      supabase.from('entregas').select(`
        id, codigo, tipo, fecha_completada, fecha_asignacion, recibido_por,
        estado:estados_entrega(id, nombre),
        orden:ordenes_servicio(id, codigo)
      `).eq('cliente_id', cliente.id).order('fecha_asignacion', { ascending: false }),
    ])

    setHistorial({ loading: false, ordenes: ordenes || [], entregas: entregas || [] })
  }

  // Equipos actualmente en préstamo: tienen fecha_entrega pero no fecha_devolucion,
  // en una orden que no esté cancelada.
  const equiposEnPrestamo = useMemo(() => {
    const lista = []
    for (const orden of historial.ordenes) {
      for (const oe of orden.equipos || []) {
        if (oe.fecha_entrega && !oe.fecha_devolucion) {
          lista.push({ ...oe, orden })
        }
      }
    }
    return lista
  }, [historial.ordenes])

  // ── LÍNEA DE TIEMPO — cliente creado + órdenes + entregas, todo en un solo hilo cronológico ──
  const lineaTiempo = useMemo(() => {
    if (!drawer) return []
    const eventos = []

    if (drawer.fecha_creacion) {
      eventos.push({ fecha: drawer.fecha_creacion, tipo: 'cliente', label: 'Cliente registrado en el sistema' })
    }
    for (const o of historial.ordenes) {
      eventos.push({ fecha: o.fecha_creacion, tipo: 'orden', label: `Orden ${o.codigo} creada · ${o.tipo?.nombre || '—'}`, sub: o.estado?.nombre })
    }
    for (const en of historial.entregas) {
      const fecha = en.fecha_completada || en.fecha_asignacion
      eventos.push({
        fecha,
        tipo: en.tipo === 'devolucion' ? 'devolucion' : 'entrega',
        label: `${en.tipo === 'devolucion' ? 'Devolución' : 'Entrega'} ${en.codigo} · OS ${en.orden?.codigo || '—'}`,
        sub: en.recibido_por ? `Recibido por ${en.recibido_por}` : en.estado?.nombre,
      })
    }
    return eventos
      .filter(ev => ev.fecha)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [drawer, historial])

  const ICONO_EVENTO = {
    cliente: { icon: <UserPlus size={13} />, color: '#64748B', bg: '#F1F5F9' },
    orden: { icon: <FileText size={13} />, color: '#1B3A6B', bg: '#E8EEF9' },
    entrega: { icon: <ArrowUpRight size={13} />, color: '#0F7B55', bg: '#E7F6EF' },
    devolucion: { icon: <ArrowDownLeft size={13} />, color: '#B45309', bg: '#FEF3E2' },
  }

  // ── EXPORTAR HOJA DE VIDA A PDF ──
  async function exportarHojaDeVida() {
    setPdfGenerando(true)
    const contenedor = document.createElement('div')
    contenedor.style.cssText = 'position:fixed;top:0;left:-680px;width:680px;pointer-events:none'
    document.body.appendChild(contenedor)
    try {
      const { default: jsPDF }       = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')

      async function toB64(url) {
        const res  = await fetch(url)
        const blob = await res.blob()
        return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob) })
      }
      let logoB64 = ''
      try { logoB64 = await toB64(LOGO_URL) } catch (_) { /* sin logo */ }

      const fechaHoy   = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
      const fechaDesde = drawer.fecha_creacion
        ? new Date(drawer.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—'
      const ubicacion  = drawer.municipio
        ? drawer.municipio.nombre + ', ' + (drawer.departamento?.nombre || '')
        : '—'
      const tipoColor  = drawer.tipo_persona === 'Jurídica'
        ? { bg: '#E8F7FB', color: '#0E86A0' }
        : { bg: '#F1F5F9', color: '#475569' }
      const inicial    = (drawer.nombre || '?').charAt(0).toUpperCase()

      const infoRows = [
        ['NIT / CC', drawer.nit_cc ? (drawer.nit_cc + (drawer.digito_verificacion ? '-' + drawer.digito_verificacion : '')) : '—'],
        ['Teléfono', drawer.telefono || '—'],
        ['Email', drawer.email || '—'],
        ['Dirección', drawer.direccion || '—'],
        ['Ubicación', ubicacion],
        ['Cliente desde', fechaDesde],
      ]

      const identificacionHTML = infoRows.map(([k, v]) =>
        '<div><div style="font-size:10px;color:#94A3B8">' + k + '</div>' +
        '<div style="font-size:12.5px;color:#0F172A;margin-top:2px">' + v + '</div></div>'
      ).join('')

      const thStyle = 'text-align:left;padding:5px 8px;font-size:9.5px;color:#94A3B8;font-weight:600'
      const prestamosHTML = equiposEnPrestamo.length === 0
        ? '<div style="font-size:12px;color:#94A3B8;padding:8px 0">Sin equipos en préstamo activos</div>'
        : '<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:11.5px"><tr style="background:#F8FAFC">' +
          ['EQUIPO', 'CÓDIGO', 'ORDEN', 'DESDE'].map(h => '<th style="' + thStyle + '">' + h + '</th>').join('') + '</tr>' +
          equiposEnPrestamo.map(oe =>
            '<tr style="border-top:0.5px solid #F1F5F9">' +
            '<td style="padding:6px 8px;color:#0F172A">' + (oe.equipo?.tipo_equipo?.atributos?.nombre || oe.equipo?.tipo_equipo?.nombre || '—') + '</td>' +
            '<td style="padding:6px 8px;font-weight:600;color:#0F172A">' + (oe.equipo?.codigo || '—') + '</td>' +
            '<td style="padding:6px 8px;color:#64748B">' + (oe.orden?.codigo || '—') + '</td>' +
            '<td style="padding:6px 8px;color:#64748B">' + (oe.fecha_entrega ? new Date(oe.fecha_entrega).toLocaleDateString('es-CO') : '—') + '</td></tr>'
          ).join('') + '</table>'

      const ordenesHTML = historial.ordenes.length === 0
        ? '<div style="font-size:12px;color:#94A3B8;padding:8px 0">Sin órdenes registradas</div>'
        : '<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:11.5px"><tr style="background:#F8FAFC">' +
          ['CÓDIGO', 'TIPO', 'ESTADO', 'FECHA', 'EQUIPOS'].map(h => '<th style="' + thStyle + '">' + h + '</th>').join('') + '</tr>' +
          historial.ordenes.map(o =>
            '<tr style="border-top:0.5px solid #F1F5F9">' +
            '<td style="padding:6px 8px;font-weight:600;color:#0F172A">' + (o.codigo || '—') + '</td>' +
            '<td style="padding:6px 8px;color:#64748B">' + (o.tipo?.nombre || '—') + '</td>' +
            '<td style="padding:6px 8px;color:#64748B">' + (o.estado?.nombre || '—') + '</td>' +
            '<td style="padding:6px 8px;color:#64748B">' + (o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleDateString('es-CO') : '—') + '</td>' +
            '<td style="padding:6px 8px;color:#64748B">' + (o.equipos || []).length + '</td></tr>'
          ).join('') + '</table>'

      const DOT_COLORS = { cliente: '#64748B', orden: '#1B3A6B', entrega: '#0F7B55', devolucion: '#B45309' }
      const timelineHTML = lineaTiempo.length === 0
        ? '<div style="font-size:12px;color:#94A3B8;padding:8px 0">Sin actividad registrada</div>'
        : lineaTiempo.map((ev, idx) => {
            const dot    = DOT_COLORS[ev.tipo] || '#64748B'
            const isLast = idx === lineaTiempo.length - 1
            const fecha  = new Date(ev.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
            return '<div style="display:flex;gap:14px;padding-bottom:' + (isLast ? '0' : '14px') + ';margin-bottom:' + (isLast ? '0' : '14px') + ';border-bottom:' + (isLast ? 'none' : '0.5px solid #F1F5F9') + '">' +
              '<div style="width:1.5px;background:#E2E8F0;position:relative;flex-shrink:0">' +
              '<div style="width:10px;height:10px;border-radius:50%;background:' + dot + ';border:2px solid #fff;position:absolute;left:50%;top:3px;transform:translateX(-50%)"></div></div>' +
              '<div style="flex:1"><div style="font-size:12.5px;font-weight:600;color:#0F172A">' + ev.label + '</div>' +
              '<div style="font-size:11px;color:#64748B;margin-top:3px">' + fecha + (ev.sub ? ' · ' + ev.sub : '') + '</div></div></div>'
          }).join('')

      const logoHtml = logoB64 ? '<img src="' + logoB64 + '" style="height:52px;width:auto;object-fit:contain">' : ''
      contenedor.innerHTML =
        '<div style="max-width:680px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">' +
        '<div style="display:flex;align-items:stretch">' +
        '<div style="flex:1;padding:20px 24px;display:flex;align-items:center">' + logoHtml + '</div>' +
        '<div style="background:#1B3A6B;padding:20px 26px;flex-shrink:0;min-width:250px">' +
        '<div style="color:#fff;font-size:13px;font-weight:700;letter-spacing:.02em">HOJA DE VIDA DEL CLIENTE</div>' +
        '<div style="color:#AFC1DE;font-size:11px;margin-top:3px">Ingemedic de Colombia S.A.S.</div>' +
        '<div style="color:#7C93BE;font-size:10px;margin-top:10px">Generado: ' + fechaHoy + '</div></div></div>' +
        '<div style="padding:20px 24px;display:flex;gap:20px">' +
        '<div style="width:130px;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-start">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:' + tipoColor.bg + ';color:' + tipoColor.color + ';display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700">' + inicial + '</div>' +
        '<div style="font-size:14px;font-weight:700;color:#0F172A;margin-top:10px;line-height:1.3">' + drawer.nombre + '</div>' +
        '<div style="margin-top:6px"><span style="display:inline-flex;align-items:center;background:' + tipoColor.bg + ';color:' + tipoColor.color + ';font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px">Persona ' + drawer.tipo_persona + '</span></div></div>' +
        '<div style="flex:1;display:flex;flex-direction:column;gap:10px">' +
        '<div style="background:#F1F5F9;padding:6px 10px;font-size:10.5px;font-weight:700;color:#334155;letter-spacing:.04em">INFORMACIÓN DEL CLIENTE</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 2px">' + identificacionHTML + '</div></div></div>' +
        '<div style="padding:0 24px 18px"><div style="background:#F1F5F9;padding:6px 10px;font-size:10.5px;font-weight:700;color:#334155;letter-spacing:.04em;margin-bottom:4px">EQUIPOS EN PRÉSTAMO ACTIVO</div>' + prestamosHTML + '</div>' +
        '<div style="padding:0 24px 18px"><div style="background:#F1F5F9;padding:6px 10px;font-size:10.5px;font-weight:700;color:#334155;letter-spacing:.04em;margin-bottom:4px">HISTORIAL DE ÓRDENES</div>' + ordenesHTML + '</div>' +
        '<div style="padding:0 24px 24px"><div style="background:#F1F5F9;padding:6px 10px;font-size:10.5px;font-weight:700;color:#334155;letter-spacing:.04em;margin-bottom:14px">LÍNEA DE TIEMPO</div>' + timelineHTML + '</div></div>'

      const isMobile     = typeof window !== 'undefined' && window.innerWidth < 768
      const canvas       = await html2canvas(contenedor, { scale: isMobile ? 1 : 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false })
      const pdf          = new jsPDF('p', 'mm', 'a4')
      const anchoPDF     = 210
      const pageHeightPx = Math.round(canvas.width * (297 / 210))
      const totalPages   = Math.ceil(canvas.height / pageHeightPx)

      let position = 0, pageNum = 0
      while (position < canvas.height) {
        if (pageNum > 0) pdf.addPage()
        const sliceH = Math.min(pageHeightPx, canvas.height - position)
        const slice  = document.createElement('canvas')
        slice.width  = canvas.width
        slice.height = sliceH
        slice.getContext('2d').drawImage(canvas, 0, -position)
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, anchoPDF, (sliceH / canvas.width) * anchoPDF)
        pdf.setDrawColor(238, 242, 246)
        pdf.line(0, 282, 210, 282)
        pdf.setFontSize(8)
        pdf.setTextColor(148, 163, 184)
        pdf.text('Ingemedic de Colombia S.A.S. · Valledupar, Cesar', 12, 288)
        pdf.text('Página ' + (pageNum + 1) + ' de ' + totalPages, 198, 288, { align: 'right' })
        position += pageHeightPx
        pageNum++
      }

      pdf.save('HojaDeVida_' + (drawer.nombre?.replace(/\s+/g, '_') || 'cliente') + '.pdf')
      showToast('PDF generado')
    } finally {
      document.body.removeChild(contenedor)
      setPdfGenerando(false)
    }
  }
  const clientesFiltrados = useMemo(() => {
    let result = clientes
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.nombre?.toLowerCase().includes(q) ||
        c.nit_cc?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telefono?.toLowerCase().includes(q)
      )
    }
    if (filtroTipo) result = result.filter(c => c.tipo_persona === filtroTipo)
    return result
  }, [clientes, search, filtroTipo])

  async function guardarCliente() {
    if (!form.nombre?.trim()) { showToast('El nombre es requerido', 'error'); return }
    if (!form.tipo_persona) { showToast('El tipo de persona es requerido', 'error'); return }
    setSaving(true)
    const payload = {
      tipo_persona: form.tipo_persona,
      nombre: form.nombre.trim(),
      nit_cc: form.nit_cc?.trim() || null,
      digito_verificacion: form.digito_verificacion?.trim() || null,
      direccion: form.direccion?.trim() || null,
      telefono: form.telefono?.trim() || null,
      email: form.email?.trim() || null,
      departamento_id: form.departamento_id || null,
      municipio_id: form.municipio_id || null,
    }
    if (form.id) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', form.id)
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      skipSyncUntil.current = Date.now() + 2500
      setClientes(prev => prev.map(c => c.id === form.id ? {
        ...c, ...payload,
        departamento: departamentos.find(d => d.id === form.departamento_id) || c.departamento,
        municipio: municipios.find(m => m.id === form.municipio_id) || c.municipio,
      } : c))
      if (drawer?.id === form.id) setDrawer(prev => ({
        ...prev, ...payload,
        departamento: departamentos.find(d => d.id === form.departamento_id) || prev.departamento,
        municipio: municipios.find(m => m.id === form.municipio_id) || prev.municipio,
      }))
      showToast('Cliente actualizado')
      registrarBitacora({ modulo: 'clientes', accion: 'editar', entidad: 'cliente', entidad_id: form.id, detalle: { nombre: payload.nombre } })
    } else {
      const { data, error } = await supabase.from('clientes')
        .insert({ ...payload, activo: true })
        .select('*, municipio:municipios(id, nombre), departamento:departamentos(id, nombre)')
        .single()
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      skipSyncUntil.current = Date.now() + 2500
      setClientes(prev => [data, ...prev])
      showToast('Cliente creado')
      registrarBitacora({ modulo: 'clientes', accion: 'crear', entidad: 'cliente', entidad_id: data.id, detalle: { nombre: data.nombre } })
    }
    setSaving(false); cerrarModal()
  }

  async function eliminarCliente(id) {
    const { error } = await supabase.from('clientes').update({ activo: false }).eq('id', id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    const cliente = clientes.find(c => c.id === id)
    skipSyncUntil.current = Date.now() + 2500
    setClientes(prev => prev.filter(c => c.id !== id))
    if (drawer?.id === id) setDrawer(null)
    setModalEliminar(null)
    showToast('Cliente eliminado')
    registrarBitacora({ modulo: 'clientes', accion: 'eliminar', entidad: 'cliente', entidad_id: id, detalle: { nombre: cliente?.nombre } })
  }

  const estiloTipo = c => TIPO_STYLES[c.tipo_persona] || TIPO_STYLES['Jurídica']

  const stats = useMemo(() => ({
    total: clientes.length,
    juridica: clientes.filter(c => c.tipo_persona === 'Jurídica').length,
    natural: clientes.filter(c => c.tipo_persona === 'Natural').length,
  }), [clientes])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div className="h-14 md:h-16 md:bg-white md:border-b md:border-slate-200 flex items-center px-4 md:px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-slate-800">Clientes</div>
          <div className="text-[12px] text-slate-400 mt-0.5">Gestión de clientes y arrendatarios</div>
        </div>
        <button onClick={() => abrirModal()}
          className="ml-auto hidden md:flex items-center gap-1.5 px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F] transition-colors">
          <Plus size={14} strokeWidth={2.5} /> Nuevo cliente
        </button>
      </div>

      {/* FAB móvil */}
      <button onClick={() => abrirModal()}
        className="fixed bottom-[calc(var(--mobile-nav-space,0px)+16px)] right-4 z-30 md:hidden shadow-lg rounded-full w-14 h-14 bg-[#D81B43] text-white flex items-center justify-center">
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-3 md:p-6 pb-3 md:pb-4 flex-shrink-0">
          {/* Stats */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Total clientes', value: stats.total, color: '#1E293B' },
              { label: 'Personas jurídicas', value: stats.juridica, color: '#0E86A0' },
              { label: 'Personas naturales', value: stats.natural, color: '#475569' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11.5px] text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <div className="relative flex-1 md:max-w-[340px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, NIT, email o teléfono..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 overflow-x-auto flex-1">
                {[
                  { value: '', label: 'Todos' },
                  { value: 'Jurídica', label: 'Persona jurídica' },
                  { value: 'Natural', label: 'Persona natural' },
                ].map(t => (
                  <button key={t.value} onClick={() => setFiltroTipo(t.value)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all whitespace-nowrap ${filtroTipo === t.value
                      ? 'bg-[#D81B43] text-white'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-[#D81B43] hover:text-[#D81B43]'
                      }`}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="hidden md:block text-[12px] text-slate-400 flex-shrink-0 md:ml-auto">
                {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla / Cards */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 pb-28 md:pb-6">
          {clientesFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="text-center py-16 text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <div className="font-semibold mb-1">{search || filtroTipo ? 'Sin resultados' : 'Sin clientes registrados'}</div>
                <div className="text-[13px]">{search || filtroTipo ? 'Intenta con otros filtros' : 'Usa "Nuevo cliente" para agregar uno'}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Cards móvil */}
              <div className="md:hidden space-y-2">
                {clientesFiltrados.map(c => {
                  const st = estiloTipo(c)
                  return (
                    <div key={c.id} onClick={() => abrirDrawer(c)}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 cursor-pointer active:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                          style={{ background: st.bg, color: st.color }}>
                          {c.nombre?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-slate-700 truncate">{c.nombre}</div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold mt-0.5"
                            style={{ background: st.bg, color: st.color }}>
                            {st.icon} {c.tipo_persona || '—'}
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                      </div>
                      <div className="space-y-1 pl-1">
                        {c.nit_cc && (
                          <div className="flex items-center gap-2 text-[12px] text-slate-500">
                            <FileText size={11} className="text-slate-400" />
                            <span className="font-mono">{c.nit_cc}{c.digito_verificacion ? `-${c.digito_verificacion}` : ''}</span>
                          </div>
                        )}
                        {c.telefono && (
                          <div className="flex items-center gap-2 text-[12px] text-slate-500">
                            <Phone size={11} className="text-slate-400" /> {c.telefono}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-2 text-[12px] text-slate-500">
                            <Mail size={11} className="text-slate-400" /> {c.email}
                          </div>
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
                      {['Cliente', 'Tipo', 'NIT / CC', 'Contacto', 'Ubicación', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map(c => {
                      const st = estiloTipo(c)
                      return (
                        <tr key={c.id} onClick={() => abrirDrawer(c)}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                                style={{ background: st.bg, color: st.color }}>
                                {c.nombre?.charAt(0)?.toUpperCase()}
                              </div>
                              <span className="text-[13px] font-semibold text-slate-700">{c.nombre}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                              style={{ background: st.bg, color: st.color }}>
                              {st.icon} {c.tipo_persona || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {c.nit_cc
                              ? <span className="font-mono text-[12.5px] text-slate-600">{c.nit_cc}{c.digito_verificacion ? `-${c.digito_verificacion}` : ''}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              {c.telefono && <div className="flex items-center gap-1.5 text-[12px] text-slate-500"><Phone size={11} className="text-slate-400" />{c.telefono}</div>}
                              {c.email && <div className="flex items-center gap-1.5 text-[12px] text-slate-500"><Mail size={11} className="text-slate-400" />{c.email}</div>}
                              {!c.telefono && !c.email && <span className="text-slate-300 text-[12px]">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-slate-500">
                            {c.municipio?.nombre
                              ? <div className="flex items-center gap-1"><MapPin size={11} className="text-slate-400 flex-shrink-0" />{c.municipio.nombre}, {c.departamento?.nombre}</div>
                              : <span className="text-slate-300">—</span>}
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

      {/* ── DRAWER ── */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[45] backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="fixed inset-x-0 bottom-0 h-[92vh] rounded-t-2xl md:rounded-none md:inset-x-auto md:top-0 md:right-0 md:bottom-0 md:h-full md:w-[420px] bg-white z-[50] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold flex-shrink-0"
                  style={{ background: estiloTipo(drawer).bg, color: estiloTipo(drawer).color }}>
                  {drawer.nombre?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="text-[15px] font-bold text-slate-800 leading-tight">{drawer.nombre}</div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5"
                    style={{ color: estiloTipo(drawer).color }}>
                    {estiloTipo(drawer).icon} Persona {drawer.tipo_persona}
                  </span>
                </div>
              </div>
              <button onClick={() => setDrawer(null)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-3 border-b border-slate-100">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Información general</div>
                {[
                  { label: 'NIT / CC', value: drawer.nit_cc ? `${drawer.nit_cc}${drawer.digito_verificacion ? `-${drawer.digito_verificacion}` : ''}` : null },
                  { label: 'Teléfono', value: drawer.telefono, icon: <Phone size={12} /> },
                  { label: 'Email', value: drawer.email, icon: <Mail size={12} /> },
                  { label: 'Dirección', value: drawer.direccion, icon: <MapPin size={12} /> },
                  { label: 'Ubicación', value: drawer.municipio ? `${drawer.municipio.nombre}, ${drawer.departamento?.nombre}` : null, icon: <MapPin size={12} /> },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className="flex justify-between text-[12.5px]">
                    <span className="text-slate-400 flex items-center gap-1">{f.icon}{f.label}</span>
                    <span className="font-medium text-slate-700 text-right ml-4 max-w-[220px]">{f.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-6">
                {/* Tabs + exportar */}
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex gap-1 border-b border-slate-200 flex-1 overflow-x-auto">
                    {[
                      { id: 'prestamo', label: 'En préstamo', count: equiposEnPrestamo.length },
                      { id: 'ordenes', label: 'Órdenes', count: historial.ordenes.length },
                      { id: 'linea', label: 'Línea de tiempo', count: lineaTiempo.length },
                    ].map(t => (
                      <button key={t.id} onClick={() => setTabHoja(t.id)}
                        className={`px-3 py-2 text-[12.5px] font-semibold border-b-2 whitespace-nowrap transition-all ${tabHoja === t.id ? 'border-[#D81B43] text-[#D81B43]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        {t.label} {t.count > 0 && <span className="ml-1 text-[10.5px] opacity-60">({t.count})</span>}
                      </button>
                    ))}
                  </div>
                  <button onClick={exportarHojaDeVida} disabled={pdfGenerando}
                    title="Exportar hoja de vida a PDF"
                    className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1B3A6B] text-white rounded-[8px] text-[11.5px] font-semibold hover:bg-[#152D54] transition-all mb-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {pdfGenerando ? <><Loader2 size={12} className="animate-spin" /> Generando…</> : <><Download size={12} /> PDF</>}
                  </button>
                </div>

                {historial.loading ? (
                  <div className="py-10 text-center text-slate-400 text-[12.5px]">Cargando historial…</div>
                ) : (
                  <div className="mt-3">
                    {/* EQUIPOS EN PRÉSTAMO */}
                    {tabHoja === 'prestamo' && (
                      equiposEnPrestamo.length > 0 ? (
                        <div className="space-y-2">
                          {equiposEnPrestamo.map(oe => (
                            <div key={oe.id} className="flex items-start gap-2.5 p-3 rounded-[9px] border border-slate-100 bg-slate-50">
                              <Package size={15} className="text-[#D81B43] mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-[12.5px] font-semibold text-slate-700">
                                  {oe.equipo?.tipo_equipo?.atributos?.nombre || oe.equipo?.tipo_equipo?.nombre || 'Equipo'}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Código: {oe.equipo?.codigo || '—'}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  OS {oe.orden?.codigo} · desde {oe.fecha_entrega ? new Date(oe.fecha_entrega).toLocaleDateString('es-CO') : '—'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <div className="text-[12.5px]">Sin equipos activos</div>
                          <div className="text-[11.5px] mt-1 text-slate-300">Los préstamos aparecerán aquí</div>
                        </div>
                      )
                    )}

                    {/* ÓRDENES */}
                    {tabHoja === 'ordenes' && (
                      historial.ordenes.length > 0 ? (
                        <div className="space-y-2">
                          {historial.ordenes.map(o => (
                            <div key={o.id} className="p-3 rounded-[9px] border border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="text-[12.5px] font-semibold text-slate-700">{o.codigo}</span>
                                <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{o.estado?.nombre || '—'}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                {o.tipo?.nombre || '—'} · {new Date(o.fecha_creacion).toLocaleDateString('es-CO')}
                                {o.fecha_vigencia && ` · vigente hasta ${new Date(o.fecha_vigencia).toLocaleDateString('es-CO')}`}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{(o.equipos || []).length} equipo(s)</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <div className="text-[12.5px]">Sin órdenes registradas</div>
                        </div>
                      )
                    )}

                    {/* LÍNEA DE TIEMPO */}
                    {tabHoja === 'linea' && (
                      lineaTiempo.length > 0 ? (
                        <div className="relative pl-5">
                          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-200" />
                          <div className="space-y-4">
                            {lineaTiempo.map((ev, i) => {
                              const ic = ICONO_EVENTO[ev.tipo] || ICONO_EVENTO.orden
                              return (
                                <div key={i} className="relative flex items-start gap-3">
                                  <div className="absolute -left-5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: ic.bg, color: ic.color }}>
                                    <div className="scale-75">{ic.icon}</div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[12px] font-semibold text-slate-700">{ev.label}</div>
                                    <div className="text-[10.5px] text-slate-400 mt-0.5">
                                      {new Date(ev.fecha).toLocaleString('es-CO')} {ev.sub && `· ${ev.sub}`}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <div className="text-[12.5px]">Sin actividad registrada</div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex gap-2 flex-shrink-0">
              <button onClick={() => abrirModal(drawer)}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300 transition-all">
                <Edit3 size={13} /> Editar
              </button>
              <button onClick={() => setModalEliminar(drawer)}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-400 rounded-[9px] text-[13px] font-medium hover:bg-red-50 transition-all ml-auto">
                <X size={13} /> Eliminar
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL CREAR / EDITAR ── */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => intentarCerrarModal()} />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-[560px] max-h-[calc(100vh-2rem)] flex flex-col shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
                <h3 className="text-[16px] font-bold text-slate-800">{form.id ? 'Editar cliente' : 'Nuevo cliente'}</h3>
                <button onClick={() => intentarCerrarModal()} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><X size={16} /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" onChange={() => setFormDirty(true)}>
                {/* Tipo persona */}
                <div>
                  <label className={labelCls}>Tipo de persona <span className="text-[#D81B43]">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Jurídica', 'Natural'].map(tipo => (
                      <button key={tipo} type="button"
                        onClick={() => setForm(f => ({ ...f, tipo_persona: tipo }))}
                        className={`flex items-center gap-2 px-4 py-3 rounded-[9px] border-2 text-[13px] font-semibold transition-all ${form.tipo_persona === tipo
                          ? 'border-[#D81B43] bg-[#D81B43]/5 text-[#D81B43]'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}>
                        {tipo === 'Jurídica' ? <Building2 size={15} /> : <User size={15} />}
                        Persona {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label className={labelCls}>Nombre / Razón social <span className="text-[#D81B43]">*</span></label>
                  <input value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre completo o razón social" className={inputCls} />
                </div>

                {/* NIT / CC */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>NIT / CC</label>
                    <input value={form.nit_cc || ''} onChange={e => setForm(f => ({ ...f, nit_cc: e.target.value }))}
                      placeholder="900123456" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Dígito verif.</label>
                    <input value={form.digito_verificacion || ''} onChange={e => setForm(f => ({ ...f, digito_verificacion: e.target.value }))}
                      placeholder="5" maxLength={1} className={inputCls} />
                  </div>
                </div>

                {/* Contacto */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Teléfono</label>
                    <input value={form.telefono || ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                      placeholder="300 000 0000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      type="email" placeholder="correo@empresa.com" className={inputCls} />
                  </div>
                </div>

                {/* Ubicación */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Departamento</label>
                    <select value={form.departamento_id || ''} onChange={e => onChangeDepartamento(e.target.value)} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Municipio</label>
                    <select value={form.municipio_id || ''} onChange={e => setForm(f => ({ ...f, municipio_id: e.target.value }))}
                      disabled={!form.departamento_id} className={inputCls + (!form.departamento_id ? ' opacity-50' : '')}>
                      <option value="">Seleccionar...</option>
                      {municipiosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className={labelCls}>Dirección</label>
                  <input value={form.direccion || ''} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                    placeholder="Calle 10 # 5-20" className={inputCls} />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0 bg-white">
                <button onClick={() => intentarCerrarModal()} className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">Cancelar</button>
                <button onClick={guardarCliente} disabled={saving}
                  className="px-5 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F] disabled:opacity-50">
                  {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear cliente'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        abierto={!!modalEliminar}
        titulo="¿Eliminar cliente?"
        mensaje={modalEliminar ? `"${modalEliminar.nombre}" quedará desactivado. Esta acción no se puede deshacer.` : ''}
        textoConfirmar="Sí, eliminar"
        textoCancelar="Cancelar"
        tipo="peligro"
        onConfirmar={() => eliminarCliente(modalEliminar.id)}
        onCancelar={() => setModalEliminar(null)}
      />

      <ConfirmDialog
        abierto={confirmarSalir}
        titulo="¿Descartar cambios?"
        mensaje="Tienes cambios sin guardar. ¿Deseas salir sin guardar?"
        textoConfirmar="Sí, salir"
        textoCancelar="Seguir editando"
        tipo="default"
        onConfirmar={() => { setConfirmarSalir(false); cerrarModal() }}
        onCancelar={() => setConfirmarSalir(false)}
      />

      {toast && (
        <div className={`fixed bottom-28 md:bottom-6 right-4 md:right-6 z-[70] px-4 py-3 rounded-[10px] text-[13px] font-medium text-white shadow-lg ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-[#0F7B55]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}