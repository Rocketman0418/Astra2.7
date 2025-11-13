import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const superAdminEmails = ['clay@rockethub.ai', 'derek@rockethub.ai', 'marshall@rockethub.ai'];
    if (!user.email || !superAdminEmails.includes(user.email)) {
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

    const url = new URL(req.url);
    const timeFilter = url.searchParams.get('timeFilter') || '30days';

    // Calculate date range
    let dateThreshold = new Date();
    if (timeFilter === '7days') {
      dateThreshold.setDate(dateThreshold.getDate() - 7);
    } else if (timeFilter === '30days') {
      dateThreshold.setDate(dateThreshold.getDate() - 30);
    } else if (timeFilter === '90days') {
      dateThreshold.setDate(dateThreshold.getDate() - 90);
    } else {
      dateThreshold = new Date('2000-01-01');
    }

    // Fetch all data directly using service role
    const [
      usersResult,
      teamsResult,
      documentsResult,
      chatsResult,
      reportsResult,
      gmailConnectionsResult,
      driveConnectionsResult,
      feedbackResult,
      supportMessagesResult
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*'),
      supabaseAdmin.from('teams').select('*'),
      supabaseAdmin.from('documents').select('*'),
      supabaseAdmin.from('astra_chats').select('*'),
      supabaseAdmin.from('scheduled_reports').select('*'),
      supabaseAdmin.from('gmail_auth').select('*'),
      supabaseAdmin.from('user_drive_connections').select('*'),
      supabaseAdmin.from('feedback_submissions').select('*'),
      supabaseAdmin.from('feedback_submissions').select('id, user_id, created_at, support_type, support_details, attachment_urls, status, admin_response, responded_at, internal_notes, not_resolved')
    ]);

    if (usersResult.error) {
      console.error('Error fetching users:', usersResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const responseData = {
      users: usersResult.data || [],
      teams: teamsResult.data || [],
      documents: documentsResult.data || [],
      chats: chatsResult.data || [],
      reports: reportsResult.data || [],
      gmail_connections: gmailConnectionsResult.data || [],
      drive_connections: driveConnectionsResult.data || [],
      feedback: feedbackResult.data || [],
      support_messages: supportMessagesResult.data || []
    };

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in admin-dashboard-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});