import { createClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()

  const ahora   = new Date()
  const hoy     = ahora.toISOString().split('T')[0]
  const en7dias = new Date(ahora.getTime() + 7 * 86400000).toISOString().split('T')[0]

  const [
    { data: equiposEstados },
    { data: ordenesActivas },
    { data: mantenimientosActivos },
    { data: entregasHoy },
    { data: vigenciasProximas },
    { data: ordenesRetrasadas },
    { data: actividadReciente },
    { data: equiposConCliente },
  ] = await Promise.all([
    supabase.from('equipos').select('estado:estados_equipo(id, nombre)'),

    supabase.from('ordenes_servicio').select(`
      id, codigo, fecha_entrega, fecha_vigencia,
      cliente:clientes(id, nombre),
      estado:estados_orden(id, nombre),
      repartidor:usuarios!ordenes_servicio_repartidor_id_fkey(id, nombre)
    `)
    .not('estado_id', 'in', `(45383dd9-7f9a-426d-830e-d093f105bef9)`)
    .order('fecha_entrega', { ascending: true })
    .limit(10),

    supabase.from('mantenimientos').select(`
      id, codigo, fecha_apertura,
      equipo:equipos(id, codigo, tipo_equipo:tipos_equipo(id, nombre, atributos)),
      estado:estados_mantenimiento(id, nombre),
      tipo:tipos_mantenimiento(id, nombre)
    `)
    .not('estado_id', 'eq', '08136bd6-f134-406a-98e9-2132516edd7f')
    .order('fecha_creacion', { ascending: false })
    .limit(8),

    supabase.from('entregas').select(`
      id, codigo, tipo, fecha_inicio, fecha_completada,
      cliente:clientes(id, nombre),
      estado:estados_entrega(id, nombre),
      repartidor:usuarios!entregas_repartidor_id_fkey(id, nombre)
    `)
    .gte('fecha_creacion', hoy)
    .order('fecha_creacion', { ascending: false }),

    supabase.from('ordenes_servicio').select(`
      id, codigo, fecha_vigencia,
      cliente:clientes(id, nombre),
      estado:estados_orden(id, nombre)
    `)
    .gte('fecha_vigencia', hoy)
    .lte('fecha_vigencia', en7dias)
    .not('estado_id', 'in', `(45383dd9-7f9a-426d-830e-d093f105bef9,acafaf48-918e-4681-bf31-3111c218bcc9)`)
    .order('fecha_vigencia', { ascending: true })
    .limit(5),

    supabase.from('ordenes_servicio').select(`
      id, codigo, fecha_entrega,
      cliente:clientes(id, nombre),
      repartidor:usuarios!ordenes_servicio_repartidor_id_fkey(id, nombre)
    `)
    .eq('estado_id', '9430f8fe-008f-494e-ada5-3c667799b26c')
    .lt('fecha_entrega', ahora.toISOString())
    .order('fecha_entrega', { ascending: true })
    .limit(5),

    supabase.from('ordenes_servicio').select(`
      id, codigo, fecha_creacion,
      cliente:clientes(id, nombre),
      estado:estados_orden(id, nombre)
    `)
    .order('fecha_creacion', { ascending: false })
    .limit(5),

    supabase.from('equipos')
      .select('cliente_actual:clientes(id, nombre)')
      .not('cliente_actual_id', 'is', null),
  ])

  const estadosEquipo = {}
  ;(equiposEstados || []).forEach(e => {
    const n = e.estado?.nombre || 'Sin estado'
    estadosEquipo[n] = (estadosEquipo[n] || 0) + 1
  })

  const topClientes = Object.values(
    (equiposConCliente || []).reduce((acc, e) => {
      const id     = e.cliente_actual?.id
      const nombre = e.cliente_actual?.nombre
      if (!id) return acc
      acc[id] = acc[id] || { nombre, cantidad: 0 }
      acc[id].cantidad++
      return acc
    }, {})
  ).sort((a, b) => b.cantidad - a.cantidad).slice(0, 8)

  return (
    <DashboardClient
      totalEquipos={(equiposEstados || []).length}
      estadosEquipo={estadosEquipo}
      ordenesActivas={ordenesActivas || []}
      mantenimientosActivos={mantenimientosActivos || []}
      entregasHoy={entregasHoy || []}
      vigenciasProximas={vigenciasProximas || []}
      ordenesRetrasadas={ordenesRetrasadas || []}
      actividadReciente={actividadReciente || []}
      topClientes={topClientes}
    />
  )
}