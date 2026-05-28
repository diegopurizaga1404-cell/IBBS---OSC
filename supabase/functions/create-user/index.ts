import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create admin client with service role key (safe: server-side only)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify calling user is admin
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    // Parse request body
    const { nombre, email, password, solicitudId, role, action, emails } = await req.json()
    const act = action || 'create'

    // list-team: accessible to any authenticated user — only returns name+email for a given email list
    if (act === 'list-team') {
      const targets: string[] = Array.isArray(emails) ? emails.map((e: string) => e.toLowerCase()) : []
      let page = 1
      const nameMap: Record<string, string> = {}
      while (true) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 })
        if (error || !data?.users?.length) break
        data.users.forEach((u: any) => {
          if (targets.includes(u.email?.toLowerCase())) {
            nameMap[u.email.toLowerCase()] = u.user_metadata?.full_name || u.user_metadata?.name || u.email.split('@')[0]
          }
        })
        if (data.users.length < 100) break
        page++
      }
      return new Response(
        JSON.stringify({ success: true, nameMap }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerRole = caller.user_metadata?.role
    if (callerRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate required fields based on action
    if (act === 'create') {
      if (!nombre || !email || !password || !solicitudId) {
        return new Response(JSON.stringify({ error: 'Missing required fields for create' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else if (act === 'list') {
      // No validation needed for listing all users
    } else if (act === 'update-role') {
      if (!email || !role) {
        return new Response(JSON.stringify({ error: 'Missing email or role for update-role' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else {
      if (!email || !solicitudId) {
        return new Response(JSON.stringify({ error: 'Missing email or solicitudId' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Helper to find user by email using listUsers pagination
    async function findUserByEmail(emailAddress: string) {
      let page = 1
      while (true) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 })
        if (error || !data || !data.users || data.users.length === 0) break
        const found = data.users.find((u: any) => u.email === emailAddress)
        if (found) return found
        if (data.users.length < 100) break
        page++
      }
      return null
    }

    // Execute the requested action
    if (act === 'list') {
      let allUsers = []
      let page = 1
      while (true) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 })
        if (error || !data || !data.users || data.users.length === 0) break
        allUsers.push(...data.users)
        if (data.users.length < 100) break
        page++
      }
      return new Response(
        JSON.stringify({ success: true, users: allUsers }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (act === 'update-role') {
      const targetUser = await findUserByEmail(email)
      if (!targetUser) {
        return new Response(JSON.stringify({ error: 'User not found in Supabase Auth' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update in Supabase Auth: set role in user_metadata
      const currentMetadata = targetUser.user_metadata || {}
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        {
          user_metadata: {
            ...currentMetadata,
            role: role
          }
        }
      )

      if (updateError) {
        return new Response(JSON.stringify({ error: `Error updating role: ${updateError.message}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User role updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (act === 'create') {
      // Create the user in Supabase Auth
      const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          full_name: nombre,
          name: nombre,
          role: role || 'editor'
        },
        email_confirm: true // Auto-confirm email, no need for verification step
      })

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Mark the request as approved in solicitudes_registro
      const { error: updateError } = await supabaseAdmin
        .from('solicitudes_registro')
        .update({
          estado: 'aprobada',
          reviewed_at: new Date().toISOString(),
          reviewed_by: caller.email
        })
        .eq('id', solicitudId)

      if (updateError) {
        console.error('Error updating solicitud:', updateError)
      }

      return new Response(
        JSON.stringify({ success: true, user: { id: data.user.id, email: data.user.email } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (act === 'delete') {
      const targetUser = await findUserByEmail(email)
      if (targetUser) {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id)
        if (deleteError) {
          return new Response(JSON.stringify({ error: `Error deleting user: ${deleteError.message}` }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      // Also delete the request from solicitudes_registro so it disappears (if it exists in DB)
      const isDbId = typeof solicitudId === 'number' || (!isNaN(Number(solicitudId)) && !String(solicitudId).startsWith('auth-'));
      if (isDbId) {
        const { error: deleteRowError } = await supabaseAdmin
          .from('solicitudes_registro')
          .delete()
          .eq('id', solicitudId)

        if (deleteRowError) {
          console.error('Error deleting row:', deleteRowError)
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User and request deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (act === 'disable') {
      const targetUser = await findUserByEmail(email)
      if (!targetUser) {
        return new Response(JSON.stringify({ error: 'User not found in Supabase Auth' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update in Supabase Auth: set ban_duration to a very long time
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { ban_duration: '876000h' }
      )

      if (banError) {
        return new Response(JSON.stringify({ error: `Error disabling user: ${banError.message}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Force sign out globally
      await supabaseAdmin.auth.admin.signOut(targetUser.id)

      // Update in solicitudes_registro: set state to 'suspendida' (if it exists in DB)
      const isDbId = typeof solicitudId === 'number' || (!isNaN(Number(solicitudId)) && !String(solicitudId).startsWith('auth-'));
      if (isDbId) {
        const { error: updateRowError } = await supabaseAdmin
          .from('solicitudes_registro')
          .update({
            estado: 'suspendida',
            reviewed_at: new Date().toISOString(),
            reviewed_by: caller.email
          })
          .eq('id', solicitudId)

        if (updateRowError) {
          console.error('Error updating row to suspendida:', updateRowError)
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User suspended successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (act === 'enable') {
      const targetUser = await findUserByEmail(email)
      if (!targetUser) {
        return new Response(JSON.stringify({ error: 'User not found in Supabase Auth' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update in Supabase Auth: remove ban
      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUser.id,
        { ban_duration: 'none' }
      )

      if (unbanError) {
        return new Response(JSON.stringify({ error: `Error enabling user: ${unbanError.message}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update in solicitudes_registro: set state back to 'aprobada' (if it exists in DB)
      const isDbId = typeof solicitudId === 'number' || (!isNaN(Number(solicitudId)) && !String(solicitudId).startsWith('auth-'));
      if (isDbId) {
        const { error: updateRowError } = await supabaseAdmin
          .from('solicitudes_registro')
          .update({
            estado: 'aprobada',
            reviewed_at: new Date().toISOString(),
            reviewed_by: caller.email
          })
          .eq('id', solicitudId)

        if (updateRowError) {
          console.error('Error updating row to aprobada:', updateRowError)
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User reactivated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
