'use client'
import { useRef, useState } from 'react'

// Pad de firma sobre canvas — compartido entre la vista de admin (EntregasClient.js)
// y la vista simplificada de repartidor (EntregasRepartidorClient.js).
export default function FirmaPad({ onFirma, onLimpiar, fullscreen = false }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const [vacio, setVacio] = useState(true)

  function getPos(e, canvas) {
    const r  = canvas.getBoundingClientRect()
    const sx = canvas.width / r.width
    const sy = canvas.height / r.height
    const src = e.touches ? e.touches[0] : e
    return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy }
  }
  function start(e) {
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e, canvasRef.current)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
    drawing.current = true; setVacio(false)
  }
  function move(e) {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e, canvasRef.current)
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#1B3A6B'
    ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
  }
  function end() {
    drawing.current = false
    onFirma(canvasRef.current.toDataURL())
  }
  function limpiar() {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setVacio(true); onLimpiar()
  }
  return (
    <div className={fullscreen ? 'flex-1 flex flex-col min-h-0' : ''}>
      <div className={`border-2 border-dashed border-slate-300 rounded-[10px] overflow-hidden bg-[#F8FAFC] relative ${
        fullscreen ? 'flex-1 min-h-[240px]' : ''
      }`}>
        <canvas ref={canvasRef} width={fullscreen ? 900 : 480} height={fullscreen ? 500 : 160}
          className={`touch-none cursor-crosshair ${fullscreen ? 'w-full h-full' : 'w-full'}`}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        {vacio && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`text-slate-300 font-medium ${fullscreen ? 'text-[15px]' : 'text-[12px]'}`}>Firme aquí</span>
          </div>
        )}
      </div>
      <button onClick={limpiar} className="mt-2 text-[12.5px] text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
        Limpiar firma
      </button>
    </div>
  )
}
