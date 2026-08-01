'use client'
import { registrarBitacora } from '@/lib/bitacora'
import Image from 'next/image'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Package, Inbox, Plus, X, Search, Download, Edit3, FileText, AlertTriangle, Clock, CheckCircle2, Box, Hash, Tag, Layers, SlidersHorizontal } from 'lucide-react'
import { IconoEquipo, GaleriaIconos } from '@/components/inventario/IconosEquipo'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/logos/logo-ingemedic.png`

const CAMPO_FILTRO_STYLES = {
  modelo: { color: '#2EB5D4', Icon: Box },
  serie: { color: '#D81B43', Icon: Hash },
  codigo: { color: '#D81B43', Icon: Hash },
  marca: { color: '#6D28D9', Icon: Tag },
  tipo: { color: '#B45309', Icon: Layers },
}
const FILTRO_PALETTE = [
  { color: '#2EB5D4', Icon: Box },
  { color: '#6D28D9', Icon: Tag },
  { color: '#B45309', Icon: Layers },
  { color: '#0E7490', Icon: SlidersHorizontal },
]
const FILTRO_DROPDOWN_MAX = 6

const ESTADO_STYLES = {
  'Disponible': { bg: '#ECFDF5', color: '#0F7B55', dot: '#0F7B55' },
  'En préstamo': { bg: '#E8F7FB', color: '#0E86A0', dot: '#2EB5D4' },
  'En mantenimiento': { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  'Con novedad': { bg: '#FEF2F2', color: '#C0392B', dot: '#C0392B' },
  'Baja': { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
}

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] text-slate-800 outline-none focus:border-[#D81B43] bg-white transition-colors placeholder:text-slate-400'
const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5'

function formatearValor(valor, tipo) {
  if (!valor && valor !== 0) return '—'
  if (tipo === 'numero' && !isNaN(valor)) return Number(valor).toLocaleString('es-CO')
  return valor
}

function formatearFecha(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function InventarioClient({ categorias: catsIniciales, tipos: tiposIniciales, equipos, estados }) {
  const router = useRouter()
  const supabase = createClient()

  const [categorias, setCategorias] = useState(catsIniciales)
  const [tipos, setTipos] = useState(tiposIniciales)
  const skipSyncUntil = useRef(0)

  // Mantener el estado local sincronizado cuando el servidor manda datos frescos
  // (esto se dispara después de router.refresh(), incluido el que llega por realtime)
  useEffect(() => {
    const t = setTimeout(() => {
      if (Date.now() < skipSyncUntil.current) return
      setCategorias(catsIniciales)
    }, 0)
    return () => clearTimeout(t)
  }, [catsIniciales])

  useEffect(() => {
    const t = setTimeout(() => {
      if (Date.now() < skipSyncUntil.current) return
      setTipos(tiposIniciales)
    }, 0)
    return () => clearTimeout(t)
  }, [tiposIniciales])

  // ── SINCRONIZACIÓN EN TIEMPO REAL ─────────────────────────
  // Sin esto, un dispositivo no se entera de cambios hechos en otro
  // (ej. otro usuario registró un equipo nuevo) hasta recargar la página.
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
      .channel('inventario-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipos' }, refrescarConDebounce)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tipos_equipo' }, refrescarConDebounce)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categorias_equipo' }, refrescarConDebounce)
      .subscribe()

    return () => { clearTimeout(debounceTimer); supabase.removeChannel(canal) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [vista, setVista] = useState('categorias')
  const [catActual, setCatActual] = useState(null)
  const [tipoActual, setTipoActual] = useState(null)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtrosCampos, setFiltrosCampos] = useState({})
  const [drawer, setDrawer] = useState(null)
  const [modalNueva, setModalNueva] = useState(false)
  const [modalTipo, setModalTipo] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalSalir, setModalSalir] = useState(false)
  const [formDirty, setFormDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [toast, setToast] = useState(null)
  const [formUnidad, setFormUnidad] = useState({ estado_id: '', atributos: {} })
  const [formTipo, setFormTipo] = useState({ icono: '', atributos: {} })
  const [formEditar, setFormEditar] = useState({ estado_id: '', atributos: {}, motivo: '' })
  const [prestamosDrawer, setPrestamosDrawer] = useState([])

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      if (!drawer?.id) {
        if (!cancelled) setPrestamosDrawer([])
        return
      }
      supabase
        .from('orden_equipos')
        .select(`
          id, fecha_entrega, fecha_devolucion,
          orden:ordenes_servicio(
            id, codigo, fecha_creacion,
            estado:estados_orden(nombre),
            cliente:clientes(id, nombre),
            paciente:pacientes(id, nombre)
          )
        `)
        .eq('equipo_id', drawer.id)
        .order('fecha_entrega', { ascending: false })
        .then(({ data }) => { if (!cancelled) setPrestamosDrawer(data || []) })
    }, 0)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawer?.id])

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const stats = useMemo(() => {
    let base = equipos
    if (vista === 'tipos' && catActual) {
      const idsTipos = tipos.filter(t => t.categoria_id === catActual.id).map(t => t.id)
      base = equipos.filter(e => idsTipos.includes(e.tipo_equipo_id))
    } else if (vista === 'unidades' && tipoActual) {
      base = equipos.filter(e => e.tipo_equipo_id === tipoActual.id)
    }
    return {
      total: base.length,
      disponibles: base.filter(e => e.estado?.nombre === 'Disponible').length,
      prestamo: base.filter(e => e.estado?.nombre === 'En préstamo').length,
      mant: base.filter(e => e.estado?.nombre === 'En mantenimiento').length,
    }
  }, [equipos, vista, catActual, tipoActual, tipos])

  const tiposDeCat = useMemo(() =>
    catActual ? tipos.filter(t => t.categoria_id === catActual.id) : [],
    [tipos, catActual]
  )

  const stockPorTipo = useMemo(() => {
    const map = {}
    equipos.forEach(e => {
      if (!e.tipo_equipo_id) return
      if (!map[e.tipo_equipo_id]) map[e.tipo_equipo_id] = { total: 0, disponibles: 0, prestamo: 0, mant: 0 }
      map[e.tipo_equipo_id].total++
      if (e.estado?.nombre === 'Disponible') map[e.tipo_equipo_id].disponibles++
      if (e.estado?.nombre === 'En préstamo') map[e.tipo_equipo_id].prestamo++
      if (e.estado?.nombre === 'En mantenimiento') map[e.tipo_equipo_id].mant++
    })
    return map
  }, [equipos])

  const baseUnidadesDeTipo = useMemo(() =>
    tipoActual ? equipos.filter(e => e.tipo_equipo_id === tipoActual.id) : [],
    [equipos, tipoActual]
  )

  const unidadesDeTipo = useMemo(() => {
    if (!tipoActual) return []
    let result = [...baseUnidadesDeTipo]
    if (search) result = result.filter(e => {
      const atrs = e.atributos || {}
      return Object.values(atrs).some(v => v?.toString().toLowerCase().includes(search.toLowerCase())) ||
        e.codigo?.toLowerCase().includes(search.toLowerCase())
    })
    if (filtroEstado) result = result.filter(e => e.estado?.nombre === filtroEstado)
    Object.entries(filtrosCampos).forEach(([clave, valor]) => {
      if (valor) result = result.filter(e =>
        e.atributos?.[clave]?.toString().toLowerCase().includes(valor.toLowerCase())
      )
    })
    return result
  }, [baseUnidadesDeTipo, tipoActual, search, filtroEstado, filtrosCampos])

  const camposTipo = catActual?.atributos_extra?.campos_tipo || []
  const camposUnidad = catActual?.atributos_extra?.campos_unidad || []

  const valoresUnicosPorCampo = useMemo(() => {
    const result = {}
    for (const campo of camposUnidad) {
      result[campo.clave] = [...new Set(
        baseUnidadesDeTipo
          .map(e => e.atributos?.[campo.clave])
          .filter(v => v != null && v !== '')
      )].sort()
    }
    return result
  }, [baseUnidadesDeTipo, camposUnidad])

  function irACat(cat) {
    setCatActual(categorias.find(c => c.id === cat.id) || cat)
    setSearch('')
    setVista('tipos')
  }

  function irATipo(tipo) {
    setTipoActual(tipo)
    setSearch('')
    setFiltroEstado('')
    setFiltrosCampos({})
    setVista('unidades')
  }

  function volver() {
    if (vista === 'unidades') { setVista('tipos'); setTipoActual(null) }
    else if (vista === 'tipos') { setVista('categorias'); setCatActual(null) }
  }

  function abrirEditar() {
    setFormEditar({
      estado_id: drawer?.estado_id || '',
      atributos: { ...(drawer?.atributos || {}) },
      motivo: '',
    })
    setFormDirty(false)
    setModalEditar(true)
  }

  function intentarCerrarEditar() {
    if (formDirty) setModalSalir(true)
    else setModalEditar(false)
  }

  async function guardarEdicion() {
    if (!formEditar.motivo?.trim()) { showToast('El motivo de cambio es obligatorio', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('equipos').update({
      estado_id: formEditar.estado_id || null,
      atributos: Object.keys(formEditar.atributos).length > 0 ? formEditar.atributos : null,
    }).eq('id', drawer.id)
    if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
    registrarBitacora({ modulo: 'inventario', accion: 'editar', entidad: 'equipo', entidad_id: drawer.id, detalle: { codigo: drawer.codigo || drawer.atributos?.codigo } })
    showToast('Equipo actualizado')
    setSaving(false)
    setModalEditar(false)
    setDrawer(null)
    router.refresh()
  }

  async function exportar(nivel, extra = {}) {
    setExportando(true)
    try {
      const res = await fetch('/api/exportar/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivel, ...extra }),
      })
      if (!res.ok) { showToast('Error exportando', 'error'); return }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `inventario_${nivel}_${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
    } catch (e) {
      showToast('Error exportando', 'error')
    } finally {
      setExportando(false)
    }
  }

  // ── GENERAR HOJA DE VIDA PDF ─────────────────────────────
  async function generarHojaVidaPDF(equipo) {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = 210, M = 15, CW = W - M * 2
    const HEADER_H = 28
    let logoEndX = M

    // Helpers
    function hexRgb(hex) {
      return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
    }
    async function fetchBase64(url) {
      const res = await fetch(url)
      const blob = await res.blob()
      const b64 = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob) })
      const dims = await new Promise(r => { const img = new window.Image(); img.onload = () => r({ w: img.naturalWidth, h: img.naturalHeight }); img.src = b64 })
      return { b64, dims }
    }

    // ── LOGO ────────────────────────────────────────────────
    try {
      const { b64, dims } = await fetchBase64(LOGO_URL)
      const ratio = HEADER_H / dims.h
      const logoW = dims.w * ratio
      doc.addImage(b64, 'PNG', M + 2, M, logoW, HEADER_H)
      logoEndX = M + logoW + 6
    } catch { logoEndX = M + 4 }

    // ── HEADER (franja azul) ─────────────────────────────────
    doc.setFillColor(27, 58, 107) // #1B3A6B
    doc.rect(logoEndX, M, W - M - logoEndX, HEADER_H, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10.5); doc.setFont('helvetica', 'bold')
    doc.text('HOJA DE VIDA DEL EQUIPO', logoEndX + 3, M + 9)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.text('Ingemedic de Colombia S.A.S.', logoEndX + 3, M + 16)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, W - M - 2, M + 23, { align: 'right' })

    let y = M + HEADER_H + 8

    // ── BLOQUE IDENTIFICACIÓN ────────────────────────────────
    const tipo = equipo.tipo_equipo
    const imagenUrl = tipo?.imagen_url && !tipo.imagen_url.startsWith('icono:') ? tipo.imagen_url : null
    const IMG_SZ = 34
    const INFO_X = imagenUrl ? M + IMG_SZ + 6 : M
    const INFO_W = imagenUrl ? CW - IMG_SZ - 6 : CW

    if (imagenUrl) {
      try {
        const { b64, dims } = await fetchBase64(imagenUrl)
        const ratio = Math.min(IMG_SZ / dims.w, IMG_SZ / dims.h)
        const iW = dims.w * ratio, iH = dims.h * ratio
        doc.setDrawColor(220, 220, 220)
        doc.roundedRect(M, y, IMG_SZ, IMG_SZ, 2, 2)
        doc.addImage(b64, 'PNG', M + (IMG_SZ - iW) / 2, y + (IMG_SZ - iH) / 2, iW, iH, undefined, 'FAST')
      } catch { }
    }

    const nombreTipoEq = tipo?.nombre || '—'
    const categoriaNombre = tipo?.categoria?.nombre || ''
    const estadoNombre = equipo.estado?.nombre || '—'
    const estadoSty = ESTADO_STYLES[estadoNombre] || { color: '#64748B' }
    const [er, eg, eb] = hexRgb(estadoSty.color)

    doc.setTextColor(30, 30, 30); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(nombreTipoEq, INFO_W - 4)
    doc.text(titleLines, INFO_X, y + 8)
    let infoY = y + 8 + titleLines.length * 6

    if (categoriaNombre) {
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120)
      doc.text(categoriaNombre, INFO_X, infoY)
      infoY += 5.5
    }
    // Badge estado
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(er, eg, eb)
    doc.text(`●  ${estadoNombre}`, INFO_X, infoY)

    y = Math.max(y + IMG_SZ + 6, infoY + 10)

    // Fila 3 columnas: Código · Serie · Fecha registro
    doc.setFillColor(240, 242, 245)
    doc.rect(M, y, CW, 6, 'F')
    doc.setTextColor(30, 30, 30); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.text('IDENTIFICACIÓN', M + 2, y + 4)
    y += 9

    const C3 = CW / 3
    const id3 = [
      ['Código',      equipo.codigo || '—'],
      ['Serie',       equipo.atributos?.serie || '—'],
      ['Registrado',  equipo.fecha_creacion ? new Date(equipo.fecha_creacion).toLocaleDateString('es-CO') : '—'],
    ]
    id3.forEach(([lbl, val], i) => {
      const cx = M + i * C3 + 2
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120)
      doc.text(lbl, cx, y)
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30)
      doc.text(String(val), cx, y + 5.5)
    })
    y += 14

    // Características técnicas (atributos del tipo + unidad)
    const atrsAll = { ...(tipo?.atributos || {}), ...(equipo.atributos || {}) }
    delete atrsAll.serie   // ya en la fila de identificación
    const atrsEntries = Object.entries(atrsAll).filter(([, v]) => v != null && v !== '')
    if (atrsEntries.length > 0) {
      if (y > 245) { doc.addPage(); y = M }
      doc.setFillColor(240, 242, 245); doc.rect(M, y, CW, 6, 'F')
      doc.setTextColor(30, 30, 30); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.text('CARACTERÍSTICAS TÉCNICAS', M + 2, y + 4)
      y += 9
      const colW = CW / 2
      atrsEntries.forEach(([k, v], i) => {
        if (y > 255) { doc.addPage(); y = M }
        const cx = M + (i % 2) * colW + 2
        if (i % 2 === 0 && i > 0) y += 5.5
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120)
        doc.text(`${k}:`, cx, y)
        doc.setTextColor(30, 30, 30)
        doc.text(String(v).slice(0, 30), cx + 24, y)
      })
      if (atrsEntries.length % 2 !== 0) y += 5.5
      y += 5
    }

    // ── LÍNEA DE TIEMPO ──────────────────────────────────────
    if (y > 240) { doc.addPage(); y = M }
    doc.setFillColor(240, 242, 245); doc.rect(M, y, CW, 6, 'F')
    doc.setTextColor(30, 30, 30); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.text('HISTORIAL — LÍNEA DE TIEMPO', M + 2, y + 4)
    y += 10

    // Construir y ordenar eventos (igual que en pantalla)
    const eventosP = []
    prestamosDrawer.forEach(p => {
      const fE = p.fecha_entrega ? new Date(p.fecha_entrega) : (p.orden?.fecha_creacion ? new Date(p.orden.fecha_creacion) : null)
      const fD = p.fecha_devolucion ? new Date(p.fecha_devolucion) : null
      const activo = !fD
      const cli = p.orden?.cliente?.nombre || 'Cliente desconocido'
      const pac = p.orden?.paciente?.nombre
      const cod = p.orden?.codigo
      eventosP.push({ tipo: 'prestamo', fecha: fE, titulo: `Prestado a ${cli}`, sub: [pac ? `Paciente: ${pac}` : null, cod ? `Orden ${cod}` : null].filter(Boolean).join(' · ') || null, activo })
      if (fD) eventosP.push({ tipo: 'devolucion', fecha: fD, titulo: 'Devuelto', sub: cod ? `Orden ${cod}` : null, activo: false })
    })
    eventosP.sort((a, b) => { if (!a.fecha && !b.fecha) return 0; if (!a.fecha) return 1; if (!b.fecha) return -1; return b.fecha - a.fecha })

    const LINE_X = M + 4
    eventosP.forEach((ev, idx) => {
      if (y > 262) { doc.addPage(); y = M + 8 }
      // Dot color
      const dotRgb = ev.tipo === 'prestamo' && ev.activo ? [14, 134, 160]
        : ev.tipo === 'devolucion' ? [15, 123, 85]
        : ev.tipo === 'registro'   ? [37, 169, 224]
        : [100, 116, 139]
      doc.setFillColor(...dotRgb)
      doc.circle(LINE_X, y, 1.8, 'F')
      // Connector line to next
      if (idx < eventosP.length - 1) {
        doc.setDrawColor(220, 220, 220)
        doc.line(LINE_X, y + 2, LINE_X, y + 14)
      }
      // Título
      const TX = LINE_X + 5
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30)
      doc.text(ev.titulo, TX, y + 0.5)
      let dY = 5
      // Subtítulo
      if (ev.sub) {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
        const subLines = doc.splitTextToSize(ev.sub, CW - TX + M - 2)
        doc.text(subLines, TX, y + dY)
        dY += subLines.length * 4
      }
      // Fecha
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140)
      let fStr = ev.fecha ? ev.fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Fecha no disponible'
      if (ev.tipo === 'prestamo' && ev.activo) fStr += '  ·  Activo'
      doc.text(fStr, TX, y + dY)
      y += dY + 8
    })

    if (eventosP.length === 0) {
      doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(160, 160, 160)
      doc.text('Sin eventos registrados', M + 8, y)
      y += 8
    }

    // ── PIE DE PÁGINA (todas las páginas) ──────────────────
    const totalPags = doc.internal.getNumberOfPages()
    for (let p = 1; p <= totalPags; p++) {
      doc.setPage(p)
      doc.setDrawColor(220, 220, 220); doc.line(M, 282, W - M, 282)
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 160)
      doc.text('Ingemedic de Colombia S.A.S.  ·  Valledupar, Cesar', M, 287)
      doc.text(`Página ${p} de ${totalPags}`, W - M, 287, { align: 'right' })
    }

    doc.save(`HojaVida_${equipo.codigo || 'equipo'}.pdf`)
    showToast('PDF generado')
  }

  function abrirModalTipo() {
    setFormTipo({ icono: '', atributos: {} })
    setModalTipo(true)
  }

  async function guardarTipo() {
    const nombreVal = formTipo.atributos?.nombre?.trim()
    if (!nombreVal) { showToast('El nombre es obligatorio', 'error'); return }
    for (const campo of camposTipo) {
      if (campo.obligatorio && !formTipo.atributos?.[campo.clave]?.toString().trim()) {
        showToast(`El campo "${campo.nombre}" es obligatorio`, 'error'); return
      }
    }
    setSaving(true)
    const { data, error } = await supabase.from('tipos_equipo')
      .insert({
        categoria_id: catActual.id,
        nombre: nombreVal,
        imagen_url: formTipo.icono ? `icono:${formTipo.icono}` : null,
        atributos: Object.keys(formTipo.atributos).length > 0 ? formTipo.atributos : null,
        activo: true,
      })
      .select('*, categoria:categorias_equipo(id, nombre, atributos_extra)').single()
    if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
    registrarBitacora({ modulo: 'inventario', accion: 'crear', entidad: 'tipo de equipo', entidad_id: data.id, detalle: { nombre: formTipo.atributos?.nombre } })
    skipSyncUntil.current = Date.now() + 2500
    setTipos(prev => [...prev, data])
    showToast('Tipo creado')
    setSaving(false)
    setModalTipo(false)
  }

  function abrirModalNueva() {
    const estadoDisponible = estados.find(e => e.nombre === 'Disponible')
    setFormUnidad({ codigo: '', estado_id: estadoDisponible?.id || '', atributos: {} })
    setModalNueva(true)
  }

  async function guardarUnidad() {
    for (const campo of camposUnidad.filter(c => c.clave !== 'codigo')) {
      if (campo.obligatorio && !formUnidad.atributos[campo.clave]?.toString().trim()) {
        showToast(`El campo "${campo.nombre}" es obligatorio`, 'error'); return
      }
    }
    setSaving(true)
    const { data: newUnit, error } = await supabase.from('equipos').insert({
      tipo_equipo_id: tipoActual.id,
      codigo: formUnidad.codigo?.trim() || null,
      estado_id: formUnidad.estado_id || null,
      atributos: Object.keys(formUnidad.atributos).length > 0 ? formUnidad.atributos : null,
    }).select('id').single()
    if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
    registrarBitacora({ modulo: 'inventario', accion: 'crear', entidad: 'equipo', entidad_id: newUnit?.id, detalle: { codigo: formUnidad.codigo?.trim() || null } })
    showToast('Equipo registrado')
    setSaving(false)
    setModalNueva(false)
    router.refresh()
  }

  function renderCampo(campo, atributos, setAtributos) {
    const val = atributos[campo.clave] || ''
    const onChange = v => setAtributos({ ...atributos, [campo.clave]: v })
    if (campo.tipo === 'booleano') return (
      <select value={val} onChange={e => onChange(e.target.value)} className={inputCls}>
        <option value="">Seleccionar...</option>
        <option value="si">Sí</option>
        <option value="no">No</option>
      </select>
    )
    if (campo.tipo === 'lista') return (
      <select value={val} onChange={e => onChange(e.target.value)} className={inputCls}>
        <option value="">Seleccionar...</option>
        {(campo.opciones || []).map(op => <option key={op} value={op}>{op}</option>)}
      </select>
    )
    return (
      <input type={campo.tipo === 'numero' ? 'number' : campo.tipo === 'fecha' ? 'date' : 'text'}
        value={val} onChange={e => onChange(e.target.value)} placeholder={campo.nombre} className={inputCls} />
    )
  }

  function nombreTipo(tipo) {
    return tipo?.nombre || '—'
  }

  function renderIconoTipo(tipo, size = 48) {
    if (tipo?.imagen_url && !tipo.imagen_url.startsWith('icono:')) {
      return <img src={tipo.imagen_url} alt={nombreTipo(tipo)}
        style={{ width: size, height: size, objectFit: 'contain', padding: 0 }} />
    }
    if (tipo?.imagen_url?.startsWith('icono:')) {
      return <IconoEquipo clave={tipo.imagen_url.replace('icono:', '')} size={size} color="#D81B43" />
    }
    const cat = categorias.find(c => c.id === tipo?.categoria_id || c.id === tipo?.categoria?.id)
    const iconoCat = cat?.imagen_url?.startsWith('icono:') ? cat.imagen_url.replace('icono:', '') : null
    if (iconoCat) return <IconoEquipo clave={iconoCat} size={size} color="#D81B43" />
    return (
      <div style={{ width: size * 0.88, height: size * 0.88 }}
        className="rounded-2xl bg-[#D81B43]/10 flex items-center justify-center flex-shrink-0">
        <span style={{ fontSize: size * 0.44 }} className="font-black text-[#D81B43]/35 leading-none select-none">
          {nombreTipo(tipo).charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Topbar */}
      <div className="h-14 md:h-16 md:bg-white md:border-b md:border-slate-200 flex items-center px-4 md:px-7 flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-600 md:text-slate-400 flex-wrap">
          {vista !== 'categorias' && (
            <button onClick={volver}
              className="md:hidden w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-700 font-bold text-base">
              ←
            </button>
          )}
          <button onClick={() => { setVista('categorias'); setCatActual(null); setTipoActual(null) }}
            className="text-[18px] font-bold text-slate-800 md:text-sm md:font-medium md:text-slate-400 md:hover:text-slate-700 transition-colors">Inventario</button>
          {catActual && <>
            <span>/</span>
            <button onClick={() => { setVista('tipos'); setTipoActual(null) }}
              className="hover:text-slate-700 transition-colors">{catActual.nombre}</button>
          </>}
          {tipoActual && <>
            <span>/</span>
            <span className="text-slate-700 font-semibold">{nombreTipo(tipoActual)}</span>
          </>}
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {vista !== 'categorias' && (
            <button onClick={volver}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-500 border border-slate-200 rounded-[9px] hover:border-slate-300 transition-all">
              ← Volver
            </button>
          )}
          <button
            onClick={() => exportar('completo')}
            disabled={exportando}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-[9px] hover:border-slate-300 transition-all disabled:opacity-50">
            <Download size={13} /> {exportando ? 'Exportando…' : 'Exportar Excel'}
          </button>
          {vista === 'tipos' && (
            <button onClick={abrirModalTipo}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F] transition-colors">
              <Plus size={14} strokeWidth={2.5} /> Nuevo tipo
            </button>
          )}
          {vista === 'unidades' && (
            <button onClick={abrirModalNueva}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F] transition-colors">
              <Plus size={14} strokeWidth={2.5} /> Nueva unidad
            </button>
          )}
        </div>
      </div>

      {/* FAB móvil — solo en vista tipos o unidades */}
      {vista === 'tipos' && (
        <button onClick={abrirModalTipo}
          className="fixed bottom-[calc(var(--mobile-nav-space,0px)+16px)] right-4 z-30 md:hidden shadow-lg rounded-full w-14 h-14 bg-[#D81B43] text-white flex items-center justify-center">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}
      {vista === 'unidades' && (
        <button onClick={abrirModalNueva}
          className="fixed bottom-[calc(var(--mobile-nav-space,0px)+16px)] right-4 z-30 md:hidden shadow-lg rounded-full w-14 h-14 bg-[#D81B43] text-white flex items-center justify-center">
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-28 md:pb-6">

        {/* Stats — desktop: grid 4 cols / móvil: chips en scroll horizontal */}
        {(() => {
          const statsItems = [
            { label: 'Total equipos', value: stats.total, color: '#1E293B' },
            { label: 'Disponibles', value: stats.disponibles, color: '#0F7B55' },
            { label: 'En préstamo', value: stats.prestamo, color: '#0E86A0' },
            { label: 'Mantenimiento', value: stats.mant, color: '#B45309' },
          ]
          return (
            <>
              {/* Desktop */}
              <div className="hidden md:grid md:grid-cols-4 gap-4 mb-6">
                {statsItems.map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[11.5px] text-slate-400 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Móvil: scroll horizontal */}
              <div className="md:hidden flex gap-2 overflow-x-auto pb-1 mb-4 -mx-3 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {statsItems.map(s => (
                  <div key={s.label} className="flex-shrink-0 bg-white border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm">
                    <span className="text-[15px] font-extrabold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">{s.label}</span>
                  </div>
                ))}
              </div>
            </>
          )
        })()}

        {/* VISTA CATEGORÍAS */}
        {vista === 'categorias' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categorias.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-400">
                <Package className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <div className="font-semibold mb-1">Sin categorías configuradas</div>
                <div className="text-[13px]">Ve a <a href="/admin/configuracion" className="text-[#D81B43] hover:underline">Configuración → Categorías</a></div>
              </div>
            )}
            {categorias.map(cat => {
              const tiposCat = tipos.filter(t => t.categoria_id === cat.id)
              const equiposCat = equipos.filter(e => tiposCat.some(t => t.id === e.tipo_equipo_id))
              const nCampos = (cat.atributos_extra?.campos_tipo?.length || 0) + (cat.atributos_extra?.campos_unidad?.length || 0)
              const iconoClave = cat.imagen_url?.startsWith('icono:') ? cat.imagen_url.replace('icono:', '') : null
              return (
                <div key={cat.id} onClick={() => irACat(cat)}
                  className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-[#D81B43]/40 hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-[#D81B43]/5 flex items-center justify-center mb-3">
                    {iconoClave
                      ? <IconoEquipo clave={iconoClave} size={24} color="#D81B43" />
                      : <Package className="w-5 h-5 text-[#D81B43] opacity-60" />
                    }
                  </div>
                  <div className="text-[13px] font-bold text-slate-800 leading-tight mb-1">{cat.nombre}</div>
                  <div className="text-[11.5px] text-slate-400">
                    {tiposCat.length} tipo{tiposCat.length !== 1 ? 's' : ''} · {equiposCat.length} uds.
                  </div>
                  {nCampos > 0 && <div className="text-[11px] text-[#D81B43]/50 mt-1">{nCampos} campos</div>}
                  <div className="mt-2 text-[#D81B43] text-[11.5px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Ver tipos →</div>
                </div>
              )
            })}
          </div>
        )}

        {/* VISTA TIPOS */}
        {vista === 'tipos' && (
          <div>
            {tiposDeCat.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 md:max-w-[280px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar tipo..."
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white" />
                </div>
                <div className="text-[12px] text-slate-400 flex-shrink-0">
                  {tiposDeCat.filter(t => !search || nombreTipo(t).toLowerCase().includes(search.toLowerCase())).length} tipo{tiposDeCat.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
            {tiposDeCat.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Inbox className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <div className="font-semibold mb-1">Sin tipos en esta categoría</div>
                <div className="text-[13px]">Usa el botón &quot;Nuevo tipo&quot; para agregar uno</div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {tiposDeCat
                .filter(t => !search || nombreTipo(t).toLowerCase().includes(search.toLowerCase()))
                .map(tipo => {
                  const stock = stockPorTipo[tipo.id] || { total: 0, disponibles: 0 }
                  const campos = camposTipo.filter(c => c.clave !== 'nombre').slice(0, 2)
                  return (
                    <div key={tipo.id} onClick={() => irATipo(tipo)}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-[#D81B43]/50 hover:shadow-sm transition-all group flex">
                      {/* Imagen — izquierda, más compacta en móvil */}
                      <div className="w-[72px] h-[72px] md:w-[100px] md:h-[100px] flex-shrink-0 bg-[#F8FAFC] flex items-center justify-center p-2 md:p-4 border-r border-slate-100">
                        {renderIconoTipo(tipo, 48)}
                      </div>
                      {/* Contenido — derecha */}
                      <div className="p-3 flex-1 min-w-0 flex flex-col justify-center relative">
                        <div className="text-[13px] font-bold text-slate-800 leading-snug mb-1 pr-10 break-words">{nombreTipo(tipo)}</div>
                        {campos.map(c => (
                          <div key={c.clave} className="text-[11px] text-slate-500 truncate">
                            <span className="text-slate-400">{c.nombre}:</span> {formatearValor(tipo.atributos?.[c.clave], c.tipo)}
                          </div>
                        ))}
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-[#0F7B55]">{stock.disponibles} disp.</span>
                          {stock.total - stock.disponibles > 0 && (
                            <span className="text-[11px] text-slate-400"> · {stock.total - stock.disponibles} en uso</span>
                          )}
                        </div>
                        {/* Badge unidades */}
                        <div className="absolute top-2 right-2 bg-white border border-slate-100 rounded-full px-2 py-0.5 shadow-sm">
                          <span className="text-[13px] font-extrabold text-slate-800 tabular-nums">{stock.total}</span>
                          <span className="text-[9px] text-slate-400 ml-0.5">uds.</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
        )}

        {/* VISTA UNIDADES */}
        {vista === 'unidades' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[160px] max-w-[300px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white" />
              </div>
              <div className="text-[12px] text-slate-400 ml-auto">
                {unidadesDeTipo.length} unidad{unidadesDeTipo.length !== 1 ? 'es' : ''}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 md:p-4 mb-4 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 size={13} color="#0F7B55" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.03em] text-slate-500">Estado</span>
                  </div>
                  <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white text-slate-600 h-[38px]">
                    <option value="">Todos</option>
                    {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                  </select>
                </div>
                {camposUnidad.map((campo, idx) => {
                  const style = CAMPO_FILTRO_STYLES[campo.clave] || FILTRO_PALETTE[idx % FILTRO_PALETTE.length]
                  const Icon = style.Icon
                  const valoresUnicos = valoresUnicosPorCampo[campo.clave] || []
                  const usarDropdown = valoresUnicos.length > 0 && valoresUnicos.length <= FILTRO_DROPDOWN_MAX
                  return (
                    <div key={campo.clave}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Icon size={13} color={style.color} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.03em] text-slate-500">{campo.nombre}</span>
                      </div>
                      {usarDropdown ? (
                        <select
                          value={filtrosCampos[campo.clave] || ''}
                          onChange={e => setFiltrosCampos(f => ({ ...f, [campo.clave]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white text-slate-600 h-[38px]"
                        >
                          <option value="">Todos</option>
                          {valoresUnicos.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={filtrosCampos[campo.clave] || ''}
                          onChange={e => setFiltrosCampos(f => ({ ...f, [campo.clave]: e.target.value }))}
                          placeholder="Filtrar…"
                          className="w-full px-3 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white h-[38px] placeholder:text-slate-400"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {unidadesDeTipo.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm text-center py-12 text-slate-400">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <div className="font-semibold mb-1">Sin unidades registradas</div>
                <div className="text-[13px]">Usa &quot;Nueva unidad&quot; para registrar el primer equipo</div>
              </div>
            ) : (
              <>
                {/* Tabla — solo en md+ */}
                <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-100">
                        {camposUnidad.map(c => (
                          <th key={c.clave} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">{c.nombre}</th>
                        ))}
                        <th className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">Estado</th>
                        <th className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">Paciente</th>
                        <th className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">Dirección</th>
                        <th className="w-10 bg-slate-50"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {unidadesDeTipo.map(eq => {
                        const est = eq.estado?.nombre || '—'
                        const estSty = ESTADO_STYLES[est] || {}
                        return (
                          <tr key={eq.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => setDrawer(eq)}>
                            {camposUnidad.map(c => (
                              <td key={c.clave} className="px-4 py-3 text-[13px] text-slate-600">
                                {c.clave === 'codigo'
                                  ? <span className="font-mono text-[12.5px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                    {eq.atributos?.[c.clave] || eq[c.clave] || '—'}
                                  </span>
                                  : formatearValor(eq.atributos?.[c.clave] || eq[c.clave], c.tipo)
                                }
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                                style={{ background: estSty.bg, color: estSty.color }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: estSty.dot }} />
                                {est}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[12.5px] text-slate-600">
                              {eq.paciente_actual?.nombre
                                ? <span className="truncate max-w-[140px] block">{eq.paciente_actual.nombre}</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-[12.5px] text-slate-500">
                              {eq.paciente_actual?.direccion
                                ? <span className="truncate max-w-[160px] block">{eq.paciente_actual.direccion}</span>
                                : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-3 text-slate-300">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cards móvil — solo en mobile */}
                <div className="md:hidden flex flex-col gap-2">
                  {unidadesDeTipo.map(eq => {
                    const est = eq.estado?.nombre || '—'
                    const estSty = ESTADO_STYLES[est] || {}
                    const primerCampo = camposUnidad[0]
                    const segundoCampo = camposUnidad[1]
                    return (
                      <div key={eq.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 cursor-pointer active:bg-slate-50"
                        onClick={() => setDrawer(eq)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            {primerCampo && (
                              <div className="font-mono text-[13px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded inline-block">
                                {eq.atributos?.[primerCampo.clave] || eq[primerCampo.clave] || '—'}
                              </div>
                            )}
                            {segundoCampo && (
                              <div className="text-[12px] text-slate-500 mt-1">
                                <span className="text-slate-400">{segundoCampo.nombre}:</span>{' '}
                                {formatearValor(eq.atributos?.[segundoCampo.clave] || eq[segundoCampo.clave], segundoCampo.tipo)}
                              </div>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold flex-shrink-0"
                            style={{ background: estSty.bg, color: estSty.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: estSty.dot }} />
                            {est}
                          </span>
                        </div>
                        {camposUnidad.slice(2).map(c => (
                          <div key={c.clave} className="text-[11.5px] text-slate-500">
                            <span className="text-slate-400">{c.nombre}:</span>{' '}
                            {formatearValor(eq.atributos?.[c.clave] || eq[c.clave], c.tipo)}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── DRAWER HOJA DE VIDA ── */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="fixed inset-x-0 bottom-0 h-[92vh] rounded-t-2xl md:rounded-none md:inset-x-auto md:top-0 md:right-0 md:bottom-0 md:h-full md:w-[500px] bg-white z-30 flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
              <div>
                <div className="text-[16px] font-bold text-slate-800">
                  {drawer.atributos?.codigo || drawer.codigo || 'Equipo'}
                  {tipoActual && <span className="text-slate-400 font-normal ml-2">— {nombreTipo(tipoActual)}</span>}
                </div>
                <div className="text-[12px] text-slate-400 mt-0.5">{catActual?.nombre}</div>
              </div>
              <button onClick={() => setDrawer(null)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100">
                {camposTipo.length > 0 && (
                  <div>
                    <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Información del equipo</div>
                    <div className="space-y-2.5">
                      {camposTipo.map(c => (
                        <div key={c.clave} className="flex justify-between text-[12.5px]">
                          <span className="text-slate-400">{c.nombre}</span>
                          <span className="font-medium text-slate-700 text-right ml-4">{formatearValor(tipoActual?.atributos?.[c.clave], c.tipo)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Estado y adquisición</div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[12.5px]">
                      <span className="text-slate-400">Estado</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: (ESTADO_STYLES[drawer.estado?.nombre] || {}).bg, color: (ESTADO_STYLES[drawer.estado?.nombre] || {}).color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: (ESTADO_STYLES[drawer.estado?.nombre] || {}).dot }} />
                        {drawer.estado?.nombre || '—'}
                      </span>
                    </div>
                    {camposUnidad.filter(c => c.clave !== 'codigo').map(c => (
                      <div key={c.clave} className="flex justify-between text-[12.5px]">
                        <span className="text-slate-400">{c.nombre}</span>
                        <span className="font-medium text-slate-700 text-right ml-4">{formatearValor(drawer.atributos?.[c.clave], c.tipo)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="text-[13px] font-bold text-slate-700 mb-4">Hoja de vida · Línea de tiempo</div>
                {(() => {
                  // Construir lista de eventos mezclados y ordenados newest-first
                  const eventos = []

                  // Eventos de préstamo
                  prestamosDrawer.forEach(p => {
                    const fechaEntrega    = p.fecha_entrega    ? new Date(p.fecha_entrega)    : (p.orden?.fecha_creacion ? new Date(p.orden.fecha_creacion) : null)
                    const fechaDevolucion = p.fecha_devolucion ? new Date(p.fecha_devolucion) : null
                    const activo         = !fechaDevolucion
                    const cliente        = p.orden?.cliente?.nombre || 'Cliente desconocido'
                    const paciente       = p.orden?.paciente?.nombre || null
                    const codigo         = p.orden?.codigo || null

                    eventos.push({
                      key:    `prestamo-${p.id}`,
                      fecha:  fechaEntrega,
                      titulo: `Prestado a ${cliente}`,
                      sub:    [paciente ? `Paciente: ${paciente}` : null, codigo ? `Orden ${codigo}` : null].filter(Boolean).join(' · ') || null,
                      dot:    activo
                        ? { bg: '#0E86A0', ring: true }       // activo: celeste con anillo
                        : { bg: '#64748B', inner: false },    // cerrado: gris
                    })

                    if (fechaDevolucion) {
                      eventos.push({
                        key:    `devolucion-${p.id}`,
                        fecha:  fechaDevolucion,
                        titulo: 'Devuelto',
                        sub:    codigo ? `Orden ${codigo}` : null,
                        dot:    { bg: '#0F7B55', inner: false },
                      })
                    }
                  })

                  // Ordenar newest-first (nulls al final)
                  eventos.sort((a, b) => {
                    if (!a.fecha && !b.fecha) return 0
                    if (!a.fecha) return 1
                    if (!b.fecha) return -1
                    return b.fecha - a.fecha
                  })

                  if (eventos.length === 0) {
                    return (
                      <div className="text-[12px] text-slate-400 italic py-2">
                        Sin actividad registrada aún
                      </div>
                    )
                  }

                  return (
                    <div className="relative">
                      <div className="absolute left-[7px] top-2 bottom-0 w-[1.5px] bg-slate-100" />
                      <div className="space-y-5">
                        {eventos.map(ev => (
                          <div key={ev.key} className="flex gap-3">
                            {/* Dot */}
                            <div className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 z-10 flex items-center justify-center"
                              style={{
                                backgroundColor: ev.dot.ring ? 'white' : ev.dot.bg,
                                border: ev.dot.ring ? `2px solid ${ev.dot.bg}` : 'none',
                                boxShadow: ev.dot.ring ? `0 0 0 3px ${ev.dot.bg}22` : 'none',
                              }}>
                              {ev.dot.inner && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              {ev.dot.ring  && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.dot.bg }} />}
                            </div>
                            {/* Texto */}
                            <div>
                              <div className="text-[12.5px] font-semibold text-slate-700">{ev.titulo}</div>
                              {ev.sub && <div className="text-[11px] text-slate-400 mt-0.5">{ev.sub}</div>}
                              <div className="text-[11.5px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock size={10} />
                                {ev.fecha ? formatearFecha(ev.fecha.toISOString()) : 'Fecha no disponible'}
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Placeholder mantenimientos */}
                        <div className="flex gap-3 opacity-40">
                          <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-300 flex-shrink-0 mt-0.5 z-10" />
                          <div className="text-[12px] text-slate-400 italic">Los mantenimientos aparecerán aquí</div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex gap-2 flex-shrink-0">
              <button onClick={abrirEditar}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300 transition-all">
                <Edit3 size={13} /> Editar ficha
              </button>
              <button onClick={() => generarHojaVidaPDF(drawer)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1B3A6B] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#152D54] transition-colors ml-auto">
                <FileText size={13} /> Hoja de vida PDF
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL EDITAR FICHA ── */}
      {modalEditar && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={intentarCerrarEditar} />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-[540px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
                <h3 className="text-[15px] font-bold text-slate-800">Editar equipo</h3>
                <button onClick={intentarCerrarEditar} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><X size={16} /></button>
              </div>
              <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-[8px]">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                <span className="text-[12px] text-amber-700">Los cambios quedan registrados en la bitácora con fecha y usuario</span>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div>
                  <label className={labelCls}>Estado</label>
                  <select value={formEditar.estado_id}
                    onChange={e => { setFormEditar(f => ({ ...f, estado_id: e.target.value })); setFormDirty(true) }}
                    className={inputCls}>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                {camposUnidad.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">Columnas de la unidad</div>
                    {camposUnidad.map(campo => (
                      <div key={campo.clave}>
                        <label className={labelCls}>{campo.nombre}</label>
                        {renderCampo(campo, formEditar.atributos, atrs => {
                          setFormEditar(f => ({ ...f, atributos: atrs }))
                          setFormDirty(true)
                        })}
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-slate-100 pt-4">
                  <label className={labelCls}>Motivo de cambio <span className="text-[#D81B43]">*</span></label>
                  <textarea value={formEditar.motivo}
                    onChange={e => { setFormEditar(f => ({ ...f, motivo: e.target.value })); setFormDirty(true) }}
                    placeholder="Describe el asunto de la corrección..." rows={3}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] text-slate-800 outline-none focus:border-[#D81B43] resize-none placeholder:text-slate-400" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
                <button onClick={intentarCerrarEditar} className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">Cancelar</button>
                <button onClick={guardarEdicion} disabled={saving}
                  className="px-5 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F] disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL CONFIRMAR SALIR ── */}
      {modalSalir && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" />
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-[360px] p-6 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={22} className="text-[#D81B43]" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-2">¿Seguro quieres salir?</h3>
              <p className="text-[13px] text-slate-400 mb-6">Se perderán los cambios que hiciste si sales</p>
              <div className="flex gap-2">
                <button onClick={() => { setModalSalir(false); setModalEditar(false) }}
                  className="flex-1 py-2.5 border border-[#D81B43] text-[#D81B43] rounded-[9px] text-[13px] font-semibold hover:bg-red-50 transition-colors">
                  Sí, quiero salir
                </button>
                <button onClick={() => setModalSalir(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-[9px] text-[13px] font-semibold hover:bg-slate-200 transition-colors">
                  No, quedarme
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL NUEVO TIPO ── */}
      {modalTipo && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setModalTipo(false)} />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Nuevo tipo de equipo</h3>
                  <div className="text-[12px] text-slate-400 mt-0.5">{catActual?.nombre}</div>
                </div>
                <button onClick={() => setModalTipo(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {camposTipo.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-[13px]">Esta categoría no tiene columnas del tipo configuradas.</div>
                    <a href="/admin/configuracion" className="text-[#D81B43] text-[13px] hover:underline mt-1 block">Ir a Configuración →</a>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className={labelCls}>Ícono del tipo <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                      <GaleriaIconos seleccionado={formTipo.icono} onSeleccionar={clave => setFormTipo(f => ({ ...f, icono: f.icono === clave ? '' : clave }))} />
                    </div>
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">Columnas del tipo</div>
                      {camposTipo.map(campo => (
                        <div key={campo.clave}>
                          <label className={labelCls}>{campo.nombre}{campo.obligatorio && <span className="text-[#D81B43] ml-1">*</span>}</label>
                          {renderCampo(campo, formTipo.atributos, atrs => setFormTipo(f => ({ ...f, atributos: atrs })))}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
                <button onClick={() => setModalTipo(false)} className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">Cancelar</button>
                <button onClick={guardarTipo} disabled={saving}
                  className="px-5 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F] disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar tipo'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL NUEVA UNIDAD ── */}
      {modalNueva && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setModalNueva(false)} />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-800">Nueva unidad</h3>
                  <div className="text-[12px] text-slate-400 mt-0.5">{nombreTipo(tipoActual)} · {catActual?.nombre}</div>
                </div>
                <button onClick={() => setModalNueva(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {camposTipo.length > 0 && (
                  <div className="bg-slate-50 rounded-[10px] border border-slate-200 p-4">
                    <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-3">Columnas del tipo</div>
                    <div className="grid grid-cols-2 gap-3">
                      {camposTipo.map(campo => (
                        <div key={campo.clave}>
                          <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">{campo.nombre}</div>
                          <div className="text-[13px] font-medium text-slate-700">{formatearValor(tipoActual?.atributos?.[campo.clave], campo.tipo)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className={labelCls}>Código interno</label>
                  <input value={formUnidad.codigo || ''} onChange={e => setFormUnidad(f => ({ ...f, codigo: e.target.value }))}
                    placeholder="ej. EQ-001" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <select value={formUnidad.estado_id} onChange={e => setFormUnidad(f => ({ ...f, estado_id: e.target.value }))} className={inputCls}>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                {camposUnidad.filter(c => c.clave !== 'codigo').length > 0 && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">Columnas de la unidad</div>
                    {camposUnidad.filter(c => c.clave !== 'codigo').map(campo => (
                      <div key={campo.clave}>
                        <label className={labelCls}>{campo.nombre}{campo.obligatorio && <span className="text-[#D81B43] ml-1">*</span>}</label>
                        {renderCampo(campo, formUnidad.atributos, atrs => setFormUnidad(f => ({ ...f, atributos: atrs })))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
                <button onClick={() => setModalNueva(false)} className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">Cancelar</button>
                <button onClick={guardarUnidad} disabled={saving}
                  className="px-5 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F] disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar unidad'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`fixed bottom-28 md:bottom-6 right-4 md:right-6 z-[60] px-4 py-3 rounded-[10px] text-[13px] font-medium text-white shadow-lg ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-[#0F7B55]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}