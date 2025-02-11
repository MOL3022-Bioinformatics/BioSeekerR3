// src/app/components/ChatPanel.jsx
import { useState, useEffect, useRef } from "react";
import { sendMessageToAI } from '../services/aiService';
import { isUniProtID } from '../services/proteinServices';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SendHorizontal, Loader2, AlertCircle, 
  MessageSquare, Download, Copy, Trash2 
} from "lucide-react";


const ChatPanel = ({ onSendMessage = () => {}, onProteinVisualize = () => {} }) => {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your specialized gene/protein chatbot. Enter a UniProt ID (e.g. "CMT2_ARATH") to visualize it, or ask me any questions about genes and proteins.'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const trimmedInput = inputValue.trim();
    setError(null);
    
    // Add user message to chat
    const userMessage = { role: 'user', content: trimmedInput };
    setChatHistory(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Check if input is a UniProt ID
      if (isUniProtID(trimmedInput)) {
        // Add a system message indicating protein visualization
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: `I'll visualize the protein with UniProt ID: ${trimmedInput}`
        }]);
        
        // Trigger protein visualization
        await onProteinVisualize(trimmedInput);
      }

      // Send to AI and get response
      const response = await sendMessageToAI(trimmedInput);
      const aiMessage = { role: 'assistant', content: response };
      setChatHistory(prev => [...prev, aiMessage]);
      onSendMessage(trimmedInput);
    } catch (error) {
      console.error('Error in chat handling:', error);
      setError(error.message || 'An error occurred while processing your request');
      const errorMessage = { 
        role: 'assistant', 
        content: `Error: ${error.message || 'Failed to process your request. Please try again.'}` 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const MessageActions = ({ message, onCopy, onDelete }) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute right-0 top-0 mt-1 mr-1 opacity-0 group-hover:opacity-100 
                flex space-x-1"
    >
      <button
        onClick={() => onCopy(message)}
        className="p-1 rounded hover:bg-[var(--chat-bg)] text-[var(--text-color)]
                  transition-colors"
        title="Copy message"
      >
        <Copy size={14} />
      </button>
      <button
        onClick={() => onDelete(message)}
        className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"
        title="Delete message"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
  
  const MessageBubble = ({ message, type, onCopy, onDelete }) => (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`group relative max-w-[80%] rounded-lg p-3 ${
        type === 'user' 
          ? 'ml-auto bg-blue-600 text-white' 
          : 'mr-auto bg-[var(--chat-bg)] text-[var(--text-color)]'
      } shadow-md`}
    >
      <div className="whitespace-pre-wrap">{message}</div>
      <MessageActions message={message} onCopy={onCopy} onDelete={onDelete} />
    </motion.div>
  );
  
  const clearChat = () => {
    setChatHistory([{
      role: 'assistant',
      content: 'Chat history cleared. How can I help you?'
    }]);
  };
  
  const copyMessage = (message) => {
    navigator.clipboard.writeText(message);
    // Optional: Show a toast notification
  };
  
  const deleteMessage = (messageToDelete) => {
    setChatHistory(prev => prev.filter(msg => msg !== messageToDelete));
  };
  
  const exportChat = () => {
    const chatText = chatHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-history.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };  

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-[var(--text-color)] rounded-lg overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-[var(--chat-bg)] border-b border-gray-700">
        <h2 className="text-lg font-semibold">Protein Analysis Chat</h2>
        <p className="text-sm opacity-75">Enter a UniProt ID or ask questions about proteins</p>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearChat}
            className="p-2 rounded hover:bg-[var(--background)] transition-colors"
            title="Clear chat"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={exportChat}
            className="p-2 rounded hover:bg-[var(--background)] transition-colors"
            title="Export chat"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--chat-bg) var(--background)'
        }}
      >
        {chatHistory.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <MessageBubble 
              message={msg.content} 
              type={msg.role === 'user' ? 'user' : 'assistant'} 
            />
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-[var(--chat-bg)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-color)]" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form 
        onSubmit={handleSend}
        className="border-t border-gray-700 p-4 bg-[var(--chat-bg)]"
      >
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter UniProt ID or ask a question..."
            className="flex-1 p-3 rounded-lg bg-[var(--background)] text-[var(--text-color)] 
                     placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`p-3 rounded-lg transition-colors ${
              isLoading || !inputValue.trim()
                ? 'bg-[var(--chat-bg)] cursor-not-allowed opacity-50'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizontal className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Helper text */}
        <div className="mt-2 text-sm text-gray-400">
          Tip: Enter a UniProt ID (e.g., CMT2_ARATH) to visualize a protein structure
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;