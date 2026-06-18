'use client'
import Image from 'next/image'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Inbox } from 'lucide-react'

const ESTADO_STYLES = {
  'Disponible':        { bg: '#ECFDF5', color: '#0F7B55', dot: '#0F7B55' },
  'En préstamo':       { bg: '#E8F7FB', color: '#0E86A0', dot: '#2EB5D4' },
  'En mantenimiento':  { bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  'Con novedad':       { bg: '#FEF2F2', color: '#C0392B', dot: '#C0392B' },
  'Baja':              { bg: '#F1F5F9', color: '#64748B', dot: '#94A3B8' },
}

export default function InventarioClient({ categorias, tipos, equipos, estados }) {
  const router = useRouter()
  const [vista, setVista]       = useState('categorias') // categorias | tipos | unidades
  const [catActual, setCatActual] = useState(null)
  const [tipoActual, setTipoActual] = useState(null)
  const [search, setSearch]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  // Stats globales
  const stats = useMemo(() => ({
    total:       equipos.length,
    disponibles: equipos.filter(e => e.estado?.nombre === 'Disponible').length,
    prestamo:    equipos.filter(e => e.estado?.nombre === 'En préstamo').length,
    mant:        equipos.filter(e => e.estado?.nombre === 'En mantenimiento').length,
  }), [equipos])

  // Tipos filtrados por categoría actual
  const tiposDeCat = useMemo(() =>
    catActual ? tipos.filter(t => t.categoria_id === catActual.id) : [],
    [tipos, catActual]
  )

  // Stock por tipo
  const stockPorTipo = useMemo(() => {
    const map = {}
    equipos.forEach(e => {
      if (!e.tipo_equipo_id) return
      if (!map[e.tipo_equipo_id]) map[e.tipo_equipo_id] = { total: 0, disponibles: 0 }
      map[e.tipo_equipo_id].total++
      if (e.estado?.nombre === 'Disponible') map[e.tipo_equipo_id].disponibles++
    })
    return map
  }, [equipos])

  // Unidades filtradas por tipo actual
  const unidadesDeTipo = useMemo(() => {
    if (!tipoActual) return []
    let result = equipos.filter(e => e.tipo_equipo_id === tipoActual.id)
    if (search) result = result.filter(e =>
      [e.codigo, e.serial, e.ubicacion, e.arrendatario?.nombre]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    )
    if (filtroEstado) result = result.filter(e => e.estado?.nombre === filtroEstado)
    return result
  }, [equipos, tipoActual, search, filtroEstado])

  function irACat(cat) {
    setCatActual(cat)
    setVista('tipos')
  }

  function irATipo(tipo) {
    setTipoActual(tipo)
    setSearch('')
    setFiltroEstado('')
    setVista('unidades')
  }

  function volver() {
    if (vista === 'unidades') { setVista('tipos'); setTipoActual(null) }
    else if (vista === 'tipos') { setVista('categorias'); setCatActual(null) }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Topbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-7 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <button onClick={() => { setVista('categorias'); setCatActual(null); setTipoActual(null) }}
            className="hover:text-[#1B3A6B] transition-colors font-medium">
            Inventario
          </button>
          {catActual && <>
            <span>/</span>
            <button onClick={() => { setVista('tipos'); setTipoActual(null) }}
              className="hover:text-[#1B3A6B] transition-colors">{catActual.nombre}</button>
          </>}
          {tipoActual && <>
            <span>/</span>
            <span className="text-[#1B3A6B] font-semibold">{tipoActual.marca} {tipoActual.modelo}</span>
          </>}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {vista !== 'categorias' && (
            <button onClick={volver}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-slate-500 hover:text-[#1B3A6B] border border-slate-200 rounded-[9px] transition-all hover:border-[#2EB5D4]">
              ← Volver
            </button>
          )}
          <button
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3A6B] text-white text-[13px] font-semibold rounded-[9px] hover:bg-[#1E4D8C] transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {vista === 'unidades' ? 'Nueva unidad' : vista === 'tipos' ? 'Nuevo tipo' : 'Nueva categoría'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total equipos',   value: stats.total,       color: '#1B3A6B' },
            { label: 'Disponibles',     value: stats.disponibles, color: '#0F7B55' },
            { label: 'En préstamo',     value: stats.prestamo,    color: '#2EB5D4' },
            { label: 'Mantenimiento',   value: stats.mant,        color: '#B45309' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="text-2xl font-extrabold tabular-nums" style={{color: s.color}}>{s.value}</div>
              <div className="text-[11.5px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* VISTA CATEGORÍAS */}
        {vista === 'categorias' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categorias.map(cat => {
              const equiposCat = equipos.filter(e => e.tipo_equipo?.categoria_id === cat.id)
              const tiposCat   = tipos.filter(t => t.categoria_id === cat.id)
              return (
                <div key={cat.id} onClick={() => irACat(cat)}
                  className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:border-[#2EB5D4] hover:shadow-md transition-all group">
                  <Package className="w-9 h-9 text-[#1B3A6B] mb-3" />
                  <div className="text-[14px] font-700 text-[#1B3A6B] font-bold leading-tight mb-1">{cat.nombre}</div>
                  <div className="text-[12px] text-slate-400">{tiposCat.length} tipo{tiposCat.length !== 1 ? 's' : ''} · {equiposCat.length} unidad{equiposCat.length !== 1 ? 'es' : ''}</div>
                  <div className="mt-3 flex items-center text-[#2EB5D4] text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver tipos →
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* VISTA TIPOS */}
        {vista === 'tipos' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {tiposDeCat.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400">
                <Inbox className="w-16 h-16 mx-auto mb-3" />
                <div className="font-semibold">Sin tipos de equipo en esta categoría</div>
              </div>
            )}
            {tiposDeCat.map(tipo => {
              const stock = stockPorTipo[tipo.id] || { total: 0, disponibles: 0 }
              return (
                <div key={tipo.id} onClick={() => irATipo(tipo)}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-[#2EB5D4] hover:shadow-md transition-all group">
                  {/* Imagen */}
                  <div className="h-[110px] bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                    {tipo.imagen_url
                      ? <Image src={tipo.imagen_url} alt={`${tipo.marca} ${tipo.modelo}`} width={120} height={120}
                          className="max-h-[100px] max-w-full object-contain p-2" unoptimized />
                      : <Package className="w-14 h-14 text-slate-400" />
                    }
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[14px] font-bold text-[#1B3A6B]">{tipo.marca}</div>
                        <div className="text-[12.5px] text-slate-500">{tipo.modelo}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[20px] font-extrabold text-[#1B3A6B] tabular-nums">{stock.total}</div>
                        <div className="text-[10.5px] text-slate-400">unidades</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11.5px] text-[#0F7B55] font-semibold">{stock.disponibles} disponible{stock.disponibles !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* VISTA UNIDADES */}
        {vista === 'unidades' && (
          <div>
            {/* Filtros */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-[300px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por código, serial..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#2EB5D4] bg-white" />
              </div>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-[9px] text-[13px] outline-none focus:border-[#2EB5D4] bg-white text-slate-600">
                <option value="">Todos los estados</option>
                {estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
              </select>
              <div className="text-[12px] text-slate-400 ml-auto">{unidadesDeTipo.length} unidad{unidadesDeTipo.length !== 1 ? 'es' : ''}</div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    {['Código', 'Serial', 'Estado', 'Ubicación', 'Arrendatario', 'Fecha ingreso'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-400 bg-slate-50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unidadesDeTipo.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400">Sin unidades registradas</td></tr>
                  )}
                  {unidadesDeTipo.map(eq => {
                    const est    = eq.estado?.nombre || '—'
                    const estSty = ESTADO_STYLES[est] || {}
                    return (
                      <tr key={eq.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <span className="font-mono text-[12.5px] font-bold bg-slate-100 text-[#1B3A6B] px-2 py-0.5 rounded">{eq.codigo || '—'}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[12.5px] text-slate-500">{eq.serial || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                            style={{background: estSty.bg, color: estSty.color}}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{background: estSty.dot}} />
                            {est}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-slate-500">{eq.ubicacion || '—'}</td>
                        <td className="px-4 py-3 text-[13px] text-slate-600 font-medium">{eq.arrendatario?.nombre || '—'}</td>
                        <td className="px-4 py-3 font-mono text-[12px] text-slate-400">{eq.fecha_ingreso || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}