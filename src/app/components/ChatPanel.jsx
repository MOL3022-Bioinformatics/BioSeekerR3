// components/ChatPanel.jsx
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { sendMessageToAI } from '../services/aiService';
import { isUniProtID } from '../services/proteinServices';
import { quickReferenceCards } from '../../../data/quickReferenceCards';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SendHorizontal, Loader2, AlertCircle, 
  MessageSquare, Download, Copy, Trash2 
} from "lucide-react";

// Memoized message bubble component to prevent unnecessary re-renders
const MessageBubble = memo(({ message, type, onCopy, onDelete }) => (
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
    <div className="chat-message whitespace-pre-wrap break-words">{message}</div>
    {(onCopy || onDelete) && (
      <MessageActions message={message} onCopy={onCopy} onDelete={onDelete} />
    )}
  </motion.div>
));

MessageBubble.displayName = 'MessageBubble';

// Memoized message actions component
const MessageActions = memo(({ message, onCopy, onDelete }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="absolute right-0 top-0 mt-1 mr-1 opacity-0 group-hover:opacity-100 
              flex space-x-1"
  >
    {onCopy && (
      <button
        onClick={() => onCopy(message)}
        className="p-1 rounded hover:bg-[var(--chat-bg)] text-[var(--text-color)]
                  transition-colors"
        title="Copy message"
      >
        <Copy size={14} />
      </button>
    )}
    {onDelete && (
      <button
        onClick={() => onDelete(message)}
        className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"
        title="Delete message"
      >
        <Trash2 size={14} />
      </button>
    )}
  </motion.div>
));

MessageActions.displayName = 'MessageActions';

// Function to process commands
const processCommand = (input) => {
  const match = input.match(/^\/(\w+)\s+(.+)/);
  if (!match) return null;
  return { command: match[1], args: match[2].trim() };
};




