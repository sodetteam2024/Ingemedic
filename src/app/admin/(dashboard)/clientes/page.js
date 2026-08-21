import { createClient } from '@/lib/supabase-server'
import ClientesClient from './ClientesClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientesPage() {
  const supabase = await createClient()

  const [
    { data: clientes },
    { data: clientesInactivos },
    { data: departamentos },
    { data: municipios },
  ] = await Promise.all([
    supabase.from('clientes')
      .select('*, municipio:municipios(id, nombre), departamento:departamentos(id, nombre)')
      .eq('activo', true)
      .order('nombre'),
    supabase.from('clientes')
      .select('*, municipio:municipios(id, nombre), departamento:departamentos(id, nombre)')
      .eq('activo', false)
      .order('nombre'),
    supabase.from('departamentos').select('*').eq('activo', true).order('nombre'),
    supabase.from('municipios').select('*').eq('activo', true).order('nombre'),
  ])

  return (
    <ClientesClient
      clientesIniciales={clientes || []}
      clientesInactivosIniciales={clientesInactivos || []}
      departamentos={departamentos || []}
      municipios={municipios || []}
    />
  )
}