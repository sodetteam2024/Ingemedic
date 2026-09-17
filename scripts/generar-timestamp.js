const fs = require('fs')
const path = require('path')

const contenido = `// Generado automáticamente en cada build — no editar a mano
export const ULTIMA_ACTUALIZACION = "${new Date().toISOString()}"
`
fs.writeFileSync(path.join(__dirname, '../src/lib/ultima-actualizacion.js'), contenido)
console.log('Timestamp de build generado:', new Date().toISOString())
