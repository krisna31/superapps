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
  DEFAULT_COBALT_INSTANCES
} from '@/services/mediaService';
import { 
  MediaPlatform, 
  MediaDownloadItem, 
  MediaExtractionResult, 
  PickerMediaItem 
} from '@/types';

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

  // Save custom Cobalt endpoint
  const handleSaveConfig = () => {
    setCustomCobaltInstance(customInstance);
    setConfigSaved(true);
    setTimeout(() => {
      setConfigSaved(false);
      setShowConfigModal(false);
    }, 1200);
  };

  // Platform visual badges
  const renderPlatformBadge = (platform: MediaPlatform) => {
    switch (platform) {
      case 'instagram':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">Instagram</span>;
      case 'facebook':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Facebook</span>;
      case 'tiktok':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">TikTok</span>;
      case 'twitter':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">Twitter / X</span>;
      case 'youtube':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">YouTube</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Direct Web</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Media Downloader
            </h1>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
              Multi-Source
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Download high-resolution video and audio from Instagram Reels, Facebook, TikTok, Twitter/X, YouTube, and direct web links.
          </p>
        </div>

        {/* API Endpoint Config Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>API Settings</span>
          </button>
        </div>
      </div>

      {/* Main Extractor Card */}
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3.5 shadow-sm">
        <form onSubmit={handleExtract} className="space-y-3">
          {/* URL Input Bar */}
          <div className="relative flex items-center">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste Instagram Reel, Facebook Video, TikTok, YouTube, or direct video URL..."
              className="w-full pl-3 pr-28 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-600"
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
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                  title="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center space-x-1 px-2 py-1 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/70 dark:bg-slate-800 rounded transition-colors"
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
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <span className="text-[11px] font-mono text-slate-400">Target:</span>
                {renderPlatformBadge(detectedPlatform)}
              </div>

              {/* Format Toggle (Video vs Audio) */}
              <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setDownloadMode('auto')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    downloadMode === 'auto'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>Video (MP4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadMode('audio')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    downloadMode === 'audio'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
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
                    value={videoQuality}
                    onChange={(e: any) => setVideoQuality(e.target.value)}
                    className="text-[11px] font-mono py-1 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none"
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
              className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-mono font-medium rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Extraction Notice:</span>
              <p className="text-[11px]">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Extraction Result Stage */}
      {result && (
        <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
                Extracted Media Preview
              </h2>
              {renderPlatformBadge(result.platform)}
            </div>
            {result.filename && (
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                {result.filename}
              </span>
            )}
          </div>

          {/* 1. Single Video / Audio Stream Result */}
          {result.url && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {/* Media Preview Player */}
              <div className="rounded-md bg-black/90 overflow-hidden flex items-center justify-center min-h-[220px] max-h-[340px] border border-slate-800">
                {downloadMode === 'audio' ? (
                  <div className="p-6 text-center space-y-3 w-full">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center">
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
                <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Format:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                      {downloadMode === 'audio' ? 'MP3 Audio Stream' : 'MP4 High Definition'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quality:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {downloadMode === 'audio' ? 'Original Bitrate' : `${videoQuality}p`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">File Name:</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]" title={result.filename}>
                      {result.filename || 'media.mp4'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleDownload(result.url!, result.filename, 'single-main')}
                    disabled={downloadingItem === 'single-main'}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-medium transition-colors shadow-xs"
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
                      className="flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                    >
                      {copiedId === 'stream-url' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
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
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
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
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                    Album Assets: {result.picker.length} items detected
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {result.audioUrl && (
                    <button
                      onClick={() => handleDownload(result.audioUrl!, result.audioFilename || 'album-soundtrack.mp3', 'album-audio')}
                      className="flex items-center space-x-1 px-2.5 py-1 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <Music className="w-3 h-3 text-emerald-400" />
                      <span>Download Audio Track</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDownloadAllPicker(result.picker!)}
                    disabled={downloadingItem === 'all-picker'}
                    className="flex items-center space-x-1.5 px-3 py-1 text-xs font-mono font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
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
                    className="group relative rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="aspect-square w-full bg-black/60 flex items-center justify-center overflow-hidden">
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

                    <div className="p-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-mono">
                      <span className="text-slate-400">
                        #{idx + 1} {item.type.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleDownload(item.url, `${result.platform}-item-${idx + 1}.${item.type === 'video' ? 'mp4' : 'jpg'}`, `picker-${idx}`)}
                        disabled={downloadingItem === `picker-${idx}`}
                        className="p-1 text-slate-700 dark:text-slate-300 hover:text-emerald-500 transition-colors"
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
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-2.5 px-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
          <span className="font-semibold text-slate-500 uppercase tracking-wider">
            Download History Ledger ({history.length})
          </span>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-rose-500 hover:text-rose-600 text-[11px] font-medium transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-mono">
            No media downloads logged yet. Paste a URL above to start.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-3">
                  <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                    {item.format === 'audio' ? (
                      <Music className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Video className="w-4 h-4 text-blue-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-sm">
                        {item.title || item.filename || 'Media Item'}
                      </span>
                      {renderPlatformBadge(item.platform)}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
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
                    className="p-1.5 text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => copyToClipboard(item.originalUrl, `orig-${item.id}`)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Copy original link"
                  >
                    {copiedId === `orig-${item.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={item.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Visit original post"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDeleteHistory(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
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

      {/* Custom Cobalt Instance Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Media Extractor Settings
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-500 dark:text-slate-400">
                Superapps uses open-source Cobalt community API instances for zero-cost social media extraction. If public instances are rate-limited, you can specify your own self-hosted Cobalt instance endpoint below.
              </p>

              <div className="space-y-1">
                <label className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  Custom Instance URL (Optional)
                </label>
                <input
                  type="url"
                  value={customInstance}
                  onChange={(e) => setCustomInstance(e.target.value)}
                  placeholder="https://my-cobalt.example.com"
                  className="w-full px-2.5 py-1.5 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono space-y-1">
                <span className="font-semibold text-slate-400">Default Fallback Instances:</span>
                <ul className="text-slate-500 list-disc list-inside space-y-0.5">
                  {DEFAULT_COBALT_INSTANCES.map((inst, i) => (
                    <li key={i} className="truncate">{inst}</li>
                  ))}
                </ul>
              </div>

              {configSaved && (
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Instance configuration saved!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCustomInstance('');
                  setCustomCobaltInstance(null);
                  setConfigSaved(true);
                  setTimeout(() => {
                    setConfigSaved(false);
                    setShowConfigModal(false);
                  }, 800);
                }}
                className="px-3 py-1.5 text-xs font-mono text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-3.5 py-1.5 text-xs font-mono font-medium rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
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
