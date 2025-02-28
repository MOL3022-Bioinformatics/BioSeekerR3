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

import ReactMarkdown from 'react-markdown';

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
    <div className="chat-message whitespace-pre-wrap break-words">
      <ReactMarkdown components={{
    ul: ({ node, ...props }) => <ul style={{ marginTop: '-40px' }} {...props} />,
    li: ({ node, ...props }) => <li style={{ marginBottom: '-25px' }} {...props} />,
  }}>{message}</ReactMarkdown>
    </div>

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
            console.error("Feil: Metadata ble ikke hentet.");           
            return;
          }

          setLastProtein(metadata);

          const systemMessage = {
            role: 'system',
            content: `Visualizing protein with UniProt ID: ${args}.`
          };
          setChatHistory(prev => [...prev, systemMessage]);

          return metadata; 
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

    let trimmedInput = inputValue.trim();
    setError(null);
    setIsLoading(true);

   
    setChatHistory(prev => {
        const updatedHistory = [...prev, { role: 'user', content: trimmedInput }];        
        return updatedHistory;
    });
    setInputValue('');

    try {
       
      const commandResult = processCommand(trimmedInput);
        let metadata = null;

        if (commandResult) {
            const { command, args } = commandResult;

            if (command === 'protein') {
                metadata = await handleCommand(command, args); // **Henter metadata**

                if (metadata) {
                    // 🎯 **Oppdater trimmedInput til å sende proteininformasjon til AI**
                    trimmedInput = `🔬 **Protein Overview:**
- **Name**: ${metadata.name}
- **Organism**: ${metadata.organism}
- **Function**: ${metadata.function}
- **Sequence length**: ${metadata.length} amino acids
- **PDB structure**: ${metadata.pdbId ? metadata.pdbId : "No structure available"}

**Explain why this protein is important, how it works, why scientists study it, and a fun fact.**  
Keep your explanation **clear and intuitive**.`;
                }
            }
        }

        let filteredContext = chatHistory
            .slice(-5) // Kun de siste 5 meldingene for å holde samtalen relevant
            .filter((msg, index, self) =>
                index === self.findIndex((m) => m.role === msg.role && m.content === msg.content)
            );

        

        
        if (lastAIResponse && lastAIResponse.trim()) {
            filteredContext.push({
                role: "system",
                content: `The user is responding to your previous question: "${lastAIResponse}". 
                          Please provide a direct answer before asking new questions. Stay on topic.`
            });
        }

        
        filteredContext.push({ role: 'user', content: trimmedInput });

        const proteinContext = metadata || lastProtein;
        if (proteinContext) { 
          filteredContext.push({
              role: "system",
              content: `We are discussing the protein **${proteinContext.name}** (UniProt ID: ${proteinContext.id}) from **${proteinContext.organism}**.
              - Function: ${proteinContext.function}
              - Length: ${proteinContext.length} amino acids
              - PDB structure: ${proteinContext.pdbId ? proteinContext.pdbId : "No structure available"}

              Stay on topic and answer user questions related to this protein first before introducing new concepts.`
          });
      }
        
        // 🎯 **Send til AI**
        const responseMessage = await sendMessageToAI(trimmedInput, filteredContext, proteinContext);

        // 🎯 **Oppdater chatten med AI-svaret**
        setChatHistory(prev => {
            const updatedHistory = [...prev, { role: 'assistant', content: responseMessage }];
            return updatedHistory;
        });
        setLastAIResponse(responseMessage); // 🎯 Husk siste AI-svar
    } catch (error) {       
        setError(error.message || 'An error occurred while processing your request');
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