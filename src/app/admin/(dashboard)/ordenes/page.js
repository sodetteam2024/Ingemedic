import { createClient } from '@/lib/supabase-server'
import OrdenesClient from './OrdenesClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdenesPage() {
  const supabase = await createClient()

  const [
    { data: ordenes },
    { data: clientes },
    { data: pacientes },
    { data: estados },
    { data: estadosEquipo },
    { data: plantillas },
    { data: equipos },
    { data: usuarios },
    { data: tipos },
  ] = await Promise.all([
    supabase.from('ordenes_servicio').select(`
      *,
      cliente:clientes(id, nombre, tipo_persona, nit_cc),
      paciente:pacientes(id, nombre, cedula, direccion),
      estado:estados_orden(id, nombre),
      repartidor:usuarios!ordenes_servicio_repartidor_id_fkey(id, nombre),
      equipos:orden_equipos(
        id, equipo_id, fecha_entrega, fecha_devolucion,
        equipo:equipos(
          id, codigo,
          tipo_equipo:tipos_equipo(id, nombre, atributos,
            categoria:categorias_equipo(id, nombre)
          )
        )
      ),
      plantillas:orden_plantillas(
        id, plantilla_id, firmado, firmado_por, firma_iniciales, fecha_firma,
        plantilla:plantillas_orden(id, nombre)
      )
    `).order('fecha_creacion', { ascending: false }),
    supabase.from('clientes').select('id, nombre, tipo_persona, nit_cc').eq('activo', true).order('nombre'),
    supabase.from('pacientes').select('*').eq('activo', true).order('nombre'),
    supabase.from('estados_orden').select('*').order('nombre'),
    supabase.from('estados_equipo').select('*').order('nombre'),
    supabase.from('plantillas_orden').select('id, nombre, descripcion').eq('activo', true).order('nombre'),
    supabase.from('equipos').select(`
      id, codigo, tipo_equipo_id,
      tipo_equipo:tipos_equipo(id, nombre, atributos,
        categoria:categorias_equipo(id, nombre)
      ),
      estado:estados_equipo(id, nombre)
    `).eq('estado_id', 'f33e7c6f-0f81-484e-9f0a-93fd28f9c414').order('codigo'),
    supabase.from('usuarios').select('id, nombre').eq('activo', true).eq('rol_id', '17cd4f56-cae6-4efd-971b-2f8875f1f633').order('nombre'),
    supabase.from('tipos_orden').select('id, nombre').eq('activo', true).order('nombre'),
  ])

  return (
    <OrdenesClient
      ordenesIniciales={ordenes || []}
      clientes={clientes || []}
      pacientes={pacientes || []}
      estados={estados || []}
      estadosEquipo={estadosEquipo || []}
      plantillas={plantillas || []}
      equiposDisponibles={equipos || []}
      usuarios={usuarios || []}
      tipos={tipos || []}
    />
  )
}