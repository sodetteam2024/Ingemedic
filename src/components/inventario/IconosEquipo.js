// Galería de 20 iconos médicos/técnicos para tipos de equipo
// Uso: <IconoEquipo clave="concentrador" size={40} color="#D81B43" />

export const ICONOS_EQUIPO = [
  {
    clave: 'concentrador',
    nombre: 'Concentrador de oxígeno',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="8" width="28" height="34" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <rect x="16" y="14" width="16" height="10" rx="1.5" stroke={color} strokeWidth="1.8" fill="none"/>
        <circle cx="24" cy="34" r="3" stroke={color} strokeWidth="1.8" fill="none"/>
        <line x1="24" y1="6" x2="24" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="20" y1="6" x2="28" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="18" y1="20" x2="30" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'cilindro',
    nombre: 'Cilindro de oxígeno',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="24" cy="12" rx="9" ry="4" stroke={color} strokeWidth="2"/>
        <rect x="15" y="12" width="18" height="26" stroke={color} strokeWidth="2" fill="none"/>
        <ellipse cx="24" cy="38" rx="9" ry="4" stroke={color} strokeWidth="2"/>
        <line x1="24" y1="8" x2="24" y2="4" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="20" y1="4" x2="28" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="15" y1="20" x2="33" y2="20" stroke={color} strokeWidth="1.5" strokeDasharray="2 2"/>
      </svg>
    ),
  },
  {
    clave: 'ventilador',
    nombre: 'Ventilador mecánico',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="36" height="28" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <circle cx="20" cy="24" r="7" stroke={color} strokeWidth="1.8" fill="none"/>
        <circle cx="20" cy="24" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
        <line x1="20" y1="17" x2="20" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="20" y1="29" x2="20" y2="31" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="13" y1="24" x2="15" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="25" y1="24" x2="27" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="34" y1="16" x2="34" y2="32" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="31" y1="20" x2="37" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="31" y1="28" x2="37" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'monitor',
    nombre: 'Monitor de signos vitales',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="40" height="28" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <polyline points="8,24 13,24 16,16 19,32 22,20 25,28 28,24 40,24" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="18" y1="36" x2="30" y2="36" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="24" y1="36" x2="24" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'desfibrilador',
    nombre: 'Desfibrilador',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="12" width="36" height="26" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <polygon points="24,18 18,28 23,28 20,36 30,24 25,24" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
        <circle cx="36" cy="16" r="3" stroke={color} strokeWidth="1.5" fill="none"/>
        <line x1="34.8" y1="14.8" x2="37.2" y2="17.2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'bomba_infusion',
    nombre: 'Bomba de infusión',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="8" width="20" height="32" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <rect x="14" y="12" width="12" height="8" rx="1.5" stroke={color} strokeWidth="1.5" fill="none"/>
        <circle cx="20" cy="28" r="4" stroke={color} strokeWidth="1.8" fill="none"/>
        <line x1="30" y1="20" x2="38" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="30" y1="28" x2="38" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="38" y1="20" x2="38" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="38" y1="24" x2="42" y2="24" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'aspirador',
    nombre: 'Aspirador de secreciones',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="14" width="24" height="26" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <ellipse cx="24" cy="14" rx="8" ry="4" stroke={color} strokeWidth="1.8" fill="none"/>
        <line x1="18" y1="26" x2="30" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18" y1="30" x2="30" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="10" x2="24" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M24 6 Q30 3 34 6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'cama',
    nombre: 'Cama hospitalaria',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="22" width="40" height="10" rx="2" stroke={color} strokeWidth="2.2" fill="none"/>
        <rect x="4" y="18" width="18" height="8" rx="2" stroke={color} strokeWidth="1.8" fill="none"/>
        <circle cx="16" cy="14" r="4" stroke={color} strokeWidth="1.8" fill="none"/>
        <line x1="8" y1="32" x2="8" y2="40" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="40" y1="32" x2="40" y2="40" stroke={color} strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="4" y1="22" x2="4" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'silla_ruedas',
    nombre: 'Silla de ruedas',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="10" r="3.5" stroke={color} strokeWidth="2" fill="none"/>
        <path d="M20 14 L20 26 L30 26" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M20 20 L28 20 L30 28" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="22" cy="36" r="6" stroke={color} strokeWidth="2" fill="none"/>
        <circle cx="36" cy="36" r="6" stroke={color} strokeWidth="2" fill="none"/>
        <line x1="30" y1="28" x2="36" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'nebulizador',
    nombre: 'Nebulizador',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="18" width="20" height="22" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <path d="M24 18 Q24 10 30 8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M30 8 Q36 8 36 14 Q36 18 30 18" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <line x1="18" y1="26" x2="30" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="18" y1="30" x2="26" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="22" cy="36" r="2" stroke={color} strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  {
    clave: 'electrocardiografo',
    nombre: 'Electrocardiógrafo',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="10" width="40" height="28" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <polyline points="6,24 10,24 13,16 16,32 19,18 22,30 25,24 30,24 33,20 36,28 40,24 42,24"
          stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  },
  {
    clave: 'oximetro',
    nombre: 'Oxímetro de pulso',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="16" width="24" height="18" rx="9" stroke={color} strokeWidth="2.2" fill="none"/>
        <circle cx="24" cy="25" r="5" stroke={color} strokeWidth="1.8" fill="none"/>
        <line x1="24" y1="20" x2="24" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="24" y1="34" x2="24" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <text x="21" y="28" fontSize="6" fill={color} fontWeight="bold">%</text>
      </svg>
    ),
  },
  {
    clave: 'tensiómetro',
    nombre: 'Tensiómetro',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="20" width="20" height="16" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <path d="M18 20 Q18 12 24 12 Q30 12 30 20" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <line x1="24" y1="24" x2="24" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="21" y1="28" x2="27" y2="28" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="34" y1="24" x2="42" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
      </svg>
    ),
  },
  {
    clave: 'glucometro',
    nombre: 'Glucómetro',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="10" width="20" height="30" rx="4" stroke={color} strokeWidth="2.2" fill="none"/>
        <rect x="18" y="14" width="12" height="8" rx="1.5" stroke={color} strokeWidth="1.5" fill="none"/>
        <circle cx="24" cy="30" r="3.5" stroke={color} strokeWidth="1.8" fill="none"/>
        <line x1="22" y1="30" x2="26" y2="30" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="28" x2="24" y2="32" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="28" y1="8" x2="32" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'camilla',
    nombre: 'Camilla',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="18" width="40" height="10" rx="2" stroke={color} strokeWidth="2.2" fill="none"/>
        <rect x="4" y="14" width="12" height="8" rx="2" stroke={color} strokeWidth="1.8" fill="none"/>
        <line x1="10" y1="28" x2="6" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="38" y1="28" x2="42" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="28" x2="10" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="34" y1="28" x2="38" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'lampara_cirugia',
    nombre: 'Lámpara de cirugía',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="20" r="10" stroke={color} strokeWidth="2.2" fill="none"/>
        <circle cx="24" cy="20" r="5" stroke={color} strokeWidth="1.5" fill="none"/>
        <line x1="24" y1="10" x2="24" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="24" y1="6" x2="24" y2="4" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="20" y1="4" x2="28" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="12" x2="11" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="34" y1="12" x2="37" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="20" x2="8" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="36" y1="20" x2="40" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="30" x2="24" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="20" y1="44" x2="28" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'ultrasonido',
    nombre: 'Ultrasonido',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="24" height="32" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <rect x="12" y="12" width="16" height="12" rx="1.5" stroke={color} strokeWidth="1.5" fill="none"/>
        <line x1="12" y1="28" x2="28" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="12" y1="32" x2="22" y2="32" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M34 20 Q40 20 40 28 Q40 36 34 36" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d="M34 24 Q37 24 37 28 Q37 32 34 32" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'incubadora',
    nombre: 'Incubadora',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="16" width="40" height="24" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <path d="M4 24 Q24 12 44 24" stroke={color} strokeWidth="2" fill="none"/>
        <circle cx="24" cy="28" r="5" stroke={color} strokeWidth="1.8" fill="none"/>
        <line x1="10" y1="40" x2="10" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="38" y1="40" x2="38" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="36" y1="16" x2="36" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="33" y1="10" x2="39" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'rayos_x',
    nombre: 'Equipo de rayos X',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="6" width="20" height="14" rx="2" stroke={color} strokeWidth="2" fill="none"/>
        <line x1="24" y1="20" x2="24" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="6" y="28" width="36" height="14" rx="2" stroke={color} strokeWidth="2" fill="none"/>
        <line x1="16" y1="32" x2="32" y2="32" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
        <line x1="16" y1="36" x2="28" y2="36" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
        <line x1="10" y1="13" x2="14" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="34" y1="13" x2="38" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    clave: 'equipo_generico',
    nombre: 'Equipo genérico',
    svg: (size, color) => (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="32" height="28" rx="3" stroke={color} strokeWidth="2.2" fill="none"/>
        <circle cx="24" cy="24" r="7" stroke={color} strokeWidth="1.8" fill="none"/>
        <circle cx="24" cy="24" r="2.5" fill={color}/>
        <line x1="24" y1="10" x2="24" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="31" x2="24" y2="38" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="8" y1="24" x2="17" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="31" y1="24" x2="40" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function IconoEquipo({ clave, size = 32, color = '#D81B43' }) {
  const icono = ICONOS_EQUIPO.find(i => i.clave === clave)
  if (!icono) return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="8" y="10" width="32" height="28" rx="3" stroke={color} strokeWidth="2.2"/>
      <circle cx="24" cy="24" r="6" stroke={color} strokeWidth="1.8"/>
    </svg>
  )
  return icono.svg(size, color)
}

export function GaleriaIconos({ seleccionado, onSeleccionar, color = '#D81B43' }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ICONOS_EQUIPO.map(icono => (
        <button
          key={icono.clave}
          type="button"
          onClick={() => onSeleccionar(icono.clave)}
          title={icono.nombre}
          className={`flex flex-col items-center gap-1 p-2 rounded-[8px] border transition-all ${
            seleccionado === icono.clave
              ? 'border-[#D81B43] bg-[#D81B43]/5'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          {icono.svg(28, seleccionado === icono.clave ? '#D81B43' : '#94A3B8')}
          <span className="text-[9px] text-slate-400 text-center leading-tight truncate w-full">{icono.nombre.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  )
}