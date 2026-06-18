'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showPass, setShowPass]     = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const isEmail  = identifier.includes('@')
    let email      = identifier

    if (!isEmail) {
      const { data, error: fetchError } = await supabase
        .from('usuarios')
        .select('email')
        .eq('username', identifier)
        .single()

      if (fetchError || !data) {
        setError('Usuario no reconocido en el sistema.')
        setLoading(false)
        return
      }
      email = data.email
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Correo/usuario o contraseña incorrectos. ' + authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex h-screen">
      <div className="hidden lg:flex flex-col items-center justify-center flex-[0_0_48%] relative overflow-hidden"
        style={{background: 'linear-gradient(155deg, #1B3A6B 0%, #0F2448 100%)'}}>
        <div className="absolute w-[420px] h-[420px] rounded-full border border-[#2EB5D4]/10 -top-[100px] -left-[100px]" />
        <div className="absolute w-[280px] h-[280px] rounded-full border border-[#2EB5D4]/7 -bottom-[70px] -right-[70px]" />
        <div className="relative z-10 text-center max-w-[340px]">
          <div className="w-[140px] h-[140px] rounded-[20px] mx-auto mb-8 flex items-center justify-center overflow-hidden"
            style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)'}}>
            <img src="/logo.png" alt="Ingemedic" className="max-w-[120px] max-h-[120px] object-contain"
              onError={e => e.target.style.display='none'} />
          </div>
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#2EB5D4] mb-3">
            Plataforma operativa
          </p>
          <h1 className="text-[22px] font-bold text-white mb-2">
            Ingemedic de Colombia S.A.S.
          </h1>
          <p className="text-[14px] font-light text-white/65 leading-relaxed">
            Gestión de equipos biomédicos especializados en tiempo real
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium text-[#2EB5D4]"
            style={{background: 'rgba(46,181,212,0.1)', border: '1px solid rgba(46,181,212,0.22)'}}>
            <span className="w-[7px] h-[7px] rounded-full bg-[#2EB5D4] animate-pulse" />
            Sistema activo
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 bg-white">
        <div className="w-full max-w-[400px]">
          <h2 className="text-[28px] font-extrabold text-[#1E293B] mb-1">¡Hola de nuevo!</h2>
          <p className="text-[14px] text-slate-400 mb-8">Ingresa con tu correo o nombre de usuario.</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-[8px] bg-red-50 border border-red-200 text-[13px] text-red-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-600 mb-1.5">
                Correo o usuario
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="correo@email.com o usuario"
                  className="w-full pl-10 pr-4 py-3 border-[1.5px] border-slate-200 rounded-[10px] text-[15px] bg-slate-50 outline-none transition-all focus:border-[#2EB5D4] focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-slate-600 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border-[1.5px] border-slate-200 rounded-[10px] text-[15px] bg-slate-50 outline-none transition-all focus:border-[#2EB5D4] focus:bg-white"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-[10px] text-[15px] font-bold text-white transition-all mt-2"
              style={{background: loading ? '#94A3B8' : '#1B3A6B'}}
            >
              {loading ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-[11.5px] text-slate-300 mt-8">
            © 2024 Ingemedic de Colombia S.A.S. — Desarrollado por SODET
          </p>
        </div>
      </div>
    </div>
  )
}