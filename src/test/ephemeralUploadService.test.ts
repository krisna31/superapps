import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadToLitterbox } from '../services/ephemeralUploadService';

describe('Ephemeral Upload Service (Litterbox)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully parse upload URL when response is 200 OK', async () => {
    const mockFile = new File(['test content'], 'sample.txt', { type: 'text/plain' });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => 'https://litter.catbox.moe/abc1234.txt',
    } as any);

    const result = await uploadToLitterbox(mockFile, '24h');
    expect(result.success).toBe(true);
    expect(result.url).toBe('https://litter.catbox.moe/abc1234.txt');
    expect(result.expiry).toBe('24h');
  });

  it('should return error when server returns non-200 status', async () => {
    const mockFile = new File(['test content'], 'sample.txt', { type: 'text/plain' });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as any);

    const result = await uploadToLitterbox(mockFile, '1h');
    expect(result.success).toBe(false);
    expect(result.error).toContain('status: 500');
  });

  it('should handle network fetch exceptions gracefully', async () => {
    const mockFile = new File(['test content'], 'sample.txt', { type: 'text/plain' });

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

    const result = await uploadToLitterbox(mockFile, '12h');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network offline');
  });
});
