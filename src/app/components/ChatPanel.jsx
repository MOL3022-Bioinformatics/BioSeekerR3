// components/ChatPanel.jsx

import React, { useState } from 'react';
import { sendMessageToAI } from '../services/aiService';

export default function ChatPanel({ onSequenceSubmit }) {
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your specialized gene/protein chatbot. ' +
        'Enter a UniProt ID (e.g., "CMT2_ARATH") to visualize it, ' +
        'or ask any questions about genes/proteins.'
    }
  ]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Optionally detect a UniProt-like string. For MVP, just call onSequenceSubmit anyway:
    onSequenceSubmit(inputValue);

    const userMessage = { role: 'user', content: inputValue };
    setChatHistory((prev) => [...prev, userMessage]);

    try {
      const response = await sendMessageToAI(inputValue);
      const aiMessage = { role: 'assistant', content: response };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('ChatPanel error:', err);
    }

    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className="mb-4">
            <strong>{msg.role === 'user' ? 'User' : 'AI'}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-300 flex">
        <input
          className="flex-grow border border-gray-300 p-2 mr-2"
          type="text"
          placeholder="Type a message or UniProt ID..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2"
          onClick={handleSendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
