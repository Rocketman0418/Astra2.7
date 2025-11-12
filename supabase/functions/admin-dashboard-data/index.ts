import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create client with user's token to verify identity
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is the super admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (user.email !== 'clay@rockethub.ai') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Super admin access only' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Now use service role to bypass RLS and get all data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all data in parallel
    const [usersRes, authUsersRes, teamsRes, documentsRes, chatsRes, reportsRes, gmailRes, driveRes, feedbackRes] = await Promise.all([
      supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.auth.admin.listUsers(),
      supabaseAdmin.from('teams').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('documents').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('astra_chats').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('astra_reports').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('gmail_auth').select('*'),
      supabaseAdmin.from('user_drive_connections').select('*'),
      supabaseAdmin.from('user_feedback_submissions').select('*').order('created_at', { ascending: false })
    ]);

    // Map auth users to add email and last_sign_in
    const authUsersMap = new Map(
      authUsersRes.data?.users?.map((au: any) => [
        au.id,
        { email: au.email, last_sign_in_at: au.last_sign_in_at }
      ]) || []
    );

    // Enrich users with auth data
    const users = (usersRes.data || []).map((u: any) => {
      const authData = authUsersMap.get(u.id);
      return {
        ...u,
        email: authData?.email || null,
        last_sign_in_at: authData?.last_sign_in_at || u.created_at
      };
    });

    const result = {
      users,
      teams: teamsRes.data || [],
      documents: documentsRes.data || [],
      chats: (chatsRes.data || []).map((c: any) => ({
        ...c,
        mode: c.mode || 'private'
      })),
      reports: reportsRes.data || [],
      gmail_connections: gmailRes.data || [],
      drive_connections: driveRes.data || [],
      feedback: feedbackRes.data || []
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});