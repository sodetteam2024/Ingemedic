import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Package, CheckCircle, Truck, Users, ClipboardList, Wrench, ChevronRight } from 'lucide-react'
export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalEquipos },
    { count: equiposDisponibles },
    { count: equiposPrestamo },
    { count: totalClientes },
    { count: osActivas },
    { count: mantActivos },
  ] = await Promise.all([
    supabase.from('equipos').select('*', { count: 'exact', head: true }),
    supabase.from('equipos').select('*', { count: 'exact', head: true })
      .eq('estado_id', 'f33e7c6f-0f81-484e-9f0a-93fd28f9c414'),
    supabase.from('equipos').select('*', { count: 'exact', head: true })
      .eq('estado_id', '56abea9f-8cad-413e-bc3c-31ba19fa00fe'),
    supabase.from('clientes').select('*', { count: 'exact', head: true })
      .eq('activo', true),
    supabase.from('ordenes_servicio').select('*', { count: 'exact', head: true })
      .not('estado_id', 'eq', '45383dd9-7f9a-426d-830e-d093f105bef9'),
    supabase.from('mantenimientos').select('*', { count: 'exact', head: true })
      .eq('en_curso', true),
  ])

  const stats = [
    { label: 'Equipos en inventario', value: totalEquipos || 0,       color: '#1B3A6B', icon: Package,       href: '/inventario' },
    { label: 'Disponibles',           value: equiposDisponibles || 0,  color: '#0F7B55', icon: CheckCircle,   href: '/inventario' },
    { label: 'En préstamo',           value: equiposPrestamo || 0,     color: '#2EB5D4', icon: Truck,         href: '/ordenes' },
    { label: 'Clientes activos',      value: totalClientes || 0,       color: '#6D28D9', icon: Users,         href: '/clientes' },
    { label: 'Órdenes activas',       value: osActivas || 0,           color: '#B45309', icon: ClipboardList, href: '/ordenes' },
    { label: 'En mantenimiento',      value: mantActivos || 0,         color: '#C0392B', icon: Wrench,        href: '/mantenimientos' },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Topbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-7 flex-shrink-0">
        <div>
          <div className="text-[18px] font-bold text-[#1B3A6B]">Dashboard</div>
          <div className="text-[12px] text-slate-400 mt-0.5">Centro de comando operativo</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold text-[#0F7B55]"
          style={{ background: '#ECFDF5', border: '1px solid rgba(15,123,85,0.15)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F7B55] animate-pulse" />
          En tiempo real
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map(s => {
            const Icon = s.icon
            return (
              <Link key={s.label} href={s.href}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#2EB5D4] hover:shadow-md transition-all group">
                <Icon size={20} className="mb-2 opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: s.color }} />
                <div className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11.5px] text-slate-400 mt-1 leading-tight">{s.label}</div>
              </Link>
            )
          })}
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="text-[13px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-4">Accesos rápidos</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Nueva orden',      href: '/ordenes',        color: '#1B3A6B' },
              { label: 'Registrar cliente',href: '/clientes',       color: '#6D28D9' },
              { label: 'Ver entregas',     href: '/entregas',       color: '#2EB5D4' },
              { label: 'Mantenimientos',   href: '/mantenimientos', color: '#C0392B' },
            ].map(a => (
              <Link key={a.label} href={a.href}
                className="flex items-center justify-between px-4 py-3 rounded-[10px] border border-slate-200 text-[13px] font-semibold hover:border-[#2EB5D4] hover:bg-slate-50 transition-all"
                style={{ color: a.color }}>
                {a.label}
                <ChevronRight size={14} className="text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}