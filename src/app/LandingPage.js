'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Menu, X, Phone, Mail, MapPin, Clock, ChevronRight, ChevronLeft,
  Target, Eye, ShieldCheck, UserCog, Users, Award, Truck, Headphones,
  MessageCircle, ChevronDown, PhoneCall, UserRound, ClipboardCheck,
  FileText, GraduationCap,
} from 'lucide-react'

const AZUL_OSCURO = '#14315C'
const AZUL_BRILLANTE = '#1D4ED8'
const ROJO = '#D81B43'

const NAV_LINKS = [
  { label: 'Nuestro Servicios', href: '#servicios' },
  { label: 'Quienes somos', href: '#quienes-somos' },
]

const PRODUCTOS = [
  {
    modelo: 'MED-JOY',
    nombre: 'Concentrador de oxígeno',
    desc: 'Concentrador de oxígeno de alto rendimiento',
    img: '/images/ingemedic-concentrador-oxigeno.png',
  },
  {
    modelo: 'O2 Type',
    nombre: 'Aspirador de secreciones',
    desc: 'Succión segura para vía aérea en casa',
    img: '/images/ingemedic-aspirador-secreciones.png',
  },
  {
    modelo: 'ResMed',
    nombre: 'CPAP / BiPAP',
    desc: 'Soporte ventilatorio no invasivo domiciliario',
    img: '/images/ingemedic-cpap.png',
  },
  {
    modelo: 'O2 Type',
    nombre: 'Concentrador portátil',
    desc: 'Oxigenoterapia domiciliaria compacta',
    img: '/images/ingemedic-conc-tiger.png',
  },
]

const PASOS = [
  { n: '01', t: 'Contacto inicial y asesoría personalizada', d: 'El cliente se comunica con nosotros a través de nuestros canales de atención disponibles. Nuestro equipo especializado escucha la necesidad del paciente, ya sea por prescripción médica o requerimiento institucional, y orienta sobre el servicio más adecuado según su condición clínica.' },
  { n: '02', t: 'Evaluación y verificación de requisitos', d: 'Se verifican los documentos necesarios para la prestación del servicio, incluyendo la orden médica o fórmula que justifica el suministro de oxígeno medicinal o el uso de equipos domiciliarios, conforme a la normativa sanitaria vigente.' },
  { n: '03', t: 'Cotización y acuerdo del servicio', d: 'Se presenta al cliente una propuesta clara con las condiciones del servicio, tarifas de alquiler o venta de equipos y frecuencia de suministro de oxígeno, asegurando transparencia y cumplimiento regulatorio en cada acuerdo.' },
  { n: '04', t: 'Instalación y entrega', d: 'Nuestro equipo técnico realiza la entrega e instalación de los equipos médicos directamente en el domicilio del paciente, verificando su correcto funcionamiento y garantizando condiciones seguras de uso.' },
  { n: '05', t: 'Capacitación al paciente y su familia', d: 'Brindamos una inducción completa al paciente y sus cuidadores sobre el manejo adecuado de los equipos, medidas de seguridad en el hogar y uso correcto del oxígeno medicinal, promoviendo una atención domiciliaria segura y efectiva.' },
  { n: '06', t: 'Seguimiento y soporte continuo', d: 'Realizamos acompañamiento periódico para verificar el estado de los equipos, la evolución del servicio y la satisfacción del paciente. Ante cualquier eventualidad, nuestro equipo técnico responde de manera oportuna, con disponibilidad las 24 horas del día.' },
]

const PASO_ICONS = [UserRound, ClipboardCheck, FileText, Truck, GraduationCap, Clock]

