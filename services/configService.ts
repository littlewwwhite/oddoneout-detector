export interface ApiConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

const STORAGE_KEY = 'oddoneout-api-config';

const DEFAULT_CONFIG: ApiConfig = {
  apiKey: '',
  apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  model: 'zai-org/GLM-4.5V',
};

export const getApiConfig = (): ApiConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load API config:', e);
  }
  return DEFAULT_CONFIG;
};

export const saveApiConfig = (config: ApiConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save API config:', e);
  }
};

export const isApiConfigured = (): boolean => {
  const config = getApiConfig();
  return !!config.apiKey && !!config.apiUrl;
};
