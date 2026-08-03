'use client'
import Link from 'next/link'
import { MapPin, Phone, Mail, Clock, ChevronRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-14 text-white border-t bg-[#071C40] border-blue-900/60">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14 pb-12 border-b border-white/15 items-start">
          {/* Columna 1: Identidad Corporativa */}
          <div className="flex flex-col items-start gap-3.5">
            <span className="text-base font-extrabold text-white tracking-wide uppercase">
              INGEMEDIC DE COLOMBIA S.A.S.
            </span>
            <div className="w-12 h-1 rounded-full bg-blue-500" />
            <p className="text-xs text-blue-100/80 leading-relaxed max-w-sm">
              Producción y suministro de oxígeno medicinal y equipos
              biomédicos para hospitalización domiciliaria en la región del
              Cesar.
            </p>
          </div>

          {/* Columna 2: Navegación Rápida */}
          <div className="flex flex-col items-start md:items-center">
            <div className="flex flex-col items-start gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
                Navegación
              </span>
              <div className="flex flex-col gap-2.5 text-xs text-blue-100/80 font-medium">
                <Link
                  href="/portafolio"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight size={13} className="text-blue-400" />
                  <span>Portafolio</span>
                </Link>
                <Link
                  href="/quienes-somos"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight size={13} className="text-blue-400" />
                  <span>Quiénes somos</span>
                </Link>
                <Link
                  href="/contacto"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight size={13} className="text-blue-400" />
                  <span>Contáctenos</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Columna 3: Contacto & Atención 24h */}
          <div className="flex flex-col items-start gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
              Contacto & Ubicación
            </span>
            <div className="flex flex-col gap-2.5 text-xs text-blue-100/80 mb-2">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Calle 14C # 20-14 Barrio la Popa, Valledupar - César</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-blue-400 flex-shrink-0" />
                <span>310 3636481 · 310 3861480</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-blue-400 flex-shrink-0" />
                <span>ingemedicsas@hotmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Centrado */}
        <div className="pt-8 flex items-center justify-center text-center">
          <p className="text-xs font-medium text-slate-400">
            © {new Date().getFullYear()} Ingemedic de Colombia S.A.S. · Todos
            los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  )
}
