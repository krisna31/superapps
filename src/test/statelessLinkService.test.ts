import { describe, it, expect } from 'vitest';
import {
  encodeStatelessLink,
  decodeStatelessLink,
  buildStatelessUrl,
  generateQrCodeDataUrl,
} from '../services/statelessLinkService';

describe('Stateless Public Shortlink Service', () => {
  it('should encode and decode destination URL with optional title', () => {
    const url = 'https://github.com/krisna31/superapps?ref=productivity&tab=readme';
    const title = 'Superapps Repository';

    const encoded = encodeStatelessLink(url, title);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeStatelessLink(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.url).toBe(url);
    expect(decoded?.title).toBe(title);
    expect(decoded?.created).toBeTypeOf('number');
  });

  it('should safely return null for invalid or corrupted encoded strings', () => {
    expect(decodeStatelessLink('')).toBeNull();
    expect(decodeStatelessLink('invalid_encoded_garbage_12345')).toBeNull();
  });

  it('should build proper hash URL based on window.location', () => {
    const encoded = 'test_hash_payload';
    const shareable = buildStatelessUrl(encoded);
    expect(shareable).toContain('#/r?d=test_hash_payload');
  });

  it('should generate valid QR code data URL', async () => {
    const qrDataUrl = await generateQrCodeDataUrl('https://example.com/test');
    expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
