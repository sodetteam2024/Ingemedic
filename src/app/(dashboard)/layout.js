import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Traer datos del usuario de la tabla usuarios
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('nombre, rol, email, username')
    .eq('email', user.email)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar usuario={usuario} />
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {children}
      </main>
    </div>
  )
}