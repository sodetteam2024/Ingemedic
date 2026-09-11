// Supabase corta silenciosamente en 1000 filas si no se pagina explícitamente
// (sin error, el resultado simplemente llega incompleto). Este helper trae TODOS
// los equipos en lotes de 1000 usando .range() hasta que un lote vuelve incompleto.
const TAMANO_LOTE = 1000

export async function traerTodosLosEquipos(supabase, buildQuery) {
  let todos = []
  let desde = 0
  while (true) {
    const { data, error } = await buildQuery(supabase.from('equipos'))
      .range(desde, desde + TAMANO_LOTE - 1)
    if (error) throw error
    todos = todos.concat(data || [])
    if (!data || data.length < TAMANO_LOTE) break
    desde += TAMANO_LOTE
  }
  return todos
}
