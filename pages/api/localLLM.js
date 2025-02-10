// services/aiService.js
const AI_MODE = process.env.NEXT_PUBLIC_AI_MODE || 'local';

export default async function sendMessageToAI(userMessage) {
  if (AI_MODE === 'local') {
    return sendMessageToLocalLLM(userMessage);
  } else {
    return sendMessageToCloudAI(userMessage);
  }
}

async function sendMessageToLocalLLM(message) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', { // Updated port
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: "deepseek-r1:7b", prompt: message })
    });

    if (!response.ok) {
      throw new Error(`Local AI request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("AI Response:", data); // Debugging

    // Adjust this based on actual response structure
    return data?.text || '(No reply from local AI)';
  } catch (err) {
    console.error('Error calling local AI:', err);
    return 'Error: local AI is not reachable';
  }
}

async function sendMessageToCloudAI(message) {
  // Stubbed or real cloud call
  return `Cloud AI response for: "${message}"`;
}