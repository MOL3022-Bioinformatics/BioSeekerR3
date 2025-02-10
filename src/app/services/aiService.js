// services/aiService.js
const AI_MODE = process.env.NEXT_PUBLIC_AI_MODE || 'local';

export async function sendMessageToAI(message) {
  if (AI_MODE === 'local') {
    return callLocalAPI(message);
  } else {
    return 'Cloud not implemented in this example';
  }
}

async function callLocalAPI(message) {
  const res = await fetch('/api/localLLM', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) {
    throw new Error('Local AI request failed');
  }
  const data = await res.json();
  return data.reply;
}
