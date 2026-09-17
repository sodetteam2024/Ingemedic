'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  Users, Award, Truck, MapPin, ChevronRight, ChevronDown
} from 'lucide-react'

const IMAGENES_HERO = [
  '/images/planta-tanques-1.jpg',
  '/images/planta-tanques-2.jpg',
  '/images/ingemedic-concentrador-oxigeno.png',
]

function WhatsappIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`flex-shrink-0 ${className}`}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.461h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const FAQS = [
  {
    q: '¿Qué tipos de equipos puedo alquilar o comprar?',
    a: 'Contamos con un portafolio de equipos médicos para hospitalización domiciliaria, incluyendo concentradores de oxígeno, entre otros dispositivos de apoyo terapéutico. Nuestro equipo te asesora para elegir el más adecuado según la condición del paciente.',
  },
  {
    q: '¿Los equipos entregados están en buen estado y certificados?',
    a: 'Sí. Todos los equipos son revisados, verificados y entregados en óptimas condiciones de funcionamiento antes de cada instalación, cumpliendo con los estándares de tecnovigilancia aplicables.',
  },
  {
    q: '¿Incluye instalación en el domicilio?',
    a: 'Sí. La entrega incluye instalación en el hogar del paciente y una capacitación al paciente y sus cuidadores sobre el uso seguro y correcto del equipo.',
  },
  {
    q: '¿Qué sucede si el equipo presenta alguna falla?',
    a: 'Contamos con soporte técnico disponible. En caso de falla, nuestro equipo atiende el reporte de forma oportuna para garantizar que el paciente no interrumpa su tratamiento.',
  },
  {
    q: '¿Cuánto tiempo puedo tener el equipo en alquiler?',
    a: 'El tiempo de alquiler se adapta a las necesidades del paciente y a la indicación médica. No manejamos tiempos mínimos rígidos; nos ajustamos a cada caso con flexibilidad y transparencia.',
  },
  {
    q: '¿Cómo se garantiza la calidad del oxígeno durante el transporte?',
    a: 'El transporte se realiza bajo protocolos estrictos de manipulación y seguridad, cumpliendo con las Buenas Prácticas de Manufactura y la normativa de transporte de gases medicinales vigente en Colombia.',
  },
]

