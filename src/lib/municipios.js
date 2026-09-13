// Normaliza nombres de municipio para poder cruzar el texto libre de
// pacientes.ciudad ("VALLEDUPAR", "Valledupar", "CANDELARIA (CESAR)") contra
// el nombre oficial del municipio en el geojson del DANE (MPIO_CNMBR).
// Usado tanto en el servidor (page.js, para armar el conteo) como en el
// cliente (MapaMunicipios, para pintar cada feature) — debe dar el mismo
// resultado en ambos lados.
// Escala de color compartida entre el mapa (MapaMunicipios) y su leyenda
// (DashboardClient) — vive acá para que la leyenda no tenga que importar
// el componente del mapa completo (y con él, Leaflet) solo por esta constante.
export const COLOR_ESCALA_MUNICIPIOS = ['#E2E8F0', '#C7D2FE', '#818CF8', '#3730A3']

export function colorPorConteoMunicipio(n) {
  if (n === 0 || !n) return COLOR_ESCALA_MUNICIPIOS[0]
  if (n <= 2) return COLOR_ESCALA_MUNICIPIOS[1]
  if (n <= 10) return COLOR_ESCALA_MUNICIPIOS[2]
  return COLOR_ESCALA_MUNICIPIOS[3]
}

export function normalizarNombreMunicipio(nombre) {
  if (!nombre) return ''
  return nombre
    .toUpperCase()
    .replace(/\(.*?\)/g, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

// pacientes.ciudad es texto libre y trae casos que normalizarNombreMunicipio
// por sí sola no resuelve — nombres coloquiales/incompletos del municipio
// oficial, o corregimientos que se escriben como si fueran su propio
// municipio. Encontrados al cruzar contra los 25 municipios reales del Cesar:
// "CODAZZI" solo (11 equipos) en vez de "Agustín Codazzi", etc.
const ALIAS_MUNICIPIO_CESAR = {
  'CODAZZI': 'AGUSTIN CODAZZI',
  'COPEY': 'EL COPEY',
  'MANAURE': 'MANAURE BALCON DEL CESAR',
}

// Corregimientos conocidos que pertenecen al municipio de Valledupar pero
// aparecen en pacientes.ciudad como si fueran su propio municipio.
const CORREGIMIENTO_A_MUNICIPIO = {
  'ATANQUEZ': 'VALLEDUPAR',
  'CHEMESQUEMENA': 'VALLEDUPAR',
}

// Normalización específica para el texto libre de pacientes.ciudad — aplica
// normalizarNombreMunicipio() primero (sin cambiarla) y encima resuelve los
// alias/corregimientos conocidos, para poder cruzar contra el nombre oficial
// del geojson en más casos reales.
export function normalizarCiudadPaciente(ciudadTexto) {
  const base = normalizarNombreMunicipio(ciudadTexto).replace(/,?\s*CESAR$/, '').trim()
  return ALIAS_MUNICIPIO_CESAR[base] || CORREGIMIENTO_A_MUNICIPIO[base] || base
}
