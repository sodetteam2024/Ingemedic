'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { registrarBitacora } from '@/lib/bitacora'
import { User, Lock, LogOut, Save } from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-[14px] text-slate-800 outline-none focus:border-[#D81B43] bg-white'
const labelCls = 'block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-500 mb-1.5'

// Preferencias simplificadas para el rol Repartidor — solo su nombre, cambio de
// contraseña y cerrar sesión. Nada de categorías/tipos/plantillas/usuarios/empresa,
// eso es exclusivo de la Configuración completa de admin.
export default function RepartidorPreferenciasClient({ usuario }) {
  const supabase = createClient()
  const [nombre, setNombre] = useState(usuario?.nombre || '')
  const [guardandoNombre, setGuardandoNombre] = useState(false)

  const [passwords, setPasswords] = useState({ nueva: '', confirmar: '' })
  const [guardandoPass, setGuardandoPass] = useState(false)

  const [toast, setToast] = useState(null)
  function showToast(msg, tipo = 'success') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 3200)
  }

  async function guardarNombre() {
    if (!nombre.trim()) { showToast('El nombre no puede quedar vacío', 'error'); return }
    setGuardandoNombre(true)
    const { error } = await supabase.from('usuarios').update({ nombre: nombre.trim() }).eq('id', usuario.id)
    setGuardandoNombre(false)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    showToast('Nombre actualizado')
  }

  async function cambiarPassword() {
    if (passwords.nueva.length < 6) { showToast('Mínimo 6 caracteres', 'error'); return }
    if (passwords.nueva !== passwords.confirmar) { showToast('Las contraseñas no coinciden', 'error'); return }
    setGuardandoPass(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.nueva })
    setGuardandoPass(false)
    if (error) { showToast('Error: ' + error.message, 'error'); return }
    setPasswords({ nueva: '', confirmar: '' })
    showToast('Contraseña actualizada')
  }

  async function cerrarSesion() {
    const { data: { user } } = await supabase.auth.getUser()
    await registrarBitacora({ modulo: 'auth', accion: 'logout', entidad: 'sesión', entidad_id: user?.id })
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <div className="max-w-[480px] mx-auto p-4 space-y-4">
      <div className="pt-2 pb-1">
        <div className="text-[17px] font-bold text-slate-800">Mis preferencias</div>
        <div className="text-[12.5px] text-slate-400 mt-0.5">{usuario?.email}</div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3 text-[13px] font-bold text-slate-700">
          <User size={15} className="text-[#D81B43]" /> Mis datos
        </div>
        <label className={labelCls}>Nombre</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} className={inputCls} />
        <button onClick={guardarNombre} disabled={guardandoNombre}
          className="w-full mt-3 py-2.5 bg-[#1B3A6B] text-white rounded-[9px] text-[13.5px] font-semibold hover:bg-[#152d55] disabled:opacity-50 flex items-center justify-center gap-1.5">
          <Save size={14} /> {guardandoNombre ? 'Guardando...' : 'Guardar nombre'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3 text-[13px] font-bold text-slate-700">
          <Lock size={15} className="text-[#D81B43]" /> Cambiar contraseña
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Nueva contraseña</label>
            <input type="password" value={passwords.nueva} onChange={e => setPasswords(p => ({ ...p, nueva: e.target.value }))}
              placeholder="Mínimo 6 caracteres" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Confirmar contraseña</label>
            <input type="password" value={passwords.confirmar} onChange={e => setPasswords(p => ({ ...p, confirmar: e.target.value }))}
              className={inputCls} />
          </div>
        </div>
        <button onClick={cambiarPassword} disabled={guardandoPass}
          className="w-full mt-3 py-2.5 bg-[#1B3A6B] text-white rounded-[9px] text-[13.5px] font-semibold hover:bg-[#152d55] disabled:opacity-50 flex items-center justify-center gap-1.5">
          <Save size={14} /> {guardandoPass ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </div>

      <button onClick={cerrarSesion}
        className="w-full py-3 border border-red-200 text-red-600 rounded-[10px] text-[14px] font-semibold hover:bg-red-50 flex items-center justify-center gap-2">
        <LogOut size={16} /> Cerrar sesión
      </button>

      {toast && (
        <div className={`fixed bottom-6 left-4 right-4 z-[70] px-4 py-3 rounded-[10px] text-[13px] font-medium text-white shadow-lg text-center ${toast.tipo === 'error' ? 'bg-red-500' : 'bg-[#0F7B55]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