const FAQS = [
  { q: '¿Qué tipos de equipos puedo alquilar o comprar?', a: 'Contamos con un portafolio de equipos médicos para hospitalización domiciliaria, incluyendo concentradores de oxígeno, entre otros dispositivos de apoyo terapéutico. Nuestro equipo te asesora para elegir el más adecuado según la condición del paciente.' },
  { q: '¿Los equipos entregados están en buen estado y certificados?', a: 'Sí. Todos los equipos son revisados, verificados y entregados en óptimas condiciones de funcionamiento antes de cada instalación, cumpliendo con los estándares de tecnovigilancia aplicables.' },
  { q: '¿Incluye instalación en el domicilio?', a: 'Sí. La entrega incluye instalación en el hogar del paciente y una capacitación al paciente y sus cuidadores sobre el uso seguro y correcto del equipo.' },
  { q: '¿Qué sucede si el equipo presenta alguna falla?', a: 'Contamos con soporte técnico disponible. En caso de falla, nuestro equipo atiende el reporte de forma oportuna para garantizar que el paciente no interrumpa su tratamiento.' },
  { q: '¿Cuánto tiempo puedo tener el equipo en alquiler?', a: 'El tiempo de alquiler se adapta a las necesidades del paciente y a la indicación médica. No manejamos tiempos mínimos rígidos; nos ajustamos a cada caso con flexibilidad y transparencia.' },
  { q: '¿Cómo se garantiza la calidad del oxígeno durante el transporte?', a: 'El transporte se realiza bajo protocolos estrictos de manipulación y seguridad, cumpliendo con las Buenas Prácticas de Manufactura y la normativa de transporte de gases medicinales vigente en Colombia.' },
]

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const LOGO_URL = `${SUPABASE_URL}/storage/v1/object/public/logos/logo-ingemedic.png`

function Logo({ light = false, size = 100 }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={LOGO_URL} alt="Ingemedic de Colombia" style={{ height: size, width: 'auto' }} className="flex-shrink-0" />
  )
  if (!light) return img
  // Sobre fondo oscuro (footer): respaldo blanco por si el logo tiene texto/detalles
  // oscuros o transparencia que no se vean bien sobre azul — quita este wrapper si
  // confirmas que el logo ya funciona bien sobre fondo oscuro tal cual.
  return <div className="bg-white rounded-lg px-3 py-2 inline-flex">{img}</div>
}

