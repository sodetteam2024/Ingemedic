import { createClient } from '@/lib/supabase-server'
import MantenimientosClient from './MantenimientosClient'

export default async function MantenimientosPage() {
  const supabase = await createClient()

  const [
    { data: mantenimientos },
    { data: estados },
    { data: tipos },
    { data: categorias },
    { data: tiposEquipo },
    { data: equipos },
    { data: checklist },
  ] = await Promise.all([
    supabase.from('mantenimientos').select(`
      *,
      equipo:equipos(id, codigo, serial,
        tipo_equipo:tipos_equipo(id, marca, modelo,
          categoria:categorias_equipo(id, nombre)
        )
      ),
      estado:estados_mantenimiento(id, nombre),
      tipo:tipos_mantenimiento(id, nombre)
    `).order('fecha_apertura', { ascending: false }),
    supabase.from('estados_mantenimiento').select('*'),
    supabase.from('tipos_mantenimiento').select('*'),
    supabase.from('categorias_equipo').select('*').eq('activo', true).order('nombre'),
    supabase.from('tipos_equipo').select('*, categoria:categorias_equipo(id, nombre), lista:listas_mantenimiento(id, nombre)').eq('activo', true).order('marca'),
    supabase.from('equipos').select('*, tipo_equipo:tipos_equipo(id, marca, modelo, categoria:categorias_equipo(id, nombre))').eq('activo', true),
    supabase.from('actividades_lista_mantenimiento').select('*').eq('activo', true).order('orden'),
  ])

  return (
    <MantenimientosClient
      mantenimientosIniciales={mantenimientos || []}
      estados={estados || []}
      tipos={tipos || []}
      categorias={categorias || []}
      tiposEquipo={tiposEquipo || []}
      equipos={equipos || []}
      checklist={checklist || []}
    />
  )
}