import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const APP_HELP_CONTEXT = `You are Astra's Help Assistant for Astra Intelligence, a team collaboration and AI insights platform.

CORE FEATURES:
1. AI Chat with Two Modes:
   - Private Mode: Personal conversations only visible to the user
   - Team Mode: Collaborative conversations visible to all team members
   - Users can @mention team members in Team mode

2. Data Visualizations:
   - Users can ask Astra to create charts and visualizations from their data
   - Visualizations are private to the requesting user, even in Team mode
   - Users can save favorite visualizations and export them as PDFs

3. Reports:
   - Admins can set up scheduled reports (daily, weekly, monthly)
   - All team members can view reports in the Reports section
   - Reports provide regular insights and summaries

4. Google Drive Integration:
   - Admins can connect Google Drive to sync documents
   - Astra analyzes synced documents to answer questions
   - Team members can view synced documents but only admins can delete them

5. Team Collaboration:
   - Real-time chat synchronization
   - @mentions with notifications
   - Team members panel shows all users
   - Notifications for mentions and important activity

ADMIN-SPECIFIC FEATURES:
- Invite team members via email
- Connect and configure Google Drive integration
- Set up scheduled reports
- Manage team settings and preferences
- Delete synced documents
- Remove team members

MEMBER CAPABILITIES:
- Chat with Astra in Private and Team modes
- Create and save visualizations
- View team reports
- View synced documents
- Collaborate in Team mode
- Update personal profile and preferences

IMPORTANT GUIDELINES:
- Answer questions about how to use the Astra Intelligence app
- Be helpful, friendly, and concise
- If someone asks about their company data (not how to use the app), politely suggest they ask in the main chat with Astra
- Provide step-by-step instructions when appropriate
- Reference specific UI elements (buttons, menus, panels) in your explanations

Answer the user's question clearly and helpfully.`;

export async function getHelpResponse(question: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent([
    { text: APP_HELP_CONTEXT },
    { text: `User question: ${question}` }
  ]);

  const response = await result.response;
  return response.text();
}

export async function saveHelpConversation(
  userId: string,
  question: string,
  response: string
): Promise<void> {
  const { error } = await supabase
    .from('help_conversations')
    .insert({
      user_id: userId,
      question,
      response
    });

  if (error) {
    console.error('Error saving help conversation:', error);
    throw error;
  }
}

export async function getHelpConversations(userId: string): Promise<Array<{
  id: string;
  question: string;
  response: string;
  created_at: string;
}>> {
  const { data, error } = await supabase
    .from('help_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching help conversations:', error);
    throw error;
  }

  return data || [];
}
