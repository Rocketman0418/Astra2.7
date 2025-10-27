import React from 'react';
import { BarChart3, Check, RefreshCw, Trash2, Plus, Reply } from 'lucide-react';
import { GroupMessage as GroupMessageType } from '../types';

interface Reaction {
  emoji: string;
  label: string;
  count: number;
  users: string[];
}

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  onClose: () => void;
}

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onReact, onClose }) => {
  const reactions = [
    { emoji: '🚀', label: 'Rocket' },
    { emoji: '😂', label: 'Laughing' },
    { emoji: '🙏', label: 'Thank You' },
    { emoji: '🤷', label: "I don't know" },
    { emoji: '😢', label: 'Crying' }
  ];

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-2 z-50">
      <div className="flex space-x-2">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            onClick={() => {
              onReact(reaction.emoji);
              onClose();
            }}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-xl"
            title={reaction.label}
          >
            {reaction.emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

interface GroupMessageProps {
  message: GroupMessageType;
  currentUserId: string;
  currentUserEmail: string;
  isCurrentUserAdmin?: boolean;
  onViewVisualization?: (messageId: string, visualizationData: string) => void;
  onCreateVisualization?: (messageId: string, messageContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string, messageContent: string, userName: string, timestamp: string) => void;
  visualizationState?: any;
}

const formatMessageContent = (content: string, mentions: string[], isAstraMessage: boolean = false): JSX.Element => {
  if (isAstraMessage) {
    // Use the same formatting logic as private chat for Astra messages
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines but add spacing
      if (!trimmedLine) {
        elements.push(<br key={`br-${index}`} />);
        return;
      }
      
      // Handle numbered lists (1. 2. 3. etc.)
      const numberedListMatch = trimmedLine.match(/^(\d+)\.\s*\*\*(.*?)\*\*:\s*(.*)$/);
      if (numberedListMatch) {
        const [, number, title, content] = numberedListMatch;
        elements.push(
          <div key={index} className="mb-4">
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {number}
              </span>
              <div className="flex-1">
                <div className="font-bold text-blue-300 mb-1">{title}</div>
                <div className="text-gray-300 leading-relaxed">{content}</div>
              </div>
            </div>
          </div>
        );
        return;
      }
      
      // Handle regular bold text
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(trimmedLine)) {
        const parts = trimmedLine.split(boldRegex);
        const formattedParts = parts.map((part, partIndex) => {
          if (partIndex % 2 === 1) {
            return <strong key={partIndex} className="font-bold text-blue-300">{part}</strong>;
          }
          return part;
        });
        elements.push(<div key={index} className="mb-2">{formattedParts}</div>);
        return;
      }
      
      // Handle bullet points
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        elements.push(
          <div key={index} className="flex items-start space-x-2 mb-2 ml-4">
            <span className="text-blue-400 mt-1">•</span>
            <span className="text-gray-300">{trimmedLine.substring(1).trim()}</span>
          </div>
        );
        return;
      }
      
      // Regular text
      elements.push(<div key={index} className="mb-2 text-gray-300">{trimmedLine}</div>);
    });
    
    return <div>{elements}</div>;
  }

  // Format user messages with bold @mentions - handle both manual typing and dropdown selections
  const mentionRegex = /@([A-Za-z]+(?:\s+[A-Za-z]+)*?)(?=\s|$)/g;
  const parts = content.split(mentionRegex);
  
  const formattedParts = parts.map((part, index) => {
    // Every odd index is a captured mention name
    if (index % 2 === 1) {
      // Normalize the mention to proper case for display
      const normalizedMention = part.toLowerCase() === 'astra' ? 'Astra' :
        part.toLowerCase() === 'derek' || part.toLowerCase() === 'derek tellier' ? 'Derek Tellier' :
        part.toLowerCase() === 'marshall' || part.toLowerCase() === 'marshall briggs' ? 'Marshall Briggs' :
        part; // Keep original if no match
        
      return (
        <span 
          key={index} 
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold px-2 py-1 rounded-md shadow-lg border border-blue-400/50 inline-block"
        >
          @{normalizedMention}
        </span>
      );
    }
    return part;
  });
  
  return (
    <span className="text-gray-300">
      {formattedParts}
    </span>
  );
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

