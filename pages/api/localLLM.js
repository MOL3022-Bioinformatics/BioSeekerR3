// services/aiService.js
const AI_MODE = process.env.NEXT_PUBLIC_AI_MODE || 'local';

export async function sendMessageToAI(userMessage) {
  if (AI_MODE === 'local') {
    return sendMessageToLocalLLM(userMessage);
  } else {
    return sendMessageToCloudAI(userMessage);
  }
}

async function sendMessageToLocalLLM(message) {
  // Example calling a local endpoint (like Ollama or custom server)
  try {
    const response = await fetch('http://localhost:11411/api/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: message })
    });
    if (!response.ok) {
      throw new Error('Local AI request failed');
    }
    const data = await response.json();
    return data?.reply || '(No reply from local AI)';
  } catch (err) {
    console.error('Error calling local AI:', err);
    return 'Error: local AI is not reachable';
  }
}

async function sendMessageToCloudAI(message) {
  // Stubbed or real cloud call
  return `Cloud AI response for: "${message}"`;
}
