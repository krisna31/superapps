import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  Tag, 
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { SnippetItem } from '@/types';

export const SnippetsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';

  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');

  const languages = [
    'typescript',
    'javascript',
    'python',
    'bash',
    'sql',
    'json',
    'html',
    'css',
    'go',
    'rust'
  ];

  useEffect(() => {
    const unsubscribe = dataService.subscribeToSnippets(userId, (data) => {
      setSnippets(data);
    });
    return () => {
      unsubscribe();
    };
  }, [userId]);

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    const tagsArr = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const newSnippet: SnippetItem = {
      id: 'snip-' + Date.now(),
      userId,
      title: title.trim(),
      code,
      language,
      tags: tagsArr,
      description: description.trim() || undefined,
      createdAt: Date.now(),
    };

    await dataService.saveSnippet(userId, newSnippet);
    setSnippets((prev) => [newSnippet, ...prev]);
    setIsModalOpen(false);
    setTitle('');
    setCode('');
    setTags('');
    setDescription('');
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteSnippet = async (id: string) => {
    await dataService.deleteSnippet(userId, id);
    setSnippets((prev) => prev.filter((s) => s.id !== id));
  };

  const filteredSnippets = snippets.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.title.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      s.code.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q));

    const matchesLang = selectedLang === 'all' || s.language === selectedLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Code Snippets Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Store, tag, and copy reusable code snippets and CLI commands
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Snippet</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code snippets, tags, or content..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="all">All Languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSnippets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            No snippets found. Click "New Snippet" to save your first code snippet.
          </div>
        ) : (
          filteredSnippets.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                      {s.language}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {s.title}
                    </h3>
                  </div>
                  {s.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {s.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleCopyCode(s.id, s.code)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Copy code"
                  >
                    {copiedId === s.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteSnippet(s.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Delete snippet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Code block */}
              <div className="bg-slate-950 p-3.5 overflow-x-auto max-h-60">
                <pre className="font-mono text-xs text-slate-200 leading-relaxed">
                  <code>{s.code}</code>
                </pre>
              </div>

              {/* Tags footer */}
              {s.tags.length > 0 && (
                <div className="p-2.5 px-4 bg-slate-50/50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <div className="flex items-center space-x-1.5 overflow-x-auto">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Snippet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Save Code Snippet</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSnippet} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Snippet Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Quick Sort Algorithm"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    {languages.map((l) => (
                      <option key={l} value={l}>{l.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Code Content *
                </label>
                <textarea
                  rows={8}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste or write your code here..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. algo, sorting, performance"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short explanation of how to use this snippet..."
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
                  Save Snippet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
