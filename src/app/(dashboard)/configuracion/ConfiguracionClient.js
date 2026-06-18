'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Users, Lock, Tag, Cpu, List, Building2,
  FileText, Upload, Plus, X, Edit3, Trash2,
  Check, ChevronRight, Save
} from 'lucide-react'

const NAV = [
  { id: 'usuarios',    label: 'Usuarios',             icon: Users,    grupo: 'Acceso' },
  { id: 'roles',       label: 'Roles y permisos',     icon: Lock,     grupo: 'Acceso' },
  { id: 'categorias',  label: 'Categorías',            icon: Tag,      grupo: 'Inventario' },
  { id: 'tipos',       label: 'Tipos de equipo',       icon: Cpu,      grupo: 'Inventario' },
  { id: 'checklist',   label: 'Checklist actividades', icon: List,     grupo: 'Mantenimientos' },
  { id: 'empresa',     label: 'Datos de la empresa',   icon: Building2, grupo: 'Sistema' },
  { id: 'plantillas',  label: 'Plantillas documentos', icon: FileText, grupo: 'Sistema' },
  { id: 'cargue',      label: 'Cargue masivo',         icon: Upload,   grupo: 'Sistema' },
]

const GRUPOS = ['Acceso', 'Inventario', 'Mantenimientos', 'Sistema']

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] outline-none focus:border-[#2EB5D4] bg-white transition-colors'
const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5'

export default function ConfiguracionClient({
  usuariosIniciales, roles, categorias: catsIniciales,
  tipos: tiposIniciales, plantillas, checklist: checklistInicial
}) {
  const router   = useRouter()
  const supabase = createClient()

  const [seccion, setSeccion]   = useState('usuarios')
  const [usuarios, setUsuarios] = useState(usuariosIniciales)
  const [cats, setCats]         = useState(catsIniciales)
  const [tipos, setTipos]       = useState(tiposIniciales)
  const [checklist, setChecklist] = useState(checklistInicial)
  const [modal, setModal]       = useState(null) // {tipo, data}
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)
  const [form, setForm]         = useState({})

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  function abrirModal(tipo, data = {}) {
    setForm(data)
    setModal(tipo)
  }

  // ── USUARIOS ────────────────────────────────────────────────
  async function guardarUsuario() {
    if (!form.nombre?.trim() || !form.email?.trim()) {
      showToast('Nombre y correo son requeridos', 'error'); return
    }
    setSaving(true)
    if (form.id) {
      const { error } = await supabase.from('usuarios')
        .update({ nombre: form.nombre, email: form.email, username: form.username, rol_id: form.rol_id })
        .eq('id', form.id)
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setUsuarios(prev => prev.map(u => u.id === form.id ? { ...u, ...form, rol: roles.find(r => r.id === form.rol_id) } : u))
      showToast('Usuario actualizado')
    } else {
      const { data, error } = await supabase.from('usuarios')
        .insert({ nombre: form.nombre, email: form.email, username: form.username, rol_id: form.rol_id, activo: true })
        .select('*, rol:roles(id, nombre)').single()
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setUsuarios(prev => [data, ...prev])
      showToast('Usuario creado')
    }
    setSaving(false); setModal(null)
  }

  async function toggleUsuario(u) {
    const { error } = await supabase.from('usuarios').update({ activo: !u.activo }).eq('id', u.id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: !x.activo } : x))
    showToast(u.activo ? 'Usuario desactivado' : 'Usuario activado')
  }

  // ── CATEGORÍAS ───────────────────────────────────────────────
  async function guardarCat() {
    if (!form.nombre?.trim()) { showToast('El nombre es requerido', 'error'); return }
    setSaving(true)
    if (form.id) {
      const { error } = await supabase.from('categorias_equipo')
        .update({ nombre: form.nombre, descripcion: form.descripcion })
        .eq('id', form.id)
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setCats(prev => prev.map(c => c.id === form.id ? { ...c, ...form } : c))
      showToast('Categoría actualizada')
    } else {
      const { data, error } = await supabase.from('categorias_equipo')
        .insert({ nombre: form.nombre, descripcion: form.descripcion, activo: true })
        .select().single()
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setCats(prev => [...prev, data])
      showToast('Categoría creada')
    }
    setSaving(false); setModal(null)
  }

  async function eliminarCat(id) {
    if (!confirm('¿Eliminar esta categoría?')) return
    const { error } = await supabase.from('categorias_equipo').update({ activo: false }).eq('id', id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setCats(prev => prev.filter(c => c.id !== id))
    showToast('Categoría eliminada')
  }

  // ── TIPOS EQUIPO ─────────────────────────────────────────────
  async function guardarTipo() {
    if (!form.marca?.trim() || !form.modelo?.trim()) {
      showToast('Marca y modelo son requeridos', 'error'); return
    }
    setSaving(true)
    const payload = {
      categoria_id: form.categoria_id, marca: form.marca, modelo: form.modelo,
      descripcion: form.descripcion, invima: form.invima,
    }
    if (form.id) {
      const { error } = await supabase.from('tipos_equipo').update(payload).eq('id', form.id)
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setTipos(prev => prev.map(t => t.id === form.id
        ? { ...t, ...payload, categoria: cats.find(c => c.id === form.categoria_id) } : t))
      showToast('Tipo actualizado')
    } else {
      const { data, error } = await supabase.from('tipos_equipo')
        .insert({ ...payload, activo: true }).select('*, categoria:categorias_equipo(id, nombre)').single()
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setTipos(prev => [...prev, data])
      showToast('Tipo creado')
    }
    setSaving(false); setModal(null)
  }

  async function eliminarTipo(id) {
    if (!confirm('¿Eliminar este tipo de equipo?')) return
    const { error } = await supabase.from('tipos_equipo').update({ activo: false }).eq('id', id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setTipos(prev => prev.filter(t => t.id !== id))
    showToast('Tipo eliminado')
  }

  // ── CHECKLIST ────────────────────────────────────────────────
  async function guardarActividad() {
    if (!form.nombre?.trim()) { showToast('El nombre es requerido', 'error'); return }
    setSaving(true)
    if (form.id) {
      const { error } = await supabase.from('actividades_mantenimiento')
        .update({ nombre: form.nombre, descripcion: form.descripcion })
        .eq('id', form.id)
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setChecklist(prev => prev.map(a => a.id === form.id ? { ...a, ...form } : a))
      showToast('Actividad actualizada')
    } else {
      const { data, error } = await supabase.from('actividades_mantenimiento')
        .insert({ nombre: form.nombre, descripcion: form.descripcion, activo: true, orden: checklist.length + 1 })
        .select().single()
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setChecklist(prev => [...prev, data])
      showToast('Actividad agregada')
    }
    setSaving(false); setModal(null)
  }

  async function eliminarActividad(id) {
    if (!confirm('¿Eliminar esta actividad?')) return
    const { error } = await supabase.from('actividades_mantenimiento').update({ activo: false }).eq('id', id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setChecklist(prev => prev.filter(a => a.id !== id))
    showToast('Actividad eliminada')
  }

  // ── EMPRESA ──────────────────────────────────────────────────
  const [empresa, setEmpresa] = useState({
    razon_social: 'Ingemedic de Colombia S.A.S.',
    nit: '900.662.580-5',
    tel: '310 3636481',
    email: 'ingemedisas@hotmail.com',
    dir: 'CLL 14C No 20-14 La Popa, Valledupar, Cesar',
    rep: 'Johan Rafael Daza Coronado',
    web: 'www.ingemedic.co',
  })

  function guardarEmpresa() {
    localStorage.setItem('ing_company_config', JSON.stringify(empresa))
    showToast('Datos guardados')
  }

  // ── RENDER ───────────────────────────────────────────────────
  const navActivo = NAV.find(n => n.id === seccion)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-[#1B3A6B]">Configuración</div>
          <div className="text-[12px] text-slate-400 mt-0.5">Panel de control del sistema</div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Nav secundario */}
        <aside className="w-56 min-w-[224px] bg-white border-r border-slate-200 flex flex-col py-4 overflow-y-auto flex-shrink-0">
          {GRUPOS.map(grupo => (
            <div key={grupo} className="mb-2">
              <div className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400 px-4 py-1.5">{grupo}</div>
              {NAV.filter(n => n.grupo === grupo).map(n => {
                const Icon = n.icon
                const active = seccion === n.id
                return (
                  <button key={n.id} onClick={() => setSeccion(n.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-all ${active ? 'bg-[#1B3A6B]/5 text-[#1B3A6B] font-semibold border-r-2 border-[#1B3A6B]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                    <Icon size={15} className={active ? 'text-[#1B3A6B]' : 'text-slate-400'} />
                    {n.label}
                  </button>
                )
              })}
            </div>
          ))}
        </aside>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[860px]">

            {/* ── USUARIOS ── */}
            {seccion === 'usuarios' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1B3A6B]">Usuarios</h2>
                    <p className="text-[13px] text-slate-400 mt-0.5">Gestiona quién tiene acceso al sistema</p>
                  </div>
                  <button onClick={() => abrirModal('usuario', { rol_id: roles[0]?.id })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
                    <Plus size={14} /> Nuevo usuario
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        {['Nombre', 'Correo', 'Usuario', 'Rol', 'Estado', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map(u => (
                        <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                                {u.nombre?.charAt(0)}
                              </div>
                              <span className="text-[13px] font-semibold text-slate-700">{u.nombre}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[12.5px] text-slate-500">{u.email}</td>
                          <td className="px-4 py-3 font-mono text-[12.5px] text-slate-500">{u.username}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${u.rol?.nombre === 'Administrador' ? 'bg-[#E8F7FB] text-[#0E86A0]' : 'bg-green-50 text-green-700'}`}>
                              {u.rol?.nombre || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[12px] font-semibold ${u.activo ? 'text-[#0F7B55]' : 'text-slate-400'}`}>
                              {u.activo ? '● Activo' : '○ Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => abrirModal('usuario', { ...u, rol_id: u.rol_id })}
                                className="p-1.5 text-slate-400 hover:text-[#1B3A6B] hover:bg-slate-100 rounded-[6px] transition-all">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => toggleUsuario(u)}
                                className={`p-1.5 rounded-[6px] transition-all ${u.activo ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}>
                                {u.activo ? <X size={13} /> : <Check size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── ROLES ── */}
            {seccion === 'roles' && (
              <div>
                <h2 className="text-[20px] font-bold text-[#1B3A6B] mb-1">Roles y permisos</h2>
                <p className="text-[13px] text-slate-400 mb-6">Define qué puede hacer cada rol en cada módulo</p>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">Módulo</th>
                          {roles.map(r => (
                            <th key={r.id} colSpan={4} className="px-4 py-3 text-center text-[10.5px] font-bold uppercase tracking-[0.07em] bg-slate-50" style={{ color: r.nombre === 'Administrador' ? '#1B3A6B' : '#0F7B55' }}>
                              {r.nombre}
                            </th>
                          ))}
                        </tr>
                        <tr className="border-b border-slate-200">
                          <th className="px-4 py-2 bg-slate-50"></th>
                          {roles.flatMap(r => ['Ver', 'Crear', 'Editar', 'Eliminar'].map(a => (
                            <th key={`${r.id}-${a}`} className="px-2 py-2 text-[9.5px] font-bold uppercase text-slate-400 bg-slate-50 text-center">{a}</th>
                          )))}
                        </tr>
                      </thead>
                      <tbody>
                        {['Inventario', 'Clientes', 'Órdenes', 'Entregas', 'Mantenimientos', 'Servicios', 'Bitácora', 'Configuración'].map(mod => (
                          <tr key={mod} className="border-b border-slate-50">
                            <td className="px-4 py-3 text-[13px] font-medium text-slate-700">{mod}</td>
                            {roles.flatMap((r, ri) => [1,1,1,ri===0?1:0].map((v, ai) => (
                              <td key={`${r.id}-${ai}`} className="px-2 py-3 text-center">
                                <input type="checkbox" defaultChecked={!!v}
                                  className="w-3.5 h-3.5 accent-[#1B3A6B] cursor-pointer" />
                              </td>
                            )))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── CATEGORÍAS ── */}
            {seccion === 'categorias' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1B3A6B]">Categorías de equipo</h2>
                    <p className="text-[13px] text-slate-400 mt-0.5">Agrupan los tipos de equipo en el inventario</p>
                  </div>
                  <button onClick={() => abrirModal('categoria', {})}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
                    <Plus size={14} /> Nueva categoría
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {cats.map((c, i) => (
                    <div key={c.id} className={`flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${i < cats.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <div className="flex-1">
                        <div className="text-[13.5px] font-semibold text-slate-700">{c.nombre}</div>
                        {c.descripcion && <div className="text-[12px] text-slate-400 mt-0.5">{c.descripcion}</div>}
                        <div className="text-[11.5px] text-slate-400 mt-1">
                          {tipos.filter(t => t.categoria_id === c.id).length} tipo{tipos.filter(t => t.categoria_id === c.id).length !== 1 ? 's' : ''} de equipo
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => abrirModal('categoria', { ...c })}
                          className="p-1.5 text-slate-400 hover:text-[#1B3A6B] hover:bg-slate-100 rounded-[6px] transition-all">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => eliminarCat(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[6px] transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {cats.length === 0 && (
                    <div className="text-center py-12 text-slate-400">Sin categorías configuradas</div>
                  )}
                </div>
              </div>
            )}

            {/* ── TIPOS EQUIPO ── */}
            {seccion === 'tipos' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1B3A6B]">Tipos de equipo</h2>
                    <p className="text-[13px] text-slate-400 mt-0.5">Catálogo de modelos por categoría</p>
                  </div>
                  <button onClick={() => abrirModal('tipo', { categoria_id: cats[0]?.id })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
                    <Plus size={14} /> Nuevo tipo
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        {['Categoría', 'Marca', 'Modelo', 'INVIMA', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tipos.map(t => (
                        <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-[12px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{t.categoria?.nombre || '—'}</span>
                          </td>
                          <td className="px-4 py-3 text-[13px] font-semibold text-slate-700">{t.marca}</td>
                          <td className="px-4 py-3 text-[13px] text-slate-600">{t.modelo}</td>
                          <td className="px-4 py-3 font-mono text-[12px] text-slate-400">{t.invima || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => abrirModal('tipo', { ...t, categoria_id: t.categoria_id })}
                                className="p-1.5 text-slate-400 hover:text-[#1B3A6B] hover:bg-slate-100 rounded-[6px] transition-all">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => eliminarTipo(t.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[6px] transition-all">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {tipos.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-12 text-slate-400">Sin tipos configurados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── CHECKLIST ── */}
            {seccion === 'checklist' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1B3A6B]">Checklist de mantenimiento</h2>
                    <p className="text-[13px] text-slate-400 mt-0.5">Actividades predeterminadas al cerrar un mantenimiento</p>
                  </div>
                  <button onClick={() => abrirModal('actividad', {})}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
                    <Plus size={14} /> Agregar actividad
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {checklist.map((a, i) => (
                    <div key={a.id} className={`flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${i < checklist.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400 flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13.5px] font-semibold text-slate-700">{a.nombre}</div>
                        {a.descripcion && <div className="text-[12px] text-slate-400 mt-0.5">{a.descripcion}</div>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => abrirModal('actividad', { ...a })}
                          className="p-1.5 text-slate-400 hover:text-[#1B3A6B] hover:bg-slate-100 rounded-[6px] transition-all">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => eliminarActividad(a.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[6px] transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {checklist.length === 0 && (
                    <div className="text-center py-12 text-slate-400">Sin actividades configuradas</div>
                  )}
                </div>
              </div>
            )}

            {/* ── EMPRESA ── */}
            {seccion === 'empresa' && (
              <div>
                <h2 className="text-[20px] font-bold text-[#1B3A6B] mb-1">Datos de la empresa</h2>
                <p className="text-[13px] text-slate-400 mb-6">Información que aparece en los documentos generados</p>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'razon_social', label: 'Razón social', full: true },
                      { key: 'nit',          label: 'NIT' },
                      { key: 'tel',          label: 'Teléfono' },
                      { key: 'email',        label: 'Email' },
                      { key: 'dir',          label: 'Dirección', full: true },
                      { key: 'rep',          label: 'Representante legal' },
                      { key: 'web',          label: 'Página web' },
                    ].map(f => (
                      <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                        <label className={labelCls}>{f.label}</label>
                        <input value={empresa[f.key] || ''} onChange={e => setEmpresa(p => ({ ...p, [f.key]: e.target.value }))}
                          className={inputCls} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-5">
                    <button onClick={guardarEmpresa}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
                      <Save size={14} /> Guardar cambios
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PLANTILLAS ── */}
            {seccion === 'plantillas' && (
              <div>
                <h2 className="text-[20px] font-bold text-[#1B3A6B] mb-1">Plantillas de documentos</h2>
                <p className="text-[13px] text-slate-400 mb-6">Documentos legales usados en las órdenes de servicio</p>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {plantillas.map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${i < plantillas.length - 1 ? 'border-b border-slate-100' : ''}`}>
                      <div className="w-8 h-8 rounded-[8px] bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                        <FileText size={15} className="text-[#1B3A6B]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[13.5px] font-semibold text-slate-700">{p.nombre}</div>
                        {p.descripcion && <div className="text-[12px] text-slate-400 mt-0.5">{p.descripcion}</div>}
                        <div className="text-[11px] text-slate-300 font-mono mt-0.5">v{p.version || '1'}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button className="px-3 py-1.5 border border-slate-200 rounded-[7px] text-[12px] font-medium text-slate-600 hover:border-[#2EB5D4] hover:text-[#2EB5D4] transition-all">
                          Previsualizar
                        </button>
                      </div>
                    </div>
                  ))}
                  {plantillas.length === 0 && (
                    <div className="text-center py-12 text-slate-400">Sin plantillas configuradas</div>
                  )}
                </div>
              </div>
            )}

            {/* ── CARGUE MASIVO ── */}
            {seccion === 'cargue' && (
              <div>
                <h2 className="text-[20px] font-bold text-[#1B3A6B] mb-1">Cargue masivo</h2>
                <p className="text-[13px] text-slate-400 mb-6">Importa datos desde archivos CSV</p>
                {[
                  { titulo: 'Equipos', sub: 'Importa unidades de inventario', cols: 'categoria, marca, modelo, serial, lote, fecha_compra' },
                  { titulo: 'Clientes', sub: 'Importa clientes desde CSV', cols: 'tipo, nombre, documento, departamento, municipio, direccion, telefono, email' },
                ].map(s => (
                  <div key={s.titulo} className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-bold text-slate-700">{s.titulo}</div>
                        <div className="text-[12px] text-slate-400 mt-0.5">{s.sub}</div>
                      </div>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-[8px] text-[12.5px] font-medium text-slate-600 hover:border-[#2EB5D4] hover:text-[#2EB5D4] transition-all">
                        <Upload size={13} /> Descargar plantilla
                      </button>
                    </div>
                    <div className="p-5">
                      <div className="border-2 border-dashed border-slate-200 rounded-[10px] p-8 text-center hover:border-[#2EB5D4] hover:bg-[#E8F7FB]/30 transition-all cursor-pointer">
                        <Upload size={28} className="mx-auto mb-2 text-slate-300" />
                        <div className="text-[13.5px] font-semibold text-slate-500">Arrastra tu CSV aquí o haz clic</div>
                        <div className="text-[12px] text-slate-400 mt-1">Columnas: {s.cols}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODALES */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-[#0F2448]/40 z-40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-[480px] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
                <h3 className="text-[15px] font-bold text-[#1B3A6B]">
                  {modal === 'usuario'    ? (form.id ? 'Editar usuario' : 'Nuevo usuario') :
                   modal === 'categoria'  ? (form.id ? 'Editar categoría' : 'Nueva categoría') :
                   modal === 'tipo'       ? (form.id ? 'Editar tipo' : 'Nuevo tipo de equipo') :
                   modal === 'actividad'  ? (form.id ? 'Editar actividad' : 'Nueva actividad') : ''}
                </h3>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* Usuario */}
                {modal === 'usuario' && <>
                  <div><label className={labelCls}>Nombre completo</label>
                    <input value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} placeholder="Nombre del usuario" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Correo</label>
                      <input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} type="email" placeholder="correo@ejemplo.com" /></div>
                    <div><label className={labelCls}>Usuario</label>
                      <input value={form.username || ''} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className={inputCls} placeholder="nombre_usuario" /></div>
                  </div>
                  <div><label className={labelCls}>Rol</label>
                    <select value={form.rol_id || ''} onChange={e => setForm(f => ({ ...f, rol_id: e.target.value }))} className={inputCls}>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select></div>
                </>}
                {/* Categoría */}
                {modal === 'categoria' && <>
                  <div><label className={labelCls}>Nombre</label>
                    <input value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} placeholder="ej. Oxigenoterapia" /></div>
                  <div><label className={labelCls}>Descripción <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                    <input value={form.descripcion || ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={inputCls} placeholder="Descripción de la categoría" /></div>
                </>}
                {/* Tipo */}
                {modal === 'tipo' && <>
                  <div><label className={labelCls}>Categoría</label>
                    <select value={form.categoria_id || ''} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Marca</label>
                      <input value={form.marca || ''} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} className={inputCls} placeholder="ej. Respironics" /></div>
                    <div><label className={labelCls}>Modelo</label>
                      <input value={form.modelo || ''} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} className={inputCls} placeholder="ej. EverFlo" /></div>
                  </div>
                  <div><label className={labelCls}>INVIMA <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                    <input value={form.invima || ''} onChange={e => setForm(f => ({ ...f, invima: e.target.value }))} className={inputCls} placeholder="Número de registro INVIMA" /></div>
                </>}
                {/* Actividad */}
                {modal === 'actividad' && <>
                  <div><label className={labelCls}>Nombre de la actividad</label>
                    <input value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} placeholder="ej. Limpieza de filtros" /></div>
                  <div><label className={labelCls}>Descripción <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                    <input value={form.descripcion || ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className={inputCls} placeholder="Descripción detallada" /></div>
                </>}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
                <button onClick={() => setModal(null)} className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">
                  Cancelar
                </button>
                <button onClick={
                  modal === 'usuario'   ? guardarUsuario :
                  modal === 'categoria' ? guardarCat :
                  modal === 'tipo'      ? guardarTipo :
                  guardarActividad
                } disabled={saving}
                  className="px-5 py-2.5 bg-[#1B3A6B] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#1E4D8C] disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
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