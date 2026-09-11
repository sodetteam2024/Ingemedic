'use client'
import { useRouter } from 'next/navigation'
import { Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { registrarBitacora } from '@/lib/bitacora'

// Layout mínimo para el rol Repartidor — sin sidebar, sin barra inferior, sin FAB
// radial (ese sistema de navegación móvil dual es para el admin con muchos
// módulos; el repartidor solo tiene Entregas y Preferencias).
export default function RepartidorHeader({ children, logoUrl }) {
  const router = useRouter()
  const supabase = createClient()

  async function cerrarSesion() {
    const { data: { user } } = await supabase.auth.getUser()
    await registrarBitacora({ modulo: 'auth', accion: 'logout', entidad: 'sesión', entidad_id: user?.id })
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="h-14 bg-[#1B3A6B] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={logoUrl} className="h-7" alt="Ingemedic" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/repartidor-preferencias')}>
            <Settings size={20} className="text-white/80" />
          </button>
          <button onClick={cerrarSesion}>
            <LogOut size={20} className="text-white/80" />
          </button>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
