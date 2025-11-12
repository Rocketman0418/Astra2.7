import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InviteRequest {
  email: string;
  inviteCode: string;
  teamName: string;
  role: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let userId: string;
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      console.error("Failed to parse JWT:", e);
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: `Unauthorized: ${authError?.message || 'User not found'}` }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, inviteCode, teamName, role }: InviteRequest = await req.json();

    if (!email || !inviteCode || !teamName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inviterName = user.user_metadata?.full_name || user.email;
    const appUrl = 'https://airocket.app';

    const emailSubject = `Join ${teamName} on AI Rocket`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background: #f3f4f6;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #84cc16 50%, #3b82f6 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              color: #4b5563;
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .invite-box {
              background: #f9fafb;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 24px;
              margin: 30px 0;
              text-align: center;
            }
            .invite-label {
              font-size: 12px;
              text-transform: uppercase;
              color: #6b7280;
              font-weight: 600;
              letter-spacing: 1px;
              margin-bottom: 12px;
            }
            .invite-code {
              font-size: 32px;
              font-weight: 700;
              color: #059669;
              font-family: 'Courier New', monospace;
              letter-spacing: 3px;
              margin-bottom: 8px;
            }
            .email-display {
              font-size: 14px;
              color: #6b7280;
              margin-top: 12px;
            }
            .email-value {
              font-weight: 600;
              color: #111827;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #f97316 0%, #84cc16 50%, #3b82f6 100%);
              color: white;
              padding: 20px 60px;
              border-radius: 12px;
              text-decoration: none;
              font-weight: 700;
              font-size: 20px;
              margin: 20px 0;
              transition: transform 0.2s;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            .cta-container {
              background: #f9fafb;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 30px;
              margin: 30px 0;
              text-align: center;
            }
            .steps {
              background: #eff6ff;
              border-left: 4px solid #3b82f6;
              padding: 20px;
              margin: 30px 0;
              border-radius: 4px;
            }
            .steps-title {
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 12px;
              font-size: 14px;
            }
            .steps ol {
              margin: 0;
              padding-left: 20px;
              color: #1e40af;
            }
            .steps li {
              margin-bottom: 8px;
              font-size: 14px;
            }
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              font-size: 13px;
              color: #6b7280;
            }
            .footer a {
              color: #3b82f6;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Welcome to AI Rocket + Astra Intelligence</h1>
            </div>
            <div class="content">
              <div class="greeting">
                Hi there!
              </div>
              <div class="message">
                <strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> on AI Rocket + Astra Intelligence,
                your team's AI-powered platform for insights and collaboration.
              </div>

              <div class="invite-box">
                <div class="invite-label">Your Invite Code</div>
                <div class="invite-code">${inviteCode}</div>
                <div class="email-display">
                  Use with email: <span class="email-value">${email}</span>
                </div>
              </div>

              <div class="cta-container">
                <a href="${appUrl}" class="cta-button">
                  Create Your Account
                </a>
              </div>

              <div class="steps">
                <div class="steps-title">Getting Started:</div>
                <ol>
                  <li>Click the button above to visit AI Rocket</li>
                  <li>Select "Sign Up" and enter your email: <strong>${email}</strong></li>
                  <li>Create a password for your account</li>
                  <li>Enter your invite code: <strong>${inviteCode}</strong></li>
                  <li>Start collaborating with your team!</li>
                </ol>
              </div>

              <div class="message">
                You'll be joining as a <strong>${role}</strong> and will have access to your team's conversations,
                documents, and AI-powered insights.
              </div>
            </div>
            <div class="footer">
              <p>
                This invitation was sent by ${inviterName} from ${teamName}.<br>
                If you have any questions, please contact your team administrator.
              </p>
              <p style="margin-top: 20px;">
                <a href="${appUrl}">AI Rocket + Astra</a> - AI Connected to ALL Your Data
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AI Rocket Invite <invite@rockethub.ai>",
        to: email,
        reply_to: user.email,
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", resendResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to send email",
          details: errorText,
          status: resendResponse.status
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendResponse.json();
    console.log("Invite email sent successfully:", resendData);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invite email sent successfully to ${email}`,
        emailId: resendData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-invite-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
