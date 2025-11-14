# Hallucination Detection System

## Overview

The Hallucination Detection System validates AI responses against known team data to prevent displaying inaccurate or fabricated information to users. This helps maintain trust and data accuracy.

## How It Works

### 1. **Data Collection**
When a user logs in, the system loads validation data for their team:
- Team name
- Team member names and emails
- Configured meeting types
- News preferences (industries, topics)

### 2. **Response Validation**
When an AI response is received, the system checks for:

#### **High-Confidence Hallucinations (Response Blocked)**
- References to team/company names that don't match the user's team
- Generic placeholder content (e.g., "John Doe", "Acme Corp", "example.com")

#### **Medium-Confidence Issues (Warning Shown)**
- Names not in the team roster
- Meeting types not configured for the team
- Fabricated specific details (phone numbers, addresses, specific dollar amounts)

#### **Validation Confidence Levels**
- **High**: No issues detected, response matches team data
- **Medium**: Minor warnings (1-2 unverified details)
- **Low**: Multiple warnings (3+) or suspicious patterns detected

### 3. **User Feedback**
Based on validation results:
- **High confidence**: ✅ Small "validated" badge shown
- **Medium confidence**: ⚠️ Yellow warning banner with optional details
- **Low confidence**: 🟠 Orange warning banner, response shown but dimmed
- **Failed validation**: 🔴 Response hidden, error message shown with option to reveal

## Implementation Guide

### Step 1: Initialize on Login

In your authentication flow, initialize the detector:

```typescript
import { initializeHallucinationDetector } from '../lib/hallucination-detector';
import { useAuth } from '../contexts/AuthContext';

// In your auth component or effect
useEffect(() => {
  if (user?.user_metadata?.team_id) {
    initializeHallucinationDetector(user.user_metadata.team_id);
  }
}, [user]);
```

### Step 2: Wrap AI Messages

Use the `ValidatedAIMessage` component to wrap AI responses:

```typescript
import { ValidatedAIMessage } from '../components/ValidatedAIMessage';

// In your message display component
{message.message_type === 'astra' && (
  <ValidatedAIMessage
    message={message.message}
    teamId={user.user_metadata.team_id}
    onValidationComplete={(result) => {
      console.log('Validation result:', result);
      // Optional: Log validation failures for monitoring
      if (!result.isValid) {
        logHallucinationDetection(message.id, result);
      }
    }}
  >
    <MessageBubble message={message} />
  </ValidatedAIMessage>
)}
```

### Step 3: Handle Reports and Scheduled Messages

For scheduled reports, validate before displaying:

```typescript
import { validateAIResponse } from '../lib/hallucination-detector';

// When receiving a report
const validation = await validateAIResponse(
  reportMessage,
  user.user_metadata.team_id
);

if (!validation.isValid) {
  // Show error message instead of report
  showErrorNotification('Report validation failed');
  return;
}

// Display report with warnings if needed
```

## Validation Rules

### Team Name Detection
- Extracts company/team names from patterns like:
  - "at [Name] team"
  - "[Name] company's"
  - "for [Name] corporation"
- Compares against user's actual team name

### People Name Detection
- Looks for capitalized "First Last" name patterns
- Cross-references against team member roster
- Flags names not in the team

### Meeting Type Detection
- Identifies meeting type references
- Validates against team's configured meeting types
- Warns about unconfigured meeting types

### Fabrication Detection
- Phone numbers (xxx-xxx-xxxx format)
- Street addresses (123 Main Street)
- Specific dollar amounts ($1,234.56)
- Email addresses
- Placeholder patterns (John Doe, Acme Corp, etc.)

## Customization

### Adding Custom Validation Rules

Extend the `HallucinationDetector` class in `src/lib/hallucination-detector.ts`:

```typescript
// Add new detection method
private detectCustomPattern(text: string): string[] {
  const matches: string[] = [];
  // Your detection logic
  return matches;
}

// Add to validateResponse method
const customIssues = this.detectCustomPattern(responseLower);
if (customIssues.length > 0) {
  warnings.push(`Custom issue: ${customIssues.join(', ')}`);
}
```

### Adjusting Confidence Thresholds

Modify the `calculateConfidence` method:

```typescript
private calculateConfidence(issues: string[], warnings: string[]): 'high' | 'medium' | 'low' {
  if (issues.length > 0) return 'low';
  if (warnings.length >= 5) return 'low';  // Increase threshold
  if (warnings.length >= 2) return 'medium';  // Adjust medium threshold
  return 'high';
}
```

## Best Practices

### 1. Load Data Early
Initialize the detector as soon as the user logs in, not just before validation:

```typescript
// ✅ Good - loads once at login
useEffect(() => {
  if (teamId) initializeHallucinationDetector(teamId);
}, [teamId]);

// ❌ Bad - loads on every message
await detector.loadTeamData(teamId); // Slow!
```

### 2. Handle Validation Errors Gracefully
Always provide fallback behavior:

```typescript
try {
  const result = await validateAIResponse(message, teamId);
  // Handle result
} catch (error) {
  console.error('Validation failed:', error);
  // Still show message but with low confidence warning
}
```

### 3. Log Validation Failures
Track hallucination detections for monitoring:

```typescript
if (!validation.isValid) {
  await supabase.from('hallucination_logs').insert({
    message_id: message.id,
    team_id: teamId,
    issues: validation.issues,
    response_preview: message.substring(0, 200)
  });
}
```

### 4. User Feedback Loop
Allow users to report false positives:

```typescript
<button onClick={() => reportFalsePositive(message.id)}>
  This response is actually correct
</button>
```

## Performance Considerations

- **Data Loading**: Team data is loaded once and cached in memory
- **Validation Speed**: Regex-based checks are fast (~1-5ms per message)
- **UI Impact**: Validation runs asynchronously, doesn't block rendering
- **Memory Usage**: Minimal (stores only team name, member names, meeting types)

## Future Enhancements

### Planned Features
1. **ML-based detection** - Train a model to detect hallucination patterns
2. **Source attribution** - Require AI to cite data sources
3. **Confidence scoring** - Ask AI to rate its own confidence
4. **Historical tracking** - Learn from past hallucinations
5. **User corrections** - Allow users to mark false positives/negatives

### Integration with n8n Workflow
Add validation prompts to the n8n workflow:

```
System: You MUST ONLY use information from the provided context.
If you don't have accurate information, respond with:
"I don't have enough information to answer that accurately."

Never fabricate:
- Team member names
- Meeting details
- Specific numbers or dates
- Company information

Always cite your sources when making specific claims.
```

## Troubleshooting

### Issue: Too many false positives
**Solution**: Adjust confidence thresholds or add exceptions for specific patterns

### Issue: Validation is slow
**Solution**: Ensure `initializeHallucinationDetector` is called once at login, not on every message

### Issue: Valid responses being flagged
**Solution**: Check if team data is up to date. User might have recently added team members that aren't synced.

### Issue: Detector not catching hallucinations
**Solution**: Review detection patterns and add new rules for the specific hallucination type

## Support

For questions or issues with the hallucination detection system:
1. Check console logs for validation errors
2. Verify team data is loaded correctly
3. Review detection rules for edge cases
4. Consider if the pattern needs a new detection rule

---

**Remember**: The goal is to protect users from acting on false information while maintaining a smooth user experience. Balance is key!
