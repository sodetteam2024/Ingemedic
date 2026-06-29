import { createClient } from '@/lib/supabase-server'
import InventarioClient from './InventarioClient'

export default async function InventarioPage() {
  const supabase = await createClient()

  const [
    { data: categorias },
    { data: tipos },
    { data: equipos },
    { data: estados },
  ] = await Promise.all([
    supabase.from('categorias_equipo')
      .select('id, nombre, descripcion, imagen_url, atributos_extra')
      .eq('activo', true).order('nombre'),
    supabase.from('tipos_equipo')
      .select('id, nombre, imagen_url, atributos, categoria_id, lista_mantenimiento_id, categoria:categorias_equipo(id, nombre, imagen_url, atributos_extra)')
      .eq('activo', true).order('nombre'),
    supabase.from('equipos')
      .select('*, estado:estados_equipo(id, nombre), tipo_equipo:tipos_equipo(id, nombre, imagen_url, atributos, categoria_id)')
      .order('fecha_creacion', { ascending: false }),
    supabase.from('estados_equipo').select('*').order('nombre'),
  ])

  return (
    <InventarioClient
      categorias={categorias || []}
      tipos={tipos || []}
      equipos={equipos || []}
      estados={estados || []}
    />
  )
}