import { supabase } from './supabase';

interface TeamValidationData {
  teamName: string;
  teamMembers: string[];
  meetingTypes: string[];
  industries: string[];
  customTopics: string;
}

interface ValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  issues: string[];
  warnings: string[];
}

/**
 * Hallucination Detection Service
 * Validates AI responses against known team data to prevent displaying hallucinated content
 */
export class HallucinationDetector {
  private validationData: TeamValidationData | null = null;
  private teamId: string | null = null;

  /**
   * Load validation data for a specific team
   */
  async loadTeamData(teamId: string): Promise<void> {
    this.teamId = teamId;

    try {
      // Fetch team name
      const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single();

      // Fetch team members
      const { data: members } = await supabase
        .from('users')
        .select('name, email')
        .eq('team_id', teamId);

      // Fetch team settings (meeting types, news preferences)
      const { data: settings } = await supabase
        .from('team_settings')
        .select('meeting_types, news_preferences')
        .eq('team_id', teamId)
        .single();

      // Extract member names (including email usernames)
      const memberNames: string[] = [];
      members?.forEach(member => {
        if (member.name) memberNames.push(member.name.toLowerCase());
        if (member.email) {
          const emailName = member.email.split('@')[0].toLowerCase();
          memberNames.push(emailName);
        }
      });

      // Extract meeting types
      const meetingTypes = settings?.meeting_types?.map((mt: any) => mt.type.toLowerCase()) || [];

      // Extract industries and topics
      const industries = settings?.news_preferences?.industries || [];
      const customTopics = settings?.news_preferences?.custom_topics || '';

      this.validationData = {
        teamName: team?.name || '',
        teamMembers: memberNames,
        meetingTypes,
        industries,
        customTopics
      };

    } catch (error) {
      console.error('Error loading team validation data:', error);
      this.validationData = null;
    }
  }

  /**
   * Validate an AI response for potential hallucinations
   */
  validateResponse(response: string): ValidationResult {
    if (!this.validationData) {
      return {
        isValid: true,
        confidence: 'low',
        issues: [],
        warnings: ['Validation data not loaded - unable to verify response accuracy']
      };
    }

    const issues: string[] = [];
    const warnings: string[] = [];
    const responseLower = response.toLowerCase();

    // Check 1: Look for other team names (common hallucination pattern)
    const suspiciousTeamNames = this.detectSuspiciousTeamNames(responseLower);
    if (suspiciousTeamNames.length > 0) {
      issues.push(`References unknown team/company names: ${suspiciousTeamNames.join(', ')}`);
    }

    // Check 2: Look for references to people not on the team
    const unknownPeople = this.detectUnknownPeople(responseLower);
    if (unknownPeople.length > 0) {
      warnings.push(`Mentions names not in team roster: ${unknownPeople.join(', ')}`);
    }

    // Check 3: Check for meeting types not configured
    const invalidMeetingTypes = this.detectInvalidMeetingTypes(responseLower);
    if (invalidMeetingTypes.length > 0) {
      warnings.push(`References unknown meeting types: ${invalidMeetingTypes.join(', ')}`);
    }

    // Check 4: Look for fabricated specific details
    const fabricatedDetails = this.detectFabricatedDetails(response);
    if (fabricatedDetails.length > 0) {
      warnings.push(`Contains potentially fabricated details: ${fabricatedDetails.join(', ')}`);
    }

    // Check 5: Generic placeholder content
    if (this.hasPlaceholderContent(response)) {
      issues.push('Response contains generic placeholder content');
    }

    // Determine overall validity
    const isValid = issues.length === 0;
    const confidence = this.calculateConfidence(issues, warnings);

    return {
      isValid,
      confidence,
      issues,
      warnings
    };
  }

