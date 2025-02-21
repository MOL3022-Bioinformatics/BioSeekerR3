// pages/api/llm.js
export const config = {
  runtime: 'edge', // Enable Edge Runtime
};

const streamOllama = async (model, messages) => {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });
  return response;
};

const streamOpenAI = async (model, messages, apiKey) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });
  return response;
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await req.json();
    const { message } = body;
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const aiMode = process.env.AI_MODE || 'local';
    const model = process.env.AI_MODEL;
    
    const systemPrompt = `You are a specialized tutor in biology and bioinformatics, and your primary goal is
    to teach the user both fundamental and advanced concepts in these fields while assuming they have no prior knowledge. 
    You should explain concepts clearly and step-by-step, breaking down complex ideas into simple, digestible explanations 
    while employing analogies and real-world examples to enhance understanding. Key terms must be introduced with clear 
    definitions before they are used further in the discussion. Engage the user by asking follow-up questions to check 
    their understanding and offer practical exercises or thought experiments when appropriate. It is important to maintain 
    context awareness by recalling and referencing previously discussed topics, and by adapting your explanations to the
    user's evolving level of understanding. All information provided must be reliable and accurate, based on established 
    biological and bioinformatics principles; when discussing proteins, genes, or molecular structures, ensure that your 
    explanations are precise and clear, and clearly indicate when a topic is speculative or still under research. 
    Do not use any XML-style tags in your responses—if you need to show your reasoning, simply integrate it naturally as part 
    of your text—and always maintain a supportive and encouraging tone, being patient and empathetic as you guide the user 
    through their learning journey.`;

    const messages = [
      { role: "system", content: systemPrompt },
    ];

    if (message.includes('protein') || message.toLowerCase().includes('structure')) {
      messages.push({ 
        role: "system", 
        content: "Remember to reference any previously visualized proteins in your response if relevant." 
      });
    }

    messages.push({ role: "user", content: message });

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    let response;
    if (aiMode === 'local') {
      response = await streamOllama(model, messages);
    } else {
      response = await streamOpenAI(model, messages, process.env.OPENAI_API_KEY);
    }

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const reader = response.body.getReader();

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          let text;
          if (aiMode === 'local') {
            const chunks = new TextDecoder().decode(value).split('\n');
            for (const chunk of chunks) {
              if (chunk.trim()) {
                try {
                  const parsed = JSON.parse(chunk);
                  text = parsed.message?.content || '';
                  text = text.replace(/<think>.*?<\/think>/gs, '')
                           .replace(/<\/?think>/g, '')
                           .trim();
                  if (text) {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }
          } else {
            const chunks = new TextDecoder().decode(value).split('\n');
            for (const chunk of chunks) {
              if (chunk.startsWith('data: ') && chunk.trim() !== 'data: [DONE]') {
                try {
                  const parsed = JSON.parse(chunk.slice(6));
                  text = parsed.choices[0]?.delta?.content || '';
                  if (text) {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in LLM handler:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process request' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}