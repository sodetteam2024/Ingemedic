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
    supabase.from('categorias_equipo').select('*').eq('activo', true).order('nombre'),
    supabase.from('tipos_equipo').select('*').eq('activo', true).order('marca'),
    supabase.from('equipos').select(`
      *,
      tipo_equipo:tipos_equipo(id, marca, modelo, imagen_url, categoria_id),
      estado:estados_equipo(id, nombre),
      arrendatario:clientes(id, nombre)
    `).order('fecha_creacion', { ascending: false }),
    supabase.from('estados_equipo').select('*'),
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