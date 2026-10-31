import { MediaPlatform, MediaExtractionResult, PickerMediaItem } from '@/types';

export interface CobaltRequestOptions {
  videoQuality?: 'max' | '2160' | '1440' | '1080' | '720' | '480' | '360';
  downloadMode?: 'auto' | 'audio' | 'mute';
  audioFormat?: 'mp3' | 'ogg' | 'wav' | 'best';
}

export const COBALT_CUSTOM_INSTANCE_KEY = 'superapps_cobalt_instance';

/**
 * Public community Cobalt instances used for fallback when extracting.
 * Cobalt is open-source (github.com/imputnet/cobalt).
 */
export const DEFAULT_COBALT_INSTANCES = [
  'https://api.cobalt.tools',
  'https://cobalt-api.kwiatekm.pl',
  'https://cobalt.api.scidsg.org',
];

/**
 * Detect the social or media platform from a given URL.
 */
export function detectMediaPlatform(rawUrl: string): MediaPlatform {
  if (!rawUrl || typeof rawUrl !== 'string') return 'generic';
  const url = rawUrl.trim().toLowerCase();

  if (/instagram\.com|instagr\.am/i.test(url)) return 'instagram';
  if (/facebook\.com|fb\.watch|fb\.gg/i.test(url)) return 'facebook';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/twitter\.com|x\.com/i.test(url)) return 'twitter';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';

  return 'generic';
}

/**
 * Check if the given URL is a direct media file (e.g. .mp4, .webm, .mp3).
 */
export function isDirectMediaUrl(rawUrl: string): boolean {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    return /\.(mp4|webm|mov|m4v|ogg|mp3|m4a|wav)(\?.*)?$/i.test(parsed.pathname);
  } catch {
    return /\.(mp4|webm|mov|m4v|ogg|mp3|m4a|wav)(\?.*)?$/i.test(rawUrl);
  }
}

/**
 * Extract a reasonable filename from a direct media URL.
 */
export function extractFilenameFromUrl(url: string, fallback = 'media.mp4'): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const name = pathname.substring(pathname.lastIndexOf('/') + 1);
    return name && name.includes('.') ? decodeURIComponent(name) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Get active list of Cobalt instances, prioritizing user's custom endpoint if set.
 */
export function getCobaltInstances(): string[] {
  const instances: string[] = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    const custom = localStorage.getItem(COBALT_CUSTOM_INSTANCE_KEY);
    if (custom && custom.trim()) {
      instances.push(custom.trim().replace(/\/+$/, ''));
    }
  }
  for (const inst of DEFAULT_COBALT_INSTANCES) {
    if (!instances.includes(inst)) {
      instances.push(inst);
    }
  }
  return instances;
}

/**
 * Save custom Cobalt instance URL to localStorage.
 */
export function setCustomCobaltInstance(url: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!url || !url.trim()) {
    localStorage.removeItem(COBALT_CUSTOM_INSTANCE_KEY);
  } else {
    localStorage.setItem(COBALT_CUSTOM_INSTANCE_KEY, url.trim().replace(/\/+$/, ''));
  }
}

/**
 * Retrieve saved custom Cobalt instance URL.
 */
export function getCustomCobaltInstance(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return localStorage.getItem(COBALT_CUSTOM_INSTANCE_KEY) || null;
}

/**
 * Core media extractor: handles Instagram, Facebook, TikTok, Twitter, YouTube, and direct URLs.
 */
export async function extractMedia(
  rawUrl: string, 
  options?: CobaltRequestOptions
): Promise<MediaExtractionResult> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error('Please enter a valid URL.');
  }

  const platform = detectMediaPlatform(trimmed);

  // 1. Direct Web Media Sniffer: bypass external APIs if it's already a direct video/audio URL
  if (isDirectMediaUrl(trimmed)) {
    const filename = extractFilenameFromUrl(trimmed, platform === 'generic' ? 'downloaded-media.mp4' : `${platform}-media.mp4`);
    return {
      status: 'direct',
      platform,
      url: trimmed,
      filename,
      title: filename,
    };
  }

  // 2. Query Cobalt instance(s) with fallback
  const instances = getCobaltInstances();
  let lastError: Error | null = null;

  for (const instance of instances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000);

      const response = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: trimmed,
          videoQuality: options?.videoQuality || '1080',
          downloadMode: options?.downloadMode || 'auto',
          audioFormat: options?.audioFormat || 'mp3',
          filenamePattern: 'pretty',
          youtubeVideoCodec: 'h264',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errData: any = null;
        try {
          errData = await response.json();
        } catch {
          // non-JSON error
        }
        const errorMsg = errData?.error?.code || `HTTP ${response.status} from ${instance}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Handle Tunnel, Stream, or Redirect single media
      if (data.status === 'tunnel' || data.status === 'stream' || data.status === 'redirect') {
        const filename = data.filename || `${platform}-${Date.now()}.${options?.downloadMode === 'audio' ? 'mp3' : 'mp4'}`;
        return {
          status: 'single',
          platform,
          url: data.url,
          filename,
          title: filename,
        };
      }

      // Handle Picker (Instagram carousel, TikTok photo slideshow)
      if (data.status === 'picker' && Array.isArray(data.picker)) {
        const pickerItems: PickerMediaItem[] = data.picker.map((item: any) => ({
          type: item.type || 'photo',
          url: item.url,
          thumb: item.thumb || item.url,
        }));

        return {
          status: 'picker',
          platform,
          title: `${platform.toUpperCase()} Album (${pickerItems.length} items)`,
          picker: pickerItems,
          audioUrl: data.audio,
          audioFilename: data.audioFilename,
        };
      }

      // Handle Cobalt error payload
      if (data.status === 'error') {
        const code = data.error?.code || 'unknown_error';
        let friendly = `Extraction failed (${code}).`;
        if (code.includes('not_found')) friendly = 'The requested post or video could not be found or is private.';
        if (code.includes('rate_limit')) friendly = 'Rate limit reached on public server. Retrying next instance...';
        throw new Error(friendly);
      }

      throw new Error(`Unexpected response status "${data.status}" from API.`);
    } catch (err: any) {
      lastError = err;
      // If abort or rate-limit, loop continues to next instance
      console.warn(`Extraction failed on ${instance}:`, err?.message);
    }
  }

  // If all instances failed
  const baseMessage = lastError?.message || 'Could not connect to extraction instances.';
  throw new Error(
    `${baseMessage} The post might be private, or public community instances are busy. You can configure a custom Cobalt instance in Settings.`
  );
}

/**
 * Triggers a file download in the browser with fallback if CORS blocks blob fetching.
 */
export async function downloadMediaFile(url: string, filename: string): Promise<{ method: 'blob' | 'direct' }> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename || 'downloaded-media.mp4';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return { method: 'blob' };
  } catch (err) {
    // CORS or streaming restriction: trigger direct download anchor or open in new window
    console.warn('CORS blob download prevented, falling back to direct link trigger:', err);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'downloaded-media.mp4';
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return { method: 'direct' };
  }
}
