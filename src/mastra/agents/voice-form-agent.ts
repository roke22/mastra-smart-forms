import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";

export const voiceFormAgent = new Agent({
  name: 'voice-form-agent',
  instructions: `
      Eres un asistente para rellenar formularios, deberas recopilar la informacion que te solicitan del texto facilitado por el usuario.
  `,
  model: openai("gpt-4o")
});
