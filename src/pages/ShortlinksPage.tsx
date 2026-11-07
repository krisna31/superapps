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
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <div className="text-xs font-semibold text-accent-primary uppercase tracking-wider mb-0.5">Redirects & Traffic</div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">
            URL Shortlinks
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Vanity URL shortener with real-time geo-analytics and secure redirect routing.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="ios-btn ios-btn-primary rounded-[10px] self-start sm:self-auto text-xs font-semibold min-h-[40px] px-4"
        >
          <Plus className="w-4 h-4" />
          <span>New Shortlink</span>
        </button>
      </div>

      {/* Shortlink List Table */}
      <div className="ios-inset-grouped bg-surface shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-border-subtle flex items-center justify-between text-xs bg-subtle/50">
          <span className="font-semibold text-ink">
            Active Links ({links.length})
          </span>
          <span className="text-ink-muted tabular-nums font-medium">
            Total Clicks: {links.reduce((acc, l) => acc + l.clicks, 0)}
          </span>
        </div>

        <div className="divide-y divide-border-subtle">
          {links.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-muted">
              No shortlinks created yet. Click "New Shortlink" to generate a route.
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.slug}
                className="py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-subtle/40 transition-colors duration-fast min-h-[56px]"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-semibold text-accent-primary bg-accent-primary/10 px-2.5 py-0.5 rounded-full border border-accent-primary/20">
                      /r/{link.slug}
                    </span>
                    <span className="text-xs font-semibold text-ink truncate">
                      {link.title || link.slug}
                    </span>
                  </div>

                  <p className="text-[11px] text-ink-secondary max-w-lg truncate">
                    {link.originalUrl}
                  </p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedAnalyticsLink(link)}
                    className="ios-btn ios-btn-secondary rounded-[8px] px-3 py-1 text-xs font-medium tabular-nums min-h-[34px]"
                    title="View detailed click analytics and tracker"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-accent-primary" />
                    <span>{link.clicks} clicks</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(link.slug)}
                    className="p-2 rounded-lg border border-border-subtle bg-surface text-ink hover:bg-subtle transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Copy full shortlink"
                  >
                    {copiedSlug === link.slug ? (
                      <Check className="w-4 h-4 text-status-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <a
                    href={`/r/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-border-subtle bg-surface text-ink hover:bg-subtle hover:text-accent-primary transition-colors inline-flex items-center justify-center min-h-[36px] min-w-[36px]"
                    title="Test redirect"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleDeleteLink(link.slug)}
                    className="p-2 rounded-lg border border-border-subtle bg-surface text-ink-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Delete link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Shortlink Modal: Apple Modal Sheet */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-shortlink-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-elevated/95 backdrop-blur-2xl border border-border-subtle rounded-[20px] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-border-subtle">
              <div>
                <span className="text-[11px] text-accent-primary font-semibold uppercase tracking-wider">New Route</span>
                <h3 id="new-shortlink-modal-title" className="font-display font-bold text-base text-ink">
                  Create Shortlink
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-ink-muted hover:text-ink rounded-full hover:bg-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-3 bg-status-danger/10 border border-status-danger/30 rounded-[10px] text-status-danger text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateShortlink} className="space-y-3.5">
              <div>
                <label htmlFor="shortlink-url-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Destination URL *
                </label>
                <input
                  id="shortlink-url-input"
                  type="text"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/very/long/url"
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="shortlink-slug-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Custom Slug (optional)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 border border-r-0 border-border-default bg-subtle text-xs text-ink-muted rounded-l-[10px] min-h-[44px] flex items-center">
                    /r/
                  </span>
                  <input
                    id="shortlink-slug-input"
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="my-link"
                    className="w-full px-3 py-2 text-xs rounded-r-[10px] border border-border-default bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="shortlink-title-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Title / Description
                </label>
                <input
                  id="shortlink-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Portfolio Website"
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-semibold py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold py-2 px-4 shadow-sm"
                >
                  Create Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Click Analytics & Tracker Modal: Apple Modal Sheet */}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedAnalyticsLink(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortlink-analytics-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-elevated/95 backdrop-blur-2xl border border-border-subtle rounded-[20px] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border-subtle flex items-center justify-between flex-shrink-0 bg-subtle/50">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-[8px] bg-accent-primary/10 text-accent-primary">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                    <h3 id="shortlink-analytics-modal-title" className="font-display font-bold text-sm text-ink truncate">
                      Analytics & Click Tracker
                    </h3>
                    <span className="font-mono text-xs font-semibold text-accent-primary bg-accent-primary/10 px-2.5 py-0.5 rounded-full border border-accent-primary/20">
                      /r/{selectedAnalyticsLink.slug}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted truncate mt-1">
                    {selectedAnalyticsLink.originalUrl}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close analytics modal"
                  onClick={() => setSelectedAnalyticsLink(null)}
                  className="p-1.5 text-ink-muted hover:text-ink rounded-full hover:bg-subtle transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Analytics Body */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* 4 Metric KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="ios-inset-grouped p-3 bg-subtle/50">
                    <span className="text-[11px] text-ink-muted block mb-1">
                      Total Clicks
                    </span>
                    <span className="text-xl font-bold text-ink tabular-nums font-display">
                      {selectedAnalyticsLink.clicks}
                    </span>
                  </div>

                  <div className="ios-inset-grouped p-3 bg-subtle/50">
                    <span className="text-[11px] text-ink-muted block mb-1">
                      Top Country
                    </span>
                    <span className="text-xs font-semibold text-ink truncate block">
                      {topCountry}
                    </span>
                  </div>

                  <div className="ios-inset-grouped p-3 bg-subtle/50">
                    <span className="text-[11px] text-ink-muted block mb-1">
                      Top Device
                    </span>
                    <span className="text-xs font-semibold text-ink truncate block">
                      {topDevice}
                    </span>
                  </div>

                  <div className="ios-inset-grouped p-3 bg-subtle/50">
                    <span className="text-[11px] text-ink-muted block mb-1">
                      Top Referrer
                    </span>
                    <span className="text-xs font-semibold text-ink truncate block">
                      {topReferrer}
                    </span>
                  </div>
                </div>

                {/* Country Distribution Breakdown */}
                {sortedCountries.length > 0 && (
                  <div className="ios-inset-grouped p-4 bg-surface">
                    <div className="flex items-center space-x-1.5 mb-3">
                      <Globe className="w-4 h-4 text-accent-primary" />
                      <h4 className="font-semibold text-xs text-ink">
                        Geographic Breakdown ({sortedCountries.length} countries)
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {sortedCountries.map((item) => {
                        const totalTracked = clicks.length || 1;
                        const pct = Math.round((item.count / totalTracked) * 100);
                        return (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <span className="text-ink font-medium w-44 truncate">
                              {item.code ? `${item.code} - ` : ''}{item.name}
                            </span>
                            <div className="flex-1 mx-3 bg-subtle rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-accent-primary h-full rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-ink-muted tabular-nums w-14 text-right font-medium">
                              {item.count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Real-Time Click Logs Ledger */}
                <div className="ios-inset-grouped bg-surface overflow-hidden">
                  <div className="p-3 bg-subtle/50 border-b border-border-subtle flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-accent-primary" />
                      <span>Detailed Click Log (Last {clicks.length})</span>
                    </span>
                    <span className="text-[11px] text-ink-muted font-medium">
                      Real-time Log
                    </span>
                  </div>

                  {clicks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-ink-muted px-4">
                      No detailed click logs recorded yet. Visit or share <code className="text-accent-primary font-semibold">/r/{selectedAnalyticsLink.slug}</code>.
                    </div>
                  ) : (
                    <div className="divide-y divide-border-subtle max-h-64 overflow-y-auto">
                      {clicks.map((log, idx) => (
                        <div
                          key={idx}
                          className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs hover:bg-subtle/40"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-ink-muted font-mono text-[11px]">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="text-ink font-medium">
                              {log.country || log.countryCode || 'Global'} {log.city ? `(${log.city})` : ''}
                            </span>
                            {log.ip && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-subtle text-ink font-mono">
                                {log.ip}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-ink-secondary text-[11px]">
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
              <div className="p-3 px-4 border-t border-border-subtle bg-subtle/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAnalyticsLink(null)}
                  className="ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold py-2 px-4 shadow-sm"
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