  /**
   * Detect mentions of team/company names that don't match the user's team
   */
  private detectSuspiciousTeamNames(text: string): string[] {
    const suspicious: string[] = [];
    const teamNameLower = this.validationData!.teamName.toLowerCase();

    // Common patterns for company/team name mentions
    const companyPatterns = [
      /(?:at|for|with|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:team|company|corp|inc|llc)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:team's|company's|corporation's)/gi
    ];

    companyPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[1].toLowerCase();
        if (name && name !== teamNameLower && name.length > 2) {
          suspicious.push(match[1]);
        }
      }
    });

    return [...new Set(suspicious)]; // Remove duplicates
  }

  /**
   * Detect mentions of people not in the team
   */
  private detectUnknownPeople(text: string): string[] {
    const unknown: string[] = [];
    const knownMembers = this.validationData!.teamMembers;

    // Look for capitalized name patterns (First Last)
    const namePattern = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g;
    const matches = text.matchAll(namePattern);

    for (const match of matches) {
      const fullName = `${match[1]} ${match[2]}`.toLowerCase();
      const firstName = match[1].toLowerCase();
      const lastName = match[2].toLowerCase();

      // Check if any part of the name matches known members
      const isKnown = knownMembers.some(member =>
        member.includes(firstName) ||
        member.includes(lastName) ||
        member.includes(fullName)
      );

      if (!isKnown) {
        unknown.push(`${match[1]} ${match[2]}`);
      }
    }

    return [...new Set(unknown)];
  }

  /**
   * Detect meeting types not configured for this team
   */
  private detectInvalidMeetingTypes(text: string): string[] {
    const invalid: string[] = [];
    const knownTypes = this.validationData!.meetingTypes;

    // Common meeting type patterns
    const meetingPatterns = [
      /(\w+(?:\s+\w+)*)\s+meeting/gi,
      /meeting\s+(?:type|for|about):\s*(\w+(?:\s+\w+)*)/gi
    ];

    meetingPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const type = match[1].toLowerCase().trim();
        if (type && !knownTypes.some(known => known.includes(type) || type.includes(known))) {
          invalid.push(match[1]);
        }
      }
    });

    return [...new Set(invalid)];
  }

  /**
   * Detect fabricated specific details (phone numbers, addresses, specific dollar amounts)
   */
  private detectFabricatedDetails(text: string): string[] {
    const fabricated: string[] = [];

    // Phone numbers
    if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text)) {
      fabricated.push('phone numbers');
    }

    // Street addresses
    if (/\b\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)\b/.test(text)) {
      fabricated.push('street addresses');
    }

    // Very specific dollar amounts with decimals (likely fabricated)
    if (/\$\d+,\d+\.\d{2}/.test(text)) {
      fabricated.push('specific dollar amounts');
    }

    // Email addresses not from known domains
    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = text.match(emailPattern);
    if (emails && emails.length > 0) {
      // This would need enhancement to check against actual team email domains
      fabricated.push('email addresses');
    }

    return fabricated;
  }

  /**
   * Check for generic placeholder content
   */
  private hasPlaceholderContent(text: string): boolean {
    const placeholderPatterns = [
      /\b(?:john|jane)\s+(?:doe|smith)\b/i,
      /\bacme\s+corp(?:oration)?\b/i,
      /\bexample\.com\b/i,
      /\b555-\d{4}\b/,
      /\[.*\]/,  // Bracketed placeholders
      /\{.*\}/,  // Curly brace placeholders
    ];

    return placeholderPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Calculate confidence level based on issues and warnings
   */
  private calculateConfidence(issues: string[], warnings: string[]): 'high' | 'medium' | 'low' {
    if (issues.length > 0) return 'low';
    if (warnings.length >= 3) return 'low';
    if (warnings.length >= 1) return 'medium';
    return 'high';
  }

  /**
   * Quick check: Does response mention the correct team name?
   */
  hasCorrectTeamName(response: string): boolean {
    if (!this.validationData) return true; // Can't verify
    const teamName = this.validationData.teamName.toLowerCase();
    return response.toLowerCase().includes(teamName);
  }

  /**
   * Get a user-friendly warning message
   */
  getWarningMessage(result: ValidationResult): string | null {
    if (result.isValid && result.warnings.length === 0) return null;

    if (!result.isValid) {
      return "This response may contain inaccurate information. Please verify details before taking action.";
    }

    if (result.confidence === 'low') {
      return "This response may contain unverified information. Please use with caution.";
    }

    if (result.confidence === 'medium' && result.warnings.length > 0) {
      return "Some details in this response couldn't be verified against your team data.";
    }

    return null;
  }
}

// Singleton instance
let detectorInstance: HallucinationDetector | null = null;

/**
 * Get or create the hallucination detector instance
 */
export function getHallucinationDetector(): HallucinationDetector {
  if (!detectorInstance) {
    detectorInstance = new HallucinationDetector();
  }
  return detectorInstance;
}

/**
 * Initialize detector for a team (call this when user logs in or switches context)
 */
export async function initializeHallucinationDetector(teamId: string): Promise<void> {
  const detector = getHallucinationDetector();
  await detector.loadTeamData(teamId);
}

/**
 * Quick validation function for use in message handlers
 */
export async function validateAIResponse(
  response: string,
  teamId: string
): Promise<ValidationResult> {
  const detector = getHallucinationDetector();

  // Ensure data is loaded for this team
  if (!detector['validationData'] || detector['teamId'] !== teamId) {
    await detector.loadTeamData(teamId);
  }

  return detector.validateResponse(response);
}
