import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateEmailRequest {
  subject?: string;
  contentDescription: string;
  specialNotes?: string;
  previousHtml?: string;
  regenerationComments?: string;
  featureContext?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured - GEMINI_API_KEY secret missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting email generation request...");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      subject,
      contentDescription,
      specialNotes,
      previousHtml,
      regenerationComments,
      featureContext
    }: GenerateEmailRequest = await req.json();

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const templateReference = `
<!DOCTYPE html>
<html>
  <head>
    <meta name=\"color-scheme\" content=\"light dark\">
    <meta name=\"supported-color-schemes\" content=\"light dark\">
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
        font-size: 22px;
        font-weight: 600;
        color: #f3f4f6;
        margin-bottom: 16px;
        text-align: center;
      }
      .hero-text {
        font-size: 18px;
        color: #d1d5db;
        margin-bottom: 24px;
        line-height: 1.7;
        text-align: center;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        color: white !important;
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
      .benefits-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 24px 0;
      }
      .benefit-card {
        background: #1e3a5f;
        border: 1px solid #3b82f6;
        border-radius: 10px;
        padding: 16px;
        text-align: center;
      }
      .benefit-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
      .benefit-text {
        font-size: 13px;
        font-weight: 600;
        color: #93c5fd;
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
    </style>
  </head>
  <body>
    <div class=\"email-wrapper\">
      <div class=\"container\">
        <div class=\"header\">
          <h1>🚀 AI Rocket + Astra Intelligence</h1>
          <p class=\"tagline\">AI that Works for Work</p>
        </div>
        <div class=\"content\">
          <!-- Main content goes here -->
        </div>
        <div class=\"footer\">
          <p>
            You're receiving this email because you have an account with AI Rocket.
          </p>
          <p style=\"margin-top: 20px;\">
            <a href=\"https://airocket.app\">AI Rocket + Astra</a> - AI that Works for Work
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
    `;

    let prompt = `You are an email marketing designer for AI Rocket / Astra Intelligence.

BRAND GUIDELINES:
- Use dark theme (#0f172a background, #1e293b containers)
- Blue-purple gradient for CTAs and headers (#3b82f6 to #8b5cf6)
- Professional, friendly, energetic tone
- Focus on value and capabilities
- Use emojis sparingly but purposefully
- Always include the RocketHub branding and tagline
- CTA button should link to https://airocket.app
- CTA button text should be "Launch AI Rocket"

KEY PRODUCT MESSAGING:
- Astra is powered by Gemini, Claude, and OpenAI working together in alignment with your team
- Emphasize the multi-AI approach as a unique strength

TEMPLATE STRUCTURE TO FOLLOW:
${templateReference}

IMPORTANT STYLING REQUIREMENTS:
- Maintain exact color schemes from the template
- Keep the header gradient and footer styling
- Ensure responsive design
- Use the same font stack
- Keep consistent spacing and padding
- Benefits should be in a 2-column grid with icons

${featureContext ? `PRODUCT FEATURE CONTEXT:\n${featureContext}\n\nUse this context to create accurate, specific content about our actual features and benefits.\n` : ''}

USER REQUEST:
Subject: ${subject || 'To be determined'}
Content Description: ${contentDescription}
${specialNotes ? `Special Instructions: ${specialNotes}` : ''}
`;

    if (previousHtml && regenerationComments) {
      prompt += `\n\nPREVIOUS VERSION:
${previousHtml}

USER FEEDBACK:
${regenerationComments}

Please regenerate the email incorporating this feedback while maintaining the brand guidelines and template structure.`;
    } else {
      prompt += `\n\nGenerate a complete HTML email that matches the template structure above while incorporating the user's content request. Include:
1. Personalized greeting with {{firstName}} variable
2. Compelling hero text that explains the main message
3. 4-6 benefit cards in a grid layout with emojis as icons
4. At least 2 CTA buttons (one near top, one at bottom) - use "Launch AI Rocket" as button text
5. Professional footer (do NOT include unsubscribe links)

Return ONLY the complete HTML code, no markdown formatting or additional text.`;
    }

    console.log("Calling Gemini API...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    let htmlContent = response.text();

    console.log("Generated content length:", htmlContent.length);
    htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    console.log("Email generation successful");
    return new Response(
      JSON.stringify({ html: htmlContent }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-marketing-email function:", error);
    console.error("Error details:", error.message, error.stack);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
