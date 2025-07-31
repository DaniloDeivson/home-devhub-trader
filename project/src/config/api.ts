// Configuração da API para alternar entre desenvolvimento e produção
const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true';

export const API_CONFIG = {
  // URL base da API
  BASE_URL: isDevelopment 
    ? 'http://localhost:5002' 
    : 'https://api.devhubtrader.com.br',
  
  // Timeout das requisições
  TIMEOUT: 30000,
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Configurações específicas por ambiente
  DEVELOPMENT: {
    BASE_URL: 'http://localhost:5002',
    CORS_ORIGINS: ['http://localhost:4173', 'http://localhost:3000'],
  },
  
  PRODUCTION: {
    BASE_URL: 'https://api.devhubtrader.com.br',
    CORS_ORIGINS: [
      'https://devhubtrader.com.br',
      'https://www.devhubtrader.com.br',
      'http://devhubtrader.com.br',
      'http://www.devhubtrader.com.br'
    ],
  }
};

// Função helper para construir URLs da API
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Função helper para fazer requisições com configuração padrão
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers,
    },
    timeout: API_CONFIG.TIMEOUT,
  };

  return fetch(url, {
    ...defaultOptions,
    ...options,
  });
};

// Log da configuração atual (apenas em desenvolvimento)
if (isDevelopment) {
  console.log('🔧 API Config:', {
    environment: 'development',
    baseUrl: API_CONFIG.BASE_URL,
    endpoints: {
      tabela: buildApiUrl('/api/tabela'),
      correlacao: buildApiUrl('/api/correlacao'),
      trades: buildApiUrl('/api/trades'),
      disciplina: buildApiUrl('/api/disciplina-completa'),
      chat: buildApiUrl('/chat'),
    }
  });
} 