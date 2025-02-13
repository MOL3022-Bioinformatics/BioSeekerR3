// services/aiService.js

export async function sendMessageToAI(message) {
  const response = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'AI request failed');
  }

  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    throw new Error('Expected event stream');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return {
    async* [Symbol.asyncIterator]() {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.text) {
                  yield data.text;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }
  };
}

export function processCommand(input) {
  const match = input.match(/^\/(\w+)\s+(.+)/);
  if (!match) return null;
  return { command: match[1], args: match[2].trim() };
}