import { NextResponse } from 'next/server'

const PLANTILLAS = {
  equipos: {
    columnas: ['categoria', 'marca', 'modelo', 'serial', 'codigo', 'lote', 'fecha_compra', 'invima'],
    ejemplo: ['Oxigenoterapia', 'Respironics', 'EverFlo', 'SN-001234', 'EQ-001', 'LOT-2024', '2024-01-15', '2019M-0001234'],
  },
  clientes: {
    columnas: ['tipo_persona', 'nombre', 'nit_cc', 'digito_verificacion', 'departamento', 'municipio', 'direccion', 'telefono', 'email'],
    ejemplo: ['juridica', 'IPS San Juan de Dios', '900123456', '5', 'Cesar', 'Valledupar', 'Calle 5 # 10-20', '3001234567', 'ips@ejemplo.com'],
  },
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo')
  const plantilla = PLANTILLAS[tipo]
  if (!plantilla) return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })

  const bom = '\uFEFF'
  const csv = bom + [plantilla.columnas, plantilla.ejemplo]
    .map(row => row.map(v => `"${v}"`).join(','))
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv;charset=utf-8',
      'Content-Disposition': `attachment; filename="plantilla_${tipo}.csv"`,
    }
  })
}