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

  // Platform visual badges (Apple HIG pill chips)
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
        className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
          isDirect
            ? 'bg-subtle text-ink-secondary border border-border-subtle'
            : 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <div className="text-xs font-semibold text-accent-primary uppercase tracking-wider mb-0.5">Media Utilities</div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">
            Media Downloader
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Download high-resolution video and audio from Instagram Reels, Facebook, TikTok, Twitter/X, YouTube, and direct web links.
          </p>
        </div>

        {/* API Endpoint Config Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-semibold min-h-[40px] px-3.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>API Settings</span>
          </button>
        </div>
      </div>

      {/* Main Extractor Card - Inset Grouped */}
      <div className="ios-inset-grouped p-4 sm:p-5 bg-surface shadow-sm space-y-4">
        <form onSubmit={handleExtract} className="space-y-3.5">
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
              className="w-full pl-3.5 pr-28 py-2.5 text-xs rounded-[10px] bg-subtle/50 border border-border-default text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
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
                  className="p-1.5 text-ink-muted hover:text-ink rounded-full"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePaste}
                className="ios-btn ios-btn-secondary rounded-[8px] px-2.5 py-1 text-xs font-semibold min-h-[32px]"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>
          </div>

          {/* Controls: Platform badge, Format Mode, Quality, and Extract Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Detected Platform Indicator */}
              <div className="flex items-center space-x-1.5 text-xs">
                <span className="text-xs text-ink-muted font-medium">Target:</span>
                {renderPlatformBadge(detectedPlatform)}
              </div>

              {/* Format Toggle (Video vs Audio) */}
              <div className="ios-segmented">
                <button
                  type="button"
                  onClick={() => setDownloadMode('auto')}
                  className={`ios-segmented-item flex items-center space-x-1 ${
                    downloadMode === 'auto' ? 'ios-segmented-item-active font-semibold' : ''
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Video (MP4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadMode('audio')}
                  className={`ios-segmented-item flex items-center space-x-1 ${
                    downloadMode === 'audio' ? 'ios-segmented-item-active font-semibold' : ''
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
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
                    className="text-xs font-medium py-1.5 px-3 bg-subtle/60 border border-border-subtle rounded-[10px] text-ink focus:outline-none focus:ring-1 focus:ring-accent-primary"
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
              className="ios-btn ios-btn-primary rounded-[10px] px-4 py-2 text-xs font-semibold shadow-sm min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="p-3 rounded-[12px] bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Extraction Notice:</span>
                <p className="text-[11px] leading-relaxed">{error}</p>
              </div>
            </div>

            {/* Direct Resolver Bridges */}
            <div className="p-3.5 rounded-[14px] bg-subtle/50 border border-border-subtle space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold text-white bg-accent-primary px-2 py-0.5 rounded-full">
                    Direct Resolver Bridges
                  </span>
                  <span className="text-xs font-medium text-ink">
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
                    className="ios-btn ios-btn-secondary rounded-[8px] px-2.5 py-1 text-xs font-medium min-h-[32px]"
                    title="Copy ready-to-run yt-dlp CLI command for terminal"
                  >
                    {copiedId === 'ytdlp-btn' ? <Check className="w-3 h-3 text-status-success" /> : <Terminal className="w-3 h-3" />}
                    <span>{copiedId === 'ytdlp-btn' ? 'Copied yt-dlp!' : 'Copy yt-dlp CLI'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(url);
                      setCopiedId('url-btn');
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="ios-btn ios-btn-secondary rounded-[8px] px-2.5 py-1 text-xs font-medium min-h-[32px]"
                  >
                    {copiedId === 'url-btn' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
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
                    className="p-3 rounded-[12px] border border-border-subtle hover:border-accent-primary bg-surface transition-colors flex items-center justify-between group shadow-sm"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-xs text-ink group-hover:text-accent-primary transition-colors block">
                        {portal.name}
                      </span>
                      <span className="text-[11px] text-ink-muted truncate block">
                        {portal.description}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-accent-primary flex-shrink-0 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Extraction Result Stage */}
      {result && (
        <div className="ios-inset-grouped p-4 sm:p-5 bg-surface shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-accent-primary">Preview</span>
              <h2 className="text-xs font-semibold text-ink">
                Extracted Media Preview
              </h2>
              {renderPlatformBadge(result.platform)}
            </div>
            {result.filename && (
              <span className="text-[11px] text-ink-muted truncate max-w-xs font-mono">
                {result.filename}
              </span>
            )}
          </div>

          {/* Single Video / Audio Stream Result */}
          {result.url && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Media Preview Player */}
              <div className="rounded-[14px] bg-black overflow-hidden flex items-center justify-center min-h-[220px] max-h-[340px] border border-border-subtle shadow-inner">
                {downloadMode === 'audio' ? (
                  <div className="p-6 text-center space-y-3 w-full">
                    <div className="w-12 h-12 mx-auto rounded-full bg-surface text-accent-primary flex items-center justify-center shadow-sm">
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
                <div className="ios-inset-grouped p-3.5 bg-subtle/50 text-xs space-y-2">
                  <div className="flex justify-between border-b border-border-subtle pb-1.5">
                    <span className="text-ink-muted">Format:</span>
                    <span className="font-semibold text-ink">
                      {downloadMode === 'audio' ? 'MP3 Audio Stream' : 'MP4 High Definition'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle pb-1.5">
                    <span className="text-ink-muted">Quality:</span>
                    <span className="font-semibold text-ink">
                      {downloadMode === 'audio' ? 'Original Bitrate' : `${videoQuality}p`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-muted">File Name:</span>
                    <span className="font-semibold text-ink truncate max-w-[200px]" title={result.filename}>
                      {result.filename || 'media.mp4'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleDownload(result.url!, result.filename, 'single-main')}
                    disabled={downloadingItem === 'single-main'}
                    className="ios-btn ios-btn-primary w-full py-2.5 rounded-[10px] text-xs font-semibold shadow-sm min-h-[44px]"
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
                      className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-semibold min-h-[40px]"
                    >
                      {copiedId === 'stream-url' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-status-success" />
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
                      className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-semibold min-h-[40px] inline-flex items-center justify-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in New Tab</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Picker / Carousel Album Result */}
          {result.status === 'picker' && result.picker && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[12px] bg-subtle/50 border border-border-subtle">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-accent-primary" />
                  <span className="text-xs font-semibold text-ink">
                    Album Assets: {result.picker.length} items detected
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {result.audioUrl && (
                    <button
                      onClick={() => handleDownload(result.audioUrl!, result.audioFilename || 'album-soundtrack.mp3', 'album-audio')}
                      className="ios-btn ios-btn-secondary rounded-[8px] text-xs font-medium px-3 py-1.5 min-h-[34px]"
                    >
                      <Music className="w-3 h-3 text-accent-primary" />
                      <span>Download Audio Track</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownloadAllPicker(result.picker!)}
                    disabled={downloadingItem === 'all-picker'}
                    className="ios-btn ios-btn-primary rounded-[8px] text-xs font-semibold px-3 py-1.5 min-h-[34px]"
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
                    className="group relative rounded-[14px] border border-border-subtle bg-surface overflow-hidden flex flex-col justify-between shadow-sm"
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

                    <div className="p-2.5 flex items-center justify-between border-t border-border-subtle bg-surface text-xs">
                      <span className="font-semibold text-ink text-[11px]">
                        #{idx + 1} {item.type.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleDownload(item.url, `${result.platform}-item-${idx + 1}.${item.type === 'video' ? 'mp4' : 'jpg'}`, `picker-${idx}`)}
                        disabled={downloadingItem === `picker-${idx}`}
                        className="p-1.5 rounded-lg text-ink hover:text-accent-primary transition-colors"
                        title="Download item"
                      >
                        {downloadingItem === `picker-${idx}` ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
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
      <div className="ios-inset-grouped bg-surface shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-border-subtle flex items-center justify-between text-xs bg-subtle/50">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-ink">
              Download History ({history.length})
            </span>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-status-danger hover:underline text-xs font-semibold transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-muted">
            No media downloads logged yet. Paste a URL above to start.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 flex items-center justify-between hover:bg-subtle/40 transition-colors text-xs min-h-[52px]"
              >
                <div className="flex items-center space-x-3.5 min-w-0 pr-3">
                  <div className="w-9 h-9 rounded-[10px] bg-accent-primary/10 text-accent-primary flex items-center justify-center flex-shrink-0">
                    {item.format === 'audio' ? (
                      <Music className="w-4 h-4" />
                    ) : (
                      <Video className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-ink truncate max-w-sm">
                        {item.title || item.filename || 'Media Item'}
                      </span>
                      {renderPlatformBadge(item.platform)}
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-ink-muted mt-0.5">
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
                    className="p-2 rounded-lg border border-border-subtle bg-surface text-ink hover:bg-subtle transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => copyToClipboard(item.originalUrl, `orig-${item.id}`)}
                    className="p-2 rounded-lg border border-border-subtle bg-surface text-ink hover:bg-subtle transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Copy original link"
                  >
                    {copiedId === `orig-${item.id}` ? (
                      <Check className="w-3.5 h-3.5 text-status-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {sanitizeRedirectUrl(item.originalUrl) && (
                    <a
                      href={sanitizeRedirectUrl(item.originalUrl)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-border-subtle bg-surface text-ink hover:bg-subtle hover:text-accent-primary transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Visit original post"
                      aria-label="Visit original post"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteHistory(item)}
                    className="p-2 rounded-lg border border-border-subtle bg-surface text-ink-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
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

      {/* Custom Cobalt Instance Modal - Apple Modal Sheet */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfigModal(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-settings-modal-title"
            className="w-full max-w-md rounded-[20px] bg-elevated/95 backdrop-blur-2xl border border-border-subtle p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-accent-primary" />
                <h3 id="media-settings-modal-title" className="text-base font-display font-bold text-ink">
                  Media Extractor Settings
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                aria-label="Close modal"
                className="p-1.5 text-ink-muted hover:text-ink rounded-full hover:bg-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-ink-secondary leading-relaxed">
                Superapps uses open-source Cobalt and multi-engine extractors for zero-cost media downloads. You can also connect your own self-hosted Cobalt instance or yt-dlp API server below for 100% private extraction.
              </p>

              <div className="space-y-1">
                <label htmlFor="custom-cobalt-url" className="text-xs font-medium text-ink-secondary">
                  Custom Instance / yt-dlp Backend URL (Optional)
                </label>
                <input
                  id="custom-cobalt-url"
                  type="url"
                  value={customInstance}
                  onChange={(e) => setCustomInstance(e.target.value)}
                  placeholder="https://my-cobalt.example.com"
                  className="w-full px-3 py-2 text-xs bg-surface border border-border-default rounded-[10px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="custom-cobalt-key" className="text-xs font-medium text-ink-secondary">
                  API Key / Bearer Token (Optional)
                </label>
                <input
                  id="custom-cobalt-key"
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Bearer token or API key for protected instances"
                  className="w-full px-3 py-2 text-xs bg-surface border border-border-default rounded-[10px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
                />
              </div>

              <div className="p-3.5 rounded-[12px] bg-subtle/60 border border-border-subtle text-[11px] space-y-1.5">
                <span className="font-semibold text-ink">Default Fallback Instances:</span>
                <ul className="text-ink-muted list-disc list-inside space-y-0.5">
                  {DEFAULT_COBALT_INSTANCES.map((inst, i) => (
                    <li key={i} className="truncate font-mono">{inst}</li>
                  ))}
                </ul>
              </div>

              {configSaved && (
                <div className="p-2.5 rounded-[10px] bg-status-success/10 border border-status-success/30 text-status-success text-xs font-semibold flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Instance configuration saved!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border-subtle">
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
                className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-semibold py-2 px-3.5"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold py-2 px-4 shadow-sm"
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
