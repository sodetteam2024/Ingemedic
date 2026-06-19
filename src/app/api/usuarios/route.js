import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Cliente admin con service_role — solo en el servidor
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request) {
  try {
    const { nombre, email, username, password, rol_id } = await request.json()

    if (!nombre || !email || !username || !password || !rol_id) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Insertar en tabla usuarios con el mismo ID
    const { data: usuario, error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id:       authData.user.id,
        nombre,
        email,
        username,
        rol_id,
        activo:   true,
      })
      .select('*, rol:roles(id, nombre)')
      .single()

    if (dbError) {
      // Si falla la inserción, eliminar el usuario de Auth para no dejar inconsistencia
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ usuario })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { id, nombre, email, username, rol_id, password } = await request.json()

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    // Actualizar en Auth si cambió email o password
    if (email || password) {
      const authUpdate = {}
      if (email)    authUpdate.email    = email
      if (password) authUpdate.password = password

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdate)
      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Actualizar en tabla usuarios
    const { data: usuario, error: dbError } = await supabaseAdmin
      .from('usuarios')
      .update({ nombre, email, username, rol_id })
      .eq('id', id)
      .select('*, rol:roles(id, nombre)')
      .single()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 })

    return NextResponse.json({ usuario })

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}