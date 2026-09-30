import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  BarChart2, 
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { ShortlinkItem } from '@/types';

export const ShortlinksPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';

  const [links, setLinks] = useState<ShortlinkItem[]>([]);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [originalUrl, setOriginalUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadLinks = async () => {
    const data = await dataService.getShortlinks(userId);
    setLinks(data);
  };

  useEffect(() => {
    loadLinks();
  }, [userId]);

  const generateRandomSlug = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const handleCreateShortlink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanUrl = originalUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const slug = (customSlug.trim() || generateRandomSlug()).toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!slug) {
      setError('Please provide a valid slug (alphanumeric, hyphens)');
      return;
    }

    const newLink: ShortlinkItem = {
      id: slug,
      userId,
      slug,
      originalUrl: cleanUrl,
      title: title.trim() || slug,
      clicks: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await dataService.saveShortlink(userId, newLink);
    setLinks((prev) => [newLink, ...prev]);
    setIsModalOpen(false);
    setOriginalUrl('');
    setCustomSlug('');
    setTitle('');
  };

  const handleDeleteLink = async (slug: string) => {
    await dataService.deleteShortlink(userId, slug);
    setLinks((prev) => prev.filter((l) => l.slug !== slug));
  };

  const getFullShortUrl = (slug: string) => {
    return `${window.location.origin}/r/${slug}`;
  };

  const handleCopyLink = (slug: string) => {
    navigator.clipboard.writeText(getFullShortUrl(slug));
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            URL Shortlinks & Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create branded redirect links with click tracking and client-side routing
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Shortlink</span>
        </button>
      </div>

      {/* Shortlink List Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">
            Active Links ({links.length})
          </span>
          <span className="text-xs text-slate-400">
            Total Clicks: {links.reduce((acc, l) => acc + l.clicks, 0)}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {links.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No shortlinks created yet. Click "New Shortlink" to create your first link.
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.slug}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      /r/{link.slug}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {link.title || link.slug}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 max-w-lg truncate">
                    Destination: <span className="hover:underline">{link.originalUrl}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                    <BarChart2 className="w-3.5 h-3.5 text-sky-500" />
                    <span>{link.clicks} clicks</span>
                  </div>

                  <button
                    onClick={() => handleCopyLink(link.slug)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Copy full shortlink"
                  >
                    {copiedSlug === link.slug ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <a
                    href={`/r/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Test redirect"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleDeleteLink(link.slug)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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

      {/* New Shortlink Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Shortlink</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateShortlink} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Destination URL *
                </label>
                <input
                  type="text"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/very/long/url"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Custom Slug / Alias (Optional)
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 text-slate-400 rounded-l-xl font-mono">
                    /r/
                  </span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="my-link (leave empty to randomize)"
                    className="w-full px-3 py-2 text-xs rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Title / Description
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Portfolio Website"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  Create Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
