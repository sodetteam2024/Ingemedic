'use client'
import Image from 'next/image'
import { useState, useMemo } from 'react'
import {
  Users, Lock, Tag, Cpu, List, Building2,
  FileText, Upload, Plus, X, Edit3, Trash2,
  Check, Save, ClipboardList, Download, CheckCircle2
} from 'lucide-react'

const NAV = [
  { id: 'usuarios',   label: 'Usuarios',             icon: Users,         grupo: 'Acceso' },
  { id: 'roles',      label: 'Roles y permisos',     icon: Lock,          grupo: 'Acceso' },
  { id: 'categorias', label: 'Categorías',            icon: Tag,           grupo: 'Inventario' },
  { id: 'tipos',      label: 'Tipos de equipo',       icon: Cpu,           grupo: 'Inventario' },
  { id: 'listas',     label: 'Listas de mantenimiento', icon: ClipboardList, grupo: 'Mantenimientos' },
  { id: 'empresa',    label: 'Datos de la empresa',   icon: Building2,     grupo: 'Sistema' },
  { id: 'plantillas', label: 'Plantillas documentos', icon: FileText,      grupo: 'Sistema' },
  { id: 'cargue',     label: 'Cargue masivo',         icon: Upload,        grupo: 'Sistema' },
]

const GRUPOS = ['Acceso', 'Inventario', 'Mantenimientos', 'Sistema']
const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[13.5px] text-slate-800 outline-none focus:border-[#2EB5D4] bg-white transition-colors placeholder:text-slate-400'
const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5'

export default function ConfiguracionClient({
  usuariosIniciales = [], roles = [], categorias: catsIniciales = [],
  tipos: tiposIniciales = [], plantillas = [], listas: listasIniciales = [], actividades: actividadesIniciales = [],
  empresaInicial = {}
}) {
  const [seccion, setSeccion]       = useState('usuarios')
  const [usuarios, setUsuarios]     = useState(usuariosIniciales ?? [])
  const [cats, setCats]             = useState(catsIniciales ?? [])
  const [tipos, setTipos]           = useState(tiposIniciales ?? [])
  const [listas, setListas]         = useState(listasIniciales ?? [])
  const [actividades, setActividades] = useState(actividadesIniciales ?? [])
  const [modal, setModal]           = useState(null)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState(null)
  const [form, setForm]             = useState({})
  const [listaExpandida, setListaExpandida] = useState(null)
  const [nuevaActividad, setNuevaActividad] = useState('')

  const [empresa, setEmpresa] = useState(empresaInicial)
  const [subiendoLogo, setSubiendoLogo] = useState(false)

  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3000)
  }

  function previsualizarPlantilla(plantilla) {
    const variablesEjemplo = {
      empresa_logo: empresa.logo_url || '',
      empresa_dir: empresa.dir || '',
      empresa_tel: empresa.tel || '',
      empresa_email: empresa.email || '',
      empresa_web: empresa.web || '',
      orden_codigo: 'OS-2024-001',
      ciudad: 'Valledupar',
      orden_fecha: '15/01/2024',
      cliente_nombre: 'IPS San Juan de Dios',
      equipo_nombre: 'Concentrador de Oxígeno',
      equipo_marca: 'Respironics',
      equipo_modelo: 'EverFlo',
      equipo_serial: 'SN-001234',
      equipo_codigo: 'EQ-001',
      equipo_invima: '2019M-0001234',
      recibido_por: 'Juan Pérez',
      recibido_cargo: 'Jefe de enfermería',
      recibido_cc: '1065432198',
      repartidor_nombre: 'Carlos Gómez',
      repartidor_cc: '1065987654',
      devolucion_fecha: '15/02/2024',
      mant_codigo: 'MAN-2024-001',
      mant_fecha: '15/01/2024',
      mant_tipo: 'Preventivo',
      mant_estado: 'Disponible',
      mant_tecnico: 'Carlos Gómez',
      mant_tecnico_cc: '1065987654',
    }

    let html = plantilla.contenido || ''
    for (const [key, value] of Object.entries(variablesEjemplo)) {
      html = html.replaceAll(`{{${key}}}`, value)
    }

    const ventana = window.open('', '_blank')
    if (!ventana) {
      showToast('No se pudo abrir la ventana de previsualización', 'error')
      return
    }
    ventana.document.write(html)
    ventana.document.close()
  }

  async function getSupabase() {
    const { createClient } = await import('@/lib/supabase')
    return createClient()
  }

  function CargueCard({ titulo, tipo, sub, cols }) {
    const [archivo, setArchivo] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [resultado, setResultado] = useState(null)

    async function descargarPlantilla() {
      const res = await fetch(`/api/cargue/plantilla?tipo=${tipo}`)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `plantilla_${tipo}.csv`
      a.click()
    }

    async function procesarCargue() {
      if (!archivo) return
      setCargando(true)
      setResultado(null)
      const formData = new FormData()
      formData.append('tipo', tipo)
      formData.append('archivo', archivo)
      const res = await fetch('/api/cargue', { method: 'POST', body: formData })
      const data = await res.json()
      setResultado(data)
      setCargando(false)
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[14px] font-bold text-slate-700">{titulo}</div>
            <div className="text-[12px] text-slate-400 mt-0.5">{sub}</div>
          </div>
          <button onClick={descargarPlantilla}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-[8px] text-[12.5px] font-medium text-slate-600 hover:border-[#2EB5D4] hover:text-[#2EB5D4] transition-all">
            <Download size={13} /> Descargar plantilla
          </button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block">
            <div className="border-2 border-dashed border-slate-200 rounded-[10px] p-8 text-center hover:border-[#2EB5D4] hover:bg-[#E8F7FB]/30 transition-all cursor-pointer">
              <Upload size={28} className="mx-auto mb-2 text-slate-300" />
              <div className="text-[13.5px] font-semibold text-slate-500">
                {archivo ? archivo.name : 'Arrastra tu CSV aquí o haz clic'}
              </div>
              <div className="text-[12px] text-slate-400 mt-1">Columnas: {cols}</div>
              <input type="file" accept=".csv,text/csv" className="hidden"
                onChange={e => {
                  setArchivo(e.target.files?.[0] || null)
                  setResultado(null)
                  e.target.value = ''
                }} />
            </div>
          </label>

          {archivo && (
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={procesarCargue}
                disabled={cargando}
                className="px-3 py-2 bg-[#1B3A6B] text-white rounded-[9px] text-[13px] font-medium hover:bg-[#1E4D8C] transition-colors disabled:opacity-50">
                {cargando ? 'Procesando...' : `Importar ${titulo.toLowerCase()}`}
              </button>
              <button onClick={() => { setArchivo(null); setResultado(null) }}
                className="px-3 py-2 border border-slate-200 rounded-[9px] text-[13px] text-slate-500 hover:border-slate-300 transition-all">
                Cancelar
              </button>
            </div>
          )}

          {resultado && (
            <div className={`rounded-[10px] p-4 ${resultado.exitosos >= 0 ? 'bg-green-50 text-[#0F7B55]' : 'bg-slate-50 text-slate-500'}`}>
              <div className="flex items-center gap-2 font-semibold mb-2 text-[#0F7B55]">
                <CheckCircle2 size={16} />
                {resultado.exitosos ?? 0} de {resultado.total ?? 0} registros importados correctamente
              </div>
              {resultado.errores?.length > 0 && (
                <div className="space-y-2 text-slate-500">
                  <div className="text-[13px] font-semibold text-slate-700">
                    {resultado.errores.length} error{resultado.errores.length !== 1 ? 'es' : ''}:
                  </div>
                  <div className="space-y-1 text-[13px]">
                    {resultado.errores.map((e, i) => (
                      <div key={i}>· {e}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  function abrirModal(tipo, data = {}) {
    setForm({ ...data, password: '' })
    setModal(tipo)
  }

  // ── USUARIOS ──────────────────────────────────────────────
  async function guardarUsuario() {
    if (!form.nombre?.trim() || !form.email?.trim() || !form.username?.trim()) {
      showToast('Nombre, correo y usuario son requeridos', 'error'); return
    }
    if (!form.id && !form.password?.trim()) { showToast('La contraseña es requerida', 'error'); return }
    if (form.password && form.password.length < 6) { showToast('Mínimo 6 caracteres', 'error'); return }
    setSaving(true)
    const res = await fetch('/api/usuarios', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: form.id, nombre: form.nombre.trim(), email: form.email.trim(),
        username: form.username.trim().toLowerCase().replace(/\s+/g, '_'),
        password: form.password?.trim() || undefined, rol_id: form.rol_id,
      }),
    })
    const data = await res.json()
    if (!res.ok) { showToast('Error: ' + data.error, 'error'); setSaving(false); return }
    if (form.id) {
      setUsuarios(prev => prev.map(u => u.id === form.id ? data.usuario : u))
      showToast('Usuario actualizado')
    } else {
      setUsuarios(prev => [data.usuario, ...prev])
      showToast('Usuario creado')
    }
    setSaving(false); setModal(null); setForm({})
  }

  async function toggleUsuario(u) {
    const res = await fetch('/api/usuarios', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, activo: !u.activo }),
    })
    const data = await res.json()
    if (!res.ok) { showToast('Error: ' + data.error, 'error'); return }
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: !x.activo } : x))
    showToast(u.activo ? 'Usuario desactivado' : 'Usuario activado')
  }

  // ── CATEGORÍAS ────────────────────────────────────────────
  async function guardarCat() {
    if (!form.nombre?.trim()) { showToast('El nombre es requerido', 'error'); return }
    setSaving(true)
    const supabase = await getSupabase()
    if (form.id) {
      const { error } = await supabase.from('categorias_equipo')
        .update({ nombre: form.nombre, descripcion: form.descripcion }).eq('id', form.id)
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
    const supabase = await getSupabase()
    const { error } = await supabase.from('categorias_equipo').update({ activo: false }).eq('id', id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setCats(prev => prev.filter(c => c.id !== id))
    showToast('Categoría eliminada')
  }

  // ── TIPOS EQUIPO ──────────────────────────────────────────
  async function guardarTipo() {
    if (!form.categoria_id) { showToast('La categoría es requerida', 'error'); return }
    if (!form.marca?.trim() || !form.modelo?.trim()) {
      showToast('Marca y modelo son requeridos', 'error'); return
    }
    setSaving(true)
    const supabase = await getSupabase()
    const payload = {
      categoria_id: form.categoria_id, marca: form.marca, modelo: form.modelo,
      descripcion: form.descripcion, invima: form.invima,
      lista_mantenimiento_id: form.lista_mantenimiento_id || null,
    }
    if (form.id) {
      const { error } = await supabase.from('tipos_equipo').update(payload).eq('id', form.id)
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setTipos(prev => prev.map(t => t.id === form.id ? {
        ...t, ...payload,
        categoria: cats.find(c => c.id === form.categoria_id) || t.categoria,
        lista: listas.find(l => l.id === form.lista_mantenimiento_id) || t.lista,
      } : t))
      showToast('Tipo actualizado')
    } else {
      const { data, error } = await supabase.from('tipos_equipo')
        .insert({ ...payload, activo: true })
        .select('*, categoria:categorias_equipo(id, nombre), lista:listas_mantenimiento(id, nombre)').single()
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setTipos(prev => [...prev, data])
      showToast('Tipo creado')
    }
    setSaving(false); setModal(null)
  }

  async function eliminarTipo(id) {
    if (!confirm('¿Eliminar este tipo de equipo?')) return
    const supabase = await getSupabase()
    const { error } = await supabase.from('tipos_equipo').update({ activo: false }).eq('id', id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setTipos(prev => prev.filter(t => t.id !== id))
    showToast('Tipo eliminado')
  }

  // ── LISTAS MANTENIMIENTO ──────────────────────────────────
  async function guardarLista() {
    if (!form.nombre?.trim()) { showToast('El nombre es requerido', 'error'); return }
    setSaving(true)
    const supabase = await getSupabase()
    if (form.id) {
      const { error } = await supabase.from('listas_mantenimiento')
        .update({ nombre: form.nombre, descripcion: form.descripcion }).eq('id', form.id)
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setListas(prev => prev.map(l => l.id === form.id ? { ...l, ...form } : l))
      showToast('Lista actualizada')
    } else {
      const { data, error } = await supabase.from('listas_mantenimiento')
        .insert({ nombre: form.nombre, descripcion: form.descripcion, activo: true })
        .select().single()
      if (error) { showToast('Error: ' + error.message, 'error'); setSaving(false); return }
      setListas(prev => [...prev, data])
      setListaExpandida(data.id)
      showToast('Lista creada')
    }
    setSaving(false); setModal(null)
  }

  async function eliminarLista(id) {
    if (!confirm('¿Eliminar esta lista? Las actividades asociadas también se eliminarán.')) return
    const supabase = await getSupabase()
    const { error } = await supabase.from('listas_mantenimiento').update({ activo: false }).eq('id', id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setListas(prev => prev.filter(l => l.id !== id))
    setActividades(prev => prev.filter(a => a.lista_id !== id))
    showToast('Lista eliminada')
  }

  // ── ACTIVIDADES DE LISTA ──────────────────────────────────
  async function agregarActividad(listaId) {
    if (!nuevaActividad.trim()) return
    const supabase = await getSupabase()
    const orden = actividades.filter(a => a.lista_id === listaId).length + 1
    const { data, error } = await supabase.from('actividades_lista_mantenimiento')
      .insert({ lista_id: listaId, nombre: nuevaActividad.trim(), orden, activo: true })
      .select().single()
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setActividades(prev => [...prev, data])
    setNuevaActividad('')
    showToast('Actividad agregada')
  }

  async function eliminarActividad(id) {
    if (!confirm('¿Eliminar esta actividad?')) return
    const supabase = await getSupabase()
    const { error } = await supabase.from('actividades_lista_mantenimiento').update({ activo: false }).eq('id', id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setActividades(prev => prev.filter(a => a.id !== id))
    showToast('Actividad eliminada')
  }

  async function subirLogo(file) {
    setSubiendoLogo(true)
    const supabase = await getSupabase()
    const ext = file.name.split('.').pop()
    const path = `logo-ingemedic.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (uploadError) { showToast('Error subiendo logo: ' + uploadError.message, 'error'); setSubiendoLogo(false); return }

    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

    setEmpresa(p => ({ ...p, logo_url: publicUrl }))
    setSubiendoLogo(false)
    showToast('Logo actualizado')
  }

  async function guardarEmpresa() {
    const supabase = await getSupabase()
    const { error } = await supabase.from('configuracion_empresa')
      .update({
        razon_social: empresa.razon_social,
        nit: empresa.nit,
        tel: empresa.tel,
        email: empresa.email,
        dir: empresa.dir,
        rep: empresa.rep,
        web: empresa.web,
        logo_url: empresa.logo_url,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id', empresa.id)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    showToast('Datos guardados')
  }

  const actividadesDeLista = (listaId) => actividades.filter(a => a.lista_id === listaId)

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-[#1B3A6B]">Configuración</div>
          <div className="text-[12px] text-slate-400 mt-0.5">Panel de control del sistema</div>
        </div>
      </div>

      {/* Mobile section tabs */}
      <div className="flex md:hidden overflow-x-auto border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex">
          {NAV.map(n => {
            const Icon = n.icon
            const active = seccion === n.id
            return (
              <button key={n.id} onClick={() => setSeccion(n.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[12px] font-medium whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                  active ? 'border-[#1B3A6B] text-[#1B3A6B]' : 'border-transparent text-slate-500'
                }`}>
                <Icon size={14} />
                {n.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <aside className="hidden md:flex w-56 min-w-[224px] bg-white border-r border-slate-200 flex-col py-4 overflow-y-auto flex-shrink-0">
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

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-[860px]">

            {/* ── USUARIOS ── */}
            {seccion === 'usuarios' && (
              <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1B3A6B]">Usuarios</h2>
                    <p className="text-[13px] text-slate-400 mt-0.5">Gestiona quién tiene acceso al sistema</p>
                  </div>
                  <button onClick={() => abrirModal('usuario', { rol_id: roles[0]?.id })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
                    <Plus size={14} /> Nuevo usuario
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                  <table className="w-full border-collapse min-w-[560px]">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        {['Nombre','Correo','Usuario','Rol','Estado',''].map(h => (
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
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Lock size={24} className="text-slate-400" />
                  </div>
                  <div className="text-[15px] font-bold text-slate-600 mb-2">Módulo en construcción</div>
                  <div className="text-[13px] text-slate-400 max-w-[320px] mx-auto leading-relaxed">
                    La gestión de permisos por rol estará disponible en la <span className="font-semibold text-slate-500">Fase 2</span>.
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-[12px] font-semibold text-slate-500">
                    🏗️ Próximamente
                  </div>
                </div>
              </div>
            )}

            {/* ── CATEGORÍAS ── */}
            {seccion === 'categorias' && (
              <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
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
                  {cats.length === 0 && <div className="text-center py-12 text-slate-400">Sin categorías configuradas</div>}
                </div>
              </div>
            )}

            {/* ── TIPOS EQUIPO ── */}
            {seccion === 'tipos' && (
              <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1B3A6B]">Tipos de equipo</h2>
                    <p className="text-[13px] text-slate-400 mt-0.5">Asigna una lista de mantenimiento a cada tipo</p>
                  </div>
                  <button onClick={() => abrirModal('tipo', { categoria_id: cats[0]?.id })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
                    <Plus size={14} /> Nuevo tipo
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                  <table className="w-full border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        {['Categoría','Marca','Modelo','INVIMA','Lista de mantenimiento',''].map(h => (
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
                            {t.lista
                              ? <span className="text-[12.5px] font-semibold text-[#0F7B55]">✓ {t.lista.nombre}</span>
                              : <span className="text-[12px] text-slate-400">Sin lista asignada</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => abrirModal('tipo', {
                                ...t,
                                categoria_id: t.categoria_id ?? t.categoria?.id,
                                lista_mantenimiento_id: t.lista_mantenimiento_id ?? t.lista?.id,
                              })}
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
                        <tr><td colSpan={6} className="text-center py-12 text-slate-400">Sin tipos configurados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── LISTAS MANTENIMIENTO ── */}
            {seccion === 'listas' && (
              <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1B3A6B]">Listas de mantenimiento</h2>
                    <p className="text-[13px] text-slate-400 mt-0.5">Crea listas con actividades y asígnalas a los tipos de equipo</p>
                  </div>
                  <button onClick={() => abrirModal('lista', {})}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
                    <Plus size={14} /> Nueva lista
                  </button>
                </div>

                <div className="space-y-3">
                  {listas.length === 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm text-center py-12 text-slate-400">
                      <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                      <div>Sin listas configuradas</div>
                    </div>
                  )}
                  {listas.map(l => {
                    const acts = actividadesDeLista(l.id)
                    const expanded = listaExpandida === l.id
                    return (
                      <div key={l.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Header lista */}
                        <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => setListaExpandida(expanded ? null : l.id)}>
                          <div className="flex-1">
                            <div className="text-[14px] font-bold text-slate-700">{l.nombre}</div>
                            {l.descripcion && <div className="text-[12px] text-slate-400 mt-0.5">{l.descripcion}</div>}
                            <div className="text-[11.5px] text-slate-400 mt-1">
                              {acts.length} actividad{acts.length !== 1 ? 'es' : ''}
                              {' · '}
                              {tipos.filter(t => t.lista_mantenimiento_id === l.id).length} tipo{tipos.filter(t => t.lista_mantenimiento_id === l.id).length !== 1 ? 's' : ''} asignado{tipos.filter(t => t.lista_mantenimiento_id === l.id).length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <button onClick={() => abrirModal('lista', { ...l })}
                              className="p-1.5 text-slate-400 hover:text-[#1B3A6B] hover:bg-slate-100 rounded-[6px] transition-all">
                              <Edit3 size={13} />
                            </button>
                            <button onClick={() => eliminarLista(l.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[6px] transition-all">
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="text-slate-400 ml-1">
                            {expanded
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                            }
                          </div>
                        </div>

                        {/* Actividades expandidas */}
                        {expanded && (
                          <div className="border-t border-slate-100 px-5 py-4">
                            <div className="space-y-2 mb-3">
                              {acts.map((a, i) => (
                                <div key={a.id} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-[8px] border border-slate-200">
                                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                                    {i + 1}
                                  </div>
                                  <span className="flex-1 text-[13px] text-slate-700">{a.nombre}</span>
                                  <button onClick={() => eliminarActividad(a.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                              {acts.length === 0 && (
                                <div className="text-[12.5px] text-slate-400 text-center py-2">Sin actividades — agrégalas abajo</div>
                              )}
                            </div>
                            {/* Agregar actividad */}
                            <div className="flex gap-2">
                              <input
                                value={nuevaActividad}
                                onChange={e => setNuevaActividad(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && agregarActividad(l.id)}
                                placeholder="ej. Limpieza de filtros"
                                className={inputCls}
                              />
                              <button onClick={() => agregarActividad(l.id)}
                                className="px-3 py-2.5 bg-[#1B3A6B] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#1E4D8C] transition-colors flex-shrink-0 flex items-center gap-1">
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── EMPRESA ── */}
            {seccion === 'empresa' && (
              <div>
                <h2 className="text-[20px] font-bold text-[#1B3A6B] mb-1">Datos de la empresa</h2>
                <p className="text-[13px] text-slate-400 mb-6">Información que aparece en los documentos generados</p>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  {/* Logo */}
                  <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
                    <div className="w-20 h-20 rounded-xl border-2 border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                      {empresa.logo_url
                        ? <Image src={empresa.logo_url} alt="Logo de la empresa" width={80} height={80} className="object-contain p-1" />
                        : <Building2 size={28} className="text-slate-300" />
                      }
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-slate-700 mb-1">Logo de la empresa</div>
                      <div className="text-[12px] text-slate-400 mb-3">Aparece en los documentos y en el sidebar del sistema</div>
                      <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-[8px] text-[12.5px] font-medium text-slate-600 hover:border-[#2EB5D4] hover:text-[#2EB5D4] transition-all cursor-pointer w-fit">
                        <Upload size={13} /> {subiendoLogo ? 'Subiendo...' : 'Cambiar logo'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const file = e.target.files[0]
                          if (file) subirLogo(file)
                          e.target.value = ''
                        }} />
                      </label>
                      {empresa.logo_url && (
                        <button onClick={() => setEmpresa(p => ({ ...p, logo_url: null }))}
                          className="mt-2 text-[12px] text-red-400 hover:text-red-600 transition-colors block">
                          Quitar logo
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'razon_social', label: 'Razón social', full: true },
                      { key: 'nit',   label: 'NIT' }, { key: 'tel', label: 'Teléfono' },
                      { key: 'email', label: 'Email' },
                      { key: 'dir',   label: 'Dirección', full: true },
                      { key: 'rep',   label: 'Representante legal' }, { key: 'web', label: 'Página web' },
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
                      <button onClick={() => previsualizarPlantilla(p)}
                        className="px-3 py-1.5 border border-slate-200 rounded-[7px] text-[12px] font-medium text-slate-600 hover:border-[#2EB5D4] hover:text-[#2EB5D4] transition-all">
                        Previsualizar
                      </button>
                    </div>
                  ))}
                  {plantillas.length === 0 && <div className="text-center py-12 text-slate-400">Sin plantillas configuradas</div>}
                </div>
              </div>
            )}

            {/* ── CARGUE MASIVO ── */}
            {seccion === 'cargue' && (
              <div>
                <h2 className="text-[20px] font-bold text-[#1B3A6B] mb-1">Cargue masivo</h2>
                <p className="text-[13px] text-slate-400 mb-6">Importa equipos y clientes desde archivos CSV</p>
                {[
                  {
                    titulo: 'Equipos',
                    tipo: 'equipos',
                    sub: 'Importa unidades de inventario',
                    cols: 'categoria, marca, modelo, serial, codigo, lote, fecha_compra, invima',
                  },
                  {
                    titulo: 'Clientes',
                    tipo: 'clientes',
                    sub: 'Importa clientes desde CSV',
                    cols: 'tipo_persona, nombre, nit_cc, digito_verificacion, departamento, municipio, direccion, telefono, email',
                  },
                ].map(s => (
                  <CargueCard key={s.tipo} {...s} />
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
                  {modal === 'usuario'   ? (form.id ? 'Editar usuario'       : 'Nuevo usuario')        :
                   modal === 'categoria' ? (form.id ? 'Editar categoría'     : 'Nueva categoría')      :
                   modal === 'tipo'      ? (form.id ? 'Editar tipo de equipo': 'Nuevo tipo de equipo') :
                   modal === 'lista'     ? (form.id ? 'Editar lista'         : 'Nueva lista de mantenimiento') : ''}
                </h3>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[75vh]">

                {/* USUARIO */}
                {modal === 'usuario' && <>
                  <div>
                    <label className={labelCls}>Nombre completo</label>
                    <input value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      className={inputCls} placeholder="Nombre del usuario" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Correo</label>
                      <input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className={inputCls} type="email" placeholder="correo@ejemplo.com" />
                    </div>
                    <div>
                      <label className={labelCls}>Usuario</label>
                      <input value={form.username || ''} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                        className={inputCls} placeholder="nombre_usuario" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Rol</label>
                    <select value={form.rol_id || ''} onChange={e => setForm(f => ({ ...f, rol_id: e.target.value }))} className={inputCls}>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>
                  {!form.id ? (
                    <div>
                      <label className={labelCls}>Contraseña</label>
                      <input value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        type="password" className={inputCls} placeholder="Mínimo 6 caracteres" />
                    </div>
                  ) : (
                    <div>
                      <label className={labelCls}>Nueva contraseña <span className="text-slate-300 font-normal normal-case ml-1">(opcional)</span></label>
                      <input value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        type="password" className={inputCls} placeholder="Dejar vacío para no cambiar" />
                    </div>
                  )}
                </>}

                {/* CATEGORÍA */}
                {modal === 'categoria' && <>
                  <div>
                    <label className={labelCls}>Nombre</label>
                    <input value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      className={inputCls} placeholder="ej. Oxigenoterapia" />
                  </div>
                  <div>
                    <label className={labelCls}>Descripción <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                    <input value={form.descripcion || ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      className={inputCls} placeholder="Descripción de la categoría" />
                  </div>
                </>}

                {/* TIPO EQUIPO */}
                {modal === 'tipo' && <>
                  <div>
                    <label className={labelCls}>Categoría</label>
                    <select value={form.categoria_id || ''} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))} className={inputCls}>
                      <option value="">Seleccionar...</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Marca</label>
                      <input value={form.marca || ''} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                        className={inputCls} placeholder="ej. Respironics" />
                    </div>
                    <div>
                      <label className={labelCls}>Modelo</label>
                      <input value={form.modelo || ''} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                        className={inputCls} placeholder="ej. EverFlo" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>INVIMA <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                    <input value={form.invima || ''} onChange={e => setForm(f => ({ ...f, invima: e.target.value }))}
                      className={inputCls} placeholder="Número de registro INVIMA" />
                  </div>
                  <div>
                    <label className={labelCls}>Lista de mantenimiento <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                    <select value={form.lista_mantenimiento_id || ''} onChange={e => setForm(f => ({ ...f, lista_mantenimiento_id: e.target.value }))} className={inputCls}>
                      <option value="">Sin lista asignada</option>
                      {listas.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.nombre} ({actividadesDeLista(l.id).length} actividades)
                        </option>
                      ))}
                    </select>
                    {listas.length === 0 && (
                      <p className="text-[12px] text-slate-400 mt-1.5">
                        Primero crea listas en la sección &quot;Listas de mantenimiento&quot;
                      </p>
                    )}
                  </div>
                </>}

                {/* LISTA */}
                {modal === 'lista' && <>
                  <div>
                    <label className={labelCls}>Nombre de la lista</label>
                    <input value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      className={inputCls} placeholder="ej. Revisión básica concentrador" />
                  </div>
                  <div>
                    <label className={labelCls}>Descripción <span className="text-slate-300 font-normal normal-case">(opcional)</span></label>
                    <input value={form.descripcion || ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                      className={inputCls} placeholder="Descripción de la lista" />
                  </div>
                </>}

              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 flex-shrink-0">
                <button onClick={() => setModal(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[9px] text-[13px] font-medium text-slate-600 hover:border-slate-300">
                  Cancelar
                </button>
                <button onClick={
                  modal === 'usuario'   ? guardarUsuario :
                  modal === 'categoria' ? guardarCat     :
                  modal === 'tipo'      ? guardarTipo    :
                  guardarLista
                } disabled={saving}
                  className="px-5 py-2.5 bg-[#1B3A6B] text-white rounded-[9px] text-[13px] font-semibold hover:bg-[#1E4D8C] disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-[10px] text-[13px] font-medium text-white shadow-lg ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-[#0F7B55]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}