export const GroupMessage: React.FC<GroupMessageProps> = ({
  message,
  currentUserId,
  currentUserEmail,
  isCurrentUserAdmin = false,
  onViewVisualization,
  onCreateVisualization,
  onDeleteMessage,
  onReact,
  onReply,
  visualizationState
}) => {
  const isOwnMessage = message.user_id === currentUserId;
  const isAstraMessage = message.message_type === 'astra';
  const isReplyMessage = message.metadata?.reply_to_message_id;
  const hasVisualization = message.visualization_data || visualizationState?.hasVisualization;
  const isGeneratingVisualization = visualizationState?.isGenerating || false;
  const [showReactionPicker, setShowReactionPicker] = React.useState(false);
  const [reactions, setReactions] = React.useState<Reaction[]>([]);
  
  // Allow visualization creation if:
  // 1. It's an Astra message AND
  // 2. Either the current user asked the question OR the current user's email matches
  const currentUserName = currentUserEmail?.split('@')[0];
  const canCreateVisualization = isAstraMessage && (
    message.metadata?.asked_by_user_name === currentUserName ||
    message.user_email === currentUserEmail ||
    // Also check if the astra_prompt was asked by current user (fallback)
    (message.astra_prompt && message.metadata?.original_user_message_id)
  );
  
  // Message expansion logic
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isLongMessage = message.message_content.length > 300;
  const shouldTruncate = isLongMessage && !isExpanded;
  const displayText = shouldTruncate 
    ? message.message_content.substring(0, 300) + '...'
    : message.message_content;

  const lines = displayText.split('\n');
  const shouldShowMore = lines.length > 5 && !isExpanded;
  const finalText = shouldShowMore 
    ? lines.slice(0, 5).join('\n') + '...'
    : displayText;

  const getButtonText = () => {
    if (isGeneratingVisualization) {
      return 'Generating...';
    }
    if (hasVisualization || visualizationState?.hasVisualization) {
      return 'View Visualization';
    }
    return 'Create Visualization';
  };

  const handleVisualizationClick = () => {
    if (isGeneratingVisualization) {
      return; // Don't allow clicks while generating
    }
    
    if (hasVisualization && onViewVisualization) {
      onViewVisualization(message.id, message.visualization_data || undefined);
    } else if (visualizationState?.hasVisualization && onViewVisualization) {
      onViewVisualization(message.id, undefined);
    } else if (isAstraMessage && onCreateVisualization && canCreateVisualization) {
      onCreateVisualization(message.id, message.message_content);
    }
  };

  const handleDeleteMessage = () => {
    if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      onDeleteMessage?.(message.id);
    }
  };

  const handleReact = (emoji: string) => {
    if (onReact) {
      onReact(message.id, emoji);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message.id, message.message_content, message.user_name, message.created_at);
    }
  };

  // Mock reactions data - in a real app, this would come from the database
  React.useEffect(() => {
    // Initialize with any existing reactions from message metadata
    if (message.metadata?.reactions) {
      setReactions(message.metadata.reactions);
    }
  }, [message.metadata?.reactions]);

  return (
    <div className={`flex mb-4 ${isOwnMessage && !isAstraMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {(!isOwnMessage || isAstraMessage) && (
        <div className="flex-shrink-0 mr-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isAstraMessage 
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
              : 'bg-gray-600 text-white'
          }`}>
            {isAstraMessage ? '🚀' : message.user_name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[70%] ${isOwnMessage && !isAstraMessage ? 'ml-auto' : ''}`}>
        {/* User name and timestamp */}
        {(!isOwnMessage || isAstraMessage) && (
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-sm font-medium ${
              isAstraMessage ? 'text-blue-300' : 'text-gray-300'
            }`}>
              {message.user_name}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(message.created_at)}
            </span>
          </div>
        )}

        {/* Message bubble container */}
        <div className="relative group">
          {/* Message bubble */}
          <div className={`rounded-2xl px-4 py-3 ${
            isOwnMessage && !isAstraMessage
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
              : isAstraMessage
              ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-white border border-blue-500/20'
              : 'bg-gray-700 text-white'
          } relative`}>
            {/* Admin Delete Button */}
            {isCurrentUserAdmin && onDeleteMessage && (
              <button
                onClick={handleDeleteMessage}
                className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all duration-200"
                title="Delete message (Admin only)"
              >
                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
              </button>
            )}

            {/* Reply to Original Message Display */}
            {isReplyMessage && message.metadata?.reply_to_message && (
              <div className="mb-3 pb-3 border-l-4 border-blue-500 pl-3 bg-gray-800/50 rounded-r-lg">
                <div className="flex items-center space-x-2 mb-1">
                  <Reply className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">
                    Replying to {message.metadata.reply_to_message.userName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(message.metadata.reply_to_message.timestamp)}
                  </span>
                </div>
                <div className="text-sm text-gray-400 italic line-clamp-2">
                  {message.metadata.reply_to_message.content.length > 100 
                    ? message.metadata.reply_to_message.content.substring(0, 100) + '...'
                    : message.metadata.reply_to_message.content
                  }
                </div>
              </div>
            )}

            {/* Show original prompt for Astra messages */}
            {isAstraMessage && message.astra_prompt && (
              <div className="mb-3 pb-3 border-b border-gray-600/50">
                <div className="text-xs text-gray-400 mb-1">Responding to:</div>
                <div className="text-sm text-gray-300 italic">"{message.astra_prompt}"</div>
                <div className="text-xs text-blue-300 mt-1">Asked by {message.metadata?.asked_by_user_name || 'Unknown User'}</div>
              </div>
            )}

            {/* Image Display */}
            {message.metadata?.image && (
              <div className="mt-3 mb-3">
                <img
                  src={message.metadata.image.url}
                  alt={message.metadata.image.filename}
                  className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    // Open image in modal - we'll implement this next
                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                    modal.onclick = () => modal.remove();
                    
                    const img = document.createElement('img');
                    img.src = message.metadata.image.url;
                    img.className = 'max-w-full max-h-full object-contain';
                    img.onclick = (e) => e.stopPropagation();
                    
                    const closeBtn = document.createElement('button');
                    closeBtn.innerHTML = '×';
                    closeBtn.className = 'absolute top-4 right-4 text-white text-3xl hover:text-gray-300';
                    closeBtn.onclick = () => modal.remove();
                    
                    modal.appendChild(img);
                    modal.appendChild(closeBtn);
                    document.body.appendChild(modal);
                  }}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {message.metadata.image.filename} • {(message.metadata.image.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}

            <div className="break-words text-sm leading-relaxed">
              {isOwnMessage && !isAstraMessage ? (
                <div className="whitespace-pre-wrap">{formatMessageContent(finalText, message.mentions, false)}</div>
              ) : (
                formatMessageContent(finalText, message.mentions, isAstraMessage)
              )}
            </div>
            
            {/* Show More/Less button */}
            {(isLongMessage || shouldShowMore) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs underline mt-2 opacity-90 hover:opacity-100 transition-opacity"
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </button>
            )}

            {/* Visualization button for Astra messages */}
            {isAstraMessage && (onViewVisualization || (onCreateVisualization && canCreateVisualization)) && (
              <div className="mt-3">
                <button
                  onClick={handleVisualizationClick}
                  disabled={isGeneratingVisualization || (!hasVisualization && !visualizationState?.hasVisualization && !canCreateVisualization)}
                  className={`flex items-center space-x-2 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 transform disabled:cursor-not-allowed ${
                    isGeneratingVisualization
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 animate-pulse cursor-not-allowed'
                      : (hasVisualization || visualizationState?.hasVisualization)
                      ? 'bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-[length:200%_100%] animate-[gradient_3s_ease-in-out_infinite] hover:scale-105 shadow-lg'
                      : canCreateVisualization
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105'
                      : 'bg-gray-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  {(hasVisualization || visualizationState?.hasVisualization) && !isGeneratingVisualization ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <BarChart3 className={`w-4 h-4 ${isGeneratingVisualization ? 'animate-spin' : ''}`} />
                  )}
                  <span>{getButtonText()}</span>
                  {isGeneratingVisualization && (
                    <div className="flex space-x-1 ml-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  )}
                </button>
                
                {/* Retry button - only show when visualization exists */}
                {(hasVisualization || visualizationState?.hasVisualization) && !isGeneratingVisualization && onCreateVisualization && canCreateVisualization && (
                  <button
                    onClick={() => onCreateVisualization(message.id, message.message_content)}
                    className="flex items-center space-x-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 ml-2"
                    title="Generate a new visualization"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span className="hidden sm:inline">Retry</span>
                  </button>
                )}
              </div>
            )}

            {/* Timestamp for own messages */}
            {isOwnMessage && !isAstraMessage && (
              <div className="text-xs opacity-70 mt-2">
                {formatTime(message.created_at)}
              </div>
            )}
          </div>

          {/* React button - only show for messages from other users */}
          {!isOwnMessage && (onReact || onReply) && (
            <div className="absolute top-2 -right-16 flex space-x-1">
              {/* Reply button */}
              {onReply && (
                <button
                  onClick={handleReply}
                  className="opacity-0 group-hover:opacity-100 bg-gray-600 hover:bg-blue-600 text-white p-2 rounded-full transition-all duration-200 shadow-lg"
                  title="Reply to message"
                >
                  <Reply className="w-4 h-4" />
                </button>
              )}
              
              {/* React button */}
              {onReact && (
              <div className="relative">
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="opacity-0 group-hover:opacity-100 bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-full transition-all duration-200 shadow-lg"
                  title="React to message"
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                {showReactionPicker && (
                  <ReactionPicker
                    onReact={handleReact}
                    onClose={() => setShowReactionPicker(false)}
                  />
                )}
              </div>
              )}
            </div>
          )}
        </div>

        {/* Display existing reactions */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {reactions.map((reaction, index) => (
              <button
                key={index}
                onClick={() => handleReact(reaction.emoji)}
                className="flex items-center space-x-1 bg-gray-600/50 hover:bg-gray-600 rounded-full px-2 py-1 text-xs transition-colors"
                title={`${reaction.users.join(', ')} reacted with ${reaction.label}`}
              >
                <span>{reaction.emoji}</span>
                <span className="text-gray-300">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};