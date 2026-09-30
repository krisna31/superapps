import LZString from 'lz-string';
import QRCode from 'qrcode';

export interface StatelessLinkPayload {
  url: string;
  title?: string;
  created: number;
}

/**
 * Compresses a URL payload into a URL-safe string
 */
export function encodeStatelessLink(url: string, title?: string): string {
  const payload: StatelessLinkPayload = {
    url,
    title: title || '',
    created: Date.now(),
  };
  const jsonStr = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(jsonStr);
}

/**
 * Decompresses the URL-safe string back to the original URL payload
 */
export function decodeStatelessLink(encoded: string): StatelessLinkPayload | null {
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(encoded);
    if (!jsonStr) return null;
    return JSON.parse(jsonStr) as StatelessLinkPayload;
  } catch (e) {
    console.error('Failed to decode stateless link', e);
    return null;
  }
}

/**
 * Builds the full shareable URL based on the current window location
 */
export function buildStatelessUrl(encoded: string): string {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#/r?d=${encoded}`;
}

/**
 * Generates a QR Code as a Data URL
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: 280,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}
