import { createClient } from '@/lib/supabase-server'
import OrdenesClient from './OrdenesClient'

export default async function OrdenesPage() {
  const supabase = await createClient()

  const [
    { data: ordenes },
    { data: clientes },
    { data: estados },
    { data: tipos },
    { data: plantillas },
    { data: equipos },
    { data: usuarios },
  ] = await Promise.all([
    supabase.from('ordenes_servicio').select(`
      *,
      cliente:clientes(id, nombre, tipo_persona, nit_cc),
      estado:estados_orden(id, nombre),
      tipo:tipos_orden(id, nombre),
      repartidor:usuarios(id, nombre),
      equipos:orden_equipos(id, equipo_id, fecha_entrega, fecha_devolucion,
        equipo:equipos(id, codigo, serial, tipo_equipo:tipos_equipo(marca, modelo))
      ),
      plantillas:orden_plantillas(id, plantilla_id, firmado, firmado_por, firma_iniciales,
        plantilla:plantillas_orden(id, nombre)
      )
    `).order('fecha_creacion', { ascending: false }),
    supabase.from('clientes').select('id, nombre, tipo_persona, nit_cc').eq('activo', true).order('nombre'),
    supabase.from('estados_orden').select('*'),
    supabase.from('tipos_orden').select('*').eq('activo', true),
    supabase.from('plantillas_orden').select('id, nombre, descripcion').eq('activo', true).eq('eliminado', false),
    supabase.from('equipos').select(`
      id, codigo, serial,
      tipo_equipo:tipos_equipo(id, marca, modelo, categoria_id,
        categoria:categorias_equipo(id, nombre)
      ),
      estado:estados_equipo(id, nombre)
    `).eq('estado_id', 'f33e7c6f-0f81-484e-9f0a-93fd28f9c414'),
    supabase.from('usuarios').select('id, nombre, rol_id').eq('activo', true),
  ])

  return (
    <OrdenesClient
      ordenesIniciales={ordenes || []}
      clientes={clientes || []}
      estados={estados || []}
      tipos={tipos || []}
      plantillas={plantillas || []}
      equiposDisponibles={equipos || []}
      usuarios={usuarios || []}
    />
  )
}