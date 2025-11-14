# Hallucination Detection - Integration Examples

## Quick Start Integration

### 1. Update AuthContext to Initialize Detector

```typescript
// In src/contexts/AuthContext.tsx
import { initializeHallucinationDetector } from '../lib/hallucination-detector';

// Inside your AuthContext component, add this effect:
useEffect(() => {
  if (user?.user_metadata?.team_id) {
    // Initialize hallucination detector with team data
    initializeHallucinationDetector(user.user_metadata.team_id)
      .catch(err => console.error('Failed to initialize hallucination detector:', err));
  }
}, [user?.user_metadata?.team_id]);
```

### 2. Update ChatContainer to Use Validation

```typescript
// In src/components/ChatContainer.tsx

import { ValidatedAIMessage } from './ValidatedAIMessage';
import { useAuth } from '../contexts/AuthContext';

// Inside your message rendering loop:
const { user } = useAuth();

{messages.map((message) => (
  <div key={message.id}>
    {message.message_type === 'user' ? (
      // User messages don't need validation
      <MessageBubble message={message} />
    ) : (
      // Validate all AI responses
      <ValidatedAIMessage
        message={message.message}
        teamId={user?.user_metadata?.team_id || ''}
        onValidationComplete={(result) => {
          // Optional: Track validation results
          if (!result.isValid) {
            console.warn('Hallucination detected in message:', message.id, result);
          }
        }}
      >
        <MessageBubble message={message} />
      </ValidatedAIMessage>
    )}
  </div>
))}
```

### 3. Update ReportsView to Validate Reports

```typescript
// In src/components/ReportsView.tsx

import { ValidatedAIMessage } from './ValidatedAIMessage';
import { useAuth } from '../contexts/AuthContext';

// When displaying report messages:
const { user } = useAuth();

{reportMessages.map((message) => (
  <ValidatedAIMessage
    key={message.id}
    message={message.message}
    teamId={user?.user_metadata?.team_id || ''}
    onValidationComplete={(result) => {
      if (!result.isValid && result.issues.length > 0) {
        // Critical: This report failed validation
        // You might want to notify the user differently for reports
        console.error('Report validation failed:', message.metadata?.report_title);
      }
    }}
  >
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="prose dark:prose-invert max-w-none">
        {message.message}
      </div>
    </div>
  </ValidatedAIMessage>
))}
```

### 4. Update GroupChat to Validate Team Messages

```typescript
// In src/components/GroupChat.tsx

import { ValidatedAIMessage } from './ValidatedAIMessage';
import { useAuth } from '../contexts/AuthContext';

// For AI responses in group chat:
const { user } = useAuth();

{messages.map((message) => (
  <div key={message.id}>
    {message.message_type === 'astra' ? (
      <ValidatedAIMessage
        message={message.message}
        teamId={user?.user_metadata?.team_id || ''}
      >
        <GroupMessage message={message} />
      </ValidatedAIMessage>
    ) : (
      <GroupMessage message={message} />
    )}
  </div>
))}
```

## Advanced: Pre-validation Before Saving

For critical operations, you can validate BEFORE saving to the database:

```typescript
// In your chat submission handler

import { validateAIResponse } from '../lib/hallucination-detector';

async function handleAIResponse(aiResponse: string) {
  // Validate before saving
  const validation = await validateAIResponse(
    aiResponse,
    user.user_metadata.team_id
  );

  if (!validation.isValid && validation.confidence === 'low') {
    // Response failed validation - don't save it
    console.error('AI response failed validation:', validation.issues);

    // Show error to user
    toast.error('Unable to process AI response due to data validation concerns.');

    // Optionally, log the failed response for review
    await supabase.from('failed_ai_responses').insert({
      team_id: user.user_metadata.team_id,
      response: aiResponse,
      validation_issues: validation.issues,
      validation_warnings: validation.warnings
    });

    return; // Don't proceed
  }

  // Validation passed or had minor warnings - proceed to save
  await supabase.from('astra_chats').insert({
    user_id: user.id,
    message: aiResponse,
    message_type: 'astra',
    validation_metadata: {
      confidence: validation.confidence,
      warnings: validation.warnings
    }
  });
}
```

## Monitoring and Analytics

### Track Hallucination Detection Rates

Create a migration to add a tracking table:

