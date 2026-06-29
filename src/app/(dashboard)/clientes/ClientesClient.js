'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Plus, X, Edit3, Search, Building2, User,
  Phone, Mail, MapPin, FileText, AlertTriangle, ChevronRight
} from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] text-slate-800 outline-none focus:border-[#D81B43] bg-white transition-colors placeholder:text-slate-400'
const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5'

const TIPO_STYLES = {
  'Jurídica': { bg: '#E8F7FB', color: '#0E86A0', icon: <Building2 size={14} /> },
  'Natural':  { bg: '#F1F5F9', color: '#475569', icon: <User size={14} /> },
}

export default function ClientesClient({ clientesIniciales, departamentos, municipios }) {
  const supabase = createClient()

  const [clientes, setClientes]           = useState(clientesIniciales)
  const [search, setSearch]               = useState('')
  const [filtroTipo, setFiltroTipo]       = useState('')
  const [drawer, setDrawer]               = useState(null)
  const [modal, setModal]                 = useState(false)
  const [modalEliminar, setModalEliminar] = useState(null)
  const [saving, setSaving]               = useState(false)
  const [toast, setToast]                 = useState(null)
  const [form, setForm]                   = useState({})
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([])

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  function abrirModal(cliente = null) {
    if (cliente) {
      setForm({
        id:                  cliente.id,
        tipo_persona:        cliente.tipo_persona || '',
        nombre:              cliente.nombre || '',
        nit_cc:              cliente.nit_cc || '',
        digito_verificacion: cliente.digito_verificacion || '',
        direccion:           cliente.direccion || '',
        telefono:            cliente.telefono || '',
        email:               cliente.email || '',
        departamento_id:     cliente.departamento_id || '',
        municipio_id:        cliente.municipio_id || '',
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
    if (!form.nombre?.trim())   { showToast('El nombre es requerido', 'error'); return }
    if (!form.tipo_persona)     { showToast('El tipo de persona es requerido', 'error'); return }
    setSaving(true)
    const payload = {
      tipo_persona:        form.tipo_persona,
      nombre:              form.nombre.trim(),
      nit_cc:              form.nit_cc?.trim() || null,
      digito_verificacion: form.digito_verificacion?.trim() || null,
      direccion:           form.direccion?.trim() || null,
      telefono:            form.telefono?.trim() || null,
      email:               form.email?.trim() || null,
      departamento_id:     form.departamento_id || null,
      municipio_id:        form.municipio_id || null,
    }
    if (form.id) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', form.id)
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setClientes(prev => prev.map(c => c.id === form.id ? {
        ...c, ...payload,
        departamento: departamentos.find(d => d.id === form.departamento_id) || c.departamento,
        municipio:    municipios.find(m => m.id === form.municipio_id)       || c.municipio,
      } : c))
      if (drawer?.id === form.id) setDrawer(prev => ({
        ...prev, ...payload,
        departamento: departamentos.find(d => d.id === form.departamento_id) || prev.departamento,
        municipio:    municipios.find(m => m.id === form.municipio_id)       || prev.municipio,
      }))
      showToast('Cliente actualizado')
    } else {
      const { data, error } = await supabase.from('clientes')
        .insert({ ...payload, activo: true })
        .select('*, municipio:municipios(id, nombre), departamento:departamentos(id, nombre)')
        .single()
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setClientes(prev => [data, ...prev])
      showToast('Cliente creado')
    }
    setSaving(false); setModal(false)
  }

  async function eliminarCliente(id) {
    const { error } = await supabase.from('clientes').update({ activo: false }).eq('id', id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setClientes(prev => prev.filter(c => c.id !== id))
    if (drawer?.id === id) setDrawer(null)
    setModalEliminar(null)
    showToast('Cliente eliminado')
  }

  const estiloTipo = c => TIPO_STYLES[c.tipo_persona] || TIPO_STYLES['Jurídica']

  const stats = useMemo(() => ({
    total:    clientes.length,
    juridica: clientes.filter(c => c.tipo_persona === 'Jurídica').length,
    natural:  clientes.filter(c => c.tipo_persona === 'Natural').length,
  }), [clientes])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-slate-800">Clientes</div>
          <div className="text-[12px] text-slate-400 mt-0.5">Gestión de clientes y arrendatarios</div>
        </div>
        <button onClick={() => abrirModal()}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[#D81B43] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#B0172F] transition-colors">
          <Plus size={14} strokeWidth={2.5} /> Nuevo cliente
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-6 pb-4 flex-shrink-0">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Total clientes',      value: stats.total,    color: '#1E293B' },
              { label: 'Personas jurídicas',  value: stats.juridica, color: '#0E86A0' },
              { label: 'Personas naturales',  value: stats.natural,  color: '#475569' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11.5px] text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-[340px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, NIT, email o teléfono..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#D81B43] bg-white" />
            </div>
            <div className="flex items-center gap-2">
              {[
                { value: '',         label: 'Todos' },
                { value: 'Jurídica', label: 'Persona jurídica' },
                { value: 'Natural',  label: 'Persona natural' },
              ].map(t => (
                <button key={t.value} onClick={() => setFiltroTipo(t.value)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                    filtroTipo === t.value
                      ? 'bg-[#D81B43] text-white'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-[#D81B43] hover:text-[#D81B43]'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="text-[12px] text-slate-400 ml-auto">
              {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {clientesFiltrados.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <div className="font-semibold mb-1">{search || filtroTipo ? 'Sin resultados' : 'Sin clientes registrados'}</div>
                <div className="text-[13px]">{search || filtroTipo ? 'Intenta con otros filtros' : 'Usa "Nuevo cliente" para agregar uno'}</div>
              </div>
            ) : (
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
                      <tr key={c.id} onClick={() => setDrawer(c)}
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
                            {c.email    && <div className="flex items-center gap-1.5 text-[12px] text-slate-500"><Mail size={11} className="text-slate-400" />{c.email}</div>}
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
            )}
          </div>
        </div>
      </div>

      {/* ── DRAWER ── */}
      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm" onClick={() => setDrawer(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-[420px] bg-white z-30 flex flex-col shadow-2xl">
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
                  { label: 'NIT / CC',   value: drawer.nit_cc ? `${drawer.nit_cc}${drawer.digito_verificacion ? `-${drawer.digito_verificacion}` : ''}` : null },
                  { label: 'Teléfono',   value: drawer.telefono, icon: <Phone size={12} /> },
                  { label: 'Email',      value: drawer.email,    icon: <Mail size={12} /> },
                  { label: 'Dirección',  value: drawer.direccion, icon: <MapPin size={12} /> },
                  { label: 'Ubicación',  value: drawer.municipio ? `${drawer.municipio.nombre}, ${drawer.departamento?.nombre}` : null, icon: <MapPin size={12} /> },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className="flex justify-between text-[12.5px]">
                    <span className="text-slate-400 flex items-center gap-1">{f.icon}{f.label}</span>
                    <span className="font-medium text-slate-700 text-right ml-4 max-w-[220px]">{f.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-6">
                <div className="text-[13px] font-bold text-slate-700 mb-4">Equipos en préstamo</div>
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <div className="text-[12.5px]">Sin equipos activos</div>
                  <div className="text-[11.5px] mt-1 text-slate-300">Los préstamos aparecerán aquí</div>
                </div>
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
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[560px] max-h-[calc(100vh-2rem)] flex flex-col shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
                <h3 className="text-[16px] font-bold text-slate-800">{form.id ? 'Editar cliente' : 'Nuevo cliente'}</h3>
                <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"><X size={16} /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Tipo persona */}
                <div>
                  <label className={labelCls}>Tipo de persona <span className="text-[#D81B43]">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Jurídica', 'Natural'].map(tipo => (
                      <button key={tipo} type="button"
                        onClick={() => setForm(f => ({ ...f, tipo_persona: tipo }))}
                        className={`flex items-center gap-2 px-4 py-3 rounded-[9px] border-2 text-[13px] font-semibold transition-all ${
                          form.tipo_persona === tipo
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
                <button onClick={() => setModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">Cancelar</button>
                <button onClick={guardarCliente} disabled={saving}
                  className="px-5 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F] disabled:opacity-50">
                  {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear cliente'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL ELIMINAR ── */}
      {modalEliminar && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[360px] p-6 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={22} className="text-[#D81B43]" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-2">¿Eliminar cliente?</h3>
              <p className="text-[13px] text-slate-400 mb-1"><span className="font-semibold text-slate-600">{modalEliminar.nombre}</span></p>
              <p className="text-[12px] text-slate-400 mb-6">Esta acción no se puede deshacer</p>
              <div className="flex gap-2">
                <button onClick={() => eliminarCliente(modalEliminar.id)}
                  className="flex-1 py-2.5 bg-[#D81B43] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#B0172F]">
                  Sí, eliminar
                </button>
                <button onClick={() => setModalEliminar(null)}
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