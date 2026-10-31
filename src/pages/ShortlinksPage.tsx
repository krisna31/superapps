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
import { sanitizeRedirectUrl } from '@/utils/security';

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
      // Keep selected analytics modal in sync if new click arrives
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
      const generatedSlug = customSlug.trim() || Math.random().toString(36).substring(2, 8);
      const newShortlink: ShortlinkItem = {
        id: 'link-' + Date.now(),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            URL Shortlinks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Client-side slug redirection engine with hit tracking and analytics
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Shortlink</span>
        </button>
      </div>

      {/* Shortlink List Table */}
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-2.5 px-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
          <span className="font-semibold text-slate-500 uppercase tracking-wider">
            Active Links ({links.length})
          </span>
          <span className="text-slate-400 tabular-nums">
            Total Clicks: {links.reduce((acc, l) => acc + l.clicks, 0)}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {links.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-mono">
              No shortlinks created yet. Click "New Shortlink" to create your first link.
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.slug}
                className="py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      /r/{link.slug}
                    </span>
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {link.title || link.slug}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-slate-400 max-w-lg truncate">
                    {link.originalUrl}
                  </p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedAnalyticsLink(link)}
                    className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono tabular-nums transition border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                    title="View detailed click analytics and tracker"
                  >
                    <BarChart2 className="w-3 h-3 text-sky-500" />
                    <span>{link.clicks} clicks</span>
                  </button>

                  <button
                    onClick={() => handleCopyLink(link.slug)}
                    className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Copy full shortlink"
                  >
                    {copiedSlug === link.slug ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={`/r/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Test redirect"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDeleteLink(link.slug)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Create Shortlink</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-3.5 p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateShortlink} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Destination URL *
                </label>
                <input
                  type="text"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/very/long/url"
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Custom Slug / Alias (Optional)
                </label>
                <div className="flex items-center">
                  <span className="px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 text-slate-400 rounded-l-md font-mono">
                    /r/
                  </span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="my-link (leave empty to randomize)"
                    className="w-full px-2.5 py-1.5 text-xs rounded-r-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Title / Description
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Portfolio Website"
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition"
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
        const clicks = selectedAnalyticsLink.recentClicks || [];
        
        // Geo Aggregation
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

        // Device Aggregation
        const deviceCounts: Record<string, number> = {};
        clicks.forEach((c) => {
          const dev = c.device || 'Desktop';
          deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
        });
        const topDevice = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Desktop';

        // Referrer Aggregation
        const referrerCounts: Record<string, number> = {};
        clicks.forEach((c) => {
          const ref = c.referrer || 'Direct';
          referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
        });
        const topReferrer = Object.entries(referrerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Direct';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div className="min-w-0 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-sky-500/10 text-sky-500">
                      <BarChart2 className="w-4 h-4" />
                    </span>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      Analytics & Click Tracker
                    </h3>
                    <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      /r/{selectedAnalyticsLink.slug}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate mt-1">
                    {selectedAnalyticsLink.originalUrl}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedAnalyticsLink(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Analytics Body */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 font-sans text-xs">
                {/* 4 Metric KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                      Total Clicks
                    </span>
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                      {selectedAnalyticsLink.clicks}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                      Top Country
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {topCountry}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                      Top Device
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {topDevice}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                      Top Referrer
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {topReferrer}
                    </span>
                  </div>
                </div>

                {/* Country Distribution Breakdown */}
                {sortedCountries.length > 0 && (
                  <div className="p-3.5 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1.5 mb-2.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-500" />
                      <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        Geographic Breakdown ({sortedCountries.length} countries)
                      </h4>
                    </div>

                    <div className="space-y-1.5">
                      {sortedCountries.map((item) => {
                        const totalTracked = clicks.length || 1;
                        const pct = Math.round((item.count / totalTracked) * 100);
                        return (
                          <div key={item.name} className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-700 dark:text-slate-300 w-44 truncate">
                              {item.code ? `${item.code} - ` : ''}{item.name}
                            </span>
                            <div className="flex-1 mx-3 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-slate-400 tabular-nums w-12 text-right">
                              {item.count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Real-Time Click Logs Ledger */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-2.5 px-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
                    <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-sky-500" />
                      <span>Detailed Click Log (Last {clicks.length})</span>
                    </span>
                    <span className="text-slate-400">
                      Logged in real-time
                    </span>
                  </div>

                  {clicks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-mono px-4">
                      No detailed click logs recorded yet. Visit or share <code className="text-emerald-500 font-semibold">/r/{selectedAnalyticsLink.slug}</code> to begin recording click IP, country, and device information.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                      {clicks.map((log, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <span className="text-slate-900 dark:text-slate-200 font-semibold">
                              {log.country || log.countryCode || 'Global'} {log.city ? `(${log.city})` : ''}
                            </span>
                            {log.ip && (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                {log.ip}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-slate-400 text-[10px]">
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
              <div className="p-3 px-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAnalyticsLink(null)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition"
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
