'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Search, Plus, X, CheckCircle2 } from 'lucide-react'

const TIPO_ID = {
  preventivo: '1618f69b-f062-478b-a5c8-fc42d20088d0',
  correctivo:  '311ee6dc-7311-457d-91a7-7ac01208cb24',
}
const ESTADO_ID = {
  abierto:    '9c71ba4d-e82d-4714-b2fb-4cc242cd47be',
  en_proceso: 'eef1b963-5bf5-4be7-85ab-312d9605234d',
  cerrado:    '08136bd6-f134-406a-98e9-2132516edd7f',
}

function calcDias(fechaApertura, fechaCierre) {
  const ini = new Date(fechaApertura)
  const fin = fechaCierre ? new Date(fechaCierre) : new Date()
  return Math.max(0, Math.round((fin - ini) / (1000 * 60 * 60 * 24)))
}

export default function MantenimientosClient({
  mantenimientosIniciales, estados, tipos,
  categorias, tiposEquipo, equipos, checklist: checklistInicial
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [mants, setMants]           = useState(mantenimientosIniciales)
  const [vista, setVista]           = useState('activos')
  const [search, setSearch]         = useState('')
  const [drawer, setDrawer]         = useState(null)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalCierre, setModalCierre] = useState(null)
  const [checklistCierre, setChecklistCierre] = useState([]) // actividades del tipo del equipo
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)

  const [form, setForm] = useState({
    tipo_id: TIPO_ID.preventivo,
    cat_id: '', tipo_equipo_id: '', equipo_id: '',
    tecnico: '', observaciones: '',
  })

  const [cierreForm, setCierreForm] = useState({
    actividades: '', tecnico: '', resultado: 'disponible',
    checklist: {},
  })

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const activos  = useMemo(() => mants.filter(m => m.en_curso), [mants])
  const cerrados = useMemo(() => mants.filter(m => !m.en_curso), [mants])

  const tiposFiltrados = useMemo(() =>
    form.cat_id ? tiposEquipo.filter(t => t.categoria_id === form.cat_id) : [],
    [tiposEquipo, form.cat_id]
  )

  const equiposFiltrados = useMemo(() =>
    form.tipo_equipo_id ? equipos.filter(e => e.tipo_equipo?.id === form.tipo_equipo_id) : [],
    [equipos, form.tipo_equipo_id]
  )

  const mantsFiltrados = useMemo(() => {
    const lista = vista === 'activos' ? activos : cerrados
    return lista.filter(m =>
      !search || [m.codigo, m.equipo?.serial, m.equipo?.codigo, m.tecnico,
        m.equipo?.tipo_equipo?.marca, m.equipo?.tipo_equipo?.modelo]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    )
  }, [vista, activos, cerrados, search])

  const stats = useMemo(() => ({
    activos:     activos.length,
    correctivos: activos.filter(m => m.tipo_id === TIPO_ID.correctivo).length,
    preventivos: activos.filter(m => m.tipo_id === TIPO_ID.preventivo).length,
    cerrados:    cerrados.length,
  }), [activos, cerrados])

  // ── CREAR ──────────────────────────────────────────────────
  async function guardarMant() {
    if (!form.equipo_id) { showToast('Selecciona una unidad de equipo', 'error'); return }
    setSaving(true)

    const codigo = `MAN-${new Date().getFullYear()}-${String(mants.length + 1).padStart(3, '0')}`

    const { data, error } = await supabase.from('mantenimientos').insert({
      codigo,
      equipo_id:             form.equipo_id,
      tipo_mantenimiento_id: form.tipo_id,
      estado_id:             ESTADO_ID.abierto,
      tecnico:               form.tecnico,
      observaciones_cliente: form.observaciones,
      fecha_apertura:        new Date().toISOString().split('T')[0],
      en_curso:              true,
    }).select(`
      *,
      equipo:equipos(id, codigo, serial,
        tipo_equipo:tipos_equipo(id, marca, modelo,
          categoria:categorias_equipo(id, nombre)
        )
      ),
      estado:estados_mantenimiento(id, nombre),
      tipo:tipos_mantenimiento(id, nombre)
    `).single()

    if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }

    // Marcar equipo en mantenimiento
    await supabase.from('equipos')
      .update({ estado_id: 'edf159bf-6402-4991-a673-ade689ded77e' })
      .eq('id', form.equipo_id)

    setMants(prev => [data, ...prev])
    showToast('Equipo ingresado a taller')
    setSaving(false)
    setModalNuevo(false)
    setForm({ tipo_id: TIPO_ID.preventivo, cat_id: '', tipo_equipo_id: '', equipo_id: '', tecnico: '', observaciones: '' })
  }

  // ── ABRIR CIERRE ──────────────────────────────────────────
  async function abrirCierre(m) {
    // Buscar la lista asignada al tipo de equipo
    const tipoEquipoId = m.equipo?.tipo_equipo?.id
    let actividades = []

    if (tipoEquipoId) {
      // 1. Buscar el tipo de equipo para obtener su lista_mantenimiento_id
      const { data: tipoData } = await supabase
        .from('tipos_equipo')
        .select('lista_mantenimiento_id')
        .eq('id', tipoEquipoId)
        .single()

      if (tipoData?.lista_mantenimiento_id) {
        // 2. Cargar actividades de esa lista
        const { data } = await supabase
          .from('actividades_lista_mantenimiento')
          .select('*')
          .eq('lista_id', tipoData.lista_mantenimiento_id)
          .eq('activo', true)
          .order('orden')
        actividades = data || []
      }
    }

    setChecklistCierre(actividades)
    const chkObj = {}
    actividades.forEach(a => chkObj[a.id] = false)
    setCierreForm({ actividades: '', tecnico: m.tecnico || '', resultado: 'disponible', checklist: chkObj })
    setModalCierre(m)
    setDrawer(null)
  }

  // ── CONFIRMAR CIERRE ──────────────────────────────────────
  async function confirmarCierre() {
    if (!modalCierre) return
    setSaving(true)
    const hoy = new Date().toISOString().split('T')[0]

    const { error } = await supabase.from('mantenimientos').update({
      en_curso:          false,
      estado_id:         ESTADO_ID.cerrado,
      fecha_cierre_real: hoy,
      actividades:       cierreForm.actividades,
      tecnico:           cierreForm.tecnico,
    }).eq('id', modalCierre.id)

    if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }

    // Guardar ítems del checklist completados
    const itemsCompletados = Object.entries(cierreForm.checklist)
      .filter(([_, v]) => v)
      .map(([id]) => id)

    if (itemsCompletados.length > 0) {
      await supabase.from('checklist_mantenimiento_items')?.insert(
        itemsCompletados.map(checklistId => ({
          mantenimiento_id: modalCierre.id,
          checklist_item_id: checklistId,
          completado: true,
          fecha: hoy,
        }))
      )
    }

    // Actualizar estado del equipo
    const nuevoEstadoEq = cierreForm.resultado === 'disponible'
      ? 'f33e7c6f-0f81-484e-9f0a-93fd28f9c414'
      : '1be9843f-bcbf-46f2-bb6c-5a487225b8c3'

    await supabase.from('equipos')
      .update({ estado_id: nuevoEstadoEq })
      .eq('id', modalCierre.equipo_id)

    setMants(prev => prev.map(m =>
      m.id === modalCierre.id
        ? { ...m, en_curso: false, fecha_cierre_real: hoy, actividades: cierreForm.actividades }
        : m
    ))
    showToast(cierreForm.resultado === 'disponible' ? 'Equipo devuelto a disponible' : 'Equipo dado de baja')
    setSaving(false)
    setModalCierre(null)
    router.refresh()
  }

  const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5'
  const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] text-slate-800 outline-none focus:border-[#2EB5D4] bg-white placeholder:text-slate-400'

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Topbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-[#1B3A6B]">Mantenimientos</div>
          <div className="text-[12px] text-slate-400 mt-0.5">
            {activos.length} equipo{activos.length !== 1 ? 's' : ''} en taller
          </div>
        </div>
        <button onClick={() => setModalNuevo(true)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
          <Plus size={14} strokeWidth={2.5} /> Ingresar equipo
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-3 md:p-6 gap-3 md:gap-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: 'En taller ahora', value: stats.activos,     color: '#B45309', onClick: () => setVista('activos') },
            { label: 'Correctivos',     value: stats.correctivos,  color: '#C0392B', onClick: () => setVista('activos') },
            { label: 'Preventivos',     value: stats.preventivos,  color: '#2EB5D4', onClick: () => setVista('activos') },
            { label: 'Historial total', value: stats.cerrados,     color: '#64748B', onClick: () => setVista('historial') },
          ].map(s => (
            <div key={s.label} onClick={s.onClick}
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
              placeholder="Buscar equipo, serial, técnico..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#2EB5D4] bg-white" />
          </div>
          <button onClick={() => setVista('activos')}
            className={`px-3 py-2 text-[12.5px] font-medium rounded-[9px] border transition-all ${vista === 'activos' ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-slate-500 border-slate-200 hover:border-[#2EB5D4]'}`}>
            🔧 En taller
          </button>
          <button onClick={() => setVista('historial')}
            className={`px-3 py-2 text-[12.5px] font-medium rounded-[9px] border transition-all ${vista === 'historial' ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-slate-500 border-slate-200 hover:border-[#2EB5D4]'}`}>
            📋 Historial
          </button>
        </div>

        {/* Tabla */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b-2 border-slate-200">
                  {['ID','Equipo','Serial','Tipo','Técnico','Ingreso',
                    vista === 'activos' ? 'Días' : 'Cierre',
                    vista === 'activos' ? 'Acción' : 'Resultado'
                  ].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mantsFiltrados.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-16 text-slate-400">
                    {vista === 'activos' ? 'Sin equipos en taller' : 'Sin mantenimientos cerrados'}
                  </td></tr>
                )}
                {mantsFiltrados.map(m => {
                  const dias   = calcDias(m.fecha_apertura, m.fecha_cierre_real)
                  const esCorr = m.tipo_id === TIPO_ID.correctivo
                  return (
                    <tr key={m.id} onClick={() => setDrawer(m)}
                      className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                      style={{ borderLeft: `3px solid ${esCorr ? '#C0392B' : '#2EB5D4'}` }}>
                      <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{m.codigo}</td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold text-slate-700">
                          {m.equipo?.tipo_equipo?.marca} {m.equipo?.tipo_equipo?.modelo}
                        </div>
                        <div className="text-[11px] text-slate-400">{m.equipo?.tipo_equipo?.categoria?.nombre}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{m.equipo?.serial || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${esCorr ? 'bg-red-50 text-red-600' : 'bg-[#E8F7FB] text-[#0E86A0]'}`}>
                          {esCorr ? '⚠️ Correctivo' : '🔵 Preventivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-slate-500">{m.tecnico || '—'}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-slate-400">{m.fecha_apertura}</td>
                      <td className="px-4 py-3">
                        {vista === 'activos'
                          ? <span className="font-mono font-bold text-[13px] text-amber-600">{dias} d</span>
                          : <span className="font-mono text-[12px] text-slate-400">{m.fecha_cierre_real || '—'}</span>
                        }
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {vista === 'activos' ? (
                          <button onClick={() => abrirCierre(m)}
                            className="px-3 py-1.5 bg-[#0F7B55] text-white text-[11.5px] font-bold rounded-[7px] hover:opacity-80 transition-opacity">
                            ✓ Cerrar
                          </button>
                        ) : (
                          <span className={`text-[12px] font-semibold ${m.actividades ? 'text-[#0F7B55]' : 'text-slate-400'}`}>
                            {m.actividades ? '✅ Completado' : '—'}
                          </span>
                        )}
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
          <div className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] bg-white z-30 flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b flex items-start justify-between flex-shrink-0 bg-[#1B3A6B]">
              <div>
                <div className="text-[15px] font-bold text-white font-mono">{drawer.codigo}</div>
                <div className="text-[12px] text-white/50 mt-0.5">
                  {drawer.equipo?.tipo_equipo?.marca} {drawer.equipo?.tipo_equipo?.modelo}
                </div>
              </div>
              <button onClick={() => setDrawer(null)} className="text-white/50 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Equipo</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Modelo</div>
                    <div className="text-[13.5px] font-semibold text-slate-700">{drawer.equipo?.tipo_equipo?.marca} {drawer.equipo?.tipo_equipo?.modelo}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Serial</div>
                    <div className="font-mono text-[13px] text-[#1B3A6B] font-bold">{drawer.equipo?.serial}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Código</div>
                    <div className="font-mono text-[13px] text-slate-600">{drawer.equipo?.codigo}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Categoría</div>
                    <div className="text-[13px] text-slate-600">{drawer.equipo?.tipo_equipo?.categoria?.nombre || '—'}</div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Mantenimiento</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Tipo</div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${drawer.tipo_id === TIPO_ID.correctivo ? 'bg-red-50 text-red-600' : 'bg-[#E8F7FB] text-[#0E86A0]'}`}>
                      {drawer.tipo_id === TIPO_ID.correctivo ? '⚠️ Correctivo' : '🔵 Preventivo'}
                    </span>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Días en taller</div>
                    <div className="text-[18px] font-extrabold text-amber-600 font-mono">{calcDias(drawer.fecha_apertura, drawer.fecha_cierre_real)}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Técnico</div>
                    <div className="text-[13.5px] text-slate-700">{drawer.tecnico || 'Sin asignar'}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Ingreso</div>
                    <div className="font-mono text-[13px] text-slate-600">{drawer.fecha_apertura}</div>
                  </div>
                  {drawer.observaciones_cliente && (
                    <div className="col-span-2">
                      <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Motivo</div>
                      <div className="text-[13px] text-slate-600 italic">“{drawer.observaciones_cliente}”</div>
                    </div>
                  )}
                  {drawer.actividades && (
                    <div className="col-span-2">
                      <div className="text-[10.5px] font-semibold uppercase text-slate-400 mb-1">Actividades realizadas</div>
                      <div className="text-[13px] text-slate-600">{drawer.actividades}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex gap-2 flex-shrink-0">
              {drawer.en_curso && (
                <button onClick={() => abrirCierre(drawer)}
                  className="flex-1 py-2.5 bg-[#0F7B55] text-white rounded-[9px] text-[13px] font-semibold hover:opacity-90 transition-opacity">
                  ✓ Cerrar mantenimiento
                </button>
              )}
              <button onClick={() => setDrawer(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300 transition-all">
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL NUEVO */}
      {modalNuevo && (
        <>
          <div className="fixed inset-0 bg-[#0F2448]/40 z-40 backdrop-blur-sm" onClick={() => setModalNuevo(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0 bg-[#1B3A6B]">
                <h3 className="text-[15px] font-bold text-white">Ingresar equipo a mantenimiento</h3>
                <button onClick={() => setModalNuevo(false)} className="text-white/50 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Tipo */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: TIPO_ID.preventivo, label: '🔵 Preventivo', sub: 'Rutina programada' },
                    { id: TIPO_ID.correctivo, label: '⚠️ Correctivo', sub: 'Falla técnica' },
                  ].map(t => (
                    <button key={t.id} onClick={() => setForm(f => ({ ...f, tipo_id: t.id }))}
                      className={`py-3 rounded-[10px] border-[1.5px] text-center transition-all ${form.tipo_id === t.id
                        ? t.id === TIPO_ID.preventivo ? 'border-[#2EB5D4] bg-[#E8F7FB]' : 'border-red-400 bg-red-50'
                        : 'border-slate-200'}`}>
                      <div className="text-[13px] font-bold text-slate-700">{t.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.sub}</div>
                    </button>
                  ))}
                </div>
                <div>
                  <label className={labelCls}>Categoría</label>
                  <select value={form.cat_id} onChange={e => setForm(f => ({ ...f, cat_id: e.target.value, tipo_equipo_id: '', equipo_id: '' }))}
                    className={inputCls}>
                    <option value="">Seleccionar categoría...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tipo de equipo</label>
                    <select value={form.tipo_equipo_id} onChange={e => setForm(f => ({ ...f, tipo_equipo_id: e.target.value, equipo_id: '' }))}
                      disabled={!form.cat_id} className={inputCls}>
                      <option value="">{form.cat_id ? 'Seleccionar...' : 'Selecciona categoría'}</option>
                      {tiposFiltrados.map(t => <option key={t.id} value={t.id}>{t.marca} {t.modelo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Unidad (serial)</label>
                    <select value={form.equipo_id} onChange={e => setForm(f => ({ ...f, equipo_id: e.target.value }))}
                      disabled={!form.tipo_equipo_id} className={inputCls}>
                      <option value="">{form.tipo_equipo_id ? 'Seleccionar...' : 'Selecciona tipo'}</option>
                      {equiposFiltrados.map(e => <option key={e.id} value={e.id}>{e.serial} ({e.codigo})</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Técnico responsable <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                  <input value={form.tecnico} onChange={e => setForm(f => ({ ...f, tecnico: e.target.value }))}
                    placeholder="Nombre del técnico" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Motivo / observaciones</label>
                  <input value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                    placeholder="Describe la razón del mantenimiento..." className={inputCls} />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
                <button onClick={() => setModalNuevo(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">
                  Cancelar
                </button>
                <button onClick={guardarMant} disabled={saving}
                  className="px-5 py-2.5 bg-[#1B3A6B] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#1E4D8C] disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Ingresar a taller'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL CIERRE */}
      {modalCierre && (
        <>
          <div className="fixed inset-0 bg-[#0F2448]/40 z-40 backdrop-blur-sm" onClick={() => setModalCierre(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0 bg-[#0F7B55]">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Cerrar mantenimiento</h3>
                  <div className="text-[12px] text-white/60 mt-0.5">
                    {modalCierre.equipo?.tipo_equipo?.marca} {modalCierre.equipo?.tipo_equipo?.modelo} · {modalCierre.equipo?.serial}
                  </div>
                </div>
                <button onClick={() => setModalCierre(null)} className="text-white/50 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10">
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Checklist del tipo de equipo */}
                {checklistCierre.length > 0 && (
                  <div>
                    <label className={labelCls}>
                      Checklist de actividades
                      <span className="text-slate-300 font-normal normal-case ml-1">
                        ({checklistCierre.length} actividad{checklistCierre.length !== 1 ? 'es' : ''} para este tipo)
                      </span>
                    </label>
                    <div className="space-y-2">
                      {checklistCierre.map(item => {
                        const checked = cierreForm.checklist[item.id]
                        return (
                          <div key={item.id}
                            onClick={() => setCierreForm(f => ({ ...f, checklist: { ...f.checklist, [item.id]: !f.checklist[item.id] } }))}
                            className={`flex items-center gap-3 p-3 rounded-[9px] border cursor-pointer transition-all ${checked ? 'border-[#0F7B55] bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all ${checked ? 'bg-[#0F7B55]' : 'border-[1.5px] border-slate-300'}`}>
                              {checked && <CheckCircle2 size={10} className="text-white" />}
                            </div>
                            <span className={`text-[13px] ${checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.nombre}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {checklistCierre.length === 0 && (
                  <div className="text-[12.5px] text-slate-400 bg-slate-50 rounded-[9px] p-3 border border-slate-200">
                    Sin checklist configurado para este tipo de equipo. Ve a Configuración → Tipos de equipo para agregar actividades.
                  </div>
                )}

                {/* Actividades libres */}
                <div>
                  <label className={labelCls}>Actividades adicionales <span className="text-slate-300 font-normal normal-case">(texto libre)</span></label>
                  <textarea value={cierreForm.actividades} onChange={e => setCierreForm(f => ({ ...f, actividades: e.target.value }))}
                    placeholder="Repuestos usados, observaciones, procedimientos adicionales..." rows={3}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] text-slate-800 outline-none focus:border-[#2EB5D4] resize-none placeholder:text-slate-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Técnico que cierra</label>
                    <input value={cierreForm.tecnico} onChange={e => setCierreForm(f => ({ ...f, tecnico: e.target.value }))}
                      placeholder="Nombre del técnico" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Resultado</label>
                    <select value={cierreForm.resultado} onChange={e => setCierreForm(f => ({ ...f, resultado: e.target.value }))}
                      className={inputCls}>
                      <option value="disponible">✅ Equipo disponible</option>
                      <option value="baja">🗑️ Dar de baja</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
                <button onClick={() => setModalCierre(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600">
                  Cancelar
                </button>
                <button onClick={confirmarCierre} disabled={saving}
                  className="px-5 py-2.5 bg-[#0F7B55] text-white rounded-[9px] text-[13px] font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Guardando...' : '✓ Confirmar cierre'}
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