```sql
-- Create table to track hallucination detection
CREATE TABLE IF NOT EXISTS hallucination_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  message_id uuid,
  confidence text NOT NULL, -- 'high', 'medium', 'low'
  issues jsonb DEFAULT '[]'::jsonb,
  warnings jsonb DEFAULT '[]'::jsonb,
  response_preview text,
  detected_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hallucination_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Super admins can view hallucination logs"
  ON hallucination_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email IN ('clay@rockethub.ai', 'derek@rockethub.ai')
    )
  );
```

### Add Logging to Your Components

```typescript
// Create a logging utility
// src/utils/hallucinationLogger.ts

import { supabase } from '../lib/supabase';

export async function logHallucinationDetection(
  teamId: string,
  messageId: string,
  validation: ValidationResult,
  responsePreview: string
) {
  try {
    await supabase.from('hallucination_logs').insert({
      team_id: teamId,
      message_id: messageId,
      confidence: validation.confidence,
      issues: validation.issues,
      warnings: validation.warnings,
      response_preview: responsePreview.substring(0, 200)
    });
  } catch (error) {
    console.error('Failed to log hallucination detection:', error);
  }
}

// Use in your components
onValidationComplete={(result) => {
  if (result.confidence !== 'high' || !result.isValid) {
    logHallucinationDetection(
      teamId,
      message.id,
      result,
      message.message
    );
  }
}}
```

## Testing

### Test with Known Hallucinations

```typescript
// src/lib/__tests__/hallucination-detector.test.ts

import { validateAIResponse } from '../hallucination-detector';

describe('Hallucination Detection', () => {
  test('detects wrong team name', async () => {
    const fakeResponse = "At Acme Corporation's team meeting...";
    const result = await validateAIResponse(fakeResponse, 'real-team-id');

    expect(result.isValid).toBe(false);
    expect(result.issues.some(i => i.includes('unknown team'))).toBe(true);
  });

  test('detects unknown people', async () => {
    const fakeResponse = "John Smith from our team suggested...";
    const result = await validateAIResponse(fakeResponse, 'real-team-id');

    expect(result.warnings.some(w => w.includes('not in team roster'))).toBe(true);
  });

  test('passes valid response', async () => {
    const validResponse = "Based on your team's data, here are the insights...";
    const result = await validateAIResponse(validResponse, 'real-team-id');

    expect(result.isValid).toBe(true);
    expect(result.confidence).toBe('high');
  });
});
```

## Configuration Options

### Strict Mode (Block More Aggressively)

```typescript
// In hallucination-detector.ts, update calculateConfidence:

private calculateConfidence(issues: string[], warnings: string[]): 'high' | 'medium' | 'low' {
  // STRICT MODE: Be more conservative
  if (issues.length > 0) return 'low';
  if (warnings.length >= 2) return 'low';  // Lower threshold
  if (warnings.length >= 1) return 'medium';
  return 'high';
}
```

### Permissive Mode (Show More Warnings)

```typescript
// Less aggressive - allow more content through
private calculateConfidence(issues: string[], warnings: string[]): 'high' | 'medium' | 'low' {
  if (issues.length > 2) return 'low';  // Need multiple serious issues
  if (warnings.length >= 5) return 'low';
  if (warnings.length >= 3) return 'medium';
  return 'high';
}
```

## User Education

Add a help tooltip or modal explaining the validation system:

```typescript
// Add to your help/FAQ component

<FAQItem question="What do the validation badges mean?">
  <p>
    Astra Intelligence validates AI responses against your team's actual data to
    prevent inaccurate information from being displayed.
  </p>
  <ul>
    <li>✅ <strong>Validated</strong>: Response matches your team data</li>
    <li>⚠️ <strong>Warning</strong>: Some details couldn't be verified</li>
    <li>🔴 <strong>Blocked</strong>: Response contains inaccurate information</li>
  </ul>
  <p>
    This helps ensure you're always working with accurate, trustworthy information.
  </p>
</FAQItem>
```

## Performance Tips

1. **Load team data once at login** - Don't reload on every message
2. **Cache validation results** - If showing the same message multiple times
3. **Validate async** - Don't block message rendering
4. **Batch validations** - If processing multiple messages at once

```typescript
// Efficient batch validation
const validations = await Promise.all(
  messages.map(msg => validateAIResponse(msg.message, teamId))
);

messages.forEach((msg, idx) => {
  const validation = validations[idx];
  // Handle each validation result
});
```

---

Ready to implement? Start with Step 1 (initialize in AuthContext) and gradually add validation to your message display components.
