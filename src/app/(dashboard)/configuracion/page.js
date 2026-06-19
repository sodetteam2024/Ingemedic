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
    { data: checklist },
    { data: empresa },
  ] = await Promise.all([
    supabase.from('usuarios').select('*, rol:roles(id, nombre)').order('nombre'),
    supabase.from('roles').select('*'),
    supabase.from('categorias_equipo').select('*').order('nombre'),
    supabase.from('tipos_equipo').select('*, categoria:categorias_equipo(id, nombre)').order('marca'),
    supabase.from('plantillas_orden').select('*').eq('eliminado', false).order('nombre'),
    supabase.from('checklist_mantenimiento').select('*').eq('activo', true).order('orden'),
    supabase.from('configuracion_empresa').select('*').single(),
  ])

  return (
    <ConfiguracionClient
      usuariosIniciales={usuarios || []}
      roles={roles || []}
      categorias={categorias || []}
      tipos={tipos || []}
      plantillas={plantillas || []}
      checklist={checklist || []}
      empresaInicial={empresa || {}}
    />
  )
}