export default function LandingPage() {
  const [faqAbierta, setFaqAbierta] = useState(0)
  const [indiceImagenHero, setIndiceImagenHero] = useState(0)

  // Carrusel del panel derecho del hero — rota cada 4s con fundido cruzado (opacity).
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceImagenHero(i => (i + 1) % IMAGENES_HERO.length)
    }, 4000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* ── 1. HEADER REUTILIZABLE — transparente sobre el hero, sólido al hacer scroll ── */}
      <Header transparent />

      {/* ── 2. HERO SECTION — 2 paneles: texto fijo a la izquierda, carrusel a la derecha ── */}
      <section className="relative min-h-screen md:h-screen w-full overflow-hidden flex flex-col md:flex-row">
        {/* Panel izquierdo — texto fijo, no cambia con el carrusel ni con el scroll */}
        <div className="w-full md:w-[48%] flex-shrink-0 flex items-center px-6 sm:px-8 md:px-16 py-16 md:py-0 relative z-20 bg-[#0B2247]">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-black text-white leading-[1.12] mb-5 tracking-tight">
              Respira con tranquilidad gracias a nuestros equipos de oxígeno certificados.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl mb-8">
              Acompañamos tu recuperación y bienestar con equipos médicos de calidad, oxígeno medicinal y un servicio pensado para darte tranquilidad en cada momento.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
              <a
                href="https://wa.me/573103861480?text=Hola,%20requiero%20información%20sobre%20el%20catálogo%20de%20productos"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-[210px] h-[52px] rounded-full text-sm font-bold text-white bg-[#25D366] hover:bg-[#128C7E] flex items-center justify-center gap-2.5 shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <WhatsappIcon size={18} />
                <span>Consultar catalogo</span>
              </a>
              <Link
                href="/portafolio"
                className="w-full sm:w-[170px] h-[52px] rounded-full text-sm font-bold text-white bg-[#D81B43] hover:bg-[#B51335] flex items-center justify-center shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                Ver Portafolio
              </Link>
            </div>
          </div>
        </div>

        {/* Panel derecho — carrusel de imágenes con fundido cruzado */}
        <div className="relative w-full md:flex-1 h-[280px] sm:h-[360px] md:h-auto overflow-hidden">
          {IMAGENES_HERO.map((img, i) => (
            <div
              key={img}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                i === indiceImagenHero ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="Ingemedic — planta y equipos" className="w-full h-full object-cover" />
            </div>
          ))}

          {/* Transición suave entre paneles — difumina desde el color del panel izquierdo hacia transparente */}
          <div
            className="hidden md:block absolute inset-y-0 left-0 w-24 md:w-40 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #0B2247, transparent)' }}
          />

          {/* Badge flotante de certificación — clickeable, hace scroll suave a la sección de certificación */}
          <a
            href="#certificacion-invima"
            style={{ cursor: 'pointer' }}
            className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 z-10 bg-slate-900/85 backdrop-blur-sm rounded-xl px-6 sm:px-9 py-4 sm:py-6 flex flex-col text-white hover:bg-slate-900 transition-colors"
          >
            <span className="text-[22px] sm:text-[30px] font-extrabold leading-tight whitespace-nowrap">Certificados por INVIMA</span>
            <span className="text-[13px] sm:text-[16px] text-white/70 mt-1 whitespace-nowrap">Resolución 2026013255</span>
          </a>
        </div>
      </section>

      {/* ── 3. STATS BAR ── */}
      <section className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="flex items-center justify-center gap-4 px-4 py-1">
            <Users size={30} className="text-[#1B3A6B] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black tracking-tight leading-none text-[#1B3A6B]">+ 20.000</span>
              <span className="text-xs font-medium text-slate-500 mt-1">Pacientes atendidos</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 px-4 py-1">
            <Award size={30} className="text-[#1B3A6B] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black tracking-tight leading-none text-[#1B3A6B]">+ 13</span>
              <span className="text-xs font-medium text-slate-500 mt-1">Años de experiencia</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 px-4 py-1">
            <Truck size={30} className="text-[#1B3A6B] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black tracking-tight leading-none text-[#1B3A6B]">+ 10.000</span>
              <span className="text-xs font-medium text-slate-500 mt-1">Entregas realizadas</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 px-4 py-1">
            <MapPin size={30} className="text-[#1B3A6B] flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm lg:text-base font-bold text-[#1B3A6B] leading-snug">Cobertura en todo el Cesar</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. CERTIFICACIÓN INVIMA (COMPACTA) ── */}
      <section id="certificacion-invima" className="relative py-16 overflow-hidden bg-slate-950 text-white">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: 'url(/images/ingemedic-planta-oxigeno.jpg)' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="bg-[#0B1226] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-left">
              <div className="inline-block px-4 py-1 rounded-full border border-white/40 bg-white/10 text-xs font-semibold uppercase tracking-wider text-white mb-3">
                CALIDAD Y CONFIANZA CERTIFICADA
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2">
                Estamos certificados por <span className="text-[#2EB5D4]">INVIMA</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mb-6">
                Vigente hasta abril de 2029 · Resolución 2026013255
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/quienes-somos"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md"
                >
                  Conoce nuestra planta e historia <ChevronRight size={15} />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 w-full md:w-[320px] flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-invima-oficial.png"
                alt="INVIMA — Instituto Nacional de Vigilancia de Medicamentos y Alimentos"
                className="h-16 w-auto object-contain"
              />
              <a
                href="https://www.invima.gov.co/establecimiento/2345g-ingemedic-de-colombia-sas"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md"
              >
                Verificar certificación en INVIMA <ChevronRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FAQ SECTION ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 lg:py-20">
        <div className="text-center max-w-3xl mx-auto mb-10 flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 uppercase tracking-tight text-[#0B2656]">
            PREGUNTAS FRECUENTES
          </h2>
          <div className="w-14 h-1 rounded-full my-2 bg-blue-600" />
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl text-center">
            Resolvemos las dudas más comunes sobre nuestros servicios y equipos médicos
          </p>
        </div>

        <div className="space-y-3.5 max-w-3xl mx-auto">
          {FAQS.map((f, i) => {
            const abierta = faqAbierta === i
            return (
              <div
                key={i}
                className="rounded-2xl border overflow-hidden transition-all duration-300 shadow-sm bg-white border-slate-200/90"
              >
                <button
                  onClick={() => setFaqAbierta(abierta ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-slate-50/50"
                >
                  <span className="text-xs sm:text-sm font-bold text-[#0D2247]">{f.q}</span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${abierta ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    <ChevronDown size={14} />
                  </div>
                </button>
                {abierta && (
                  <div className="px-5 pb-4 pt-1 text-xs leading-relaxed border-t border-slate-100 text-slate-600">
                    {f.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── 6. FOOTER REUTILIZABLE ── */}
      <Footer />
    </div>
  )
}