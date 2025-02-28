// services/aiService.js

export async function sendMessageToAI(message, contextMessages = [], proteinMetadata = null) {
  const payload = { message, context: contextMessages };

  if (proteinMetadata) {
      payload.metadata = {
          id: proteinMetadata.id,
          name: proteinMetadata.name,
          organism: proteinMetadata.organism,
          function: proteinMetadata.function,
          length: proteinMetadata.length,
          pdbId: proteinMetadata.pdbId || "No structure available"
      };
  }

  //console.log("🔵 [CLIENT] Sender forespørsel til /api/llm:", JSON.stringify(payload, null, 2)); // 🛠 Debugging


  const response = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text(); // **Leser alltid responsen som tekst først**
//console.log("🟢 [CLIENT] Rå respons fra API:", responseText); // 🛠 Debugging


  if (!response.ok) {
    console.error("🔴 Feilmelding fra server:", responseText);
    try {
        const errorData = JSON.parse(responseText); // **Prøv å tolke JSON**
        throw new Error(errorData.error || 'AI request failed');
    } catch (e) {
        throw new Error(`Uventet respons fra server: ${responseText}`);
    }
}

try {
    const responseData = JSON.parse(responseText); // **Tolker JSON**
    console.log("🟢 [CLIENT] Parsed AI-svar:", JSON.stringify(responseData, null, 2)); // 🛠 Debugging
       
    return responseData.text; // **Returnerer AI-svaret**
} catch (e) {
    console.error("⚠️ Kunne ikke parse JSON:", responseText);
    throw new Error('Feil i responsformatet fra AI-serveren.');
}
}


export function processCommand(input) {
  const match = input.match(/^\/(\w+)\s+(.+)/);
  if (!match) return null;
  return { command: match[1], args: match[2].trim() };
}