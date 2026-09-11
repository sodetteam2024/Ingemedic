import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Rutas a las que un usuario con rol "Repartidor" tiene acceso — cualquier otra
// ruta bajo /admin/* lo redirige de vuelta a Entregas.
const RUTAS_REPARTIDOR = ['/admin/entregas', '/admin/repartidor-preferencias']

export async function middleware(request) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const esRutaAdmin = pathname.startsWith('/admin')
  const esLogin     = pathname === '/admin/login'

  // Sin sesión, intentando entrar a /admin/* que no sea el login → redirigir al login
  if (esRutaAdmin && !esLogin && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Con sesión, intentando ver el login → directo al dashboard
  if (esLogin && user) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Rol "Repartidor" — solo puede ver Entregas y sus propias preferencias;
  // cualquier otra ruta de /admin/* lo devuelve a Entregas.
  if (esRutaAdmin && !esLogin && user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('roles (nombre)')
      .eq('email', user.email)
      .single()

    const esRepartidor  = usuario?.roles?.nombre === 'Repartidor'
    const rutaPermitida = RUTAS_REPARTIDOR.some(r => pathname.startsWith(r))
    if (esRepartidor && !rutaPermitida) {
      return NextResponse.redirect(new URL('/admin/entregas', request.url))
    }
  }

  // Todo lo demás (landing pública "/", assets, API) pasa sin restricción
  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
