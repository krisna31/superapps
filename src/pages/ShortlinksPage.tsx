import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Shortlink } from '../types';
import {
  encodeStatelessLink,
  buildStatelessUrl,
  generateQrCodeDataUrl,
} from '../services/statelessLinkService';
import {
  Link2,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Trash2,
  Sparkles,
  Share2,
  X,
} from 'lucide-react';

export const ShortlinksPage: React.FC = () => {
  const { runQuery, runMutation, refreshSignal } = useDb();
  const [links, setLinks] = useState<Shortlink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Personal');
  const [formError, setFormError] = useState<string | null>(null);

  // Stateless generator state
  const [statelessUrlInput, setStatelessUrlInput] = useState('');
  const [statelessTitleInput, setStatelessTitleInput] = useState('');
  const [generatedStatelessUrl, setGeneratedStatelessUrl] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Quick Go box
  const [quickGoInput, setQuickGoInput] = useState('');

  // Load links from SQLite
  useEffect(() => {
    const res = runQuery('SELECT id, key, title, url, category, clicks, createdAt, updatedAt FROM shortlinks ORDER BY clicks DESC, createdAt DESC;');
    if (res.values) {
      const items: Shortlink[] = res.values.map((v) => ({
        id: v[0],
        key: v[1],
        title: v[2],
        url: v[3],
        category: v[4] || 'Personal',
        clicks: v[5] || 0,
        createdAt: v[6],
        updatedAt: v[7],
      }));
      setLinks(items);
    }
  }, [runQuery, refreshSignal]);

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanKey = keyInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!cleanKey) {
      setFormError('Key must contain alphanumeric characters or dashes/underscores.');
      return;
    }

    let cleanUrl = urlInput.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const id = 'link_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    try {
      runMutation(
        'INSERT INTO shortlinks (id, key, title, url, category, clicks, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 0, ?, ?);',
        [id, cleanKey, titleInput.trim() || cleanKey, cleanUrl, categoryInput, now, now]
      );
      setShowAddModal(false);
      setKeyInput('');
      setTitleInput('');
      setUrlInput('');
    } catch (err: any) {
      setFormError(err.message?.includes('UNIQUE') ? 'A shortlink with this key already exists!' : 'Failed to save link.');
    }
  };

  const handleDeleteLink = (id: string) => {
    if (window.confirm('Delete this shortlink?')) {
      runMutation('DELETE FROM shortlinks WHERE id = ?;', [id]);
    }
  };

  const handleOpenLink = (link: Shortlink) => {
    // Increment click count in SQLite
    runMutation('UPDATE shortlinks SET clicks = clicks + 1, updatedAt = ? WHERE id = ?;', [
      new Date().toISOString(),
      link.id,
    ]);
    window.open(link.url, '_blank', 'noreferrer');
  };

  const handleQuickGo = (e: React.FormEvent) => {
    e.preventDefault();
    const query = quickGoInput.trim().toLowerCase().replace(/^go\//, '');
    const found = links.find((l) => l.key.toLowerCase() === query);
    if (found) {
      handleOpenLink(found);
      setQuickGoInput('');
    } else {
      alert(`Shortkey "go/${query}" not found.`);
    }
  };

  const handleGenerateStateless = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statelessUrlInput) return;

    let target = statelessUrlInput.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }

    const encoded = encodeStatelessLink(target, statelessTitleInput.trim());
    const fullShareable = buildStatelessUrl(encoded);
    setGeneratedStatelessUrl(fullShareable);

    const qr = await generateQrCodeDataUrl(fullShareable);
    setQrCodeDataUrl(qr);
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(identifier);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const categories = ['All', ...Array.from(new Set(links.map((l) => l.category)))];

  const filteredLinks = links.filter((l) => {
    const matchesSearch =
      l.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || l.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Link2 className="w-6 h-6 text-blue-500" />
            <span>Shortlink & Quick Launcher</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Personal local jump keys stored in SQLite + Serverless stateless public redirects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Shortlink</span>
          </button>
        </div>
      </div>

      {/* Quick Launcher Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleQuickGo} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-blue-400 font-mono text-xs font-bold">
              go/
            </span>
            <input
              type="text"
              value={quickGoInput}
              onChange={(e) => setQuickGoInput(e.target.value)}
              placeholder="Type shortcut (e.g. gh) and press Enter to launch..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            Launch
          </button>
        </form>
      </div>

      {/* Two Column Layout: Left = Local Shortlinks Hub, Right = Stateless Public Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Personal Shortlink List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search shortkeys, titles, or URLs..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredLinks.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center text-slate-500 text-xs border border-slate-800">
              No shortlinks found. Click "New Shortlink" to add your first quick shortcut.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  className="glass-card p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleOpenLink(link)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono text-xs font-bold transition-colors shrink-0"
                      title="Click to launch"
                    >
                      go/{link.key}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{link.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                          {link.category}
                        </span>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-blue-400 truncate block mt-0.5 max-w-sm"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      {link.clicks} clicks
                    </span>
                    <button
                      onClick={() => handleOpenLink(link)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Launch URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(link.url, link.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Copy URL"
                    >
                      {copiedLink === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Stateless Shareable Link Generator */}
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Stateless Public Redirector</h2>
            </div>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Create a link you can share with <strong>anyone on the web</strong>. Uses URL payload compression to forward recipients from static GitHub Pages without any database server!
            </p>

            <form onSubmit={handleGenerateStateless} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={statelessUrlInput}
                  onChange={(e) => setStatelessUrlInput(e.target.value)}
                  placeholder="https://example.com/very/long/url..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                  Optional Title / Label
                </label>
                <input
                  type="text"
                  value={statelessTitleInput}
                  onChange={(e) => setStatelessTitleInput(e.target.value)}
                  placeholder="Doc, Presentation, Repo..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Shareable Link & QR</span>
              </button>
            </form>

            {generatedStatelessUrl && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
                    Your Shareable Link
                  </div>
                  <div className="text-[11px] text-purple-300 font-mono break-all line-clamp-3">
                    {generatedStatelessUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedStatelessUrl, 'stateless')}
                    className="mt-2 w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedLink === 'stateless' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Shareable Link</span>
                      </>
                    )}
                  </button>
                </div>

                {qrCodeDataUrl && (
                  <div className="p-3 rounded-xl bg-white flex flex-col items-center justify-center shadow-lg">
                    <img src={qrCodeDataUrl} alt="QR Code" className="w-40 h-40" />
                    <span className="text-[10px] text-slate-700 font-medium mt-1">
                      Scan with Phone to Forward
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Shortlink Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-500" />
                <span>Create Personal Shortlink</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Short Key (go/...)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-blue-400 font-mono text-xs font-bold">
                    go/
                  </span>
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="e.g. gh, mail, cal, pr"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Title / Label
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. GitHub Dashboard"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                  <option value="Dev">Dev / Tools</option>
                  <option value="Social">Social</option>
                  <option value="Docs">Docs</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/30"
                >
                  Save Shortlink
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
