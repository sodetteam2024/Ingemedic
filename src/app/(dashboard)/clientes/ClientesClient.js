'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, User, Users, Building2, MapPin, Phone, X, Edit3, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function ClientesClient({ clientesIniciales, departamentos, municipios }) {
  const router   = useRouter()
  const supabase = createClient()

  const [clientes, setClientes]         = useState(clientesIniciales)
  const [search, setSearch]             = useState('')
  const [filtroTipo, setFiltroTipo]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroDep, setFiltroDep]       = useState('')
  const [filtroMun, setFiltroMun]       = useState('')
  const [drawer, setDrawer]             = useState(null)
  const [modal, setModal]               = useState(false)
  const [editando, setEditando]         = useState(null)
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState(null)

  // Form state
  const [form, setForm] = useState({
    tipo_persona: 'natural', nombre: '', nit_cc: '', digito_verificacion: '',
    departamento_id: '', municipio_id: '', direccion: '', telefono: '', email: '',
  })

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  const munsFiltrados = useMemo(() =>
    form.departamento_id
      ? municipios.filter(m => m.departamento_id === form.departamento_id)
      : [],
    [municipios, form.departamento_id]
  )

  const munsFiltroBar = useMemo(() =>
    filtroDep ? municipios.filter(m => m.departamento_id === filtroDep) : municipios,
    [municipios, filtroDep]
  )

  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      const mq = !search || [c.nombre, c.nit_cc, c.email, c.telefono]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()))
      const mt = !filtroTipo   || c.tipo_persona === filtroTipo
      const me = !filtroEstado || (filtroEstado === 'activo' ? c.activo : !c.activo)
      const md = !filtroDep    || c.departamento_id === filtroDep
      const mm = !filtroMun    || c.municipio_id === filtroMun
      return mq && mt && me && md && mm
    }).sort((a, b) => b.activo - a.activo)
  }, [clientes, search, filtroTipo, filtroEstado, filtroDep, filtroMun])

  const stats = useMemo(() => ({
    total:    clientes.length,
    natural:  clientes.filter(c => c.tipo_persona === 'natural').length,
    juridica: clientes.filter(c => c.tipo_persona === 'juridica').length,
    activos:  clientes.filter(c => c.activo).length,
  }), [clientes])

  function abrirModalNuevo() {
    setEditando(null)
    setForm({
      tipo_persona: 'natural', nombre: '', nit_cc: '', digito_verificacion: '',
      departamento_id: '', municipio_id: '', direccion: '', telefono: '', email: '',
    })
    setModal(true)
  }

  function abrirModalEditar(c) {
    setEditando(c)
    setForm({
      tipo_persona:        c.tipo_persona || 'natural',
      nombre:              c.nombre || '',
      nit_cc:              c.nit_cc || '',
      digito_verificacion: c.digito_verificacion || '',
      departamento_id:     c.departamento_id || '',
      municipio_id:        c.municipio_id || '',
      direccion:           c.direccion || '',
      telefono:            c.telefono || '',
      email:               c.email || '',
    })
    setModal(true)
    setDrawer(null)
  }

  async function guardar() {
    if (!form.nombre.trim()) { showToast('El nombre es requerido', 'error'); return }
    if (!form.nit_cc.trim()) { showToast('El documento es requerido', 'error'); return }
    setSaving(true)

    const payload = {
      tipo_persona:        form.tipo_persona,
      nombre:              form.nombre.trim(),
      nit_cc:              form.nit_cc.trim(),
      digito_verificacion: form.tipo_persona === 'juridica' ? form.digito_verificacion.trim() : null,
      departamento_id:     form.departamento_id || null,
      municipio_id:        form.municipio_id || null,
      direccion:           form.direccion.trim(),
      telefono:            form.telefono.trim(),
      email:               form.email.trim(),
    }

    if (editando) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', editando.id)
      if (error) { showToast('Error al actualizar: ' + error.message, 'error'); setSaving(false); return }
      showToast('Cliente actualizado')
    } else {
      const { error } = await supabase.from('clientes').insert({ ...payload, activo: true })
      if (error) { showToast('Error al crear: ' + error.message, 'error'); setSaving(false); return }
      showToast('Cliente registrado')
    }

    setSaving(false)
    setModal(false)
    router.refresh()
  }

  async function toggleActivo(c) {
    const { error } = await supabase.from('clientes').update({ activo: !c.activo }).eq('id', c.id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setClientes(prev => prev.map(x => x.id === c.id ? { ...x, activo: !x.activo } : x))
    setDrawer(prev => prev?.id === c.id ? { ...prev, activo: !prev.activo } : prev)
    showToast(c.activo ? 'Cliente desactivado' : 'Cliente activado')
  }

  const getNombreDep = (id) => departamentos.find(d => d.id === id)?.nombre || '—'
  const getNombreMun = (id) => municipios.find(m => m.id === id)?.nombre || '—'

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-[#1B3A6B]">Clientes</div>
          <div className="text-[12px] text-slate-400 mt-0.5">Directorio de clientes</div>
        </div>
        <button onClick={abrirModalNuevo}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Nuevo cliente
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Total', value: stats.total, color: '#1B3A6B' },
            { label: 'Personas naturales', value: stats.natural, color: '#2EB5D4' },
            { label: 'Personas jurídicas', value: stats.juridica, color: '#6D28D9' },
            { label: 'Activos', value: stats.activos, color: '#0F7B55' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11.5px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o documento..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#2EB5D4] bg-white" />
          </div>
          <select value={filtroDep} onChange={e => { setFiltroDep(e.target.value); setFiltroMun('') }}
            className="px-3 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#2EB5D4] bg-white text-slate-600">
            <option value="">Todos los departamentos</option>
            {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
          <select value={filtroMun} onChange={e => setFiltroMun(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#2EB5D4] bg-white text-slate-600">
            <option value="">Todos los municipios</option>
            {munsFiltroBar.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          {['', 'natural', 'juridica'].map((t, i) => (
            <button key={i} onClick={() => setFiltroTipo(t)}
              className={`px-3 py-2 text-[12.5px] font-medium rounded-[9px] border transition-all ${filtroTipo === t ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-slate-500 border-slate-200 hover:border-[#2EB5D4]'}`}>
              {t === '' ? 'Todos' : t === 'natural'
                ? <><User className="w-4 h-4 inline-block mr-1" />Natural</>
                : <><Building2 className="w-4 h-4 inline-block mr-1" />Jurídica</>}
            </button>
          ))}
          {['', 'activo', 'inactivo'].map((e, i) => (
            <button key={i} onClick={() => setFiltroEstado(e)}
              className={`px-3 py-2 text-[12.5px] font-medium rounded-[9px] border transition-all ${filtroEstado === e && e !== '' ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : e === '' ? '' : 'bg-white text-slate-500 border-slate-200 hover:border-[#2EB5D4]'} ${e === '' ? 'hidden' : ''}`}>
              {e === 'activo'
                ? <><CheckCircle2 className="w-4 h-4 inline-block mr-1" />Activos</>
                : <><XCircle className="w-4 h-4 inline-block mr-1" />Inactivos</>}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-400">
              <Users className="w-16 h-16 mx-auto mb-3" />
              <div className="font-semibold">No se encontraron clientes</div>
            </div>
          )}
          {clientesFiltrados.map(c => {
            const esJ   = c.tipo_persona === 'juridica'
            const docStr = esJ && c.digito_verificacion ? `NIT ${c.nit_cc}-${c.digito_verificacion}` : `C.C. ${c.nit_cc}`
            return (
              <div key={c.id} onClick={() => setDrawer(c)}
                className={`bg-white rounded-xl border overflow-hidden shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#2EB5D4] ${!c.activo ? 'opacity-60' : ''}`}>
                <div className="p-4 border-b border-slate-50 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ${esJ ? 'bg-[#1B3A6B]' : 'bg-[#2EB5D4]'}`}>
                    {esJ ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-[#1B3A6B] truncate">{c.nombre}</div>
                    <div className="text-[11.5px] font-mono text-slate-400 mt-0.5">{docStr}</div>
                    <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${esJ ? 'bg-purple-50 text-purple-700' : 'bg-[#E8F7FB] text-[#0E86A0]'}`}>
                      {esJ ? 'Persona jurídica' : 'Persona natural'}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  {(c.municipio_id || c.departamento_id) && (
                    <div className="flex items-center gap-2 text-[12.5px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {getNombreMun(c.municipio_id)}{c.departamento_id ? `, ${getNombreDep(c.departamento_id)}` : ''}
                    </div>
                  )}
                  {c.telefono && (
                    <div className="flex items-center gap-2 text-[12.5px] text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                      {c.telefono}
                    </div>
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-50 flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 text-[11.5px] font-semibold ${c.activo ? 'text-[#0F7B55]' : 'text-slate-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.activo ? 'bg-[#0F7B55]' : 'bg-slate-300'}`} />
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">{c.id.slice(0, 8)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DRAWER */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-[#0F2448]/30 z-20 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-[480px] bg-white z-30 flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0 bg-[#1B3A6B]">
              <div>
                <div className="text-[15px] font-bold text-white">{drawer.nombre}</div>
                <div className="text-[12px] text-white/50 mt-0.5">{drawer.id.slice(0, 8)} · {drawer.tipo_persona === 'juridica' ? 'Persona jurídica' : 'Persona natural'}</div>
              </div>
              <button onClick={() => setDrawer(null)} className="text-white/50 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Info principal */}
              <div className="p-5 border-b border-slate-100">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Información</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1">Documento</div>
                    <div className="font-mono text-[13.5px] font-bold text-[#1B3A6B]">
                      {drawer.tipo_persona === 'juridica' && drawer.digito_verificacion
                        ? `NIT ${drawer.nit_cc}-${drawer.digito_verificacion}`
                        : `C.C. ${drawer.nit_cc}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1">Estado</div>
                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${drawer.activo ? 'text-[#0F7B55]' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${drawer.activo ? 'bg-[#0F7B55]' : 'bg-slate-300'}`} />
                      {drawer.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Ubicación */}
              <div className="p-5 border-b border-slate-100">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Ubicación</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1">Departamento</div>
                    <div className="text-[13.5px] text-slate-700">{getNombreDep(drawer.departamento_id)}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1">Municipio</div>
                    <div className="text-[13.5px] text-slate-700">{getNombreMun(drawer.municipio_id)}</div>
                  </div>
                  {drawer.direccion && (
                    <div className="col-span-2">
                      <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1">Dirección</div>
                      <div className="text-[13.5px] text-slate-700">{drawer.direccion}</div>
                    </div>
                  )}
                </div>
              </div>
              {/* Contacto */}
              <div className="p-5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Contacto</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1">Teléfono</div>
                    <div className="text-[13.5px] text-slate-700">{drawer.telefono || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 mb-1">Email</div>
                    <div className="text-[13px] text-slate-700 break-all">{drawer.email || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex gap-2 flex-shrink-0">
              <button onClick={() => abrirModalEditar(drawer)}
                className="flex-1 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-semibold text-slate-600 hover:border-[#2EB5D4] hover:text-[#2EB5D4] transition-all">
                <Edit3 className="w-4 h-4 inline-block mr-1" />Editar
              </button>
              <button onClick={() => toggleActivo(drawer)}
                className={`flex-1 py-2.5 border rounded-[9px] text-[13px] font-semibold transition-all ${drawer.activo ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                {drawer.activo
                  ? <><XCircle className="w-4 h-4 inline-block mr-1" />Desactivar</>
                  : <><CheckCircle2 className="w-4 h-4 inline-block mr-1" />Activar</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-[#0F2448]/40 z-40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[520px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                <h3 className="text-[15px] font-bold text-[#1B3A6B]">{editando ? 'Editar cliente' : 'Nuevo cliente'}</h3>
                <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Tipo */}
                <div className="grid grid-cols-2 gap-3">
                  {['natural', 'juridica'].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, tipo_persona: t }))}
                      className={`py-3 rounded-[10px] border-[1.5px] text-center transition-all ${form.tipo_persona === t
                        ? t === 'natural' ? 'border-[#2EB5D4] bg-[#E8F7FB]' : 'border-purple-400 bg-purple-50'
                        : 'border-slate-200'}`}>
                      <div className="text-[13px] font-bold text-slate-700">
                        {t === 'natural'
                          ? <><User className="w-4 h-4 inline-block mr-1" />Persona natural</>
                          : <><Building2 className="w-4 h-4 inline-block mr-1" />Persona jurídica</>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t === 'natural' ? 'Paciente domiciliario' : 'IPS, empresa, corporación'}</div>
                    </button>
                  ))}
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">
                    Nombre completo / Razón social
                  </label>
                  <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre del cliente"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4]" />
                </div>

                {/* Documento */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">
                      {form.tipo_persona === 'juridica' ? 'NIT' : 'C.C.'}
                    </label>
                    <input value={form.nit_cc} onChange={e => setForm(f => ({ ...f, nit_cc: e.target.value }))}
                      placeholder={form.tipo_persona === 'juridica' ? '900123456' : '1065432198'}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4]" />
                  </div>
                  {form.tipo_persona === 'juridica' && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">
                        Dígito verificación
                      </label>
                      <input value={form.digito_verificacion} onChange={e => setForm(f => ({ ...f, digito_verificacion: e.target.value }))}
                        placeholder="5" maxLength={1}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4]" />
                    </div>
                  )}
                </div>

                {/* Departamento / Municipio */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Departamento</label>
                    <select value={form.departamento_id} onChange={e => setForm(f => ({ ...f, departamento_id: e.target.value, municipio_id: '' }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4] bg-white">
                      <option value="">Seleccionar...</option>
                      {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Municipio</label>
                    <select value={form.municipio_id} onChange={e => setForm(f => ({ ...f, municipio_id: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4] bg-white">
                      <option value="">Seleccionar...</option>
                      {munsFiltrados.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Dirección</label>
                  <input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                    placeholder="Calle, carrera, barrio..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4]" />
                </div>

                {/* Teléfono / Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Teléfono</label>
                    <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                      placeholder="300 1234567"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5">Email</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      type="email" placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4]" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
                <button onClick={() => setModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300 transition-all">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={saving}
                  className="px-5 py-2.5 bg-[#1B3A6B] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#1E4D8C] transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-[10px] text-[13px] font-medium text-white shadow-lg transition-all ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-[#0F7B55]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}