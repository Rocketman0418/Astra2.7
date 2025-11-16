import React, { useState } from 'react';
import { Bookmark, Reply, Copy, Check } from 'lucide-react';
import { VisualizationButton } from './VisualizationButton';
import { Message } from '../types';

const formatMessageText = (text: string): JSX.Element => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  const processLine = (line: string, index: number) => {
    const trimmedLine = line.trim();

    // Skip horizontal rules (---, ___, ***)
    if (/^[-_*]{3,}$/.test(trimmedLine)) {
      return;
    }

    // Handle markdown tables
    if (trimmedLine.includes('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(trimmedLine);
      return;
    } else if (inTable) {
      // End of table, render it
      elements.push(renderTable(tableRows, `table-${index}`));
      inTable = false;
      tableRows = [];
    }

    // Skip empty lines with minimal spacing
    if (!trimmedLine) {
      elements.push(<div key={`space-${index}`} className="h-3" />);
      return;
    }

    // Handle headers (### Header)
    const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2].trim();
      const sizes = ['text-xl', 'text-lg', 'text-base', 'text-base', 'text-sm', 'text-sm'];
      const marginTop = level === 1 ? 'mt-6' : level === 2 ? 'mt-5' : 'mt-4';

      elements.push(
        <div key={index} className={`${sizes[level - 1]} font-bold text-blue-300 ${marginTop} mb-2`}>
          {content}
        </div>
      );
      return;
    }

    // Handle numbered lists with bold titles (1. **Title**: content)
    const numberedListMatch = trimmedLine.match(/^(\d+)\.\s*\*\*(.*?)\*\*[:\s]*(.*)$/);
    if (numberedListMatch) {
      const [, number, title, content] = numberedListMatch;
      elements.push(
        <div key={index} className="mb-3 ml-4">
          <div className="flex items-start space-x-2">
            <span className="text-blue-400 font-semibold">{number}.</span>
            <div className="flex-1">
              <span className="font-semibold text-blue-300">{title}</span>
              {content && <span className="text-gray-300">: {content}</span>}
            </div>
          </div>
        </div>
      );
      return;
    }

    // Handle simple numbered lists (1. content)
    const simpleNumberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (simpleNumberedMatch) {
      const [, number, content] = simpleNumberedMatch;
      elements.push(
        <div key={index} className="mb-2 ml-4 flex items-start space-x-2">
          <span className="text-blue-400 font-semibold">{number}.</span>
          <span className="text-gray-300 flex-1">{processInlineFormatting(content)}</span>
        </div>
      );
      return;
    }

    // Handle bullet points
    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
      const content = trimmedLine.substring(1).trim();
      elements.push(
        <div key={index} className="flex items-start space-x-2 mb-2 ml-4">
          <span className="text-blue-400 mt-1">•</span>
          <span className="text-gray-300 flex-1">{processInlineFormatting(content)}</span>
        </div>
      );
      return;
    }

    // Handle lines with inline formatting
    elements.push(
      <div key={index} className="mb-2 text-gray-300 leading-relaxed">
        {processInlineFormatting(trimmedLine)}
      </div>
    );
  };

  const processInlineFormatting = (text: string): React.ReactNode => {
    // Handle bold text (**text**)
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-semibold text-blue-300">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const renderTable = (rows: string[], key: string): JSX.Element => {
    if (rows.length < 2) return <></>;

    const parseRow = (row: string) =>
      row.split('|').map(cell => cell.trim()).filter(cell => cell.length > 0);

    const headers = parseRow(rows[0]);
    const dataRows = rows.slice(2).map(parseRow); // Skip separator row

    return (
      <div key={key} className="my-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-600">
              {headers.map((header, i) => (
                <th key={i} className="text-left py-2 px-3 text-blue-300 font-semibold text-sm">
                  {header.replace(/\*\*/g, '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-700/50">
                {row.map((cell, j) => (
                  <td key={j} className="py-2 px-3 text-gray-300 text-sm">
                    {processInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  lines.forEach(processLine);

  // Handle any remaining table
  if (inTable && tableRows.length > 0) {
    elements.push(renderTable(tableRows, 'table-final'));
  }

  return <div className="space-y-1">{elements}</div>;
};

interface MessageBubbleProps {
  message: Message;
  onToggleExpansion: (messageId: string) => void;
  onToggleFavorite?: (messageId: string, text: string) => void;
  isFavorited?: boolean;
  onCreateVisualization?: (messageId: string, messageText: string) => void;
  onViewVisualization?: (messageId: string) => void;
  visualizationState?: any;
  onReply?: (messageId: string, messageText: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onToggleExpansion,
  onToggleFavorite,
  isFavorited = false,
  onCreateVisualization,
  onViewVisualization,
 visualizationState,
 onReply
}) => {
  const [copied, setCopied] = useState(false);
  const isLongMessage = message.text.length > 800;
  const shouldTruncate = isLongMessage && !message.isExpanded;

  // Check if message has visualization data stored in database
  const hasStoredVisualization = message.visualization || message.hasStoredVisualization;
  const hasVisualization = hasStoredVisualization || visualizationState?.hasVisualization;

  // Check if this is an Astra message (can be replied to)
  const isAstraMessage = message.messageType === 'astra' || (!message.isUser && !message.isCentered);

  // Check if this is a reply message
  const isReplyMessage = message.isReply || message.text.startsWith('@reply ');

  // Extract reply content if this is a reply message
  const getReplyContent = () => {
    if (isReplyMessage && message.text.startsWith('@reply ')) {
      const parts = message.text.split(' ');
      if (parts.length >= 3) {
        return parts.slice(2).join(' '); // Remove "@reply" and messageId
      }
    }
    return message.text;
  };

  // Get the base text content (handle reply messages)
  const baseText = isReplyMessage ? getReplyContent() : message.text;

  // Apply truncation if needed
  const truncatedText = shouldTruncate
    ? baseText.substring(0, 800) + '...'
    : baseText;

  // Check for line-based truncation
  const lines = truncatedText.split('\n');
  const shouldShowMore = lines.length > 15 && !message.isExpanded;
  const finalText = shouldShowMore
    ? lines.slice(0, 15).join('\n') + '...'
    : truncatedText;

  // Handle copy text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Special styling for centered welcome message
  if (message.isCentered) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="flex items-start w-full max-w-3xl" data-tour="astra-welcome-message">
          <div className="flex-shrink-0 mr-2 md:mr-3 mt-1">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm md:text-lg">
              🚀
            </div>
          </div>

          <div className="flex-1 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-sm">
            <div className="break-words text-sm md:text-sm leading-relaxed">
              <div className="whitespace-pre-wrap text-gray-300">{finalText}</div>
            </div>

            <div className="text-xs opacity-70 mt-1 md:mt-2">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-3 md:mb-4">
      <div className="flex items-start w-full max-w-3xl">
        {!message.isUser && (
          <div className="flex-shrink-0 mr-2 md:mr-3 mt-1">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm md:text-lg">
              🚀
            </div>
          </div>
        )}

        {message.isUser && (
          <div className="flex-shrink-0 w-6 md:w-8 mr-2 md:mr-3"></div>
        )}

        <div className={`flex-1 rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-sm ${
          message.isUser
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
            : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white'
        }`}>
        <div className="break-words text-sm md:text-sm leading-relaxed">
          {message.isUser ? (
            <>
              {isReplyMessage && (
                <div className="text-xs text-blue-300 mb-2 opacity-80">
                  💬 Reply
                </div>
              )}
              <div className="whitespace-pre-wrap">{finalText}</div>
            </>
          ) : (
            formatMessageText(finalText)
          )}
        </div>
        
        {(isLongMessage || shouldShowMore) && (
          <button
            onClick={() => onToggleExpansion(message.id)}
            className="text-xs underline mt-1 md:mt-2 opacity-90 hover:opacity-100 transition-opacity"
          >
            {message.isExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}

        <div className="text-xs opacity-70 mt-1 md:mt-2">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
        
        {/* Favorite button for user messages */}
        {message.isUser && onToggleFavorite && (
          <div className="mt-2 md:mt-3">
            <button
              onClick={() => onToggleFavorite(message.id, message.text)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 min-h-[44px] touch-manipulation ${
                isFavorited
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
              title={isFavorited ? 'Remove from saved prompts' : 'Save prompt'}
            >
              <Bookmark className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              <span>{isFavorited ? 'Saved' : 'Save Prompt'}</span>
            </button>
          </div>
        )}

        {/* Action buttons for Astra messages: Reply, Copy, Visualization */}
        {!message.isUser && message.chatId && (
          <div className="mt-2 md:mt-3 flex flex-wrap gap-2">
            {console.log('🔍 MessageBubble: Rendering action buttons for chatId:', message.chatId, 'visualizationState:', visualizationState)}

            {/* Reply button */}
            {isAstraMessage && !message.isCentered && onReply && (
              <button
                onClick={() => onReply(message.chatId || message.id, message.text)}
                className="flex items-center justify-center space-x-1 md:space-x-2 bg-gray-600/50 hover:bg-blue-600/50 hover:text-blue-300 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 min-h-[44px] touch-manipulation"
                title="Reply to this message"
              >
                <Reply className="w-4 h-4" />
                <span className="hidden sm:inline">Reply</span>
                <span className="sm:hidden">Reply</span>
              </button>
            )}

            {/* Copy button */}
            {onCreateVisualization && onViewVisualization && (
              <button
                onClick={handleCopyText}
                className="flex items-center justify-center space-x-1 md:space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 min-h-[44px] touch-manipulation"
                title="Copy message text"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copied!</span>
                    <span className="sm:hidden">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copy Text</span>
                    <span className="sm:hidden">Copy</span>
                  </>
                )}
              </button>
            )}

            {/* Visualization button */}
            {onCreateVisualization && onViewVisualization && (
              <VisualizationButton
                messageId={message.chatId}
                messageText={message.text}
                onCreateVisualization={onCreateVisualization}
                onViewVisualization={onViewVisualization}
                visualizationState={visualizationState}
              />
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};