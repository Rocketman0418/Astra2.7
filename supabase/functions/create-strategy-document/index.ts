import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { folderId, strategyData } = await req.json();
    if (!folderId || !strategyData) {
      return new Response(JSON.stringify({ error: "Folder ID and strategy data are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const teamId = user.user_metadata?.team_id;
    if (!teamId) {
      return new Response(JSON.stringify({ error: "No team ID found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get team name
    const { data: team, error: teamError } = await supabaseClient
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .maybeSingle();

    const teamName = team?.name || "Team";

    // Get Google Drive access token
    const { data: connection, error: connError } = await supabaseClient
      .from("user_drive_connections")
      .select("access_token")
      .eq("team_id", teamId)
      .eq("is_active", true)
      .maybeSingle();

    if (connError || !connection?.access_token) {
      return new Response(JSON.stringify({ error: "No active Google Drive connection" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build document content
    let content = `# ${teamName} Mission and Strategy\n\n`;
    content += `*Created: ${new Date().toLocaleDateString()}*\n\n`;
    content += "---\n\n";

    if (strategyData.mission) {
      content += "## Mission\n\n";
      content += `${strategyData.mission}\n\n`;
    }

    if (strategyData.coreValues) {
      content += "## Core Values\n\n";
      content += `${strategyData.coreValues}\n\n`;
    }

    if (strategyData.oneYearGoals) {
      content += "## One-Year Goals\n\n";
      content += `${strategyData.oneYearGoals}\n\n`;
    }

    if (strategyData.threeYearGoals) {
      content += "## Three-Year Goals\n\n";
      content += `${strategyData.threeYearGoals}\n\n`;
    }

    if (strategyData.problems) {
      content += "## Problems We're Solving\n\n";
      content += `${strategyData.problems}\n\n`;
    }

    if (strategyData.products) {
      content += "## Our Products\n\n";
      content += `${strategyData.products}\n\n`;
    }

    if (strategyData.uniqueness) {
      content += "## What Makes Us Different\n\n";
      content += `${strategyData.uniqueness}\n\n`;
    }

    if (strategyData.marketing) {
      content += "## Marketing Strategy\n\n";
      content += `${strategyData.marketing}\n\n`;
    }

    // Create Google Doc
    const createResponse = await fetch(
      "https://www.googleapis.com/drive/v3/files",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${teamName} Mission and Strategy`,
          mimeType: "application/vnd.google-apps.document",
          parents: [folderId],
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Google Drive API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to create document" }), {
        status: createResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const doc = await createResponse.json();

    // Add content to the document using Google Docs API
    const updateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${doc.id}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("Google Docs API error:", errorText);
      // Document was created but content failed - still return success
    }

    return new Response(JSON.stringify({ document: doc }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in create-strategy-document:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
