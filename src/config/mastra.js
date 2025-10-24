// Configuración del servidor Mastra
export const MASTRA_CONFIG = {
  serverUrl: import.meta.env.VITE_MASTRA_SERVER || 'http://localhost:4111',
  agentId: 'voiceFormAgent'
}
