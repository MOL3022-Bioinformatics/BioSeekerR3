import { sendMessageToAI } from "@/services/aiService";

describe("AI Service", () => {
  test("Local AI should return a mock response", async () => {
    const message = "Hello, AI!";
    const response = await sendMessageToAI(message);
    
    expect(response).toMatch(/AI says/);
  });
});
