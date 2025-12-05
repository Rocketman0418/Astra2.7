import React, { useState } from 'react';
import { X, BarChart, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatAstraMessage } from '../../utils/formatAstraMessage';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface VisualizationBoosterModalProps {
  onClose: () => void;
  onComplete: () => void;
  astraResponse?: string; // The response from the previous guided chat step
}

export const VisualizationBoosterModal: React.FC<VisualizationBoosterModalProps> = ({
  onClose,
  onComplete,
  astraResponse
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'show_message' | 'generating' | 'showing_viz'>('show_message');
  const [visualizationHtml, setVisualizationHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateVisualization = async () => {
    if (!user) return;

    // Use astraResponse if available, otherwise use a fallback message
    const messageText = astraResponse || 'Create a visualization showing key insights from recent data';

    setStep('generating');
    setError(null);

    try {
      // Get API key from environment
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('Gemini API key not found');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        generationConfig: {
          temperature: 1.0,
          topK: 64,
          topP: 0.95,
          maxOutputTokens: 100000,
        }
      });

      const baseDesign = `DESIGN REQUIREMENTS:
- Use a dark theme with gray-900 (#111827) background
- Use gray-800 (#1f2937) and gray-700 (#374151) for card backgrounds
- Use white (#ffffff) and gray-300 (#d1d5db) for text
- Use blue (#3b82f6), purple (#8b5cf6), and cyan (#06b6d4) for accents and highlights
- Match the visual style of a modern dark dashboard
- Include proper spacing, rounded corners, and subtle shadows
- Use responsive layouts with flexbox or CSS grid
- Ensure all content fits within containers without overflow`;

      const prompt = `Create a comprehensive visual dashboard to help understand the information in the message below.

${baseDesign}
- Use graphics, emojis, and charts as needed to enhance the visualization
- Include visual elements like progress bars, icons, charts, and infographics where appropriate
- Make the dashboard visually engaging with relevant emojis and graphical elements

CRITICAL TYPOGRAPHY & SIZING RULES:
- Headings: Use max font-size of 1.875rem (30px)
- Large numbers/metrics: Use max font-size of 2rem (32px) with clamp() for responsiveness
- Subheadings: 1rem to 1.25rem (16-20px)
- Body text: 0.875rem to 1rem (14-16px)

CRITICAL LAYOUT RULES TO PREVENT OVERFLOW:
- Add padding inside ALL cards and containers (minimum 1rem on all sides)
- Use word-wrap: break-word on all text elements
- Use overflow-wrap: break-word to handle long numbers and text
- For responsive card grids, use: display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;
- Never use fixed widths that might cause overflow
- Ensure numbers scale down on smaller containers using clamp() or max-width with text wrapping

MESSAGE TEXT:
${messageText}

Return only the HTML code - no other text or formatting.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let cleanedContent = response.text();

      // Clean up the response - remove markdown code blocks if present
      cleanedContent = cleanedContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

      // Ensure it starts with DOCTYPE if it's a complete HTML document
      if (!cleanedContent.toLowerCase().includes('<!doctype') && !cleanedContent.toLowerCase().includes('<html')) {
        cleanedContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visualization</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            background: #111827;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            width: 100%;
            overflow-x: hidden;
        }
        /* Prevent text overflow in all elements */
        h1, h2, h3, h4, h5, h6, p, div, span {
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
        }
        /* Enforce maximum font sizes */
        h1 { font-size: clamp(1.5rem, 4vw, 1.875rem) !important; }
        h2 { font-size: clamp(1.25rem, 3.5vw, 1.5rem) !important; }
        h3 { font-size: clamp(1.125rem, 3vw, 1.25rem) !important; }
        /* Responsive images */
        img {
            max-width: 100%;
            height: auto;
        }
        /* Ensure all containers have proper padding and prevent overflow */
        [class*="card"], [class*="container"], [class*="box"], [style*="padding"] {
            padding: 1rem !important;
            overflow: hidden;
        }
    </style>
</head>
<body>
    ${cleanedContent}
</body>
</html>`;
      }

      setVisualizationHtml(cleanedContent);
      setStep('showing_viz');
    } catch (err: any) {
      console.error('Error creating visualization:', err);
      setError(err.message || 'Failed to create visualization');
      setStep('show_message');
    }
  };

  const handleProceed = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <BarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Data Visualizations</h2>
              <p className="text-sm text-gray-300">Turn insights into visuals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Show Astra's previous message */}
          {step === 'show_message' && (
            <div className="space-y-6">
              {astraResponse && (
                <div className="bg-purple-900/10 border border-purple-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <p className="text-sm text-gray-400">Astra's Previous Insights:</p>
                  </div>
                  <div className="text-white prose prose-invert max-w-none">
                    {formatAstraMessage(astraResponse)}
                  </div>
                </div>
              )}

              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BarChart className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300 font-medium mb-1">
                      Ready to Visualize?
                    </p>
                    <p className="text-sm text-gray-300">
                      Click below to transform Astra's insights into an interactive visualization. This helps you spot trends and patterns at a glance!
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Generating visualization */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
              <p className="text-white text-lg font-medium mb-2">Creating your visualization...</p>
              <p className="text-gray-400 text-sm">This may take a moment</p>

              {/* Animated progress indicators */}
              <div className="mt-8 space-y-3 max-w-md w-full">
                <div className="bg-gray-700/50 rounded-lg p-3 flex items-center gap-3 animate-pulse">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Analyzing data structure...</span>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 flex items-center gap-3 animate-pulse" style={{ animationDelay: '0.2s' }}>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Generating chart...</span>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 flex items-center gap-3 animate-pulse" style={{ animationDelay: '0.4s' }}>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Rendering visualization...</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Show visualization */}
          {step === 'showing_viz' && visualizationHtml && (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-sm text-green-300 font-medium">Visualization Created!</p>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div
                  className="w-full"
                  dangerouslySetInnerHTML={{ __html: visualizationHtml }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-800/50 flex justify-end items-center gap-3 flex-shrink-0">
          {step === 'show_message' && (
            <button
              onClick={handleCreateVisualization}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl font-medium min-h-[44px]"
            >
              <BarChart className="w-5 h-5" />
              Create Visualization
            </button>
          )}

          {step === 'showing_viz' && (
            <button
              onClick={handleProceed}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-xl font-medium min-h-[44px]"
            >
              <CheckCircle className="w-5 h-5" />
              Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
