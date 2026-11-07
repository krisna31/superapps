import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Music, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  AlertCircle, 
  Film, 
  SlidersHorizontal, 
  ClipboardPaste, 
  Layers,
  RefreshCw,
  Terminal,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { 
  extractMedia, 
  downloadMediaFile, 
  detectMediaPlatform, 
  getCustomCobaltInstance, 
  setCustomCobaltInstance,
  getCustomCobaltApiKey,
  setCustomCobaltApiKey,
  getYtDlpCommand,
  getFallbackPortals,
  DEFAULT_COBALT_INSTANCES
} from '@/services/mediaService';
import { 
  MediaPlatform, 
  MediaDownloadItem, 
  MediaExtractionResult, 
  PickerMediaItem 
} from '@/types';
import { sanitizeRedirectUrl } from '@/utils/security';

export const MediaDownloaderPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';

  // Input & Option States
  const [url, setUrl] = useState('');
  const [downloadMode, setDownloadMode] = useState<'auto' | 'audio'>('auto');
  const [videoQuality, setVideoQuality] = useState<'max' | '1080' | '720' | '480'>('1080');
  
  // Extraction & Download States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MediaExtractionResult | null>(null);
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // History & Instance Config States
  const [history, setHistory] = useState<MediaDownloadItem[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customInstance, setCustomInstance] = useState(getCustomCobaltInstance() || '');
  const [customApiKey, setCustomApiKey] = useState(getCustomCobaltApiKey() || '');
  const [configSaved, setConfigSaved] = useState(false);

  // Subscribe to media history from local vault / storage
  useEffect(() => {
    const unsubscribe = dataService.subscribeToMediaHistory(userId, (items) => {
      // Sort newest first
      const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
      setHistory(sorted);
    });
    return () => unsubscribe();
  }, [userId]);

  const detectedPlatform = detectMediaPlatform(url);

  // Quick paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrl(text.trim());
        setError(null);
      }
    } catch {
      // Clipboard permissions denied
    }
  };

  // Perform media extraction
  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await extractMedia(url.trim(), {
        downloadMode,
        videoQuality,
        audioFormat: 'mp3',
      });
      setResult(res);

      // Auto-save to history ledger
      if (res.url) {
        await dataService.saveMediaDownloadItem(userId, {
          originalUrl: url.trim(),
          title: res.filename || `${res.platform}-media`,
          platform: res.platform,
          format: downloadMode === 'audio' ? 'audio' : 'video',
          quality: downloadMode === 'audio' ? 'MP3' : videoQuality,
          downloadUrl: res.url,
          filename: res.filename,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to extract media from link.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle single item download
  const handleDownload = async (mediaUrl: string, filename?: string, itemId?: string) => {
    const targetFilename = filename || `media-${Date.now()}.${downloadMode === 'audio' ? 'mp3' : 'mp4'}`;
    const idKey = itemId || mediaUrl;
    setDownloadingItem(idKey);
    try {
      await downloadMediaFile(mediaUrl, targetFilename);
    } catch (err: any) {
      console.warn('Download error:', err);
    } finally {
      setTimeout(() => setDownloadingItem(null), 1000);
    }
  };

  // Batch download for picker / carousel items
  const handleDownloadAllPicker = async (items: PickerMediaItem[]) => {
    setDownloadingItem('all-picker');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ext = item.type === 'video' ? 'mp4' : 'jpg';
      const name = `${result?.platform || 'media'}-album-${i + 1}.${ext}`;
      await downloadMediaFile(item.url, name);
      // Small pause between multiple trigger clicks
      await new Promise((r) => setTimeout(r, 400));
    }
    setDownloadingItem(null);
  };

  // Copy URL to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete history item
  const handleDeleteHistory = async (item: MediaDownloadItem) => {
    await dataService.deleteMediaDownloadItem(userId, item.id);
  };

  // Clear entire history
  const handleClearHistory = async () => {
    if (confirm('Clear all media download history records?')) {
      await dataService.clearMediaHistory(userId);
    }
  };

  // Save custom Cobalt endpoint & API Key
  const handleSaveConfig = () => {
    try {
      setCustomCobaltInstance(customInstance);
      setCustomCobaltApiKey(customApiKey);
      setConfigSaved(true);
      setTimeout(() => {
        setConfigSaved(false);
        setShowConfigModal(false);
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid custom instance URL.');
      setShowConfigModal(false);
    }
  };

  useEffect(() => {
    if (!showConfigModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowConfigModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showConfigModal]);

  // Platform visual badges (Werkbund architectural index format)
  const renderPlatformBadge = (platform: MediaPlatform) => {
    const labelMap: Partial<Record<MediaPlatform, string>> = {
      instagram: 'Instagram',
      facebook: 'Facebook',
      tiktok: 'TikTok',
      twitter: 'Twitter / X',
      youtube: 'YouTube',
    };
    const label = labelMap[platform] || 'Direct Web';
    const isDirect = !labelMap[platform];
    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border-[1.5px] rounded-none ${
          isDirect
            ? 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-strong)]'
            : 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header - Werkbund Subway Wayfinding Band */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-[1.5px] border-[var(--border-strong)] pb-3.5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-[var(--text-primary)] text-[var(--bg-canvas)] rounded-none">
              [APP-07]
            </span>
            <h1 className="text-2xl font-display font-black tracking-tight text-[var(--text-primary)] uppercase">
              Media Downloader
            </h1>
            <span className="px-2 py-0.5 bg-[var(--bg-subtle)] text-[var(--color-primary)] border-[1.5px] border-[var(--border-strong)] font-mono text-[10px] font-bold uppercase rounded-none">
              Multi-Source
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--text-muted)] mt-1 uppercase tracking-wide">
            Download high-resolution video and audio from Instagram Reels, Facebook, TikTok, Twitter/X, YouTube, and direct web links.
          </p>
        </div>

        {/* API Endpoint Config Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none transition-colors duration-100 ease-linear shadow-none"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>API Settings</span>
          </button>
        </div>
      </div>

      {/* Main Extractor Card */}
      <div className="bg-[var(--bg-surface)] border-[1.5px] border-[var(--border-strong)] rounded-none p-4 space-y-3.5 shadow-none">
        <form onSubmit={handleExtract} className="space-y-3">
          {/* URL Input Bar */}
          <div className="relative flex items-center">
            <input
              type="url"
              aria-label="Media source URL"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste Instagram Reel, Facebook Video, TikTok, YouTube, or direct video URL..."
              className="w-full pl-3 pr-28 py-2.5 text-xs font-mono bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)] shadow-none"
            />
            
            <div className="absolute right-1.5 flex items-center space-x-1">
              {url && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl('');
                    setResult(null);
                    setError(null);
                  }}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-none"
                  title="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] bg-[var(--bg-subtle)] border-[1.5px] border-[var(--border-strong)] rounded-none transition-colors duration-100 ease-linear"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>
          </div>

          {/* Controls: Platform badge, Format Mode, Quality, and Extract Button */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Detected Platform Indicator */}
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase">Target:</span>
                {renderPlatformBadge(detectedPlatform)}
              </div>

              {/* Format Toggle (Video vs Audio) */}
              <div className="flex items-center border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-canvas)] rounded-none p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setDownloadMode('auto')}
                  className={`flex items-center space-x-1 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider rounded-none transition-colors duration-100 ease-linear ${
                    downloadMode === 'auto'
                      ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] shadow-none'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>Video (MP4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadMode('audio')}
                  className={`flex items-center space-x-1 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider rounded-none transition-colors duration-100 ease-linear ${
                    downloadMode === 'audio'
                      ? 'bg-[var(--text-primary)] text-[var(--bg-canvas)] shadow-none'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Music className="w-3 h-3" />
                  <span>Audio (MP3)</span>
                </button>
              </div>

              {/* Resolution Dropdown (Visible only in Video mode) */}
              {downloadMode === 'auto' && (
                <div className="flex items-center space-x-1.5">
                  <select
                    aria-label="Video quality"
                    value={videoQuality}
                    onChange={(e: any) => setVideoQuality(e.target.value)}
                    className="text-[11px] font-mono font-bold py-1 px-2.5 bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none text-[var(--text-primary)] focus:outline-none uppercase"
                  >
                    <option value="1080">1080p FHD</option>
                    <option value="720">720p HD</option>
                    <option value="480">480p SD</option>
                    <option value="max">Max Quality</option>
                  </select>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-100 ease-linear shadow-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Extract Media</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Alert with 1-Click Direct Resolvers */}
        {error && (
          <div className="space-y-3">
            <div className="p-3 rounded-none bg-rose-500/10 border-[1.5px] border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-mono font-bold uppercase">[ERR-EXTRACTION] Extraction Notice:</span>
                <p className="text-[11px] font-mono">{error}</p>
              </div>
            </div>

            {/* Direct Resolver Bridges (Works without self-hosted Cobalt) */}
            <div className="p-3 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-white bg-[var(--color-primary)] px-2 py-0.5 rounded-none">
                    Direct Resolver Bridges
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                    1-Click web extractors (No custom server required):
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getYtDlpCommand(url, downloadMode));
                      setCopiedId('ytdlp-btn');
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="flex items-center space-x-1 text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-none bg-[var(--bg-surface)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] text-[var(--text-primary)] border-[1.5px] border-[var(--border-strong)] transition-colors duration-100 ease-linear"
                    title="Copy ready-to-run yt-dlp CLI command for terminal"
                  >
                    {copiedId === 'ytdlp-btn' ? <Check className="w-3 h-3 text-[var(--color-primary)]" /> : <Terminal className="w-3 h-3" />}
                    <span>{copiedId === 'ytdlp-btn' ? 'Copied yt-dlp!' : 'Copy yt-dlp CLI'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      setCopiedId('url-btn');
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="flex items-center space-x-1 text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-none bg-[var(--bg-surface)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] text-[var(--text-primary)] border-[1.5px] border-[var(--border-strong)] transition-colors duration-100 ease-linear"
                  >
                    {copiedId === 'url-btn' ? <Check className="w-3 h-3 text-[var(--color-primary)]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'url-btn' ? 'Copied URL!' : 'Copy Media URL'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {getFallbackPortals(url, detectedPlatform).map((portal) => (
                  <a
                    key={portal.name}
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-none border-[1.5px] border-[var(--border-strong)] hover:border-[var(--color-primary)] bg-[var(--bg-surface)] transition-colors flex items-center justify-between group shadow-none"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-mono font-bold uppercase text-xs text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors block">
                        {portal.name}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] truncate block">
                        {portal.description}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] flex-shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Extraction Result Stage */}
      {result && (
        <div className="bg-[var(--bg-surface)] border-[1.5px] border-[var(--border-strong)] rounded-none p-4 space-y-4 shadow-none">
          <div className="flex items-center justify-between border-b-[1.5px] border-[var(--border-strong)] pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[var(--color-primary)]">[OUTPUT]</span>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Extracted Media Preview
              </h2>
              {renderPlatformBadge(result.platform)}
            </div>
            {result.filename && (
              <span className="text-[11px] font-mono text-[var(--text-muted)] truncate max-w-xs">
                {result.filename}
              </span>
            )}
          </div>

          {/* 1. Single Video / Audio Stream Result */}
          {result.url && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Media Preview Player */}
              <div className="rounded-none bg-black overflow-hidden flex items-center justify-center min-h-[220px] max-h-[340px] border-[1.5px] border-[var(--border-strong)]">
                {downloadMode === 'audio' ? (
                  <div className="p-6 text-center space-y-3 w-full">
                    <div className="w-12 h-12 mx-auto rounded-none bg-[var(--bg-surface)] text-[var(--color-primary)] flex items-center justify-center border-[1.5px] border-[var(--border-strong)]">
                      <Music className="w-6 h-6" />
                    </div>
                    <audio controls className="w-full mt-2" src={result.url}>
                      Your browser does not support the audio player.
                    </audio>
                  </div>
                ) : (
                  <video
                    controls
                    playsInline
                    className="w-full h-full max-h-[340px] object-contain"
                    src={result.url}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              {/* Action Details & Buttons */}
              <div className="space-y-3">
                <div className="p-3 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] text-xs font-mono space-y-1.5">
                  <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1">
                    <span className="text-[var(--text-muted)] uppercase">Format:</span>
                    <span className="font-bold text-[var(--text-primary)] uppercase">
                      {downloadMode === 'audio' ? 'MP3 Audio Stream' : 'MP4 High Definition'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1">
                    <span className="text-[var(--text-muted)] uppercase">Quality:</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {downloadMode === 'audio' ? 'Original Bitrate' : `${videoQuality}p`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)] uppercase">File Name:</span>
                    <span className="font-bold text-[var(--text-primary)] truncate max-w-[200px]" title={result.filename}>
                      {result.filename || 'media.mp4'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleDownload(result.url!, result.filename, 'single-main')}
                    disabled={downloadingItem === 'single-main'}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-none bg-[var(--color-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors duration-100 ease-linear shadow-none"
                  >
                    {downloadingItem === 'single-main' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Downloading file...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download to Device</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => copyToClipboard(result.url!, 'stream-url')}
                      className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-mono font-bold uppercase text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none transition-colors duration-100 ease-linear shadow-none"
                    >
                      {copiedId === 'stream-url' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          <span>Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Stream Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={sanitizeRedirectUrl(result.url) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-mono font-bold uppercase text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none transition-colors duration-100 ease-linear shadow-none"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in New Tab</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Picker / Carousel Album Result (Instagram Carousel / TikTok Slideshow) */}
          {result.status === 'picker' && result.picker && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)]">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[var(--color-primary)]" />
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase">
                    Album Assets: {result.picker.length} items detected
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {result.audioUrl && (
                    <button
                      onClick={() => handleDownload(result.audioUrl!, result.audioFilename || 'album-soundtrack.mp3', 'album-audio')}
                      className="flex items-center space-x-1 px-3 py-1.5 text-xs font-mono font-bold uppercase text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none transition-colors duration-100 ease-linear"
                    >
                      <Music className="w-3 h-3 text-[var(--color-primary)]" />
                      <span>Download Audio Track</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownloadAllPicker(result.picker!)}
                    disabled={downloadingItem === 'all-picker'}
                    className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-[var(--color-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] text-white rounded-none transition-colors duration-100 ease-linear shadow-none"
                  >
                    {downloadingItem === 'all-picker' ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Downloading all...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        <span>Download All Items</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Grid of carousel items */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {result.picker.map((item, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-none border-[1.5px] border-[var(--border-strong)] bg-[var(--bg-canvas)] overflow-hidden flex flex-col justify-between shadow-none"
                  >
                    <div className="aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                      {item.type === 'video' ? (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={item.thumb || item.url}
                          alt={`Item ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>

                    <div className="p-2 flex items-center justify-between border-t-[1.5px] border-[var(--border-strong)] bg-[var(--bg-surface)] text-[10px] font-mono">
                      <span className="font-bold text-[var(--text-primary)]">
                        #{idx + 1} {item.type.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleDownload(item.url, `${result.platform}-item-${idx + 1}.${item.type === 'video' ? 'mp4' : 'jpg'}`, `picker-${idx}`)}
                        disabled={downloadingItem === `picker-${idx}`}
                        className="p-1 text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors"
                        title="Download item"
                      >
                        {downloadingItem === `picker-${idx}` ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Download History Ledger */}
      <div className="rounded-none bg-[var(--bg-surface)] border-[1.5px] border-[var(--border-strong)] overflow-hidden shadow-none">
        <div className="p-3 border-b-[1.5px] border-[var(--border-strong)] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-[var(--color-primary)]">[LEDGER]</span>
            <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
              Download History Ledger ({history.length})
            </span>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-rose-600 dark:text-rose-400 hover:underline text-[11px] font-mono font-bold uppercase transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">
            No media downloads logged yet. Paste a URL above to start.
          </div>
        ) : (
          <div className="divide-y-[1.5px] divide-[var(--border-strong)]">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-colors text-xs font-mono"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-3">
                  <div className="w-8 h-8 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] text-[var(--text-primary)] flex items-center justify-center flex-shrink-0">
                    {item.format === 'audio' ? (
                      <Music className="w-4 h-4 text-[var(--color-primary)]" />
                    ) : (
                      <Video className="w-4 h-4 text-[var(--text-primary)]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[var(--text-primary)] truncate max-w-sm">
                        {item.title || item.filename || 'Media Item'}
                      </span>
                      {renderPlatformBadge(item.platform)}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {item.quality && (
                        <>
                          <span>•</span>
                          <span className="uppercase">{item.quality}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(item.downloadUrl, item.filename, item.id)}
                    className="p-1.5 text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none transition-colors duration-100 ease-linear shadow-none"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => copyToClipboard(item.originalUrl, `orig-${item.id}`)}
                    className="p-1.5 text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none transition-colors duration-100 ease-linear shadow-none"
                    title="Copy original link"
                  >
                    {copiedId === `orig-${item.id}` ? (
                      <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {sanitizeRedirectUrl(item.originalUrl) && (
                    <a
                      href={sanitizeRedirectUrl(item.originalUrl)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none transition-colors duration-100 ease-linear shadow-none"
                      title="Visit original post"
                      aria-label="Visit original post"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteHistory(item)}
                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white border-[1.5px] border-[var(--border-strong)] rounded-none transition-colors duration-100 ease-linear shadow-none"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Cobalt Instance Modal - Pure Werkbund Scrim & Structural Border */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-50 bg-[var(--scrim-unblurred)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfigModal(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-settings-modal-title"
            className="w-full max-w-md rounded-none bg-[var(--bg-surface)] border-[1.5px] border-[var(--border-strong)] p-5 space-y-4 shadow-none"
          >
            <div className="flex items-center justify-between border-b-[1.5px] border-[var(--border-strong)] pb-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 id="media-settings-modal-title" className="text-sm font-display font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Media Extractor Settings
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                aria-label="Close modal"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <p className="text-[var(--text-muted)] leading-relaxed">
                Superapps uses open-source Cobalt and multi-engine extractors for zero-cost media downloads. You can also connect your own self-hosted Cobalt instance or yt-dlp API server (e.g. Metube / yt-dlp-host) below for 100% private extraction.
              </p>

              <div className="space-y-1">
                <label htmlFor="custom-cobalt-url" className="font-mono text-[11px] font-bold text-[var(--text-primary)] uppercase">
                  Custom Instance / yt-dlp Backend URL (Optional)
                </label>
                <input
                  id="custom-cobalt-url"
                  type="url"
                  value={customInstance}
                  onChange={(e) => setCustomInstance(e.target.value)}
                  placeholder="https://my-cobalt.example.com"
                  className="w-full px-3 py-2 font-mono text-xs bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="custom-cobalt-key" className="font-mono text-[11px] font-bold text-[var(--text-primary)] uppercase">
                  API Key / Bearer Token (Optional)
                </label>
                <input
                  id="custom-cobalt-key"
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Bearer token or API key for protected instances"
                  className="w-full px-3 py-2 font-mono text-xs bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] rounded-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="p-3 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--border-strong)] text-[11px] font-mono space-y-1">
                <span className="font-bold text-[var(--text-primary)] uppercase">Default Fallback Instances:</span>
                <ul className="text-[var(--text-muted)] list-disc list-inside space-y-0.5">
                  {DEFAULT_COBALT_INSTANCES.map((inst, i) => (
                    <li key={i} className="truncate">{inst}</li>
                  ))}
                </ul>
              </div>

              {configSaved && (
                <div className="p-2.5 rounded-none bg-[var(--bg-canvas)] border-[1.5px] border-[var(--color-primary)] text-[var(--color-primary)] font-mono text-[11px] font-bold uppercase flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Instance configuration saved!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t-[1.5px] border-[var(--border-strong)]">
              <button
                type="button"
                onClick={() => {
                  setCustomInstance('');
                  setCustomApiKey('');
                  setCustomCobaltInstance(null);
                  setCustomCobaltApiKey(null);
                  setConfigSaved(true);
                  setTimeout(() => {
                    setConfigSaved(false);
                    setShowConfigModal(false);
                  }, 800);
                }}
                className="px-3 py-1.5 text-xs font-mono font-bold uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-none"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider rounded-none bg-[var(--color-primary)] text-white hover:bg-[var(--text-primary)] hover:text-[var(--bg-canvas)] transition-colors duration-100 ease-linear shadow-none"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
