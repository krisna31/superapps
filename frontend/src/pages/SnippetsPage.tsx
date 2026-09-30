import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDb } from '../context/DbContext';
import { Snippet } from '../types';
import { soundService } from '../services/soundService';
import {
  Code2,
  Plus,
  Search,
  Copy,
  Check,
  Star,
  Trash2,
  Edit2,
  Tag,
  Terminal,
  FileCode,
  Filter,
  X,
  Sparkles,
} from 'lucide-react';

const POPULAR_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'shell',
  'sql',
  'json',
  'markdown',
  'html',
  'css',
  'rust',
  'go',
  'yaml',
  'dockerfile',
  'prompt',
];

const LANGUAGE_STYLES: Record<string, { label: string; badge: string }> = {
  typescript: { label: 'TypeScript', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  javascript: { label: 'JavaScript', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  python: { label: 'Python', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  shell: { label: 'Shell / Bash', badge: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  sql: { label: 'SQL', badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  json: { label: 'JSON', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  markdown: { label: 'Markdown', badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  html: { label: 'HTML', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  css: { label: 'CSS', badge: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
  rust: { label: 'Rust', badge: 'bg-orange-600/15 text-orange-400 border-orange-600/30' },
  go: { label: 'Go', badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  yaml: { label: 'YAML', badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  dockerfile: { label: 'Dockerfile', badge: 'bg-blue-600/15 text-blue-400 border-blue-600/30' },
  prompt: { label: 'Prompt Template', badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

function safeParseTags(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String);
    if (typeof parsed === 'string') return [parsed];
    return [];
  } catch {
    if (typeof val === 'string') {
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }
}

export const SnippetsPage: React.FC = () => {
  const { runQuery, runMutation, refreshSignal } = useDb();
  const location = useLocation();
  const navigate = useNavigate();

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLanguage, setFormLanguage] = useState('typescript');
  const [formCode, setFormCode] = useState('');
  const [formTagsStr, setFormTagsStr] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);

  // Load snippets from SQLite
  useEffect(() => {
    const res = runQuery('SELECT id, title, description, language, code, tags, isPinned, createdAt, updatedAt FROM snippets ORDER BY isPinned DESC, updatedAt DESC;');
    if (res.values) {
      setSnippets(
        res.values.map((v) => ({
          id: v[0] as string,
          title: v[1] as string,
          description: (v[2] as string) || '',
          language: (v[3] as string) || 'typescript',
          code: (v[4] as string) || '',
          tags: safeParseTags(v[5]),
          isPinned: Boolean(v[6]),
          createdAt: v[7] as string,
          updatedAt: v[8] as string,
        }))
      );
    }
  }, [runQuery, refreshSignal]);

  // Handle URL deep link ?action=new
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      openCreateModal();
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // All distinct languages present in database
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    snippets.forEach((s) => set.add(s.language.toLowerCase()));
    return Array.from(set).sort();
  }, [snippets]);

  // Filter snippets
  const filteredSnippets = useMemo(() => {
    return snippets.filter((s) => {
      const sTags = s.tags || [];
      const matchesSearch =
        searchQuery === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLang =
        selectedLanguage === 'all' || s.language.toLowerCase() === selectedLanguage.toLowerCase();
      const matchesPinned = !pinnedOnly || s.isPinned;

      return matchesSearch && matchesLang && matchesPinned;
    });
  }, [snippets, searchQuery, selectedLanguage, pinnedOnly]);

  // Metrics
  const metrics = useMemo(() => {
    const total = snippets.length;
    const pinned = snippets.filter((s) => s.isPinned).length;
    const langCounts: Record<string, number> = {};
    snippets.forEach((s) => {
      langCounts[s.language] = (langCounts[s.language] || 0) + 1;
    });
    const topLangEntry = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0];
    const topLang = topLangEntry ? topLangEntry[0] : 'None';
    return { total, pinned, topLang };
  }, [snippets]);

  // Modal Openers
  const openCreateModal = () => {
    setEditingSnippet(null);
    setFormTitle('');
    setFormDescription('');
    setFormLanguage('typescript');
    setFormCode('');
    setFormTagsStr('');
    setFormIsPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setFormTitle(snippet.title);
    setFormDescription(snippet.description || '');
    setFormLanguage(snippet.language);
    setFormCode(snippet.code);
    setFormTagsStr((snippet.tags || []).join(', '));
    setFormIsPinned(snippet.isPinned);
    setIsModalOpen(true);
  };

  // Copy to clipboard with sound effect
  const handleCopyCode = (snippet: Snippet) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(snippet.code).catch(() => {});
    }
    soundService.playSuccess();
    setCopiedId(snippet.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Toggle Pinned
  const handleTogglePinned = (snippet: Snippet) => {
    const nextPinned = snippet.isPinned ? 0 : 1;
    const now = new Date().toISOString();
    runMutation('UPDATE snippets SET isPinned = ?, updatedAt = ? WHERE id = ?;', [
      nextPinned,
      now,
      snippet.id,
    ]);
    soundService.playClick();
  };

  // Delete Snippet
  const handleDeleteSnippet = (snippet: Snippet) => {
    if (window.confirm(`Delete snippet "${snippet.title}"?`)) {
      runMutation('DELETE FROM snippets WHERE id = ?;', [snippet.id]);
      soundService.playClick();
    }
  };

  // Save Snippet
  const handleSaveSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCode.trim()) return;

    const parsedTags = formTagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const now = new Date().toISOString();

    if (editingSnippet) {
      runMutation(
        `UPDATE snippets SET title = ?, description = ?, language = ?, code = ?, tags = ?, isPinned = ?, updatedAt = ? WHERE id = ?;`,
        [
          formTitle.trim(),
          formDescription.trim(),
          formLanguage.toLowerCase(),
          formCode,
          JSON.stringify(parsedTags),
          formIsPinned ? 1 : 0,
          now,
          editingSnippet.id,
        ]
      );
    } else {
      const id = crypto.randomUUID();
      runMutation(
        `INSERT INTO snippets (id, title, description, language, code, tags, isPinned, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          formTitle.trim(),
          formDescription.trim(),
          formLanguage.toLowerCase(),
          formCode,
          JSON.stringify(parsedTags),
          formIsPinned ? 1 : 0,
          now,
          now,
        ]
      );
    }

    soundService.playClick();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Code2 className="w-6 h-6 text-emerald-400" />
            <span>Encrypted Snippets Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Securely manage code snippets, shell commands, prompt templates, and configs locally in SQLite.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Snippet</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Total Snippets</span>
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Stored in local vault</div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Pinned Snippets</span>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">{metrics.pinned}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Quick access favorites</div>
        </div>

        <div className="glass-card p-4 rounded-xl col-span-2 sm:col-span-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Top Language</span>
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400 mt-1 capitalize">{metrics.topLang}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Most common syntax</div>
        </div>
      </div>

      {/* Search & Language Filters */}
      <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search snippet titles, code, descriptions, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Pinned filter toggle */}
          <button
            onClick={() => setPinnedOnly((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              pinnedOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${pinnedOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Pinned Only</span>
          </button>
        </div>

        {/* Language Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
          <button
            onClick={() => setSelectedLanguage('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              selectedLanguage === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Languages ({snippets.length})
          </button>

          {availableLanguages.map((lang) => {
            const count = snippets.filter((s) => s.language.toLowerCase() === lang).length;
            const style = LANGUAGE_STYLES[lang] || { label: lang, badge: 'text-slate-300' };

            return (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-all border ${
                  selectedLanguage.toLowerCase() === lang
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <span>{style.label || lang}</span>
                <span className="ml-1 text-[10px] opacity-70 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Snippets Grid */}
      {filteredSnippets.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Code2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Snippets Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedLanguage !== 'all' || pinnedOnly
              ? 'No snippets matched your search filters. Try clearing your filters or query.'
              : 'Keep your most important code blocks, shell commands, and prompt templates readily accessible.'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Snippet</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSnippets.map((snippet) => {
            const langStyle = LANGUAGE_STYLES[snippet.language.toLowerCase()] || {
              label: snippet.language,
              badge: 'bg-slate-800 text-slate-300 border-slate-700',
            };
            const isCopied = copiedId === snippet.id;

            return (
              <div
                key={snippet.id}
                className="glass-card rounded-2xl border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Snippet Card Header */}
                <div className="p-4 border-b border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <button
                        onClick={() => handleTogglePinned(snippet)}
                        title={snippet.isPinned ? 'Unpin snippet' : 'Pin snippet to top'}
                        className="text-slate-500 hover:text-amber-400 transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            snippet.isPinned
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600 hover:text-amber-400'
                          }`}
                        />
                      </button>

                      <h3 className="font-bold text-sm text-white truncate">{snippet.title}</h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Language Badge */}
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${langStyle.badge}`}
                      >
                        {langStyle.label}
                      </span>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyCode(snippet)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                          isCopied
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                        }`}
                        title="Copy code to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(snippet)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit snippet"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteSnippet(snippet)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete snippet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {snippet.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">{snippet.description}</p>
                  )}
                </div>

                {/* Code Preview Box */}
                <div className="p-3 bg-slate-950/90 font-mono text-xs text-slate-200 overflow-x-auto max-h-56 select-text border-b border-slate-800/80">
                  <pre className="text-[11px] leading-relaxed font-mono whitespace-pre">
                    <code>{snippet.code}</code>
                  </pre>
                </div>

                {/* Footer with Tags and Timestamp */}
                <div className="p-3 bg-slate-900/40 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex flex-wrap gap-1 items-center">
                    {snippet.tags.length > 0 ? (
                      snippet.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-400 border border-slate-700/40"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span>No tags</span>
                    )}
                  </div>

                  <span>
                    Updated {new Date(snippet.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              <span>{editingSnippet ? 'Edit Snippet' : 'Create New Snippet'}</span>
            </h2>

            <form onSubmit={handleSaveSnippet} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Docker Compose PostgreSQL with pgvector"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Language & Pinned row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Language / Syntax *
                  </label>
                  <select
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 capitalize"
                  >
                    {POPULAR_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang} className="bg-slate-900">
                        {LANGUAGE_STYLES[lang]?.label || lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="formIsPinned"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="formIsPinned"
                    className="text-xs text-slate-300 cursor-pointer flex items-center gap-1"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                    <span>Pin to top (Favorite)</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Context
                </label>
                <input
                  type="text"
                  placeholder="Short note about when to use this snippet..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Code Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Snippet Code *
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Paste or write your code, command, or template here..."
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-y"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="devops, database, setup"
                  value={formTagsStr}
                  onChange={(e) => setFormTagsStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-colors"
                >
                  {editingSnippet ? 'Save Changes' : 'Create Snippet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
