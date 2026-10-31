import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  detectMediaPlatform, 
  isDirectMediaUrl, 
  extractFilenameFromUrl,
  getCobaltInstances,
  setCustomCobaltInstance,
  getCustomCobaltApiKey,
  setCustomCobaltApiKey,
  getYtDlpCommand,
  extractMedia,
  downloadMediaFile,
  COBALT_CUSTOM_INSTANCE_KEY,
  DEFAULT_COBALT_INSTANCES
} from '@/services/mediaService';

describe('mediaService Platform Detection and URL Parsing', () => {
  it('correctly identifies Instagram URLs (Reels, Posts, Stories)', () => {
    expect(detectMediaPlatform('https://www.instagram.com/reel/C3abc123/')).toBe('instagram');
    expect(detectMediaPlatform('https://instagram.com/p/DFxyz789/')).toBe('instagram');
    expect(detectMediaPlatform('https://instagr.am/reel/123')).toBe('instagram');
  });

  it('correctly identifies Facebook URLs', () => {
    expect(detectMediaPlatform('https://www.facebook.com/reel/123456789')).toBe('facebook');
    expect(detectMediaPlatform('https://fb.watch/ab12cd34/')).toBe('facebook');
    expect(detectMediaPlatform('https://facebook.com/watch/?v=987654321')).toBe('facebook');
  });

  it('correctly identifies TikTok URLs', () => {
    expect(detectMediaPlatform('https://www.tiktok.com/@user/video/71234567890')).toBe('tiktok');
    expect(detectMediaPlatform('https://vt.tiktok.com/ZS123456/')).toBe('tiktok');
  });

  it('correctly identifies Twitter / X URLs', () => {
    expect(detectMediaPlatform('https://twitter.com/OpenAI/status/1234567890')).toBe('twitter');
    expect(detectMediaPlatform('https://x.com/kaboros/status/9876543210')).toBe('twitter');
  });

  it('correctly identifies YouTube URLs (Standard & Shorts)', () => {
    expect(detectMediaPlatform('https://www.youtube.com/watch?v=dQw4w9wgXcQ')).toBe('youtube');
    expect(detectMediaPlatform('https://youtu.be/dQw4w9wgXcQ')).toBe('youtube');
    expect(detectMediaPlatform('https://www.youtube.com/shorts/abcdef12345')).toBe('youtube');
  });

  it('classifies direct media links and unknown domains as generic', () => {
    expect(detectMediaPlatform('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')).toBe('generic');
    expect(detectMediaPlatform('https://example.com/some/page')).toBe('generic');
  });

  it('identifies direct media file extensions properly', () => {
    expect(isDirectMediaUrl('https://example.com/video.mp4')).toBe(true);
    expect(isDirectMediaUrl('https://example.com/audio.mp3?token=xyz')).toBe(true);
    expect(isDirectMediaUrl('https://example.com/movie.webm')).toBe(true);
    expect(isDirectMediaUrl('https://example.com/movie.mov')).toBe(true);
    expect(isDirectMediaUrl('https://instagram.com/reel/C123')).toBe(false);
    expect(isDirectMediaUrl('https://example.com/index.html')).toBe(false);
  });

  it('extracts filename from URL with fallback', () => {
    expect(extractFilenameFromUrl('https://example.com/path/my_cool_video.mp4')).toBe('my_cool_video.mp4');
    expect(extractFilenameFromUrl('https://example.com/path/')).toBe('media.mp4');
  });
});

