'use client'
import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  Users, Award, Truck, MapPin, ChevronRight, ChevronDown
} from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* ── 1. HEADER REUTILIZABLE ── */}
      <Header />

      {/* ── 2. HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#EAF2FF] via-[#F3F7FF] to-[#DCE9FE] py-16 md:py-20">
        <div className="absolute inset-0 pointer-events-none opacity-30 select-none">
          <div className="absolute top-10 right-1/3 text-blue-300 text-6xl font-light">+</div>
          <div className="absolute top-1/4 right-12 text-blue-200 text-8xl font-light">+</div>
          <div className="absolute bottom-12 right-1/4 text-blue-300 text-5xl font-light">+</div>
          <div className="absolute top-12 left-12 text-blue-200 text-4xl font-light">+</div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col items-start">
            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-black text-[#0D2247] leading-[1.12] mb-5 tracking-tight">
              Respira con tranquilidad gracias a nuestros equipos de oxígeno certificados.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mb-8">
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

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative max-w-[380px] sm:max-w-[460px] lg:max-w-[500px] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/ingemedic-concentrador-oxigeno.png"
                alt="Concentrador de oxígeno certificado"
                className="w-full h-auto object-contain filter drop-shadow-[0_20px_35px_rgba(11,38,86,0.25)] hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. STATS BAR ── */}
      <section className="bg-[#0B2656] text-white py-6 border-t border-blue-900/50 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/20">
          <div className="flex items-center justify-center gap-4 px-4 py-1">
            <Users size={30} className="text-white opacity-95 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black tracking-tight leading-none text-white">+ 20.000</span>
              <span className="text-xs font-medium text-blue-100/90 mt-1">Pacientes atendidos</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 px-4 py-1">
            <Award size={30} className="text-white opacity-95 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black tracking-tight leading-none text-white">+ 13</span>
              <span className="text-xs font-medium text-blue-100/90 mt-1">Años de experiencia</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 px-4 py-1">
            <Truck size={30} className="text-white opacity-95 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-2xl lg:text-3xl font-black tracking-tight leading-none text-white">+ 10.000</span>
              <span className="text-xs font-medium text-blue-100/90 mt-1">Entregas realizadas</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 px-4 py-1">
            <MapPin size={30} className="text-white opacity-95 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm lg:text-base font-bold text-white leading-snug">Cobertura en todo el Cesar</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. CERTIFICACIÓN INVIMA (COMPACTA) ── */}
      <section className="relative py-16 overflow-hidden bg-slate-950 text-white">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: 'url(/images/ingemedic-planta-oxigeno.jpg)' }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 text-left">
            <div className="inline-block px-4 py-1 rounded-full border border-white/40 bg-white/10 text-xs font-semibold uppercase tracking-wider text-white mb-3">
              CALIDAD Y CONFIANZA CERTIFICADA
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2">
              Estamos certificados por <span className="text-[#00B0FF]">INVIMA</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mb-6">
              Para la creación y distribución de oxígeno medicinal bajo las Buenas Prácticas de Manufactura sanitarias en Colombia.
            </p>
            <Link
              href="/quienes-somos"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md"
            >
              Conoce nuestra planta e historia <ChevronRight size={15} />
            </Link>
          </div>

          <div className="lg:col-span-4 flex justify-center">
            <div className="bg-white p-3 rounded-2xl shadow-xl max-w-[280px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/ingemedic-certificado-invima.jpg"
                alt="Certificado INVIMA"
                className="w-full h-auto rounded-xl object-contain"
              />
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