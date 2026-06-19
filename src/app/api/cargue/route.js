import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Papa from 'papaparse'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request) {
  try {
    const formData = await request.formData()
    const tipo = formData.get('tipo')
    const archivo = formData.get('archivo')
    const texto = await archivo.text()
    const { data: filas, errors } = Papa.parse(texto, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim().replace(/^\uFEFF/, ''), // quita BOM
      transform: v => v.trim(),
    })

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Error parseando CSV: ' + errors[0].message }, { status: 400 })
    }

    if (filas.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío o mal formateado' }, { status: 400 })
    }

    const resultados = { exitosos: 0, errores: [] }

    if (tipo === 'equipos') {
      // Cargar catálogos necesarios
      const { data: categorias } = await supabaseAdmin.from('categorias_equipo').select('id, nombre').eq('activo', true)
      const { data: tipos } = await supabaseAdmin.from('tipos_equipo').select('id, marca, modelo, categoria_id').eq('activo', true)
      const { data: estadoDisponible } = await supabaseAdmin.from('estados_equipo').select('id').eq('nombre', 'Disponible').single()

      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i]
        const nFila = i + 2 // +2 porque fila 1 es header

        // Validar campos obligatorios
        if (!fila.serial?.trim()) {
          resultados.errores.push(`Fila ${nFila}: el serial es obligatorio`)
          continue
        }
        if (!fila.marca?.trim() || !fila.modelo?.trim()) {
          resultados.errores.push(`Fila ${nFila}: marca y modelo son obligatorios`)
          continue
        }

        // Resolver categoría
        const cat = categorias?.find(c => c.nombre.toLowerCase() === fila.categoria?.toLowerCase())
        if (!cat) {
          resultados.errores.push(`Fila ${nFila}: categoría "${fila.categoria}" no existe en el sistema`)
          continue
        }

        // Resolver tipo de equipo
        let tipo_equipo = tipos?.find(t =>
          t.marca.toLowerCase() === fila.marca.toLowerCase() &&
          t.modelo.toLowerCase() === fila.modelo.toLowerCase() &&
          t.categoria_id === cat.id
        )

        // Si no existe el tipo, crearlo
        if (!tipo_equipo) {
          const { data: nuevoTipo, error: errTipo } = await supabaseAdmin
            .from('tipos_equipo')
            .insert({ categoria_id: cat.id, marca: fila.marca, modelo: fila.modelo, invima: fila.invima || null, activo: true })
            .select('id').single()
          if (errTipo) {
            resultados.errores.push(`Fila ${nFila}: error creando tipo de equipo — ${errTipo.message}`)
            continue
          }
          tipo_equipo = nuevoTipo
        }

        // Verificar serial duplicado
        const { data: existente } = await supabaseAdmin
          .from('equipos').select('id').eq('serial', fila.serial).single()
        if (existente) {
          resultados.errores.push(`Fila ${nFila}: serial "${fila.serial}" ya existe en inventario`)
          continue
        }

        // Insertar equipo
        const { error } = await supabaseAdmin.from('equipos').insert({
          tipo_equipo_id: tipo_equipo.id,
          serial: fila.serial.trim(),
          codigo: fila.codigo?.trim() || null,
          lote: fila.lote?.trim() || null,
          fecha_compra: fila.fecha_compra?.trim() || null,
          estado_id: estadoDisponible?.id,
          activo: true,
        })

        if (error) {
          resultados.errores.push(`Fila ${nFila}: ${error.message}`)
        } else {
          resultados.exitosos++
        }
      }
    }

    if (tipo === 'clientes') {
      const { data: departamentos } = await supabaseAdmin.from('departamentos').select('id, nombre')
      const { data: municipios } = await supabaseAdmin.from('municipios').select('id, nombre, departamento_id')

      for (let i = 0; i < filas.length; i++) {
        const fila = filas[i]
        const nFila = i + 2

        if (!fila.nombre?.trim()) {
          resultados.errores.push(`Fila ${nFila}: el nombre es obligatorio`)
          continue
        }
        if (!fila.nit_cc?.trim()) {
          resultados.errores.push(`Fila ${nFila}: el documento es obligatorio`)
          continue
        }
        if (!['natural', 'juridica'].includes(fila.tipo_persona?.toLowerCase())) {
          resultados.errores.push(`Fila ${nFila}: tipo_persona debe ser "natural" o "juridica"`)
          continue
        }

        // Resolver departamento y municipio
        const dep = departamentos?.find(d => d.nombre.toLowerCase() === fila.departamento?.toLowerCase())
        const mun = municipios?.find(m =>
          m.nombre.toLowerCase() === fila.municipio?.toLowerCase() &&
          (!dep || m.departamento_id === dep.id)
        )

        // Verificar documento duplicado
        const { data: existente } = await supabaseAdmin
          .from('clientes').select('id').eq('nit_cc', fila.nit_cc).single()
        if (existente) {
          resultados.errores.push(`Fila ${nFila}: documento "${fila.nit_cc}" ya existe`)
          continue
        }

        const { error } = await supabaseAdmin.from('clientes').insert({
          tipo_persona:        fila.tipo_persona.toLowerCase(),
          nombre:              fila.nombre.trim(),
          nit_cc:              fila.nit_cc.trim(),
          digito_verificacion: fila.digito_verificacion?.trim() || null,
          departamento_id:     dep?.id || null,
          municipio_id:        mun?.id || null,
          direccion:           fila.direccion?.trim() || null,
          telefono:            fila.telefono?.trim() || null,
          email:               fila.email?.trim() || null,
          activo:              true,
        })

        if (error) {
          resultados.errores.push(`Fila ${nFila}: ${error.message}`)
        } else {
          resultados.exitosos++
        }
      }
    }

    return NextResponse.json({
      total: filas.length,
      exitosos: resultados.exitosos,
      errores: resultados.errores,
    })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}