import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select(`
    nombre,
    email,
    username,
    roles (
      nombre
    )
  `)
  .eq('email', user.email)
    .single()

  const { data: empresa } = await supabase
    .from('configuracion_empresa')
    .select('logo_url, razon_social')
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar usuario={usuario} empresa={empresa} />
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden pb-[var(--mobile-nav-space,0px)] md:pb-0">
        {children}
      </main>
    </div>
  )
}