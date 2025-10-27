import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Smile, X, Reply, Image, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ReplyState {
  isReplying: boolean;
  originalMessage: {
    id: string;
    content: string;
    userName: string;
    timestamp: string;
  } | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, imageData?: { url: string; filename: string; size: number }) => void;
  disabled: boolean;
  placeholder?: string;
  users?: User[];
  replyState?: ReplyState;
  onCancelReply?: () => void;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Type a message... Use @astra for AI Intelligence",
  users = [],
  replyState,
  onCancelReply
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);

  // Debug: Check if onSend prop is received
  useEffect(() => {
    console.log('🔧 MentionInput: Component mounted, onSend type:', typeof onSend);
    console.log('🔧 MentionInput: onSend function:', onSend);
  }, [onSend]);

  // Add Astra to the users list
  const allUsers = [
    { id: 'astra', name: 'Astra', email: 'astra@rockethub.ai' },
    ...users
  ];

  // Filter users based on mention query
  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('🔧 MentionInput: Input changed:', e.target.value);
    console.log('🔧 MentionInput: onChange prop type:', typeof onChange);
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  // Handle key presses
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    console.log('🚀 MentionInput: Key pressed:', e.key, 'showMentions:', showMentions, 'value:', value);
    
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filteredUsers[selectedMentionIndex]) {
          insertMention(filteredUsers[selectedMentionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('🚀 MentionInput: Enter key pressed, calling handleSubmit');
      console.log('🚀 MentionInput: Current state - value:', value, 'disabled:', disabled, 'onSend type:', typeof onSend);
      handleSubmit();
    }
  };

  // Insert mention into text
  const insertMention = (user: User) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
      const properCaseName = user.name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      const newValue = `${beforeMention}@${properCaseName} ${textAfterCursor}`;
      const newCursorPos = beforeMention.length + properCaseName.length + 2;
      
      onChange(newValue);
      setShowMentions(false);
      
      // Set cursor position after mention
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    console.log('🚀 MentionInput: handleSubmit called');
    console.log('🚀 MentionInput: value:', value);
    console.log('🚀 MentionInput: value.trim():', value.trim());
    console.log('🚀 MentionInput: disabled:', disabled);
    console.log('🚀 MentionInput: onSend type:', typeof onSend);
    console.log('🚀 MentionInput: onSend function:', onSend);
    
    if ((value.trim() || selectedImage) && !disabled && !uploadingImage) {
      console.log('🚀 MentionInput: Conditions met, calling onSend with value:', value);
      
      let imageData = undefined;
      
      // Upload image if selected
      if (selectedImage) {
        setUploadingImage(true);
        try {
          const fileExt = selectedImage.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `team-chat-images/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(filePath, selectedImage.file);
          
          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            alert('Failed to upload image. Please try again.');
            return;
          }
          
          const { data: urlData } = supabase.storage
            .from('chat-media')
            .getPublicUrl(filePath);
          
          imageData = {
            url: urlData.publicUrl,
            filename: selectedImage.file.name,
            size: selectedImage.file.size
          };
          
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
          return;
        } finally {
          setUploadingImage(false);
        }
      }
      
      onSend(value || '', imageData);
      setShowEmojiPicker(false);
      setSelectedImage(null);
    } else {
      console.log('🚀 MentionInput: Conditions NOT met - not sending');
      console.log('🚀 MentionInput: Has trimmed value:', !!value.trim());
      console.log('🚀 MentionInput: Not disabled:', !disabled);
      console.log('🚀 MentionInput: Has selected image:', !!selectedImage);
      console.log('🚀 MentionInput: Not uploading:', !uploadingImage);
    }
  };

  // Test button click
  const handleButtonClick = async () => {
    console.log('🚀 MentionInput: Send button clicked!');
    console.log('🚀 MentionInput: Button click - value:', value);
    console.log('🚀 MentionInput: Button click - disabled:', disabled);
    console.log('🚀 MentionInput: Button click - hasValue:', !!value.trim());
    await handleSubmit();
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file only.');
      return;
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB. Please choose a smaller image.');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage({
        file,
        preview: e.target?.result as string
      });
    };
    reader.readAsDataURL(file);
    
    // Clear the input
    event.target.value = '';
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  // Common emojis for quick access
  const commonEmojis = [
    // Faces & Expressions
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲',
    '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱',
    '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😴', '😪', '😵',
    
    // Cool & Fun
    '😎', '🤠', '🥳', '🤡', '🤖', '👻', '💀', '☠️', '👽', '👾',
    '🎭', '🎪', '🎨', '🎬', '🎤', '🎧', '🎵', '🎶', '🎸', '🥁',
    
    // Hands & Gestures
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌',
    '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '💅',
    
    // Hearts & Love
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    
    // Symbols & Effects
    '✨', '🎉', '🎊', '🔥', '💯', '⭐', '🌟', '💫', '⚡', '💥',
    '💢', '💨', '💦', '💤', '🕳️', '💣', '💡', '🔔', '🔕', '📢',
    
    // Transportation & Space
    '🚀', '🛸', '✈️', '🚁', '🚂', '🚗', '🏎️', '🚓', '🚑', '🚒',
    '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹',
    
    // Nature & Weather
    '🌈', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️',
    '☃️', '⛄', '🌬️', '💨', '🌪️', '🌊', '💧', '☔', '⚡', '🔥',
    
    // Food & Drinks
    '🍕', '🍔', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳',
    '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍟', '🍿',
    '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃',
    
    // Activities & Sports
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁',
    
    // Objects & Tools
    '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀',
    '📱', '☎️', '📞', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️'
  ];

  // Insert emoji at cursor position
  const insertEmoji = (emoji: string) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const newValue = textBeforeCursor + emoji + textAfterCursor;
    const newCursorPos = cursorPosition + emoji.length;
    
    onChange(newValue);
    setCursorPosition(newCursorPos);
    
    // Set cursor position after emoji
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Check if @astra is mentioned (disable emojis for AI queries)
  const hasAstraMention = value.toLowerCase().includes('@astra');

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Close mentions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionsRef.current && !mentionsRef.current.contains(event.target as Node)) {
        setShowMentions(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        // Only close emoji picker if clicking outside AND not on the emoji button
        const target = event.target as Element;
        const isEmojiButton = target.closest('button')?.querySelector('svg')?.classList.contains('lucide-smile');
        if (!isEmojiButton) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      
      {/* Reply Preview */}
      {replyState?.isReplying && replyState.originalMessage && (
        <div className="mb-3 bg-gray-800 border border-gray-600 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Reply className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">
                  Replying to {replyState.originalMessage.userName}
                </span>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2">
                {replyState.originalMessage.content.length > 100 
                  ? replyState.originalMessage.content.substring(0, 100) + '...'
                  : replyState.originalMessage.content
                }
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="p-1 hover:bg-gray-700 rounded transition-colors ml-2"
              title="Cancel reply"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="mb-3 bg-gray-800 border border-gray-600 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={selectedImage.preview}
                alt="Selected image"
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <p className="text-sm font-medium text-white">{selectedImage.file.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeSelectedImage}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Mentions dropdown */}
      {showMentions && filteredUsers.length > 0 && (
        <div
          ref={mentionsRef}
          className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
        >
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors flex items-center space-x-3 ${
                index === selectedMentionIndex ? 'bg-gray-700' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                user.id === 'astra' 
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-600 text-white'
              }`}>
                {user.id === 'astra' ? '🚀' : user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{user.name}</div>
                <div className="text-gray-400 text-xs">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && !hasAstraMention && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 z-50 max-h-64 overflow-y-auto"
        >
          <div className="grid grid-cols-10 gap-2">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => insertEmoji(emoji)}
                className="text-xl hover:bg-gray-700 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="relative">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full resize-none rounded-2xl border border-gray-600 bg-gray-800 text-white px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-gray-700 disabled:cursor-not-allowed max-h-32 min-h-[72px] text-sm leading-relaxed placeholder-gray-400 ${
              hasAstraMention ? 'pr-12' : 'pr-20'
            }`}
            rows={3}
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#3b82f6 #374151'
            }}
          />
          
          {/* Buttons inside input */}
          <div className="absolute right-3 bottom-3 flex items-center space-x-2">
            {/* Image upload button */}
            {!hasAstraMention && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="text-gray-400 hover:text-gray-300 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add image"
              >
                {uploadingImage ? (
                  <Upload className="w-4 h-4 animate-pulse" />
                ) : (
                  <Image className="w-4 h-4" />
                )}
              </button>
            )}
            
            {!hasAstraMention && (
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-400 hover:text-gray-300 transition-colors p-1"
              >
                <Smile className="w-4 h-4 text-gray-400" />
              </button>
            )}
            
            <button
              onClick={handleButtonClick}
              disabled={disabled || (!value.trim() && !selectedImage) || uploadingImage}
              className="text-blue-500 hover:text-blue-400 disabled:text-gray-500 transition-colors disabled:cursor-not-allowed p-1"
            >
              {uploadingImage ? (
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};