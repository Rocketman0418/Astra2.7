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

    if (!folderId) {
      return new Response(JSON.stringify({ error: "Folder ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!strategyData || typeof strategyData !== 'object') {
      return new Response(JSON.stringify({ error: "Strategy data is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if at least one field is filled
    const hasContent = Object.values(strategyData).some(value =>
      typeof value === 'string' && value.trim() !== ''
    );

    if (!hasContent) {
      return new Response(JSON.stringify({ error: "Please provide at least one piece of information" }), {
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

    // Build document content with proper formatting requests
    const requests: any[] = [];
    let currentIndex = 1;

    // Helper to add text with formatting
    const addText = (text: string) => {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: text,
        },
      });
      currentIndex += text.length;
    };

    const addHeading = (text: string, level: number) => {
      const startIndex = currentIndex;
      addText(text + '\n');
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: startIndex,
            endIndex: currentIndex - 1,
          },
          paragraphStyle: {
            namedStyleType: level === 1 ? 'HEADING_1' : 'HEADING_2',
          },
          fields: 'namedStyleType',
        },
      });
    };

    // Build the document structure
    addHeading(`${teamName} Mission and Strategy`, 1);
    addText(`Created: ${new Date().toLocaleDateString()}\n\n`);

    if (strategyData.mission) {
      addHeading('Mission', 2);
      addText(`${strategyData.mission}\n\n`);
    }

    if (strategyData.coreValues) {
      addHeading('Core Values', 2);
      addText(`${strategyData.coreValues}\n\n`);
    }

    if (strategyData.oneYearGoals) {
      addHeading('One-Year Goals', 2);
      addText(`${strategyData.oneYearGoals}\n\n`);
    }

    if (strategyData.threeYearGoals) {
      addHeading('Three-Year Goals', 2);
      addText(`${strategyData.threeYearGoals}\n\n`);
    }

    if (strategyData.problems) {
      addHeading('Problems We\'re Solving', 2);
      addText(`${strategyData.problems}\n\n`);
    }

    if (strategyData.products) {
      addHeading('Our Products', 2);
      addText(`${strategyData.products}\n\n`);
    }

    if (strategyData.uniqueness) {
      addHeading('What Makes Us Different', 2);
      addText(`${strategyData.uniqueness}\n\n`);
    }

    if (strategyData.marketing) {
      addHeading('Marketing Strategy', 2);
      addText(`${strategyData.marketing}\n\n`);
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

    // Add content to the document using Google Docs API with proper formatting
    const updateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${doc.id}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("Google Docs API error:", errorText);
      console.error("Status:", updateResponse.status);
      return new Response(JSON.stringify({
        error: "Document created but failed to add content. Please check your Google Drive permissions.",
        document: doc,
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
