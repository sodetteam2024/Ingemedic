import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Papa from 'papaparse'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function limpiar(val) {
  if (!val || val.trim() === '' || val.trim().toUpperCase() === 'N/A') return null
  return val.trim()
}

function parsearFecha(str) {
  if (!str || str.trim() === '' || str.trim().toUpperCase() === 'N/A') return null
  const s = str.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')
    return `${y}-${m}-${d}`
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split('-')
    return `${y}-${m}-${d}`
  }
  return null
}

export async function POST(request) {
  try {
    const formData = await request.formData()
    const tipo    = formData.get('tipo')
    const archivo = formData.get('archivo')
    const texto   = await archivo.text()

    const { data: filas, errors: parseErrors } = Papa.parse(texto, {
      header:          true,
      skipEmptyLines:  true,
      delimiter:       '',
      transformHeader: h => h.trim().replace(/^\uFEFF/, '').replace(/;$/, ''),
      transform:       v => v.trim(),
    })

    if (parseErrors.length > 0) {
      return NextResponse.json({ error: 'Error parseando CSV: ' + parseErrors[0].message }, { status: 400 })
    }

    // Filtrar filas realmente vacías
    const filasFinales = filas.filter(f =>
      Object.values(f).some(v => v && v.trim() !== '' && v.trim().toUpperCase() !== 'N/A')
    )

    if (filasFinales.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío o mal formateado' }, { status: 400 })
    }

    const resultados = { exitosos: 0, errores: [] }

    // ── EQUIPOS ──────────────────────────────────────────────
    if (tipo === 'equipos') {
      const { data: categorias }       = await supabaseAdmin.from('categorias_equipo').select('id, nombre, atributos_extra').eq('activo', true)
      const { data: tiposEquipo }      = await supabaseAdmin.from('tipos_equipo').select('id, marca, modelo, categoria_id').eq('activo', true)
      const { data: estadoDisponible } = await supabaseAdmin.from('estados_equipo').select('id').eq('nombre', 'Disponible').single()

      for (let i = 0; i < filasFinales.length; i++) {
        const fila  = filasFinales[i]
        const nFila = i + 2

        if (!limpiar(fila.serial)) {
          resultados.errores.push(`Fila ${nFila}: el serial es obligatorio`)
          continue
        }
        if (!limpiar(fila.marca) || !limpiar(fila.modelo)) {
          resultados.errores.push(`Fila ${nFila}: marca y modelo son obligatorios`)
          continue
        }
        if (!limpiar(fila.categoria)) {
          resultados.errores.push(`Fila ${nFila}: la categoría es obligatoria`)
          continue
        }

        // Resolver categoría
        const cat = categorias?.find(c => c.nombre.toLowerCase() === fila.categoria.toLowerCase())
        if (!cat) {
          resultados.errores.push(`Fila ${nFila}: categoría "${fila.categoria}" no existe en el sistema`)
          continue
        }

        // Resolver tipo de equipo — si no existe lo crea
        let tipoObj = tiposEquipo?.find(t =>
          t.marca.toLowerCase()  === fila.marca.toLowerCase() &&
          t.modelo.toLowerCase() === fila.modelo.toLowerCase() &&
          t.categoria_id         === cat.id
        )

        if (!tipoObj) {
          const { data: nuevoTipo, error: errTipo } = await supabaseAdmin
            .from('tipos_equipo')
            .insert({
              categoria_id: cat.id,
              marca:        fila.marca.trim(),
              modelo:       fila.modelo.trim(),
              invima:       limpiar(fila.invima),
              activo:       true,
            })
            .select('id').single()

          if (errTipo) {
            resultados.errores.push(`Fila ${nFila}: error creando tipo de equipo — ${errTipo.message}`)
            continue
          }
          tipoObj = nuevoTipo
        }

        // Verificar serial duplicado
        const { data: existente } = await supabaseAdmin
          .from('equipos').select('id').eq('serial', fila.serial.trim()).maybeSingle()
        if (existente) {
          resultados.errores.push(`Fila ${nFila}: serial "${fila.serial}" ya existe en inventario`)
          continue
        }

        // Construir atributos extras de la categoría
        const camposExtra = [
          ...(cat.atributos_extra?.campos_tipo   || []),
          ...(cat.atributos_extra?.campos_unidad || []),
        ]
        const atributos = {}
        for (const campo of camposExtra) {
          if (fila[campo.clave] !== undefined && fila[campo.clave] !== '') {
            atributos[campo.clave] = fila[campo.clave]
          }
        }

        // Insertar equipo
        const { error } = await supabaseAdmin.from('equipos').insert({
          tipo_equipo_id: tipoObj.id,
          categoria_id:   cat.id,
          marca:          fila.marca.trim(),
          modelo:         fila.modelo.trim(),
          serial:         fila.serial.trim(),
          codigo:         limpiar(fila.codigo),
          invima:         limpiar(fila.invima),
          estado_id:      estadoDisponible?.id,
          atributos:      Object.keys(atributos).length > 0 ? atributos : null,
        })

        if (error) {
          resultados.errores.push(`Fila ${nFila}: ${error.message}`)
        } else {
          resultados.exitosos++
        }
      }
    }

    // ── CLIENTES ──────────────────────────────────────────────
    if (tipo === 'clientes') {
      const { data: departamentos } = await supabaseAdmin.from('departamentos').select('id, nombre')
      const { data: municipios }    = await supabaseAdmin.from('municipios').select('id, nombre, departamento_id')

      for (let i = 0; i < filasFinales.length; i++) {
        const fila  = filasFinales[i]
        const nFila = i + 2

        if (!limpiar(fila.nombre)) {
          resultados.errores.push(`Fila ${nFila}: el nombre es obligatorio`)
          continue
        }
        if (!limpiar(fila.nit_cc)) {
          resultados.errores.push(`Fila ${nFila}: el documento es obligatorio`)
          continue
        }
const tipoPersonaRaw = fila.tipo_persona?.toLowerCase().trim()
if (!['natural', 'juridica', 'jurídica'].includes(tipoPersonaRaw)) {
  resultados.errores.push(`Fila ${nFila}: tipo_persona debe ser "natural" o "juridica" (recibido: "${fila.tipo_persona}")`)
  continue
}
const tipoPersona = tipoPersonaRaw === 'natural' ? 'Natural' : 'Jurídica'
        // Resolver departamento y municipio
        const dep = departamentos?.find(d => d.nombre.toLowerCase() === fila.departamento?.toLowerCase().trim())
        const mun = municipios?.find(m =>
          m.nombre.toLowerCase() === fila.municipio?.toLowerCase().trim() &&
          (!dep || m.departamento_id === dep.id)
        )

        // Verificar documento duplicado
        const { data: existente } = await supabaseAdmin
          .from('clientes').select('id').eq('nit_cc', fila.nit_cc.trim()).maybeSingle()
        if (existente) {
          resultados.errores.push(`Fila ${nFila}: documento "${fila.nit_cc}" ya existe`)
          continue
        }

        const { error } = await supabaseAdmin.from('clientes').insert({
          tipo_persona:        tipoPersona,
          nombre:              fila.nombre.trim(),
          nit_cc:              fila.nit_cc.trim(),
          digito_verificacion: limpiar(fila.digito_verificacion),
          departamento_id:     dep?.id || null,
          municipio_id:        mun?.id || null,
          direccion:           limpiar(fila.direccion),
          telefono:            limpiar(fila.telefono),
          email:               limpiar(fila.email),
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
      total:    filasFinales.length,
      exitosos: resultados.exitosos,
      errores:  resultados.errores,
    })

  } catch (error) {
    console.error('Error en cargue masivo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}