import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Paleta Ingemedic
const ROJO    = 'D81B43'
const CELESTE = '25A9E0'
const GRIS    = 'F1F5F9'
const TEXTO   = '1E293B'
const BLANCO  = 'FFFFFF'

function estiloHeader(ws, fila, nCols) {
  for (let c = 1; c <= nCols; c++) {
    const cell = ws.getCell(fila, c)
    cell.font      = { bold: true, color: { argb: BLANCO }, name: 'Arial', size: 10 }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROJO } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border    = { bottom: { style: 'medium', color: { argb: ROJO } } }
  }
  ws.getRow(fila).height = 22
}

function estiloFila(ws, fila, nCols, par) {
  for (let c = 1; c <= nCols; c++) {
    const cell = ws.getCell(fila, c)
    cell.font      = { name: 'Arial', size: 10, color: { argb: TEXTO } }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: par ? 'F8FAFC' : BLANCO } }
    cell.alignment = { vertical: 'middle' }
    cell.border    = { bottom: { style: 'thin', color: { argb: 'E2E8F0' } } }
  }
  ws.getRow(fila).height = 18
}

function agregarTitulo(ws, titulo, nCols) {
  ws.mergeCells(1, 1, 1, nCols)
  const cell = ws.getCell(1, 1)
  cell.value     = titulo
  cell.font      = { bold: true, color: { argb: ROJO }, name: 'Arial', size: 13 }
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7' } }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  // Subtítulo con fecha
  ws.mergeCells(2, 1, 2, nCols)
  const sub = ws.getCell(2, 1)
  sub.value     = `Generado: ${new Date().toLocaleString('es-CO')}`
  sub.font      = { italic: true, color: { argb: '94A3B8' }, name: 'Arial', size: 9 }
  sub.alignment = { horizontal: 'right', vertical: 'middle' }
  ws.getRow(2).height = 16
}

