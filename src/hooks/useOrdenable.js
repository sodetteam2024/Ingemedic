import { useState, useMemo } from 'react'

export function useOrdenable(items, ordenInicial = null) {
  const [config, setConfig] = useState(ordenInicial ? { clave: ordenInicial, direccion: 'asc' } : null)

  const itemsOrdenados = useMemo(() => {
    if (!config) return items
    const { clave, accessor, direccion } = config
    const obtenerValor = accessor || ((item) => item[clave])
    return [...items].sort((a, b) => {
      const valorA = obtenerValor(a)
      const valorB = obtenerValor(b)
      if (valorA == null && valorB == null) return 0
      if (valorA == null) return 1
      if (valorB == null) return -1
      if (typeof valorA === 'string') {
        return direccion === 'asc' ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA)
      }
      return direccion === 'asc' ? valorA - valorB : valorB - valorA
    })
  }, [items, config])

  function solicitarOrden(clave, accessor) {
    setConfig((actual) => {
      if (actual?.clave === clave) {
        if (actual.direccion === 'asc') return { clave, accessor, direccion: 'desc' }
        return null  // tercer click: vuelve al orden original
      }
      return { clave, accessor, direccion: 'asc' }
    })
  }

  return { itemsOrdenados, config, solicitarOrden }
}