export default function LandingPage() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [productoActivo, setProductoActivo] = useState(0)
  const [faqAbierta, setFaqAbierta] = useState(0)

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 min-h-[88px] flex items-center justify-between">
          <Logo />

          <nav className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Nuestro Servicios</a>
            <a href="#quienes-somos" className="text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Quienes somos</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="#contacto"
              className="px-5 py-2.5 rounded-full text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.03]"
              style={{ background: AZUL_OSCURO }}>
              Contáctanos
            </a>
            <Link href="/admin/login"
              className="px-5 py-2.5 rounded-full text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.03]"
              style={{ background: ROJO }}>
              Acceso del Personal
            </Link>
          </div>

          <button onClick={() => setMenuAbierto(v => !v)} className="md:hidden text-slate-700">
            {menuAbierto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuAbierto && (
          <div className="md:hidden border-t border-slate-100 px-4 py-4 space-y-3 bg-white">
            <a href="#servicios" onClick={() => setMenuAbierto(false)} className="block text-[14px] font-medium text-slate-600 py-1.5">Nuestro Servicios</a>
            <a href="#quienes-somos" onClick={() => setMenuAbierto(false)} className="block text-[14px] font-medium text-slate-600 py-1.5">Quienes somos</a>
            <a href="#contacto" onClick={() => setMenuAbierto(false)}
              className="block text-center px-5 py-2.5 rounded-full text-[13.5px] font-semibold text-white" style={{ background: AZUL_OSCURO }}>
              Contáctanos
            </a>
            <Link href="/admin/login"
              className="block text-center px-5 py-2.5 rounded-full text-[13.5px] font-semibold text-white" style={{ background: ROJO }}>
              Acceso del Personal
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/ingemedic-hero-bg.jpg)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 md:pt-16 pb-4 md:pb-5 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-[32px] md:text-[44px] font-extrabold text-white leading-[1.15] mb-5">
              Equipos médicos y oxígeno para tu cuidado diario
            </h1>
            <p className="text-[15px] text-blue-100/90 leading-relaxed max-w-md mb-8">
              Acompañamos tu recuperación y bienestar con equipos médicos de calidad, oxígeno medicinal
              y un servicio pensado para darte tranquilidad en cada momento.
            </p>
            <div className="flex flex-col md:flex-row gap-3">
              <a href="#contacto"
                className="text-center w-full md:w-auto px-6 py-3 rounded-full text-[14px] font-semibold text-white transition-transform hover:scale-[1.03]"
                style={{ background: AZUL_OSCURO }}>
                Contáctanos
              </a>
              <a href="#servicios"
                className="text-center w-full md:w-auto px-6 py-3 rounded-full text-[14px] font-semibold text-slate-800 bg-white transition-transform hover:scale-[1.03]">
                Nuestros servicios
              </a>
            </div>
          </div>
          <div className="relative flex justify-center md:justify-end mt-8 md:mt-0 z-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ingemedic-concentrador-oxigeno.png" alt="Concentrador de oxígeno"
              className="max-w-[280px] md:max-w-[560px] w-full h-auto drop-shadow-2xl -mb-10 md:-mb-16" />
          </div>
        </div>
        {/* Franjas — ambas blancas; la imagen (z-20) las pisa por encima para dar profundidad */}
        <div className="relative z-10 space-y-1.5 pb-2.5">
          <div className="h-[12px] bg-white shadow-sm" />
          <div className="h-[9px] bg-white/80" />
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ── */}
      <section id="quienes-somos" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start mb-14">
          <div>
            <h2 className="text-[26px] md:text-[30px] font-extrabold mb-1" style={{ color: AZUL_OSCURO }}>¿QUIÉNES SOMOS?</h2>
            <div className="w-14 h-1 rounded-full mb-5" style={{ background: AZUL_BRILLANTE }} />
            <p className="text-[13.5px] leading-relaxed text-slate-600 text-justify">
              INGEMEDIC DE COLOMBIA S.A.S. es una empresa dedicada a la producción y suministro de
              oxígeno medicinal, así como al alquiler y venta de equipos médicos para la hospitalización
              domiciliaria. Con atención disponible las 24 horas del día, garantizando continuidad y
              respaldo en cada etapa del tratamiento del paciente.
            </p>
            <p className="text-[13.5px] leading-relaxed text-slate-600 mt-3 text-justify">
              Contamos con un amplio portafolio de equipos médicos que permiten acondicionar el entorno
              del hogar para brindar al paciente una recuperación digna, segura y confortable junto a su
              familia, contribuyendo además a la reducción significativa de los costos asociados a una
              hospitalización prolongada.
            </p>
            <p className="text-[13.5px] leading-relaxed text-slate-600 mt-3 text-justify">
              En Ingemedic de Colombia S.A.S. hemos implementado un Sistema Integrado de Gestión de
              Calidad fundamentado en un enfoque por procesos, mediante el cual identificamos,
              documentamos y controlamos cada actividad que incide directamente en la calidad de nuestros
              productos y servicios, gestionando eficientemente los recursos requeridos y manteniendo un
              ciclo permanente de mejora continua orientado a la satisfacción de nuestros clientes y al
              cumplimiento de los estándares regulatorios exigidos por el INVIMA y demás entes de control
              en Colombia.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ingemedic-senor.png" alt="Paciente recibiendo oxigenoterapia domiciliaria"
              className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border p-6 text-center" style={{ borderColor: `${AZUL_BRILLANTE}33` }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${AZUL_BRILLANTE}15` }}>
              <Target size={22} style={{ color: AZUL_BRILLANTE }} />
            </div>
            <h3 className="text-[16px] font-extrabold mb-2" style={{ color: AZUL_OSCURO }}>MISIÓN</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed text-justify">
              Somos una empresa especializada en el suministro y comercialización de oxígeno medicinal
              y en el alquiler, mantenimiento y calibración de equipos Biomédicos para la hospitalización
              domiciliaria, enfocada en mejorar la calidad de vida de las personas que requieran nuestros
              productos y servicios en el departamento del Cesar; con el apoyo de colaboradores
              responsables y comprometidos con el bienestar de nuestros usuarios.
            </p>
          </div>
          <div className="rounded-2xl border p-6 text-center" style={{ borderColor: `${AZUL_BRILLANTE}33` }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${AZUL_BRILLANTE}15` }}>
              <Eye size={22} style={{ color: AZUL_BRILLANTE }} />
            </div>
            <h3 className="text-[16px] font-extrabold mb-2" style={{ color: AZUL_OSCURO }}>VISIÓN</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed text-justify">
              Para el año 2027 Ingemedic planea ser la empresa líder en el departamento del Cesar en el
              suministro y comercialización de oxígeno medicinal, alquiler, venta, mantenimiento y
              calibración de equipos Biomédicos para la hospitalización domiciliaria, con servicio las
              24 horas, garantizando a nuestros clientes una experiencia de atención confiable a través
              de nuestros productos y servicios.
            </p>
          </div>
        </div>
      </section>

      {/* ── NUESTROS PRODUCTOS ── */}
      <section id="servicios" className="py-16 md:py-20 overflow-hidden" style={{ background: `linear-gradient(115deg, ${AZUL_OSCURO} 0%, ${AZUL_BRILLANTE} 100%)` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-[24px] md:text-[28px] font-extrabold text-white mb-1">NUESTROS PRODUCTOS</h2>
            <div className="w-14 h-1 rounded-full bg-white/60 mb-2 mx-auto md:mx-0" />
            <p className="text-[13.5px] text-blue-100/80">
              Contamos con una amplia gama de equipos para diferentes necesidades, con asesoría y soporte especializados
            </p>
          </div>

          {/* Carrusel: siempre 3 tarjetas visibles con animación fluida */}
          <div className="relative px-10 md:px-16">
            {/* Botón Izquierdo */}
            <button
              onClick={() => setProductoActivo(p => (p - 1 + PRODUCTOS.length) % PRODUCTOS.length)}
              aria-label="Producto anterior"
              className="absolute left-0 md:-left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-2xl flex items-center justify-center border border-slate-200 cursor-pointer"
              style={{ transition: 'transform 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <ChevronLeft size={22} className="text-slate-700" />
            </button>

            {/* Botón Derecho */}
            <button
              onClick={() => setProductoActivo(p => (p + 1) % PRODUCTOS.length)}
              aria-label="Siguiente producto"
              className="absolute right-0 md:-right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-2xl flex items-center justify-center border border-slate-200 cursor-pointer"
              style={{ transition: 'transform 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <ChevronRight size={22} className="text-slate-700" />
            </button>

            {/* 3 slots con llave FIJA — React reutiliza el nodo y anima entre estados */}
            <div className="flex flex-row gap-4 md:gap-5 h-[230px] md:h-[240px]">
              {[0, 1, 2].map((slotIdx) => {
                const realIdx = (productoActivo + slotIdx) % PRODUCTOS.length
                const p = PRODUCTOS[realIdx]
                const activo = slotIdx === 0
                const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
                const DUR = '0.5s'

                return (
                  <div
                    key={`slot-${slotIdx}`}
                    onClick={() => !activo && setProductoActivo(realIdx)}
                    style={{
                      flex: activo ? '1.8 1 0%' : '1 1 0%',
                      opacity: activo ? 1 : 0.45,
                      transform: activo ? 'scale(1)' : 'scale(0.94)',
                      cursor: activo ? 'default' : 'pointer',
                      transition: `flex ${DUR} ${EASE}, opacity ${DUR} ${EASE}, transform ${DUR} ${EASE}`,
                      borderRadius: '1rem',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '1rem',
                      overflow: 'hidden',
                      height: '100%',
                      padding: '1rem 1.25rem',
                      border: '1px solid',
                      borderColor: activo ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                      background: activo ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)',
                      boxShadow: activo ? '0 20px 60px rgba(0,0,0,0.3)' : 'none',
                      backdropFilter: 'blur(12px)',
                      zIndex: activo ? 10 : 0,
                    }}
                  >
                    {/* Imagen */}
                    <div style={{
                      width: activo ? 96 : 64,
                      height: activo ? 96 : 64,
                      flexShrink: 0,
                      borderRadius: '0.75rem',
                      background: 'rgba(255,255,255,0.97)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transition: `width ${DUR} ${EASE}, height ${DUR} ${EASE}`,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.img} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>

                    {/* Contenido */}
                    <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem', overflow: 'hidden' }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'white',
                        padding: '0.15rem 0.6rem',
                        borderRadius: 999,
                        width: 'fit-content',
                        background: activo ? '#2563eb' : 'rgba(255,255,255,0.2)',
                        opacity: activo ? 1 : 0.75,
                        transition: `background ${DUR} ease, opacity ${DUR} ease`,
                      }}>
                        {p.modelo}
                      </span>

                      <div style={{
                        fontWeight: 800,
                        color: 'white',
                        lineHeight: 1.25,
                        fontSize: activo ? 18 : 13,
                        transition: `font-size ${DUR} ${EASE}`,
                      }}>
                        {p.nombre}
                      </div>

                      <div style={{
                        fontSize: 12,
                        color: 'rgba(219,234,254,0.85)',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        maxHeight: activo ? 40 : 0,
                        opacity: activo ? 1 : 0,
                        transition: `max-height ${DUR} ${EASE}, opacity 0.4s ease`,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {p.desc}
                      </div>

                      <div style={{
                        overflow: 'hidden',
                        maxHeight: activo ? 44 : 0,
                        opacity: activo ? 1 : 0,
                        pointerEvents: activo ? 'auto' : 'none',
                        transition: `max-height ${DUR} ${EASE}, opacity 0.35s ease`,
                      }}>
                        <button style={{
                          marginTop: '0.25rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 1rem',
                          borderRadius: 999,
                          background: 'white',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#1e293b',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          transition: 'transform 0.2s ease, background 0.2s ease',
                        }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          Ver servicio <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Indicadores de posición */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {PRODUCTOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setProductoActivo(i)}
                aria-label={`Ver producto ${i + 1}`}
                style={{
                  height: 8,
                  width: i === productoActivo ? 30 : 8,
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: i === productoActivo ? '#ffffff' : 'rgba(255,255,255,0.3)',
                  transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1), background 0.4s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </section>


      {/* ── POR QUÉ ELEGIRNOS ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <h2 className="text-[24px] md:text-[28px] font-extrabold mb-1" style={{ color: AZUL_OSCURO }}>¿POR QUÉ ELEGIRNOS?</h2>
        <div className="w-14 h-1 rounded-full mb-5" style={{ background: AZUL_BRILLANTE }} />
        <p className="text-[13.5px] text-slate-600 leading-relaxed max-w-3xl mb-10 text-justify">
          En Ingemedic de Colombia S.A.S. nos diferenciamos por ofrecer un servicio responsable,
          técnicamente respaldado y orientado al bienestar del paciente. Estas son las razones por
          las que clientes, instituciones de salud y familias colombianas confían en nosotros:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {[
            { icon: ShieldCheck, t: 'Registro sanitario vigente ante el INVIMA', d: 'Operamos bajo el marco regulatorio exigido por las autoridades sanitarias colombianas, lo que garantiza que nuestro oxígeno medicinal cumple con los más altos estándares de calidad, pureza y seguridad establecidos en la normativa legal vigente.' },
            { icon: Clock, t: 'Disponibilidad las 24 horas al día', d: 'Entendemos que las necesidades médicas no tienen horario. Por eso, contamos con un esquema de atención continua que asegura el suministro oportuno de oxígeno y el soporte técnico de equipos en cualquier momento.' },
            { icon: UserCog, t: 'Equipo técnico especializado', d: 'Contamos con personal capacitado en el manejo, mantenimiento y asesoría de equipos médicos domiciliarios, garantizando una atención segura, precisa y humanizada en cada visita.' },
          ].map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className="rounded-2xl border border-slate-200 p-6">
                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${AZUL_BRILLANTE}12` }}>
                  <Icon size={22} style={{ color: AZUL_BRILLANTE }} />
                </div>
                <h3 className="text-[14.5px] font-extrabold text-center mb-2" style={{ color: AZUL_OSCURO }}>{f.t}</h3>
                <p className="text-[12.5px] text-slate-500 text-center leading-relaxed text-justify">{f.d}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Banner de cifras — a todo el ancho de la pantalla, no contenido */}
      <div className="w-full text-white" style={{ background: AZUL_OSCURO }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-7 grid grid-cols-1 md:grid-cols-4 divide-y-2 md:divide-y-0 md:divide-x-2 divide-white/15">
          {[
            { icon: Users, n: '+20.000', l: 'Pacientes atendidos' },
            { icon: Award, n: '+13', l: 'Años de experiencia' },
            { icon: Truck, n: '+10.000', l: 'Entregas realizadas' },
            { icon: MapPin, n: null, l: 'Cobertura en toda la región del Cesar' },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="flex items-center gap-3 px-0 md:px-6 py-3 md:py-0 justify-center md:justify-start">
                <Icon size={22} className="flex-shrink-0 opacity-90" />
                <div>
                  {s.n && <div className="text-[18px] font-extrabold leading-none">{s.n}</div>}
                  <div className={`text-[11.5px] text-blue-100/80 ${s.n ? 'mt-1' : ''}`}>{s.l}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <h2 className="text-[24px] md:text-[28px] font-extrabold mb-1" style={{ color: AZUL_OSCURO }}>¿CÓMO FUNCIONA?</h2>
        <div className="w-14 h-1 rounded-full mb-5" style={{ background: AZUL_BRILLANTE }} />
        <p className="text-[13.5px] text-slate-600 leading-relaxed max-w-3xl mb-10 text-justify">
          En Ingemedic de Colombia S.A.S. acompañamos al paciente y su familia desde el primer contacto
          hasta la entrega y seguimiento del servicio. Nuestro proceso es <strong>simple, ágil y seguro</strong>.
        </p>

        {/* Línea de tiempo — misma estructura en móvil y desktop (2 columnas independientes
            en desktop, cada una con su propia línea recta; en móvil colapsa a 1 columna).
            Nada de líneas calculadas entre columnas — así nunca se desalinea. */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10">
          {[PASOS.slice(0, 3), PASOS.slice(3, 6)].map((columna, colIdx) => (
            <div key={colIdx} className="relative pl-1 mb-8 md:mb-0 last:mb-0">
              <div className="absolute left-[27px] top-1 bottom-1 w-0.5" style={{ background: `${AZUL_BRILLANTE}35` }} />
              <div className="space-y-5">
                {columna.map((p, idx) => {
                  const i = colIdx * 3 + idx
                  const Icon = PASO_ICONS[i]
                  return (
                    <div key={p.n} className="relative flex items-start gap-3.5">
                      <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-white text-[13px] font-extrabold shadow-md"
                        style={{ background: AZUL_BRILLANTE }}>
                        {p.n}
                      </div>
                      <div className="flex-1 rounded-2xl border border-slate-200 p-4">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2" style={{ background: `${AZUL_BRILLANTE}12` }}>
                          <Icon size={16} style={{ color: AZUL_BRILLANTE }} />
                        </div>
                        <h3 className="text-[13.5px] font-extrabold mb-1" style={{ color: AZUL_OSCURO }}>{p.t}</h3>
                        <p className="text-[12px] text-slate-500 leading-relaxed text-justify">{p.d}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTÁCTENOS ── */}
      <section id="contacto" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-[26px] md:text-[30px] font-extrabold mb-1" style={{ color: AZUL_OSCURO }}>Contáctenos</h2>
            <div className="w-14 h-1 rounded-full mb-5" style={{ background: AZUL_BRILLANTE }} />
            <h3 className="text-[15px] font-bold text-slate-700 mb-2">Estamos para ayudarte</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-6 text-justify">
              ¿Necesitas oxígeno medicinal, equipos médicos o asesoría especializada? Nuestro equipo está
              listo para brindarte la mejor atención y soluciones confiables para tu cuidado.
            </p>

            <div className="space-y-3 mb-6">
              {[
                { icon: Phone, label: 'Teléfono / WhatsApp', value: '3103636481 · 3103861480' },
                { icon: Mail, label: 'Correo electrónico', value: 'ingemedicsas@hotmail.com' },
                { icon: MapPin, label: 'Dirección', value: 'Calle 14C # 20-14 Barrio la Popa, Valledupar - César' },
                { icon: Clock, label: 'Horario de atención', value: 'Lunes a viernes 8am-12 pm / 2 - 6 pm · Sábado 8 am - 12pm' },
              ].map((c, i) => {
                const Icon = c.icon
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${AZUL_BRILLANTE}12` }}>
                      <Icon size={16} style={{ color: AZUL_BRILLANTE }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10.5px] text-slate-400 uppercase tracking-wide">{c.label}</div>
                      <div className="text-[13px] font-semibold" style={{ color: AZUL_OSCURO }}>{c.value}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <a href="#contacto" className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-3 md:py-2.5 rounded-full text-[13px] font-semibold text-white" style={{ background: AZUL_OSCURO }}>
                <MessageCircle size={14} /> Solicitar cotización
              </a>
              <a href="tel:3103636481" className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-3 md:py-2.5 rounded-full text-[13px] font-semibold border border-slate-300 text-slate-700">
                <PhoneCall size={14} /> Llamar ahora
              </a>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/ingemedic-imagen-mujer.png" alt="Asesora de Ingemedic"
              className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-5 py-4 text-white" style={{ background: AZUL_OSCURO }}>
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <Headphones size={16} />
              </div>
              <div>
                <div className="text-[13px] font-bold">Asesoría personalizada</div>
                <div className="text-[11.5px] text-blue-100/80">Te guiamos en la elección del equipo ideal según tus necesidades</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <h2 className="text-[24px] md:text-[28px] font-extrabold mb-1" style={{ color: AZUL_OSCURO }}>PREGUNTAS FRECUENTES</h2>
        <div className="w-14 h-1 rounded-full mb-2" style={{ background: AZUL_BRILLANTE }} />
        <p className="text-[13.5px] text-slate-500 mb-8">Resolvemos las dudas más comunes sobre nuestros servicios y equipos médicos</p>

        <div className="space-y-3 max-w-4xl">
          {FAQS.map((f, i) => {
            const abierta = faqAbierta === i
            return (
              <div key={i} className="rounded-2xl border border-slate-200 overflow-hidden">
                <button onClick={() => setFaqAbierta(abierta ? -1 : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                  <span className="text-[14px] font-bold" style={{ color: AZUL_OSCURO }}>{f.q}</span>
                  <ChevronDown size={18} className={`flex-shrink-0 text-slate-400 transition-transform ${abierta ? 'rotate-180' : ''}`} />
                </button>
                {abierta && (
                  <div className="px-5 pb-4 text-[13px] text-slate-500 leading-relaxed text-justify">{f.a}</div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="text-white py-10" style={{ background: AZUL_OSCURO }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo light size={40} />
          <p className="text-[12px] text-blue-100/60 text-center">
            © {new Date().getFullYear()} Ingemedic de Colombia S.A.S. · Todos los derechos reservados
          </p>
          <Link href="/admin/login" className="text-[12.5px] font-semibold text-white/80 hover:text-white transition-colors">
            Acceso del personal →
          </Link>
        </div>
      </footer>
    </div>
  )
}