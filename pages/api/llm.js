// pages/api/llm.js
export const config = {
  runtime: 'edge', // Enable Edge Runtime
};

const streamOllama = async (model, messages) => {
  const url = process.env.OLLAMA_URL + "/api/generate";
  const response = await fetch(url, {
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
    console.log("🔵 [SERVER] Mottatt forespørsel:", body);

    const { message, context, metadata } = body;
    
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
      ...(Array.isArray(context) ? context : []) 
    ];
    
    if (message.includes('protein') || message.toLowerCase().includes('structure')) {
      messages.push({ 
        role: "system", 
        content: "Remember to reference any previously visualized proteins in your response if relevant." 
      });
    }

    messages.push({ role: "user", content: message });

    let response;
    if (aiMode === 'local') {
      response = await streamOllama(model, messages);
    } else {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model, messages }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service error: ${errorText}`);
    }

    const responseData = await response.json();
   

    
    return new Response(JSON.stringify({ text: responseData.choices?.[0]?.message?.content || "No response from AI" }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('🔴 [SERVER] Error i LLM handler:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}