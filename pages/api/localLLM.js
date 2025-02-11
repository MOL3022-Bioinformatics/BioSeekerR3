// pages/api/localLLM.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-r1:1.5b",
        prompt: message,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return res.status(200).json({ reply: data.response });

  } catch (error) {
    console.error('Error in local LLM handler:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}