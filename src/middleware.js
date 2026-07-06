import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

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

  // Todo lo demás (landing pública "/", assets, API) pasa sin restricción
  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
