// Simple encryption for localStorage credentials
const ENCRYPTION_KEY = 'minio-file-manager-2024';

export const encrypt = (text: string): string => {
  const encoded = btoa(encodeURIComponent(text));
  let result = '';
  for (let i = 0; i < encoded.length; i++) {
    const charCode = encoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
};

export const decrypt = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return decodeURIComponent(atob(result));
  } catch {
    return '';
  }
};

export interface MinioConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  useSSL: boolean;
}

const STORAGE_KEY = 'minio_config_encrypted';

export const saveConfig = (config: MinioConfig): void => {
  const encrypted = encrypt(JSON.stringify(config));
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const loadConfig = (): MinioConfig | null => {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;
  
  try {
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
};

export const clearConfig = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const hasStoredConfig = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};
