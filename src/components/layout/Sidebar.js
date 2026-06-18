'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'grid' },
    ]
  },
  {
    label: 'Operaciones',
    items: [
      { href: '/entregas',       label: 'Entregas',            icon: 'truck' },
      { href: '/inventario',     label: 'Inventario',          icon: 'pulse' },
      { href: '/ordenes',        label: 'Órdenes de servicio', icon: 'file' },
      { href: '/clientes',       label: 'Clientes',            icon: 'users' },
      { href: '/mantenimientos', label: 'Mantenimientos',      icon: 'tool' },
      { href: '/servicios',      label: 'Servicios prestados', icon: 'pulse' },
    ]
  },
  {
    label: 'Sistema',
    items: [
      { href: '/bitacora',      label: 'Bitácora',      icon: 'book' },
      { href: '/configuracion', label: 'Configuración', icon: 'settings' },
    ]
  },
]

const ICONS = {
  grid:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  truck:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  pulse:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  file:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  users:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  tool:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  book:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  logout:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
}

export default function Sidebar({ usuario }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-w-[256px] flex flex-col h-screen overflow-y-auto flex-shrink-0"
      style={{background: 'linear-gradient(180deg, #1B3A6B 0%, #0F2448 100%)'}}>

      {/* Logo */}
      <div className="px-[18px] py-5 border-b border-white/8 flex items-center gap-2.5">
        <img src="/logo.png" alt="Ingemedic" className="h-[42px] w-auto"
          onError={e => e.target.style.display='none'} />
        <div>
          <div className="text-[13px] font-bold text-white leading-tight">Ingemedic</div>
          <div className="text-[10px] text-white/40 tracking-[0.06em] mt-0.5">SISTEMA OPERATIVO</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {NAV.map(group => (
          <div key={group.label} className="pb-1">
            <div className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-white/28 px-[18px] py-2.5">
              {group.label}
            </div>
            {group.items.map(item => {
              const active = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2.5 px-[18px] py-[9px] text-[13.5px] font-medium transition-all border-l-[3px] ${
                    active
                      ? 'text-white bg-[#2EB5D4]/12 border-l-[#2EB5D4]'
                      : 'text-white/55 border-l-transparent hover:text-white hover:bg-white/6'
                  }`}>
                  <span className={`w-[18px] flex-shrink-0 flex items-center justify-center ${active ? 'opacity-100' : 'opacity-70'}`}>
                    {ICONS[item.icon]}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Usuario */}
      <div className="px-[18px] py-3.5 border-t border-white/8 flex items-center gap-2.5 mt-auto">
        <div className="w-8 h-8 rounded-full bg-[#2EB5D4] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
          {usuario?.nombre?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-white truncate">{usuario?.nombre || 'Usuario'}</div>
          <div className="text-[10.5px] text-white/40 capitalize">{usuario?.rol || 'admin'}</div>
        </div>
        <button onClick={logout} className="text-white/30 hover:text-white transition-colors flex-shrink-0 p-1">
          {ICONS.logout}
        </button>
      </div>
    </aside>
  )
}