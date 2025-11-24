import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MarketingEmailRequest {
  recipientEmails?: string[];
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { recipientEmails }: MarketingEmailRequest = await req.json();

    let recipients: { email: string; firstName: string }[] = [];

    if (recipientEmails && recipientEmails.length > 0) {
      // Test mode: send to specific emails
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .in('email', recipientEmails);

      if (error) {
        console.error("Error fetching test users:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      recipients = users.map(u => ({
        email: u.email,
        firstName: u.name?.split(' ')[0] || 'there'
      }));
    } else {
      // Production mode: send to all users
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('email, name');

      if (error) {
        console.error("Error fetching all users:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      recipients = users.map(u => ({
        email: u.email,
        firstName: u.name?.split(' ')[0] || 'there'
      }));
    }

    const appUrl = 'https://airocket.app';
    const emailSubject = 'Astra Guided Setup now Live';

    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="color-scheme" content="light dark">
            <meta name="supported-color-schemes" content="light dark">
            <style>
              :root {
                color-scheme: light dark;
                supported-color-schemes: light dark;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                line-height: 1.6;
                color: #e5e7eb !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: #0f172a !important;
              }
              body[data-outlook-cycle] {
                background-color: #0f172a !important;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #1e293b !important;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
              }
              .email-wrapper {
                background-color: #0f172a !important;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
              }
              .header .tagline {
                margin: 8px 0 0 0;
                font-size: 14px;
                opacity: 0.95;
                font-weight: 500;
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 20px;
                font-weight: 600;
                color: #f3f4f6;
                margin-bottom: 20px;
              }
              .message {
                font-size: 16px;
                color: #d1d5db;
                margin-bottom: 20px;
                line-height: 1.8;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
                padding: 18px 48px;
                border-radius: 12px;
                text-decoration: none;
                font-weight: 700;
                font-size: 18px;
                margin: 10px 0;
                transition: transform 0.2s;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
              }
              .cta-container {
                text-align: center;
                margin: 30px 0;
              }
              .feature-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 20px;
                margin: 30px 0;
              }
              .feature-card {
                background: #334155;
                border: 2px solid #475569;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
              }
              .feature-icon {
                font-size: 48px;
                margin-bottom: 12px;
              }
              .feature-title {
                font-size: 18px;
                font-weight: 700;
                color: #f3f4f6;
                margin-bottom: 8px;
              }
              .feature-description {
                font-size: 14px;
                color: #cbd5e1;
                line-height: 1.6;
              }
              .feature-list {
                list-style: none;
                padding: 0;
                margin: 8px 0 0 0;
                text-align: left;
              }
              .feature-list li {
                padding: 4px 0 4px 20px;
                position: relative;
                color: #94a3b8;
                font-size: 13px;
              }
              .feature-list li:before {
                content: "•";
                position: absolute;
                left: 0;
                color: #60a5fa;
              }
              .benefits-section {
                background: #1e3a5f;
                border-left: 4px solid #3b82f6;
                padding: 24px;
                margin: 30px 0;
                border-radius: 4px;
              }
              .benefits-title {
                font-weight: 700;
                color: #60a5fa;
                margin-bottom: 16px;
                font-size: 18px;
              }
              .benefits-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-top: 16px;
              }
              .benefit-item {
                display: flex;
                align-items: start;
                gap: 8px;
              }
              .benefit-icon {
                font-size: 20px;
                flex-shrink: 0;
              }
              .benefit-text {
                font-size: 14px;
                color: #93c5fd;
              }
              .access-section {
                background: #422006;
                border-left: 4px solid #f59e0b;
                padding: 24px;
                margin: 30px 0;
                border-radius: 4px;
              }
              .access-title {
                font-weight: 700;
                color: #fbbf24;
                margin-bottom: 16px;
                font-size: 18px;
              }
              .access-steps {
                margin: 0;
                padding-left: 24px;
                color: #fcd34d;
              }
              .access-steps li {
                margin-bottom: 12px;
                font-size: 15px;
              }
              .access-steps li strong {
                color: #fef3c7;
              }
              .visual-guide {
                background: #334155;
                border-radius: 12px;
                padding: 24px;
                margin: 20px 0;
                text-align: center;
              }
              .visual-step {
                margin: 16px 0;
              }
              .visual-step-number {
                display: inline-block;
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #f97316 0%, #3b82f6 100%);
                border-radius: 50%;
                color: white;
                font-weight: 700;
                line-height: 32px;
                margin-bottom: 8px;
              }
              .visual-step-text {
                font-size: 15px;
                color: #e2e8f0;
                font-weight: 600;
              }
              .footer {
                background: #0f172a;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #334155;
                font-size: 13px;
                color: #94a3b8;
              }
              .footer a {
                color: #60a5fa;
                text-decoration: none;
              }
              .divider {
                border-top: 1px solid #334155;
                margin: 30px 0;
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="container">
                <div class="header">
                  <h1>🚀 AI Rocket + Astra Intelligence</h1>
                  <p class="tagline">AI that Works for Work</p>
                </div>

                <div class="content">
                  <div class="greeting">
                    Hi ${recipient.firstName}!
                  </div>

                  <div class="message">
                    We're excited to announce that <strong>Astra Guided Setup</strong> is now live! Astra will now walk you through a step-by-step setup process to connect your team's data and unlock powerful AI insights across your business.
                  </div>

                  <div class="message">
                    No more guessing which folders to connect or how to organize your data. Astra will guide you through selecting the right folders for <strong>Strategy Documents</strong>, <strong>Meeting Notes</strong>, and <strong>Financial Data</strong> — making setup simple and fast.
                  </div>

                  <div class="divider"></div>

                  <div class="benefits-section">
                    <div class="benefits-title">✨ What Guided Setup Accomplishes For You</div>
                    <div class="message" style="color: #93c5fd; font-size: 15px;">
                      By following Astra's guided setup, you'll unlock these powerful capabilities:
                    </div>
                    <div class="benefits-grid">
                      <div class="benefit-item">
                        <div class="benefit-icon">📊</div>
                        <div class="benefit-text"><strong>Strategy Intelligence</strong> - Ask about your mission, goals, and OKRs</div>
                      </div>
                      <div class="benefit-item">
                        <div class="benefit-icon">📝</div>
                        <div class="benefit-text"><strong>Meeting Insights</strong> - Track decisions and action items</div>
                      </div>
                      <div class="benefit-item">
                        <div class="benefit-icon">💰</div>
                        <div class="benefit-text"><strong>Financial Analysis</strong> - Understand P&L and budget trends</div>
                      </div>
                      <div class="benefit-item">
                        <div class="benefit-icon">🎯</div>
                        <div class="benefit-text"><strong>Cross-Data Insights</strong> - Connect strategy to execution</div>
                      </div>
                      <div class="benefit-item">
                        <div class="benefit-icon">📈</div>
                        <div class="benefit-text"><strong>Visual Reports</strong> - Get automatic charts and graphs</div>
                      </div>
                      <div class="benefit-item">
                        <div class="benefit-icon">🤝</div>
                        <div class="benefit-text"><strong>Team Collaboration</strong> - AI-powered group discussions</div>
                      </div>
                    </div>
                  </div>

                  <div class="feature-grid">
                    <div class="feature-card">
                      <div class="feature-icon">📊</div>
                      <div class="feature-title">Strategy Documents</div>
                      <div class="feature-description">Connect your mission, vision, OKRs, and strategic plans</div>
                      <ul class="feature-list">
                        <li>Mission & Vision statements</li>
                        <li>Quarterly goals & OKRs</li>
                        <li>Strategic roadmaps</li>
                        <li>Company values documents</li>
                      </ul>
                    </div>

                    <div class="feature-card">
                      <div class="feature-icon">📝</div>
                      <div class="feature-title">Meeting Notes</div>
                      <div class="feature-description">Sync team meetings and capture decisions</div>
                      <ul class="feature-list">
                        <li>Team meeting notes</li>
                        <li>1-on-1 summaries</li>
                        <li>Sprint retrospectives</li>
                        <li>Planning sessions</li>
                      </ul>
                    </div>

                    <div class="feature-card">
                      <div class="feature-icon">💰</div>
                      <div class="feature-title">Financial Documents</div>
                      <div class="feature-description">Connect P&L, budgets, and expense reports</div>
                      <ul class="feature-list">
                        <li>Profit & Loss statements</li>
                        <li>Budget forecasts</li>
                        <li>Expense reports</li>
                        <li>Revenue tracking</li>
                      </ul>
                    </div>
                  </div>

                  <div class="divider"></div>

                  <div class="access-section">
                    <div class="access-title">🎯 How to Access Guided Setup</div>
                    <div class="visual-guide">
                      <div class="visual-step">
                        <div class="visual-step-number">1</div>
                        <div class="visual-step-text">Open AI Rocket app</div>
                      </div>
                      <div style="font-size: 24px; color: #64748b; margin: 8px 0;">↓</div>
                      <div class="visual-step">
                        <div class="visual-step-number">2</div>
                        <div class="visual-step-text">Click the <strong>+ button</strong> in the Features Menu</div>
                      </div>
                      <div style="font-size: 24px; color: #64748b; margin: 8px 0;">↓</div>
                      <div class="visual-step">
                        <div class="visual-step-number">3</div>
                        <div class="visual-step-text">Select <strong>"Launch Guided Setup"</strong></div>
                      </div>
                      <div style="font-size: 24px; color: #64748b; margin: 8px 0;">↓</div>
                      <div class="visual-step">
                        <div class="visual-step-number">4</div>
                        <div class="visual-step-text">Follow Astra's step-by-step guidance</div>
                      </div>
                    </div>

                    <ol class="access-steps">
                      <li>The <strong>Features Menu</strong> is located in the top navigation bar</li>
                      <li>Look for the <strong>+ button</strong> (it's the add/plus icon)</li>
                      <li>You can pause and resume setup anytime</li>
                      <li>Setup typically takes <strong>5-10 minutes</strong></li>
                    </ol>
                  </div>

                  <div class="cta-container">
                    <a href="${appUrl}" class="cta-button">
                      Open AI Rocket →
                    </a>
                  </div>

                  <div class="message" style="text-align: center; color: #94a3b8; font-size: 14px;">
                    Have questions? Just ask Astra once you're in the app — I'm here to help!
                  </div>
                </div>

                <div class="footer">
                  <p>
                    You're receiving this email because you have an account with AI Rocket.<br>
                    This is a product announcement about new features available to you.
                  </p>
                  <p style="margin-top: 20px;">
                    <a href="${appUrl}">AI Rocket + Astra</a> - AI that Works for Work
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Astra Intelligence <astra@rockethub.ai>",
            to: recipient.email,
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          console.error(`Failed to send to ${recipient.email}:`, resendResponse.status, errorText);
          errors.push({ email: recipient.email, error: errorText });
        } else {
          const resendData = await resendResponse.json();
          results.push({ email: recipient.email, emailId: resendData.id });
          console.log(`Email sent successfully to ${recipient.email}`);
        }
      } catch (error) {
        console.error(`Error sending to ${recipient.email}:`, error);
        errors.push({ email: recipient.email, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${results.length} emails successfully`,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-marketing-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
