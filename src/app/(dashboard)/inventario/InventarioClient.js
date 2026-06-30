'use client'
import Image from 'next/image'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Package, Inbox, Plus, X, Search, Download, Edit3, FileText, AlertTriangle, Clock } from 'lucide-react'
import { IconoEquipo, GaleriaIconos } from '@/components/inventario/IconosEquipo'

const ESTADO_STYLES = {
  'Disponible':        { bg: '#ECFDF5', color: '#0F7B55', dot: '#0F7B55' },
  'En préstamo':       { bg: '#E8F7FB', color: '#0E86A0', dot: '#2EB5D4' },
  'En mantenimiento':  { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  'Con novedad':       { bg: '#FEF2F2', color: '#C0392B', dot: '#C0392B' },
  'Baja':              { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
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
  const router   = useRouter()
  const supabase = createClient()

  const [categorias, setCategorias] = useState(catsIniciales)
  const [tipos, setTipos]           = useState(tiposIniciales)
  const [vista, setVista]           = useState('categorias')
  const [catActual, setCatActual]   = useState(null)
  const [tipoActual, setTipoActual] = useState(null)
  const [search, setSearch]         = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [drawer, setDrawer]         = useState(null)
  const [modalNueva, setModalNueva] = useState(false)
  const [modalTipo, setModalTipo]   = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalSalir, setModalSalir] = useState(false)
  const [formDirty, setFormDirty]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [exportando, setExportando] = useState(false)
  const [toast, setToast]           = useState(null)
  const [formUnidad, setFormUnidad] = useState({ estado_id: '', atributos: {} })
  const [formTipo, setFormTipo]     = useState({ icono: '', atributos: {} })
  const [formEditar, setFormEditar] = useState({ estado_id: '', atributos: {}, motivo: '' })

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const stats = useMemo(() => ({
    total:       equipos.length,
    disponibles: equipos.filter(e => e.estado?.nombre === 'Disponible').length,
    prestamo:    equipos.filter(e => e.estado?.nombre === 'En préstamo').length,
    mant:        equipos.filter(e => e.estado?.nombre === 'En mantenimiento').length,
  }), [equipos])

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
      if (e.estado?.nombre === 'Disponible')       map[e.tipo_equipo_id].disponibles++
      if (e.estado?.nombre === 'En préstamo')      map[e.tipo_equipo_id].prestamo++
      if (e.estado?.nombre === 'En mantenimiento') map[e.tipo_equipo_id].mant++
    })
    return map
  }, [equipos])

  const unidadesDeTipo = useMemo(() => {
    if (!tipoActual) return []
    let result = equipos.filter(e => e.tipo_equipo_id === tipoActual.id)
    if (search) result = result.filter(e => {
      const atrs = e.atributos || {}
      return Object.values(atrs).some(v => v?.toString().toLowerCase().includes(search.toLowerCase())) ||
        e.serial?.toLowerCase().includes(search.toLowerCase()) ||
        e.codigo?.toLowerCase().includes(search.toLowerCase())
    })
    if (filtroEstado) result = result.filter(e => e.estado?.nombre === filtroEstado)
    return result
  }, [equipos, tipoActual, search, filtroEstado])

  const camposTipo   = catActual?.atributos_extra?.campos_tipo   || []
  const camposUnidad = catActual?.atributos_extra?.campos_unidad || []

  function irACat(cat) {
    setCatActual(categorias.find(c => c.id === cat.id) || cat)
    setSearch('')
    setVista('tipos')
  }

  function irATipo(tipo) {
    setTipoActual(tipo)
    setSearch('')
    setFiltroEstado('')
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
    showToast('Equipo actualizado')
    setSaving(false)
    setModalEditar(false)
    setDrawer(null)
    router.refresh()
  }

  // ── EXPORTAR vía API route ──────────────────────────────
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
      a.download = `inventario_${nivel}_${new Date().toISOString().slice(0,10)}.xlsx`
      a.click()
    } catch (e) {
      showToast('Error exportando', 'error')
    } finally {
      setExportando(false)
    }
  }

  // ── NUEVO TIPO ──────────────────────────────────────────
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
        nombre:       nombreVal,
        imagen_url:   formTipo.icono ? `icono:${formTipo.icono}` : null,
        atributos:    Object.keys(formTipo.atributos).length > 0 ? formTipo.atributos : null,
        activo:       true,
      })
      .select('*, categoria:categorias_equipo(id, nombre, atributos_extra)').single()
    if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
    setTipos(prev => [...prev, data])
    showToast('Tipo creado')
    setSaving(false)
    setModalTipo(false)
  }

  // ── NUEVA UNIDAD ────────────────────────────────────────
  function abrirModalNueva() {
    const estadoDisponible = estados.find(e => e.nombre === 'Disponible')
    setFormUnidad({ serial: '', codigo: '', estado_id: estadoDisponible?.id || '', atributos: {} })
    setModalNueva(true)
  }

  async function guardarUnidad() {
    for (const campo of camposUnidad.filter(c => c.clave !== 'serial' && c.clave !== 'codigo')) {
      if (campo.obligatorio && !formUnidad.atributos[campo.clave]?.toString().trim()) {
        showToast(`El campo "${campo.nombre}" es obligatorio`, 'error'); return
      }
    }
    setSaving(true)
    const { error } = await supabase.from('equipos').insert({
      tipo_equipo_id: tipoActual.id,
      serial:         formUnidad.serial?.trim() || null,
      codigo:         formUnidad.codigo?.trim() || null,
      estado_id:      formUnidad.estado_id || null,
      atributos:      Object.keys(formUnidad.atributos).length > 0 ? formUnidad.atributos : null,
    })
    if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
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
    return tipo?.atributos?.nombre || tipo?.nombre || '—'
  }

  // Renderiza imagen del tipo, o ícono de la categoría como fallback
  function renderIconoTipo(tipo, size = 48) {
    // Imagen real del tipo (URL de Supabase storage)
    if (tipo?.imagen_url && !tipo.imagen_url.startsWith('icono:')) {
      return <img src={tipo.imagen_url} alt={nombreTipo(tipo)}
        style={{ width: size, height: size, objectFit: 'contain', padding: 4 }} />
    }
    // Ícono de la categoría
    const cat = categorias.find(c => c.id === tipo?.categoria_id || c.id === tipo?.categoria?.id)
    const iconoCat = cat?.imagen_url?.startsWith('icono:') ? cat.imagen_url.replace('icono:', '') : null
    if (iconoCat) return <IconoEquipo clave={iconoCat} size={size} color="#D81B43" />
    // Fallback genérico
    return <Package className="text-slate-200" style={{ width: size, height: size }} />
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* Topbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-7 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <button onClick={() => { setVista('categorias'); setCatActual(null); setTipoActual(null) }}
            className="hover:text-slate-700 transition-colors font-medium">Inventario</button>
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
        <div className="ml-auto flex items-center gap-2">
          {vista !== 'categorias' && (
            <button onClick={volver}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-500 border border-slate-200 rounded-[9px] hover:border-slate-300 transition-all">
              ← Volver
            </button>
          )}
          <button
            onClick={() => vista === 'categorias'
              ? exportar('categorias')
              : vista === 'tipos'
              ? exportar('tipos', { categoria_id: catActual?.id })
              : exportar('unidades', { tipo_id: tipoActual?.id })
            }
            disabled={exportando}
            className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-600 border border-slate-200 rounded-[9px] hover:border-slate-300 transition-all disabled:opacity-50">
            <Download size={13} /> {exportando ? 'Exportando...' : 'Exportar Excel'}
          </button>
          {vista === 'tipos' && (
            <button onClick={abrirModalTipo}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F] transition-colors">
              <Plus size={14} strokeWidth={2.5} /> Nuevo tipo
            </button>
          )}
          {vista === 'unidades' && (
            <button onClick={abrirModalNueva}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F] transition-colors">
              <Plus size={14} strokeWidth={2.5} /> Nueva unidad
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total equipos', value: stats.total,       color: '#1E293B' },
            { label: 'Disponibles',   value: stats.disponibles, color: '#0F7B55' },
            { label: 'En préstamo',   value: stats.prestamo,    color: '#0E86A0' },
            { label: 'Mantenimiento', value: stats.mant,        color: '#B45309' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11.5px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* VISTA CATEGORÍAS */}
        {vista === 'categorias' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categorias.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-400">
                <Package className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <div className="font-semibold mb-1">Sin categorías configuradas</div>
                <div className="text-[13px]">Ve a <a href="/configuracion" className="text-[#D81B43] hover:underline">Configuración → Categorías</a></div>
              </div>
            )}
            {categorias.map(cat => {
              const tiposCat   = tipos.filter(t => t.categoria_id === cat.id)
              const equiposCat = equipos.filter(e => tiposCat.some(t => t.id === e.tipo_equipo_id))
              const nCampos    = (cat.atributos_extra?.campos_tipo?.length || 0) + (cat.atributos_extra?.campos_unidad?.length || 0)
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
            {/* Buscador */}
            {tiposDeCat.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-[280px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar tipo..."
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white" />
                </div>
                <div className="text-[12px] text-slate-400 ml-auto">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tiposDeCat
                .filter(t => !search || nombreTipo(t).toLowerCase().includes(search.toLowerCase()))
                .map(tipo => {
                  const stock  = stockPorTipo[tipo.id] || { total: 0, disponibles: 0 }
                  const campos = camposTipo.filter(c => c.clave !== 'nombre').slice(0, 2)
                  return (
                    <div key={tipo.id} onClick={() => irATipo(tipo)}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-[#D81B43]/50 hover:shadow-md transition-all group">
                      {/* Imagen/ícono */}
                      <div className="h-[70px] bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                        {renderIconoTipo(tipo, 44)}
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <div className="text-[13px] font-bold text-slate-800 leading-tight">{nombreTipo(tipo)}</div>
                          <div className="text-right flex-shrink-0 ml-1">
                            <div className="text-[16px] font-extrabold text-slate-800 tabular-nums leading-none">{stock.total}</div>
                            <div className="text-[9.5px] text-slate-400 leading-none mt-0.5">uds.</div>
                          </div>
                        </div>
                        {campos.map(c => (
                          <div key={c.clave} className="text-[11px] text-slate-500 truncate">
                            <span className="text-slate-400">{c.nombre}:</span> {formatearValor(tipo.atributos?.[c.clave], c.tipo)}
                          </div>
                        ))}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] text-[#0F7B55] font-semibold">
                            {stock.disponibles} disp.
                          </span>
                          {stock.total - stock.disponibles > 0 && (
                            <span className="text-[11px] text-slate-400">
                              {stock.total - stock.disponibles} en uso
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              }
            </div>
          </div>
        )}

        {/* VISTA UNIDADES — tabla plana */}
        {vista === 'unidades' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-[300px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white" />
              </div>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white text-slate-600">
                <option value="">Todos los estados</option>
                {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
              </select>
              <div className="text-[12px] text-slate-400 ml-auto">
                {unidadesDeTipo.length} unidad{unidadesDeTipo.length !== 1 ? 'es' : ''}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {unidadesDeTipo.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <div className="font-semibold mb-1">Sin unidades registradas</div>
                  <div className="text-[13px]">Usa &quot;Nueva unidad&quot; para registrar el primer equipo</div>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      {camposUnidad.map(c => (
                        <th key={c.clave} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">{c.nombre}</th>
                      ))}
                      <th className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">Estado</th>
                      <th className="w-10 bg-slate-50"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {unidadesDeTipo.map(eq => {
                      const est    = eq.estado?.nombre || '—'
                      const estSty = ESTADO_STYLES[est] || {}
                      return (
                        <tr key={eq.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setDrawer(eq)}>
                          {camposUnidad.map(c => (
                            <td key={c.clave} className="px-4 py-3 text-[13px] text-slate-600">
                              {c.clave === 'serial' || c.clave === 'codigo'
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
                          <td className="px-3 py-3 text-slate-300">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── DRAWER HOJA DE VIDA ── */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-[500px] bg-white z-30 flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
              <div>
                <div className="text-[16px] font-bold text-slate-800">
                  {drawer.atributos?.codigo || drawer.codigo || drawer.atributos?.serial || drawer.serial || 'Equipo'}
                  {tipoActual && <span className="text-slate-400 font-normal ml-2">— {nombreTipo(tipoActual)}</span>}
                </div>
                <div className="text-[12px] text-slate-400 mt-0.5">{catActual?.nombre}</div>
              </div>
              <button onClick={() => setDrawer(null)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Info */}
              <div className="p-6 grid grid-cols-2 gap-6 border-b border-slate-100">
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
                    {camposUnidad.filter(c => c.clave !== 'serial' && c.clave !== 'codigo').map(c => (
                      <div key={c.clave} className="flex justify-between text-[12.5px]">
                        <span className="text-slate-400">{c.nombre}</span>
                        <span className="font-medium text-slate-700 text-right ml-4">{formatearValor(drawer.atributos?.[c.clave], c.tipo)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Línea de tiempo */}
              <div className="p-6">
                <div className="text-[13px] font-bold text-slate-700 mb-4">Hoja de vida · Línea de tiempo</div>
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-0 w-[1.5px] bg-slate-100" />
                  <div className="space-y-5">
                    {/* Evento: registro */}
                    <div className="flex gap-3">
                      <div className="w-4 h-4 rounded-full bg-[#25A9E0] flex-shrink-0 mt-0.5 z-10 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <div>
                        <div className="text-[12.5px] font-semibold text-slate-700">Equipo registrado en el sistema</div>
                        <div className="text-[11.5px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          {drawer.fecha_creacion ? formatearFecha(drawer.fecha_creacion) : 'Fecha no disponible'}
                        </div>
                      </div>
                    </div>
                    {/* Aquí se conectarán los mantenimientos */}
                    <div className="flex gap-3 opacity-40">
                      <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-300 flex-shrink-0 mt-0.5 z-10" />
                      <div className="text-[12px] text-slate-400 italic">Los mantenimientos aparecerán aquí</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex gap-2 flex-shrink-0">
              <button onClick={abrirEditar}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300 transition-all">
                <Edit3 size={13} /> Editar ficha
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F] transition-colors ml-auto">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[540px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[360px] p-6 shadow-2xl text-center">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
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
                    <a href="/configuracion" className="text-[#D81B43] text-[13px] hover:underline mt-1 block">Ir a Configuración →</a>
                  </div>
                ) : (
                  <>
                    {/* Galería de iconos */}
                    <div>
                      <label className={labelCls}>Ícono del tipo <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                      <GaleriaIconos seleccionado={formTipo.icono} onSeleccionar={clave => setFormTipo(f => ({ ...f, icono: f.icono === clave ? '' : clave }))} />
                    </div>
                    {/* Campos del tipo */}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Serial</label>
                    <input value={formUnidad.serial || ''} onChange={e => setFormUnidad(f => ({ ...f, serial: e.target.value }))}
                      placeholder="ej. SN-001234" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Código interno</label>
                    <input value={formUnidad.codigo || ''} onChange={e => setFormUnidad(f => ({ ...f, codigo: e.target.value }))}
                      placeholder="ej. EQ-001" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <select value={formUnidad.estado_id} onChange={e => setFormUnidad(f => ({ ...f, estado_id: e.target.value }))} className={inputCls}>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                {camposUnidad.filter(c => c.clave !== 'serial' && c.clave !== 'codigo').length > 0 && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">Columnas de la unidad</div>
                    {camposUnidad.filter(c => c.clave !== 'serial' && c.clave !== 'codigo').map(campo => (
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
        <div className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-[10px] text-[13px] font-medium text-white shadow-lg ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-[#0F7B55]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}