import { Mastra } from "@mastra/core/mastra";
import { voiceFormAgent } from "./agents/voice-form-agent";

export const mastra = new Mastra({
  agents: { voiceFormAgent }
});
