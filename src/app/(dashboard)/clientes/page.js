import { createClient } from '@/lib/supabase-server'
import ClientesClient from './ClientesClient'

export default async function ClientesPage() {
  const supabase = await createClient()

  const [
    { data: clientes },
    { data: departamentos },
    { data: municipios },
  ] = await Promise.all([
    supabase.from('clientes')
      .select('*, municipio:municipios(id, nombre), departamento:departamentos(id, nombre)')
      .eq('activo', true)
      .order('nombre'),
    supabase.from('departamentos').select('*').eq('activo', true).order('nombre'),
    supabase.from('municipios').select('*').eq('activo', true).order('nombre'),
  ])

  return (
    <ClientesClient
      clientesIniciales={clientes || []}
      departamentos={departamentos || []}
      municipios={municipios || []}
    />
  )
}