/**
 * Configurações globais do sistema para facilitar Rebranding e Customização.
 */
export const APP_CONFIG = {
  // Nome atual do sistema (mude aqui para refletir em todo o backend)
  name: "Rotiq",
  
  // Versão do sistema
  version: "1.0.0",
  
  // Configurações de exibição
  displayName: "Rotiq - Gestão de Logística 360",
  
  // Módulos habilitados por padrão
  modules: {
    fleet: true,
    finance: true,
    rh: true,
    chat: true,
  },
  
  // Configurações de Auditoria
  audit: {
    enabled: true,
    retentionDays: 90,
  }
};

export type AppConfig = typeof APP_CONFIG;
