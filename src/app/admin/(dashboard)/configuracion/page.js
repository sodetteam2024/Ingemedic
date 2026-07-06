import { createClient } from '@/lib/supabase-server'
import ConfiguracionClient from './ConfiguracionClient'

export default async function ConfiguracionPage() {
  const supabase = await createClient()

  const [
    { data: usuarios },
    { data: roles },
    { data: categorias },
    { data: tipos },
    { data: plantillas },
    { data: listas },
    { data: actividades },
    { data: empresa },
  ] = await Promise.all([
    supabase.from('usuarios').select('*, rol:roles(id, nombre)').order('nombre'),
    supabase.from('roles').select('*'),
    supabase.from('categorias_equipo').select('*').eq('activo', true).order('nombre'),
    supabase.from('tipos_equipo')
      .select('*, atributos, categoria:categorias_equipo(id, nombre, atributos_extra), lista:listas_mantenimiento(id, nombre)')
      .eq('activo', true)
      .order('nombre'),
    supabase.from('plantillas_orden').select('*').eq('eliminado', false).order('nombre'),
    supabase.from('listas_mantenimiento').select('*').eq('activo', true).order('nombre'),
    supabase.from('actividades_lista_mantenimiento').select('*').eq('activo', true).order('orden'),
    supabase.from('configuracion_empresa').select('*').single(),
  ])

  return (
    <ConfiguracionClient
      usuariosIniciales={usuarios || []}
      roles={roles || []}
      categorias={categorias || []}
      tipos={tipos || []}
      plantillas={plantillas || []}
      listas={listas || []}
      actividades={actividades || []}
      empresaInicial={empresa || {}}
    />
  )
}