describe('mediaService Instance Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default instances when no custom instance is set', () => {
    const instances = getCobaltInstances();
    expect(instances).toEqual(DEFAULT_COBALT_INSTANCES);
  });

  it('prepends custom instance when set in localStorage', () => {
    setCustomCobaltInstance('https://my-custom-cobalt.example.com/');
    const instances = getCobaltInstances();
    expect(instances[0]).toBe('https://my-custom-cobalt.example.com');
    expect(instances).toContain(DEFAULT_COBALT_INSTANCES[0]);
  });

  it('removes custom instance when passed empty or null', () => {
    setCustomCobaltInstance('https://my-custom-cobalt.example.com');
    expect(localStorage.getItem(COBALT_CUSTOM_INSTANCE_KEY)).toBe('https://my-custom-cobalt.example.com');
    setCustomCobaltInstance('');
    expect(localStorage.getItem(COBALT_CUSTOM_INSTANCE_KEY)).toBeNull();
  });

  it('manages custom API key configuration', () => {
    setCustomCobaltApiKey('secret-token-123');
    expect(getCustomCobaltApiKey()).toBe('secret-token-123');
    setCustomCobaltApiKey('');
    expect(getCustomCobaltApiKey()).toBeNull();
  });

  it('generates yt-dlp CLI command for video and audio downloads', () => {
    const videoCmd = getYtDlpCommand('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'auto');
    expect(videoCmd).toBe('yt-dlp -f "bv*+ba/b" "https://www.youtube.com/watch?v=dQw4w9WgXcQ"');

    const audioCmd = getYtDlpCommand('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'audio');
    expect(audioCmd).toBe('yt-dlp -x --audio-format mp3 "https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
  });
});

describe('mediaService Extraction Flow', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('handles direct video URL without making external API calls', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as any;

    const result = await extractMedia('https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4');
    expect(result.status).toBe('direct');
    expect(result.url).toBe('https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4');
    expect(result.filename).toBe('big_buck_bunny_720p_1mb.mp4');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses tunnel/stream responses from Cobalt API correctly', async () => {
    const mockResponse = {
      status: 'tunnel',
      url: 'https://cdn.cobalt.tools/tunnel/video-stream-123.mp4',
      filename: 'instagram_reel_123.mp4',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    }) as any;

    const result = await extractMedia('https://www.instagram.com/reel/C3abc123/');
    expect(result.status).toBe('single');
    expect(result.platform).toBe('instagram');
    expect(result.url).toBe('https://cdn.cobalt.tools/tunnel/video-stream-123.mp4');
    expect(result.filename).toBe('instagram_reel_123.mp4');
  });

  it('parses picker responses (carousels / slideshows) correctly', async () => {
    const mockPicker = {
      status: 'picker',
      audio: 'https://cdn.cobalt.tools/audio/track.mp3',
      audioFilename: 'slideshow_song.mp3',
      picker: [
        { type: 'photo', url: 'https://cdn.cobalt.tools/img1.jpg', thumb: 'https://cdn.cobalt.tools/thumb1.jpg' },
        { type: 'photo', url: 'https://cdn.cobalt.tools/img2.jpg', thumb: 'https://cdn.cobalt.tools/thumb2.jpg' },
        { type: 'video', url: 'https://cdn.cobalt.tools/clip.mp4' },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPicker,
    }) as any;

    const result = await extractMedia('https://www.instagram.com/p/CarouselPost123/');
    expect(result.status).toBe('picker');
    expect(result.platform).toBe('instagram');
    expect(result.picker).toHaveLength(3);
    expect(result.picker?.[0].type).toBe('photo');
    expect(result.picker?.[2].type).toBe('video');
    expect(result.audioUrl).toBe('https://cdn.cobalt.tools/audio/track.mp3');
  });

  it('falls back to second instance if the first fails', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 429,
          json: async () => ({ error: { code: 'error.api.rate_limit' } }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          status: 'stream',
          url: 'https://backup.cobalt.tools/stream/vid.mp4',
          filename: 'backup_vid.mp4',
        }),
      };
    }) as any;

    const result = await extractMedia('https://www.tiktok.com/@creator/video/123456');
    expect(callCount).toBe(2);
    expect(result.status).toBe('single');
    expect(result.url).toBe('https://backup.cobalt.tools/stream/vid.mp4');
  });

  it('triggers browser download for media file', async () => {
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-blob');
    window.URL.revokeObjectURL = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['test-video-content'], { type: 'video/mp4' }),
    }) as any;

    const res = await downloadMediaFile('https://cdn.example.com/video.mp4', 'test.mp4');
    expect(res.method).toBe('blob');
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });
});
