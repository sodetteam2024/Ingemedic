import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const COLUMNAS_BASE_EQUIPOS = ['categoria', 'marca', 'modelo', 'serial', 'codigo', 'invima']
const COLUMNAS_BASE_CLIENTES = ['tipo_persona', 'nombre', 'nit_cc', 'digito_verificacion', 'departamento', 'municipio', 'direccion', 'telefono', 'email']

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const tipo      = searchParams.get('tipo')
  const categoriaId = searchParams.get('categoria_id')

  let columnas = []
  let ejemplo  = []

  if (tipo === 'clientes') {
    columnas = COLUMNAS_BASE_CLIENTES
    ejemplo  = ['juridica', 'IPS San Juan de Dios', '900123456', '5', 'Cesar', 'Valledupar', 'Calle 5 # 10-20', '3001234567', 'ips@ejemplo.com']
  } else if (tipo === 'equipos') {
    // Cargar campos dinámicos de la categoría seleccionada
    let camposExtra = []
    if (categoriaId) {
      const { data: cat } = await supabaseAdmin
        .from('categorias_equipo')
        .select('nombre, atributos_extra')
        .eq('id', categoriaId)
        .single()

      camposExtra = cat?.atributos_extra?.campos_tipo?.concat(cat?.atributos_extra?.campos_unidad || []) || []
    }

    columnas = [...COLUMNAS_BASE_EQUIPOS, ...camposExtra.map(c => c.clave)]
    ejemplo  = [
      'Oxigenoterapia', 'Respironics', 'EverFlo', 'SN-001234', 'EQ-001', '2019M-0001234',
      ...camposExtra.map(c => {
        if (c.tipo === 'numero')   return '0'
        if (c.tipo === 'booleano') return 'si'
        if (c.tipo === 'fecha')    return '2024-01-15'
        if (c.tipo === 'lista')    return c.opciones?.[0] || ''
        return ''
      })
    ]
  } else {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  const bom = '\uFEFF'
  const csv = bom + [columnas, ejemplo]
    .map(row => row.map(v => `"${v}"`).join(';'))
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv;charset=utf-8',
      'Content-Disposition': `attachment; filename="plantilla_${tipo}${categoriaId ? '_' + categoriaId.slice(0,8) : ''}.csv"`,
    }
  })
}