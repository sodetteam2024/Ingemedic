import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { esSuperAdmin, moduloDeRuta, puedeVerModulo, primerModuloPermitido, MODULOS_RUTA } from '@/lib/permisos'

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
  const esSinAcceso = pathname === '/admin/sin-acceso'

  // Sin sesión, intentando entrar a /admin/* que no sea el login → redirigir al login
  if (esRutaAdmin && !esLogin && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Con sesión, intentando ver el login → directo al dashboard
  if (esLogin && user) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // ── CONTROL DE ACCESO POR ROL/MÓDULO ──────────────────────────────────
  // Reemplaza el caso hardcodeado de "Repartidor" — ahora es genérico para
  // cualquier rol, vía la tabla `permisos` (ver src/lib/permisos.js).
  // Se salta en login y en la propia página de "sin acceso" para no generar
  // un loop de redirecciones.
  if (esRutaAdmin && !esLogin && !esSinAcceso && user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol_id, roles (nombre)')
      .eq('email', user.email)
      .single()

    const rolNombre = usuario?.roles?.nombre

    // SuperAdmin es inmune a la tabla permisos — ni siquiera se consulta.
    if (usuario?.rol_id && !esSuperAdmin(rolNombre)) {
      const modulo = moduloDeRuta(pathname)
      // Rutas sin módulo mapeado (ej. la página personal de preferencias del
      // repartidor) no están sujetas a esta restricción.
      if (modulo) {
        const { data: permisosDelRol } = await supabase
          .from('permisos')
          .select('modulo, puede_ver')
          .eq('rol_id', usuario.rol_id)

        if (!puedeVerModulo(modulo, permisosDelRol)) {
          const moduloDestino = primerModuloPermitido(permisosDelRol)
          const rutaDestino   = moduloDestino ? MODULOS_RUTA.find(m => m.modulo === moduloDestino)?.ruta : null
          return NextResponse.redirect(new URL(rutaDestino || '/admin/sin-acceso', request.url))
        }
      }
    }
  }

  // Todo lo demás (landing pública "/", assets, API) pasa sin restricción
  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
