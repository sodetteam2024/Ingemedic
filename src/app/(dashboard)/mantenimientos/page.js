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
    `).order('fecha_creacion', { ascending: false }),
    supabase.from('estados_mantenimiento').select('*'),
    supabase.from('tipos_mantenimiento').select('*'),
    supabase.from('categorias_equipo').select('*').eq('activo', true).order('nombre'),
    supabase.from('tipos_equipo').select('*').eq('activo', true).order('marca'),
    supabase.from('equipos').select(`
      id, codigo, serial,
      tipo_equipo:tipos_equipo(id, marca, modelo, categoria_id),
      estado:estados_equipo(id, nombre)
    `).order('codigo'),
  ])

  return (
    <MantenimientosClient
      mantenimientosIniciales={mantenimientos || []}
      estados={estados || []}
      tipos={tipos || []}
      categorias={categorias || []}
      tiposEquipo={tiposEquipo || []}
      equipos={equipos || []}
    />
  )
}