import { IconoEquipo } from './IconosEquipo'

function nombreTipo(tipo) {
  return tipo?.nombre || '—'
}

// Cómo se ve un tipo de equipo: su propia imagen, su propio icono,
// el icono heredado de su categoría, o un placeholder con su inicial.
// Único lugar con esta lógica — se usa en Inventario y en el mini-navegador
// de equipos del wizard de Órdenes, para no divergir entre ambos.
export function IconoTipo({ tipo, categorias, size = 48 }) {
  if (tipo?.imagen_url && !tipo.imagen_url.startsWith('icono:')) {
    return <img src={tipo.imagen_url} alt={nombreTipo(tipo)}
      style={{ width: size, height: size, objectFit: 'contain', padding: 0 }} />
  }
  if (tipo?.imagen_url?.startsWith('icono:')) {
    return <IconoEquipo clave={tipo.imagen_url.replace('icono:', '')} size={size} color="#D81B43" />
  }
  const cat = (categorias || []).find(c => c.id === tipo?.categoria_id || c.id === tipo?.categoria?.id)
  const iconoCat = cat?.imagen_url?.startsWith('icono:') ? cat.imagen_url.replace('icono:', '') : null
  if (iconoCat) return <IconoEquipo clave={iconoCat} size={size} color="#D81B43" />
  return (
    <div style={{ width: size * 0.88, height: size * 0.88 }}
      className="rounded-2xl bg-[#D81B43]/10 flex items-center justify-center flex-shrink-0">
      <span style={{ fontSize: size * 0.44 }} className="font-black text-[#D81B43]/35 leading-none select-none">
        {nombreTipo(tipo).charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
