import { useState, useEffect, useRef } from "react";
import { sendMessageToAI } from '../services/aiService';
import { SendHorizontal } from "lucide-react";

const ChatPanel = ({ onSendMessage = () => {} }) => {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your specialized gene/protein chatbot. Enter a UniProt ID (e.g. "CMT2_ARATH") to visualize it, or ask me any questions about genes and proteins.'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const trimmedInput = inputValue.trim();
    
    // Add user message to chat
    const userMessage = { role: 'user', content: trimmedInput };
    setChatHistory(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send to AI and get response
      const response = await sendMessageToAI(trimmedInput);
      const aiMessage = { role: 'assistant', content: response };
      setChatHistory(prev => [...prev, aiMessage]);
      onSendMessage(trimmedInput); // Notify parent if needed
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
<div className="flex flex-col h-full bg-[#212121] text-gray-200 rounded-lg overflow-hidden">
  {/* Chat Messages Container */}
  <div 
    ref={chatContainerRef}
    className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#212121]"
    style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#424242 transparent'
    }}
  >
    {chatHistory.map((msg, index) => (
      <div 
        key={index} 
        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-[75%] rounded-lg p-3 ${
          msg.role === 'user' 
            ? 'bg-[#303030] ml-auto' 
            : 'bg-[#303030] mr-auto'
        }`}>
          {msg.content}
        </div>
      </div>
    ))}
    {isLoading && (
      <div className="flex justify-start">
        <div className="max-w-[75%] rounded-lg p-3 bg-[#303030]">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Input Container */}
  <form 
    onSubmit={handleSend}
    className="border-t border-[#424242] p-4 bg-[#212121]"
  >
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type a message or UniProt ID..."
        className="flex-1 p-3 rounded-lg bg-[#303030] text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#424242]"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !inputValue.trim()}
        className={`p-3 rounded-lg ${
          isLoading || !inputValue.trim()
            ? 'bg-[#303030] cursor-not-allowed'
            : 'bg-[#303030] hover:bg-[#424242]'
        } transition-colors`}
      >
        <SendHorizontal size={20} />
      </button>
    </div>
  </form>
</div>
  );
};

export default ChatPanel;