export async function POST(request) {
  try {
    const { nivel, categoria_id, tipo_id } = await request.json()

    const wb = new ExcelJS.Workbook()
    wb.creator  = 'Ingemedic de Colombia S.A.S.'
    wb.created  = new Date()
    wb.modified = new Date()

    if (nivel === 'categorias') {
      // ── Hoja 1: resumen por categoría ──────────────────
      const { data: cats }   = await supabase.from('categorias_equipo').select('*').eq('activo', true).order('nombre')
      const { data: tipos }  = await supabase.from('tipos_equipo').select('id, categoria_id, nombre, atributos').eq('activo', true)
      const { data: equipos } = await supabase.from('equipos').select('*, tipo_equipo:tipos_equipo(categoria_id), estado:estados_equipo(nombre)')

      const ws = wb.addWorksheet('Inventario por categoría')
      const headers = ['Categoría', 'Descripción', 'Tipos', 'Total unidades', 'Disponibles', 'En préstamo', 'En mantenimiento']
      const nCols = headers.length

      ws.columns = [
        { key: 'cat',   width: 28 },
        { key: 'desc',  width: 30 },
        { key: 'tipos', width: 10 },
        { key: 'total', width: 16 },
        { key: 'disp',  width: 14 },
        { key: 'prest', width: 14 },
        { key: 'mant',  width: 18 },
      ]

      agregarTitulo(ws, 'Inventario General — Ingemedic de Colombia S.A.S.', nCols)
      ws.addRow(headers)
      estiloHeader(ws, 3, nCols)

      cats.forEach((cat, i) => {
        const tiposCat   = tipos.filter(t => t.categoria_id === cat.id)
        const equiposCat = equipos.filter(e => tiposCat.some(t => t.id === e.tipo_equipo_id))
        ws.addRow([
          cat.nombre,
          cat.descripcion || '',
          tiposCat.length,
          equiposCat.length,
          equiposCat.filter(e => e.estado?.nombre === 'Disponible').length,
          equiposCat.filter(e => e.estado?.nombre === 'En préstamo').length,
          equiposCat.filter(e => e.estado?.nombre === 'En mantenimiento').length,
        ])
        estiloFila(ws, i + 4, nCols, i % 2 === 1)
      })

      // Totales
      const totRow = ws.addRow([
        'TOTAL', '',
        tipos.length,
        equipos.length,
        equipos.filter(e => e.estado?.nombre === 'Disponible').length,
        equipos.filter(e => e.estado?.nombre === 'En préstamo').length,
        equipos.filter(e => e.estado?.nombre === 'En mantenimiento').length,
      ])
      totRow.eachCell(cell => {
        cell.font = { bold: true, name: 'Arial', size: 10, color: { argb: BLANCO } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CELESTE } }
      })
      ws.getRow(cats.length + 4).height = 20
    }

    else if (nivel === 'tipos' && categoria_id) {
      // ── Hoja 1: tipos de la categoría ──────────────────
      const { data: cat }    = await supabase.from('categorias_equipo').select('*').eq('id', categoria_id).single()
      const { data: tipos }  = await supabase.from('tipos_equipo').select('*').eq('categoria_id', categoria_id).eq('activo', true).order('nombre')
      const { data: equipos } = await supabase.from('equipos').select('*, estado:estados_equipo(nombre)')

      const camposTipo = cat?.atributos_extra?.campos_tipo || []
      const ws = wb.addWorksheet(cat?.nombre?.slice(0, 31) || 'Tipos')

      const headers = ['Tipo', 'Total', 'Disponibles', 'En préstamo', 'En mantenimiento', ...camposTipo.map(c => c.nombre)]
      const nCols = headers.length

      ws.columns = [
        { key: 'nombre', width: 30 },
        { key: 'total',  width: 10 },
        { key: 'disp',   width: 13 },
        { key: 'prest',  width: 14 },
        { key: 'mant',   width: 18 },
        ...camposTipo.map(() => ({ width: 20 })),
      ]

      agregarTitulo(ws, `${cat?.nombre || 'Categoría'} — Tipos de equipo`, nCols)
      ws.addRow(headers)
      estiloHeader(ws, 3, nCols)

      tipos.forEach((tipo, i) => {
        const eqs = equipos.filter(e => e.tipo_equipo_id === tipo.id)
        ws.addRow([
          tipo.atributos?.nombre || tipo.nombre || '',
          eqs.length,
          eqs.filter(e => e.estado?.nombre === 'Disponible').length,
          eqs.filter(e => e.estado?.nombre === 'En préstamo').length,
          eqs.filter(e => e.estado?.nombre === 'En mantenimiento').length,
          ...camposTipo.map(c => tipo.atributos?.[c.clave] || ''),
        ])
        estiloFila(ws, i + 4, nCols, i % 2 === 1)
      })
    }

    else if (nivel === 'unidades' && tipo_id) {
      // ── Hoja 1: unidades del tipo ──────────────────────
      const { data: tipo }   = await supabase.from('tipos_equipo')
        .select('*, categoria:categorias_equipo(nombre, atributos_extra)').eq('id', tipo_id).single()
      const { data: equipos } = await supabase.from('equipos')
        .select('*, estado:estados_equipo(nombre)').eq('tipo_equipo_id', tipo_id).order('fecha_creacion', { ascending: false })

      const camposUnidad = tipo?.categoria?.atributos_extra?.campos_unidad || []
      const camposTipo   = tipo?.categoria?.atributos_extra?.campos_tipo   || []
      const nombreTipo   = tipo?.atributos?.nombre || tipo?.nombre || 'Tipo'

      const ws = wb.addWorksheet(nombreTipo.slice(0, 31))
      const headers = ['Estado', ...camposUnidad.map(c => c.nombre), 'Fecha registro']
      const nCols = headers.length

      ws.columns = [
        { key: 'estado', width: 18 },
        ...camposUnidad.map(() => ({ width: 20 })),
        { key: 'fecha', width: 18 },
      ]

      // Info del tipo arriba
      agregarTitulo(ws, `${nombreTipo} — Unidades`, nCols)

      // Bloque info tipo
      let filaActual = 3
      if (camposTipo.length > 0 && tipo?.atributos) {
        ws.mergeCells(filaActual, 1, filaActual, nCols)
        const labelCell = ws.getCell(filaActual, 1)
        labelCell.value     = 'COLUMNAS DEL TIPO'
        labelCell.font      = { bold: true, color: { argb: CELESTE }, name: 'Arial', size: 9 }
        labelCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F9FF' } }
        labelCell.alignment = { horizontal: 'left', vertical: 'middle' }
        ws.getRow(filaActual).height = 16
        filaActual++

        // Una fila con los campos del tipo
        const tipoRow = ws.addRow(camposTipo.map(c => `${c.nombre}: ${tipo.atributos?.[c.clave] || '—'}`))
        tipoRow.eachCell(cell => {
          cell.font      = { italic: true, color: { argb: '475569' }, name: 'Arial', size: 9 }
          cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F9FF' } }
          cell.alignment = { vertical: 'middle' }
        })
        ws.getRow(filaActual).height = 16
        filaActual++

        // Separador
        ws.mergeCells(filaActual, 1, filaActual, nCols)
        ws.getRow(filaActual).height = 6
        filaActual++
      }

      // Headers unidades
      ws.addRow(headers)
      estiloHeader(ws, filaActual, nCols)
      filaActual++

      equipos.forEach((eq, i) => {
        const fecha = eq.fecha_creacion
          ? new Date(eq.fecha_creacion).toLocaleDateString('es-CO')
          : ''
        ws.addRow([
          eq.estado?.nombre || '',
          ...camposUnidad.map(c => {
            const val = eq.atributos?.[c.clave] || eq[c.clave] || ''
            if (c.tipo === 'numero' && !isNaN(val) && val !== '') return Number(val)
            return val
          }),
          fecha,
        ])
        estiloFila(ws, filaActual + i, nCols, i % 2 === 1)

        // Color en celda de estado
        const estadoCell = ws.getCell(filaActual + i, 1)
        const estadoNombre = eq.estado?.nombre || ''
        if (estadoNombre === 'Disponible')       estadoCell.font = { ...estadoCell.font, color: { argb: '0F7B55' }, bold: true }
        if (estadoNombre === 'En préstamo')      estadoCell.font = { ...estadoCell.font, color: { argb: '0E86A0' }, bold: true }
        if (estadoNombre === 'En mantenimiento') estadoCell.font = { ...estadoCell.font, color: { argb: 'B45309' }, bold: true }
        if (estadoNombre === 'Baja')             estadoCell.font = { ...estadoCell.font, color: { argb: '64748B' }, bold: true }
      })

      // Resumen al final
      const resumenFila = filaActual + equipos.length + 1
      ws.getCell(resumenFila, 1).value = `Total: ${equipos.length} unidades`
      ws.getCell(resumenFila, 1).font  = { bold: true, color: { argb: ROJO }, name: 'Arial', size: 10 }
    }

    // Generar buffer
    const buffer = await wb.xlsx.writeBuffer()
    const fecha  = new Date().toISOString().slice(0, 10)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="inventario_${nivel}_${fecha}.xlsx"`,
      }
    })

  } catch (error) {
    console.error('Error exportando:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}