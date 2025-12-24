import { MinioConfig } from './crypto';

export interface FileObject {
  name: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

const getBaseUrl = (config: MinioConfig): string => {
  // Strip any existing protocol from endpoint
  const cleanEndpoint = config.endpoint.replace(/^https?:\/\//, '');
  const protocol = config.useSSL ? 'https' : 'http';
  return `${protocol}://${cleanEndpoint}`;
};

// Generate AWS Signature V4 (simplified for browser)
const generateSignature = async (
  config: MinioConfig,
  method: string,
  path: string,
  date: string,
  payloadHash: string = 'UNSIGNED-PAYLOAD'
): Promise<{ authorization: string; amzDate: string }> => {
  const region = 'us-east-1';
  const service = 's3';
  
  const amzDate = date.replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.substring(0, 8);
  
  const canonicalUri = path;
  const canonicalQueryString = '';
  const canonicalHeaders = `host:${config.endpoint}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  const encoder = new TextEncoder();
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const canonicalRequestHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
  
  const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
    const kDate = await crypto.subtle.sign('HMAC', 
      await crypto.subtle.importKey('raw', encoder.encode('AWS4' + key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      encoder.encode(dateStamp)
    );
    const kRegion = await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', kDate, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      encoder.encode(regionName)
    );
    const kService = await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', kRegion, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      encoder.encode(serviceName)
    );
    const kSigning = await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', kService, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      encoder.encode('aws4_request')
    );
    return kSigning;
  };
  
  const signingKey = await getSignatureKey(config.secretKey, dateStamp, region, service);
  const signatureBuffer = await crypto.subtle.sign('HMAC',
    await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    encoder.encode(stringToSign)
  );
  
  const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const authorization = `${algorithm} Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return { authorization, amzDate };
};

export const listFiles = async (config: MinioConfig): Promise<FileObject[]> => {
  const baseUrl = getBaseUrl(config);
  const path = `/${config.bucket}`;
  const date = new Date().toISOString();
  
  const { authorization, amzDate } = await generateSignature(config, 'GET', path, date);
  
  const response = await fetch(`${baseUrl}${path}?list-type=2`, {
    method: 'GET',
    headers: {
      'Host': config.endpoint,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      'Authorization': authorization,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.statusText}`);
  }
  
  const text = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  
  const contents = xml.getElementsByTagName('Contents');
  const files: FileObject[] = [];
  
  for (let i = 0; i < contents.length; i++) {
    const item = contents[i];
    files.push({
      name: item.getElementsByTagName('Key')[0]?.textContent || '',
      size: parseInt(item.getElementsByTagName('Size')[0]?.textContent || '0', 10),
      lastModified: new Date(item.getElementsByTagName('LastModified')[0]?.textContent || ''),
      etag: item.getElementsByTagName('ETag')[0]?.textContent?.replace(/"/g, ''),
    });
  }
  
  return files;
};

export const uploadFile = async (config: MinioConfig, file: File): Promise<void> => {
  const baseUrl = getBaseUrl(config);
  const path = `/${config.bucket}/${encodeURIComponent(file.name)}`;
  const date = new Date().toISOString();
  
  const { authorization, amzDate } = await generateSignature(config, 'PUT', path, date);
  
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'PUT',
    headers: {
      'Host': config.endpoint,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      'Authorization': authorization,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }
};

export const downloadFile = async (config: MinioConfig, fileName: string): Promise<Blob> => {
  const baseUrl = getBaseUrl(config);
  const path = `/${config.bucket}/${encodeURIComponent(fileName)}`;
  const date = new Date().toISOString();
  
  const { authorization, amzDate } = await generateSignature(config, 'GET', path, date);
  
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      'Host': config.endpoint,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      'Authorization': authorization,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  
  return response.blob();
};

export const deleteFile = async (config: MinioConfig, fileName: string): Promise<void> => {
  const baseUrl = getBaseUrl(config);
  const path = `/${config.bucket}/${encodeURIComponent(fileName)}`;
  const date = new Date().toISOString();
  
  const { authorization, amzDate } = await generateSignature(config, 'DELETE', path, date);
  
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: {
      'Host': config.endpoint,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      'Authorization': authorization,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.statusText}`);
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
