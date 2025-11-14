import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { validateAIResponse } from '../lib/hallucination-detector';

interface ValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  issues: string[];
  warnings: string[];
}

interface ValidatedAIMessageProps {
  message: string;
  teamId: string;
  children: React.ReactNode;
  onValidationComplete?: (result: ValidationResult) => void;
}

/**
 * Wrapper component that validates AI responses and shows warnings if needed
 */
export function ValidatedAIMessage({
  message,
  teamId,
  children,
  onValidationComplete
}: ValidatedAIMessageProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    validateMessage();
  }, [message, teamId]);

  const validateMessage = async () => {
    setIsValidating(true);
    try {
      const result = await validateAIResponse(message, teamId);
      setValidation(result);
      if (onValidationComplete) {
        onValidationComplete(result);
      }
    } catch (error) {
      console.error('Validation error:', error);
      // On error, allow the message to show but with low confidence
      setValidation({
        isValid: true,
        confidence: 'low',
        issues: [],
        warnings: ['Unable to validate response']
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Don't show anything while validating
  if (isValidating) {
    return <div className="opacity-50">{children}</div>;
  }

  // If validation failed critically, show error instead of message
  if (validation && !validation.isValid && validation.issues.length > 0) {
    return (
      <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Response Validation Failed
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              This response contains information that doesn't match your team's data and may be
              inaccurate. The response has been hidden for your protection.
            </p>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              {showDetails ? 'Hide' : 'Show'} validation details
            </button>
            {showDetails && (
              <div className="mt-3 space-y-2">
                {validation.issues.map((issue, idx) => (
                  <div key={idx} className="text-sm text-red-700 dark:text-red-300">
                    • {issue}
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                    Original response (use with caution):
                  </p>
                  <div className="text-sm text-red-700 dark:text-red-300 opacity-75 max-h-40 overflow-y-auto">
                    {message}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show warnings for medium/low confidence
  const hasWarnings = validation && (validation.warnings.length > 0 || validation.confidence !== 'high');

  return (
    <div>
      {hasWarnings && (
        <div className={`border-l-4 mb-3 p-3 rounded ${
          validation!.confidence === 'low'
            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
            : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
        }`}>
          <div className="flex items-start gap-3">
            {validation!.confidence === 'low' ? (
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                validation!.confidence === 'low'
                  ? 'text-orange-800 dark:text-orange-200'
                  : 'text-yellow-800 dark:text-yellow-200'
              }`}>
                {validation!.confidence === 'low'
                  ? 'This response may contain unverified information'
                  : 'Some details couldn\'t be verified'}
              </p>
              {validation!.warnings.length > 0 && (
                <>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className={`text-xs mt-1 hover:underline ${
                      validation!.confidence === 'low'
                        ? 'text-orange-700 dark:text-orange-300'
                        : 'text-yellow-700 dark:text-yellow-300'
                    }`}
                  >
                    {showDetails ? 'Hide' : 'Show'} details
                  </button>
                  {showDetails && (
                    <div className="mt-2 space-y-1">
                      {validation!.warnings.map((warning, idx) => (
                        <div
                          key={idx}
                          className={`text-xs ${
                            validation!.confidence === 'low'
                              ? 'text-orange-700 dark:text-orange-300'
                              : 'text-yellow-700 dark:text-yellow-300'
                          }`}
                        >
                          • {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show the actual message content */}
      <div className={hasWarnings && validation!.confidence === 'low' ? 'opacity-75' : ''}>
        {children}
      </div>

      {/* Show high confidence indicator for valid responses */}
      {validation && validation.isValid && validation.confidence === 'high' && validation.warnings.length === 0 && (
        <div className="flex items-center gap-2 mt-2 text-xs text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span>Response validated against team data</span>
        </div>
      )}
    </div>
  );
}
