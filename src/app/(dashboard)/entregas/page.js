import { createClient } from '@/lib/supabase-server'
import EntregasClient from './EntregasClient'

export default async function EntregasPage() {
  const supabase = await createClient()

  const [
    { data: entregas },
    { data: ordenes },
    { data: estados },
  ] = await Promise.all([
    supabase.from('entregas').select(`
      *,
      orden:ordenes_servicio(
        id, codigo, fecha_vigencia, observaciones,
        cliente:clientes(id, nombre, tipo_persona, nit_cc, direccion, telefono),
        equipos:orden_equipos(
          id, equipo_id,
          equipo:equipos(id, codigo, serial,
            tipo_equipo:tipos_equipo(id, nombre, atributos)
          )
        ),
        plantillas:orden_plantillas(
          id, plantilla_id, firmado, firmado_por, firma_iniciales, fecha_firma,
          plantilla:plantillas_orden(id, nombre)
        )
      ),
      cliente:clientes(id, nombre),
      repartidor:usuarios!entregas_repartidor_id_fkey(id, nombre),
      estado:estados_entrega(id, nombre)
    `).order('fecha_creacion', { ascending: false }),
    // Órdenes en estado "Programada" sin entrega activa aún
    supabase.from('ordenes_servicio').select(`
      id, codigo, fecha_vigencia, fecha_entrega, observaciones,
      cliente:clientes(id, nombre, tipo_persona, nit_cc, direccion, telefono),
      repartidor:usuarios!ordenes_servicio_repartidor_id_fkey(id, nombre),
      estado:estados_orden(id, nombre),
      equipos:orden_equipos(
        id, equipo_id,
        equipo:equipos(id, codigo, serial,
          tipo_equipo:tipos_equipo(id, nombre, atributos)
        )
      ),
      plantillas:orden_plantillas(
        id, plantilla_id, firmado, firmado_por, firma_iniciales, fecha_firma,
        plantilla:plantillas_orden(id, nombre)
      )
    `).eq('estado_id', '9430f8fe-008f-494e-ada5-3c667799b26c').order('fecha_entrega', { ascending: true }),
    supabase.from('estados_entrega').select('*').order('nombre'),
  ])

  return (
    <EntregasClient
      entregasIniciales={entregas || []}
      ordenesEnReparto={ordenes || []}
      estados={estados || []}
    />
  )
}