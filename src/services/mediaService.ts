import { MediaPlatform, MediaExtractionResult, PickerMediaItem } from '@/types';

export interface FallbackPortal {
  name: string;
  url: string;
  description: string;
}

/**
 * Returns prefilled 1-click fallback download portals for each platform
 * when automated browser scrapers hit CORS or bot barriers.
 */
export function getFallbackPortals(targetUrl: string, platform?: MediaPlatform): FallbackPortal[] {
  const plat = platform || detectMediaPlatform(targetUrl);
  const encoded = encodeURIComponent(targetUrl);
  
  switch (plat) {
    case 'instagram':
      return [
        { name: 'SaveInsta', url: `https://saveinsta.app/en?url=${encoded}`, description: 'Direct Instagram Reels & Video Downloader' },
        { name: 'FastDl', url: `https://fastdl.app/en?url=${encoded}`, description: 'Photos, Videos, Reels & Stories' },
        { name: 'Cobalt Web', url: 'https://cobalt.tools', description: 'Open-source clean ad-free downloader' },
        { name: 'SnapSave', url: 'https://snapsave.app/', description: 'Full HD Instagram Downloader' },
      ];
    case 'tiktok':
      return [
        { name: 'TikWM', url: 'https://www.tikwm.com/', description: 'TikTok watermark-free video & MP3' },
        { name: 'SnapTik', url: 'https://snaptik.app/', description: 'Fast TikTok Video Downloader' },
        { name: 'Cobalt Web', url: 'https://cobalt.tools', description: 'Ad-free media downloader' },
      ];
    case 'youtube':
      return [
        { name: 'Cobalt Web', url: 'https://cobalt.tools', description: 'Clean ad-free YouTube & Shorts audio/video' },
        { name: 'Y2Mate', url: 'https://www.y2mate.com/', description: 'Fast YouTube MP4/MP3 Converter' },
        { name: 'Invidious Web', url: 'https://invidious.nerdvpn.de/', description: 'Privacy-respecting open YouTube player' },
      ];
    case 'twitter':
      return [
        { name: 'TwitterVid', url: 'https://twittervid.com/', description: 'Twitter / X Video Downloader' },
        { name: 'Cobalt Web', url: 'https://cobalt.tools', description: 'Clean ad-free downloader' },
      ];
    case 'facebook':
      return [
        { name: 'FDownloader', url: 'https://fdown.net/', description: 'Facebook HD Video Downloader' },
        { name: 'SnapSave', url: 'https://snapsave.app/', description: 'Facebook Video & Reel Saver' },
        { name: 'Cobalt Web', url: 'https://cobalt.tools', description: 'Clean ad-free downloader' },
      ];
    default:
      return [
        { name: 'Cobalt Web', url: 'https://cobalt.tools', description: 'Ad-free universal video downloader' },
        { name: 'SaveFrom', url: 'https://en.savefrom.net/', description: 'Universal online video downloader' },
      ];
  }
}

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

  // 3. Fallback Multi-Engine: Platform-Specific Scrapers
  if (platform === 'tiktok') {
    try {
      const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(trimmed)}`);
      if (tikRes.ok) {
        const tikData = await tikRes.json();
        if (tikData && tikData.code === 0 && tikData.data) {
          const d = tikData.data;
          const isAudio = options?.downloadMode === 'audio';
          const mediaUrl = isAudio ? (d.music || d.play) : (d.play || d.wmplay);
          const filename = `tiktok-${d.id || Date.now()}.${isAudio ? 'mp3' : 'mp4'}`;
          return {
            status: 'single',
            platform: 'tiktok',
            title: d.title || 'TikTok Video',
            url: mediaUrl,
            filename,
            audioUrl: d.music,
            audioFilename: `tiktok-${d.id || Date.now()}-audio.mp3`,
          };
        }
      }
    } catch (e) {
      console.warn('TikWM fallback failed:', e);
    }
  }

  if (platform === 'twitter') {
    try {
      const match = trimmed.match(/(?:status|statuses)\/(\d+)/);
      if (match) {
        const vxRes = await fetch(`https://api.vxtwitter.com/Twitter/status/${match[1]}`);
        if (vxRes.ok) {
          const vxData = await vxRes.json();
          const videoUrl = vxData.media_extended?.[0]?.url || vxData.mediaURLs?.[0];
          if (videoUrl && /\.(mp4|webm|m3u8)/i.test(videoUrl)) {
            const filename = `twitter-${match[1]}.mp4`;
            return {
              status: 'single',
              platform: 'twitter',
              title: vxData.text?.substring(0, 60) || 'Twitter Video',
              url: videoUrl,
              filename,
            };
          }
        }
      }
    } catch (e) {
      console.warn('VxTwitter fallback failed:', e);
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
