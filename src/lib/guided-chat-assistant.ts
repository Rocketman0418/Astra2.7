import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface GuidedPrompt {
  title: string;
  prompt: string;
  description: string;
}

export interface UserDataSnapshot {
  hasStrategyDocs: boolean;
  strategyDocCount: number;
  strategyTopics: string[];

  hasMeetings: boolean;
  meetingCount: number;
  meetingCategories: string[];
  recentMeetingDates: string[];

  hasFinancials: boolean;
  financialCount: number;
  financialPeriods: string[];
  financialCategories: string[];

  hasEmails: boolean;
  emailCount: number;
  emailThreadCount: number;

  teamName: string;
  dataLastUpdated: string;
}

export async function analyzeUserData(userId: string, teamId: string): Promise<UserDataSnapshot> {
  try {
    const queries = [
      supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .maybeSingle(),

      supabase
        .from('documents')
        .select('title, folder_type, document_type, metadata, modified_time')
        .eq('team_id', teamId)
        .eq('folder_type', 'strategy')
        .order('modified_time', { ascending: false }),

      supabase
        .from('documents')
        .select('title, folder_type, document_type, metadata, modified_time')
        .eq('team_id', teamId)
        .eq('folder_type', 'meeting')
        .order('modified_time', { ascending: false }),

      supabase
        .from('documents')
        .select('title, folder_type, document_type, metadata, modified_time')
        .eq('team_id', teamId)
        .eq('folder_type', 'financial')
        .order('modified_time', { ascending: false }),

      supabase
        .from('company_emails')
        .select('id, thread_id')
        .eq('team_id', teamId)
        .order('email_date', { ascending: false })
        .limit(100)
    ];

    const [teamResult, strategyResult, meetingsResult, financialResult, emailsResult] = await Promise.all(queries);

    const strategyDocs = strategyResult.data || [];
    const meetings = meetingsResult.data || [];
    const financials = financialResult.data || [];
    const emails = emailsResult.data || [];

    const uniqueThreads = new Set(emails.map(e => e.thread_id)).size;

    const strategyTopics = [...new Set(
      strategyDocs
        .filter(d => d.title)
        .map(d => d.title)
    )].slice(0, 10);

    const meetingCategories = [...new Set(
      meetings
        .filter(m => m.document_type)
        .map(m => m.document_type)
    )];

    const recentMeetingDates = meetings
      .filter(m => m.modified_time)
      .map(m => new Date(m.modified_time).toLocaleDateString())
      .slice(0, 5);

    const financialPeriods = [...new Set(
      financials
        .filter(f => f.metadata?.financial_period)
        .map(f => f.metadata.financial_period)
    )].slice(0, 10);

    const financialCategories = [...new Set(
      financials
        .filter(f => f.metadata?.data_category)
        .map(f => f.metadata.data_category)
    )];

    return {
      hasStrategyDocs: strategyDocs.length > 0,
      strategyDocCount: strategyDocs.length,
      strategyTopics,

      hasMeetings: meetings.length > 0,
      meetingCount: meetings.length,
      meetingCategories,
      recentMeetingDates,

      hasFinancials: financials.length > 0,
      financialCount: financials.length,
      financialPeriods,
      financialCategories,

      hasEmails: emails.length > 0,
      emailCount: emails.length,
      emailThreadCount: uniqueThreads,

      teamName: teamResult.data?.name || 'Your Team',
      dataLastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error analyzing user data:', error);
    throw error;
  }
}

export async function generateGuidedPrompts(dataSnapshot: UserDataSnapshot): Promise<GuidedPrompt[]> {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const systemPrompt = `You are an expert AI prompt engineer for Astra Intelligence, a platform that analyzes company documents, meetings, and financials.

Based on the user's available data, generate exactly 3 highly specific, actionable prompts that will provide maximum value.

USER'S DATA SUMMARY:
${JSON.stringify(dataSnapshot, null, 2)}

CRITICAL: The counts shown represent actual DOCUMENTS, not chunks or sections. For example:
- ${dataSnapshot.strategyDocCount} strategy documents means ${dataSnapshot.strategyDocCount} distinct strategy files
- ${dataSnapshot.meetingCount} meeting notes means ${dataSnapshot.meetingCount} distinct meeting transcripts
- ${dataSnapshot.financialCount} financial records means ${dataSnapshot.financialCount} distinct financial files

PROMPT REQUIREMENTS:
1. Each prompt MUST accurately reference the user's document counts (not exaggerated)
2. Reference specific document titles from strategyTopics when available
3. Combine multiple data sources when valuable (e.g., link strategy docs with meeting notes)
4. Focus on insights, patterns, trends, and actionable recommendations
5. Be specific enough to drive valuable AI responses
6. Use natural language - if there are only 8 strategy documents, say "8 strategy documents" not "100 documents"

PROMPT STRUCTURE:
- Title: 4-6 words, action-oriented
- Prompt: The exact text the user will submit (50-100 words)
- Description: One sentence explaining why this prompt is valuable, using ACCURATE document counts

IMPORTANT RULES:
- If no financial data exists, don't suggest financial analysis
- If no meeting data exists, don't suggest meeting analysis
- If no email data exists, don't suggest email analysis
- Always ensure at least 3 prompts can be generated from available data
- Prioritize cross-data-source analysis when multiple types are available
- NEVER inflate document counts - use the exact numbers provided

OUTPUT FORMAT (JSON only, no other text):
[
  {
    "title": "Strategic Alignment Check",
    "prompt": "Review our ${dataSnapshot.strategyDocCount} strategy documents and recent meeting notes to assess how well our day-to-day activities align with our strategic goals. Identify any gaps or misalignments.",
    "description": "Connects your ${dataSnapshot.strategyDocCount} strategy documents with ${dataSnapshot.meetingCount} meeting notes to ensure execution matches vision."
  }
]

Generate 3 prompts now as JSON:`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith('```json')) {
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/```\n?/g, '');
    }

    const prompts = JSON.parse(text) as GuidedPrompt[];

    if (!Array.isArray(prompts) || prompts.length !== 3) {
      throw new Error('Invalid prompt format from AI');
    }

    return prompts;
  } catch (error) {
    console.error('Error generating guided prompts:', error);
    throw error;
  }
}

export async function saveGuidedPrompts(
  userId: string,
  teamId: string,
  prompts: GuidedPrompt[],
  dataSnapshot: UserDataSnapshot,
  generationNumber: number
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('guided_chat_prompts')
      .insert({
        user_id: userId,
        team_id: teamId,
        prompt_set: prompts,
        data_snapshot: dataSnapshot,
        generation_number: generationNumber,
        is_current: true
      })
      .select()
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    console.error('Error saving guided prompts:', error);
    throw error;
  }
}

export async function getCurrentGuidedPrompts(userId: string): Promise<{ prompts: GuidedPrompt[], generationNumber: number } | null> {
  try {
    const { data, error } = await supabase
      .from('guided_chat_prompts')
      .select('prompt_set, generation_number')
      .eq('user_id', userId)
      .eq('is_current', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      prompts: data.prompt_set as GuidedPrompt[],
      generationNumber: data.generation_number
    };
  } catch (error) {
    console.error('Error fetching current guided prompts:', error);
    return null;
  }
}