const ChatPanel = ({ onSendMessage = () => {}, onProteinVisualize = () => {} }) => {
  const [inputValue, setInputValue] = useState('');
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your specialized bioinformatics chatbot. Use commands like /protein [ID] to visualize proteins, or ask me any questions about genes and proteins.'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const [showQuickReference, setShowQuickReference] = useState(false);

  const [lastProtein, setLastProtein] = useState(null);
  const [lastUserMessage, setLastUserMessage] = useState(null);
  const [lastAIResponse, setLastAIResponse] = useState(null);



  // Improved scroll handling
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    if (chatHistory.length > 1) {
      const lastAssistantMessage = chatHistory[chatHistory.length - 1];
      setLastAIResponse(lastAssistantMessage.content);
    }
  }, [chatHistory]);
  

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, currentStreamedMessage, scrollToBottom]);
  
  const handleCommand = async (command, args) => {

    switch (command) {
      case 'protein': {
        if (isUniProtID(args)) {
          const metadata = await onProteinVisualize(args);
          
          if (!metadata) { 
            console.error("❌ Feil: Metadata ble ikke hentet.");
            //setChatHistory(prev => [...prev, { role: 'assistant', content: "Beklager, jeg klarte ikke å hente protein-informasjon." }]);
            return;
          }

          setLastProtein(metadata);


          const systemMessage = {
            role: 'system',
            content: `Visualizing protein with UniProt ID: ${args}.`
          };
          setChatHistory(prev => [...prev, systemMessage]);
          
const messageStream = await sendMessageToAI(
  `You are a bioinformatics expert, but your main task is to explain biological concepts in a **simple way**. 
  Assume the reader has **no background in biology**.

  🔬 **Protein Overview:**
  - **Name**: ${metadata.name}
  - **Organism**: ${metadata.organism}
  - **Function**: ${metadata.function}
  - **Sequence length**: ${metadata.length} amino acids
  - **PDB structure**: ${metadata.pdbId ? metadata.pdbId : "No structure available"}

  **Explain why this protein is important, how it works, why scientists study it and a funfact.**
  
  Keep your explanation **clear, and intuitive**.`, metadata
);
          
          let fullMessage = '';
          for await (const chunk of messageStream) {
            fullMessage += chunk + " ";
            setCurrentStreamedMessage(fullMessage);
          }

          // 🔹 Logg hele AI-outputen før rensing
          //console.log("📝 RAW AI OUTPUT:", fullMessage);

          // ✅ Rens outputen før den legges til chat-historikken
          const cleanedMessage = cleanText(fullMessage);
          //console.log("🧼 CLEANED AI OUTPUT:", cleanedMessage);


          setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: cleanedMessage
          }]);
          setCurrentStreamedMessage('');
          return null; // Return null to prevent double message
        }
        throw new Error('Invalid UniProt ID format');
      }
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  };

  const filterThinkingTags = (text) => {
    // Remove <think> tags and their content
    return text.replace(/<think>.*?<\/think>/gs, '')
               // Remove any remaining <think> or </think> tags
               .replace(/<\/?think>/g, '')
               // Clean up any double spaces or newlines created
               .replace(/\s+/g, ' ')
               .trim();
  };

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleSend = async (e) => {



    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const trimmedInput = inputValue.trim();
    setError(null);

    // Lagre brukerens siste melding
    setLastUserMessage(trimmedInput);
    
    // Add user message to chat
    const userMessage = { role: 'user', content: trimmedInput };
    setChatHistory(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const commandResult = processCommand(trimmedInput);

      if (commandResult) {
        const { command, args } = commandResult;


        const response = await handleCommand(command, args);
        if (response) { // Only add if handleCommand returns a message
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: response
          }]);
        }
      } else {
       
        // 🔹 Sjekk om vi har en aktiv protein-kontekst
        const metadata = lastProtein ? lastProtein : null;
        

        const previousUserMessage = lastUserMessage ? `User previously asked: "${lastUserMessage}".` : "";
        const previousAIResponse = lastAIResponse ? `AI last respond: "${lastAIResponse}".` : "";

        
        // Bygg en kontekstuell prompt for AI
        let prompt = `${previousAIResponse} Now the user asks: "${trimmedInput}".`;   
       
        if (metadata) {
          prompt = `We have been discussing the protein **${metadata.name}** (UniProt ID: ${metadata.id}) from **${metadata.organism}**.
          It is known for **${metadata.function}**.
          The sequence length is **${metadata.length} amino acids**.
          PDB structure: **${metadata.pdbId ? metadata.pdbId : "No structure available"}**.
          
          ${previousAIResponse} Now the user asks: "${trimmedInput}".`;
        }

        const messageStream = await sendMessageToAI(prompt, metadata);
        let fullMessage = '';
        
        for await (const chunk of messageStream) {
          // Filter thinking tags from chunk
          const filteredChunk = filterThinkingTags(chunk);
          if (filteredChunk) {
            fullMessage += filteredChunk + " ";
            setCurrentStreamedMessage(fullMessage);
          }
        }

        // 🔹 Logg hele AI-outputen før rensing
        //console.log("📝 RAW AI OUTPUT:", fullMessage);

// ✅ Rens outputen før den legges til chat-historikken
        const cleanedMessage = cleanText(fullMessage);
        //console.log("🧼 CLEANED AI OUTPUT:", cleanedMessage);
        
        if (fullMessage) {
          setLastAIResponse(fullMessage); // 🔹 Lagrer AI sitt svar
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            content: cleanedMessage 
          }]);
          
        }
        setCurrentStreamedMessage('');
      }
      
      onSendMessage(trimmedInput);
    } catch (error) {
      console.error('Error in chat handling:', error);
      setError(error.message || 'An error occurred while processing your request');
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to process your request. Please try again.'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  

  function cleanText(text) {
    return text
        // 🔹 Fjern dobbelte mellomrom
      .replace(/\s-\s/g, '-') // 🔹 Korriger feil splittede bindestreker
      .replace(/\s([.,!?])/g, '$1') // 🔹 Fjern mellomrom før punktum, komma, osv.
      .replace(/\bIns\sulin\b/gi, 'Insulin') // 🔹 Fikser "Ins ulin" → "Insulin"
      .replace(/\bsubstrate\s+(\d+)\b/gi, 'substrate $1') // 🔹 Fikser "substrate   1" → "substrate 1"
      .replace(/\bW\snt\b/gi, 'Wnt') // 🔹 Fikser "W nt" → "Wnt"
      .replace(/\bmultit\sasking\b/gi, 'multitasking') // 🔹 Fikser "multit asking" → "multitasking"
      .replace(/\btheWnt\b/gi, 'the Wnt') // 🔹 Fikser "theW nt" → "the Wnt"
      .trim();
  }
  

  return (
    <div className="flex flex-col h-full bg-[var(--background)] text-[var(--text-color)] rounded-lg overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="flex-none px-4 py-3 bg-[var(--chat-bg)] border-b border-gray-700">
        <h2 className="text-lg font-semibold">Protein Analysis Chat</h2>
        <p className="text-sm opacity-75">Use /protein [ID] to visualize proteins</p>
      </div>
      <button
        onClick={() => setShowQuickReference(true)}
        className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-md"
      >
        Quick Reference
      </button>

      {/* Messages Container - Updated styling */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--chat-bg) var(--background)',
          minHeight: '200px', // Ensure minimum height
          maxHeight: 'calc(100vh - 16rem)' // Prevent overflow
        }}
      >        
      <AnimatePresence initial={false}>
          {chatHistory.map((msg, index) => (
            <motion.div 
              key={index} 
              layout
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <MessageBubble 
                message={msg.content} 
                type={msg.role === 'user' ? 'user' : 'assistant'} 
              />
            </motion.div>
          ))}
          
          {currentStreamedMessage && (
            <motion.div 
              layout
              className="flex justify-start"
            >
              <MessageBubble 
                message={currentStreamedMessage} 
                type="assistant" 
              />
            </motion.div>
          )}
        </AnimatePresence>

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

      {showQuickReference && (
        <div className="quick-reference-modal">
          <div className="quick-reference-content">
            <h3>Quick Reference</h3>
            <div className="space-y-3">
              {Object.entries(quickReferenceCards).map(([key, value]) => (
                <div key={key} className="quick-reference-item">
                  <strong>{key}</strong>
                  <p>{value.split("🔍")[0]}</p> {/* Removes emoji from display */}
                  {value.includes("🔍") && (
                    <p className="example-question">
                      {value.split("🔍")[1]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowQuickReference(false)} 
              className="quick-reference-close">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Input Form - Made sticky */}
      <div className="flex-none sticky bottom-0 border-t border-gray-700 bg-[var(--chat-bg)]">
        <form onSubmit={handleSend} className="p-4">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type /protein [ID] or ask a question..."
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
          </form>
        </div>
    </div>
  );
};

export default ChatPanel;