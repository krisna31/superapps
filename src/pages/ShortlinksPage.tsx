import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  BarChart2, 
  X,
  Globe,
  Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { ShortlinkItem } from '@/types';
import { sanitizeRedirectUrl, generateSecureRandomString, generateSecureId, isValidSlug } from '@/utils/security';

export const ShortlinksPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';
  const [searchParams] = useSearchParams();
  const [links, setLinks] = useState<ShortlinkItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnalyticsLink, setSelectedAnalyticsLink] = useState<ShortlinkItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Form state
  const [originalUrl, setOriginalUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToShortlinks(userId, (data) => {
      setLinks(data);
      setSelectedAnalyticsLink((prev) => {
        if (!prev) return null;
        return data.find((l) => l.slug === prev.slug) || prev;
      });
    });
    if (searchParams.get('create') === 'true') {
      setIsModalOpen(true);
    }
    return () => {
      unsubscribe();
    };
  }, [userId, searchParams]);

  useEffect(() => {
    if (!isModalOpen && !selectedAnalyticsLink) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedAnalyticsLink) setSelectedAnalyticsLink(null);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedAnalyticsLink]);

  const handleCreateShortlink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!originalUrl.trim()) return;

    let targetUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    const validatedUrl = sanitizeRedirectUrl(targetUrl);
    if (!validatedUrl) {
      setError('Invalid destination URL. Only secure HTTP and HTTPS protocols are allowed.');
      return;
    }

    try {
      const trimmedCustomSlug = customSlug.trim();
      if (trimmedCustomSlug && !isValidSlug(trimmedCustomSlug)) {
        setError('Custom slug may only contain letters, numbers, hyphens (-), and underscores (_) (max 100 chars).');
        return;
      }
      const generatedSlug = trimmedCustomSlug || generateSecureRandomString(6);
      const newShortlink: ShortlinkItem = {
        id: generateSecureId('link'),
        userId,
        slug: generatedSlug,
        originalUrl: validatedUrl,
        title: title.trim() || undefined,
        clicks: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await dataService.saveShortlink(userId, newShortlink);

      setOriginalUrl('');
      setCustomSlug('');
      setTitle('');
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create shortlink');
    }
  };

  const handleDeleteLink = async (slug: string) => {
    if (confirm(`Delete shortlink /r/${slug}?`)) {
      await dataService.deleteShortlink(userId, slug);
    }
  };

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-1.5 border-border-strong pb-4">
        <div>
          <div className="werkbund-coord mb-1">[MODULE-08] TRAFFIC REDIRECT & CLICK ANALYTICS</div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-ink">
            URL Shortlinks
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Architectural vanity URL shortener with real-time geo-analytics and safe routing.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="werkbund-btn werkbund-btn-signal self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Shortlink</span>
        </button>
      </div>

      {/* Shortlink List Table */}
      <div className="bg-surface border-1.5 border-border-strong overflow-hidden">
        <div className="p-3 border-b-1.5 border-border-strong flex items-center justify-between text-xs font-mono bg-subtle">
          <span className="font-bold text-ink uppercase tracking-wider">
            Active Links ({links.length})
          </span>
          <span className="text-ink-muted tabular-nums">
            Total Clicks: {links.reduce((acc, l) => acc + l.clicks, 0)}
          </span>
        </div>

        <div className="divide-y-1.5 divide-border-strong">
          {links.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-ink-muted">
              [NULL] NO SHORTLINKS CREATED YET. CLICK "NEW SHORTLINK" TO GENERATE A ROUTE.
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.slug}
                className="py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-subtle transition-colors duration-fast"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-canvas bg-signal px-2 py-0.5 border border-border-strong">
                      /r/{link.slug}
                    </span>
                    <span className="text-xs font-bold text-ink uppercase truncate">
                      {link.title || link.slug}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-ink-secondary max-w-lg truncate">
                    {link.originalUrl}
                  </p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedAnalyticsLink(link)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-subtle border-1.5 border-border-strong hover:bg-ink hover:text-canvas text-ink text-xs font-mono tabular-nums font-bold transition-colors duration-fast"
                    title="View detailed click analytics and tracker"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-signal" />
                    <span>{link.clicks} clicks</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(link.slug)}
                    className="p-1.5 border border-border-strong bg-canvas text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast"
                    title="Copy full shortlink"
                  >
                    {copiedSlug === link.slug ? (
                      <Check className="w-3.5 h-3.5 text-status-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={`/r/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 border border-border-strong bg-canvas text-ink hover:bg-signal hover:text-canvas transition-colors duration-fast"
                    title="Test redirect"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDeleteLink(link.slug)}
                    className="p-1.5 border border-border-strong bg-canvas text-ink hover:bg-status-danger hover:text-white transition-colors duration-fast"
                    title="Delete link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Shortlink Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/75"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-shortlink-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-elevated border-1.5 border-border-strong p-6"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b-1.5 border-border-strong">
              <div>
                <span className="werkbund-coord text-[10px]">[ROUTE-NEW]</span>
                <h3 id="new-shortlink-modal-title" className="font-display font-bold text-sm uppercase text-ink">
                  Create Shortlink
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-ink-muted hover:text-ink border-1.5 border-transparent hover:border-border-strong"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 mb-3 bg-surface border-1.5 border-status-danger text-status-danger text-xs font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateShortlink} className="space-y-3">
              <div>
                <label htmlFor="shortlink-url-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Destination URL *
                </label>
                <input
                  id="shortlink-url-input"
                  type="text"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/very/long/url"
                  className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
                />
              </div>

              <div>
                <label htmlFor="shortlink-slug-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Custom Slug (optional)
                </label>
                <div className="flex items-center">
                  <span className="px-2.5 py-1.5 border-1.5 border-r-0 border-border-strong bg-subtle text-xs font-mono text-ink-muted">
                    /r/
                  </span>
                  <input
                    id="shortlink-slug-input"
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="my-link"
                    className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="shortlink-title-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Title / Description
                </label>
                <input
                  id="shortlink-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Portfolio Website"
                  className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t-1.5 border-border-strong">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="werkbund-btn werkbund-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="werkbund-btn werkbund-btn-signal"
                >
                  Create Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Click Analytics & Tracker Modal */}
      {selectedAnalyticsLink && (() => {
        const clicks = Array.isArray(selectedAnalyticsLink.recentClicks) ? selectedAnalyticsLink.recentClicks : [];
        
        const countryCounts: Record<string, { name: string; count: number; code?: string }> = {};
        clicks.forEach((c) => {
          const key = c.country || c.countryCode || 'Unknown';
          if (!countryCounts[key]) {
            countryCounts[key] = { name: c.country || c.countryCode || 'Unknown', count: 0, code: c.countryCode };
          }
          countryCounts[key].count++;
        });
        const sortedCountries = Object.values(countryCounts).sort((a, b) => b.count - a.count);
        const topCountry = sortedCountries[0]?.name || 'No data yet';

        const deviceCounts: Record<string, number> = {};
        clicks.forEach((c) => {
          const dev = c.device || 'Desktop';
          deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
        });
        const topDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Desktop';

        const referrerCounts: Record<string, number> = {};
        clicks.forEach((c) => {
          const ref = c.referrer || 'Direct';
          referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
        });
        const topReferrer = Object.entries(referrerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Direct';

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0A0A]/75"
            onClick={() => setSelectedAnalyticsLink(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortlink-analytics-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-elevated border-1.5 border-border-strong overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b-1.5 border-border-strong flex items-center justify-between flex-shrink-0 bg-subtle">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 bg-surface border border-border-strong text-signal">
                      <BarChart2 className="w-4 h-4" />
                    </span>
                    <h3 id="shortlink-analytics-modal-title" className="font-display font-bold text-sm uppercase text-ink truncate">
                      Analytics & Click Tracker
                    </h3>
                    <span className="font-mono text-xs font-bold text-canvas bg-signal px-2 py-0.5 border border-border-strong">
                      /r/{selectedAnalyticsLink.slug}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-ink-muted truncate mt-1">
                    {selectedAnalyticsLink.originalUrl}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close analytics modal"
                  onClick={() => setSelectedAnalyticsLink(null)}
                  className="p-1.5 border-1.5 border-border-strong text-ink-muted hover:text-ink hover:bg-surface transition-colors duration-fast"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Analytics Body */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
                {/* 4 Metric KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-surface border-1.5 border-border-strong">
                    <span className="werkbund-coord block mb-1">
                      Total Clicks
                    </span>
                    <span className="text-xl font-bold font-mono text-ink tabular-nums">
                      {selectedAnalyticsLink.clicks}
                    </span>
                  </div>

                  <div className="p-3 bg-surface border-1.5 border-border-strong">
                    <span className="werkbund-coord block mb-1">
                      Top Country
                    </span>
                    <span className="text-xs font-bold text-ink truncate block uppercase">
                      {topCountry}
                    </span>
                  </div>

                  <div className="p-3 bg-surface border-1.5 border-border-strong">
                    <span className="werkbund-coord block mb-1">
                      Top Device
                    </span>
                    <span className="text-xs font-bold text-ink truncate block uppercase">
                      {topDevice}
                    </span>
                  </div>

                  <div className="p-3 bg-surface border-1.5 border-border-strong">
                    <span className="werkbund-coord block mb-1">
                      Top Referrer
                    </span>
                    <span className="text-xs font-bold text-ink truncate block uppercase">
                      {topReferrer}
                    </span>
                  </div>
                </div>

                {/* Country Distribution Breakdown */}
                {sortedCountries.length > 0 && (
                  <div className="p-3.5 bg-surface border-1.5 border-border-strong">
                    <div className="flex items-center space-x-1.5 mb-2.5">
                      <Globe className="w-3.5 h-3.5 text-signal" />
                      <h4 className="font-bold text-xs text-ink uppercase tracking-wider">
                        Geographic Breakdown ({sortedCountries.length} countries)
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {sortedCountries.map((item) => {
                        const totalTracked = clicks.length || 1;
                        const pct = Math.round((item.count / totalTracked) * 100);
                        return (
                          <div key={item.name} className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-ink font-bold w-44 truncate uppercase">
                              {item.code ? `${item.code} - ` : ''}{item.name}
                            </span>
                            <div className="flex-1 mx-3 bg-subtle border border-border-strong h-2.5 p-0.5">
                              <div
                                className="bg-signal h-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-ink-muted tabular-nums w-14 text-right font-bold">
                              {item.count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Real-Time Click Logs Ledger */}
                <div className="border-1.5 border-border-strong bg-surface overflow-hidden">
                  <div className="p-2.5 px-3 bg-subtle border-b-1.5 border-border-strong flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-ink uppercase tracking-wider flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-signal" />
                      <span>Detailed Click Log (Last {clicks.length})</span>
                    </span>
                    <span className="werkbund-coord">
                      REAL-TIME LOG
                    </span>
                  </div>

                  {clicks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-ink-muted font-mono px-4">
                      [NULL] NO DETAILED CLICK LOGS RECORDED YET. VISIT OR SHARE <code className="text-signal font-bold">/r/{selectedAnalyticsLink.slug}</code>.
                    </div>
                  ) : (
                    <div className="divide-y-1.5 divide-border-strong max-h-64 overflow-y-auto">
                      {clicks.map((log, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono hover:bg-subtle"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-ink-muted">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="text-ink font-bold uppercase">
                              {log.country || log.countryCode || 'Global'} {log.city ? `(${log.city})` : ''}
                            </span>
                            {log.ip && (
                              <span className="text-[10px] px-1 py-0.2 bg-canvas text-ink border border-border-strong">
                                {log.ip}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-ink-secondary text-[10px]">
                            <span>{log.device || 'Desktop'}</span>
                            <span>•</span>
                            <span>{log.os || 'OS'} / {log.browser || 'Browser'}</span>
                            <span>•</span>
                            <span className="truncate max-w-[120px]" title={log.referrer}>
                              Ref: {log.referrer || 'Direct'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 px-4 border-t-1.5 border-border-strong bg-subtle flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAnalyticsLink(null)}
                  className="werkbund-btn werkbund-btn-signal"
                >
                  Close Analytics
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
