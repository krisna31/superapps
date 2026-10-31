import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  Tag, 
  X 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { SnippetItem } from '@/types';

export const SnippetsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';
  const [searchParams] = useSearchParams();
  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const languages = [
    'typescript',
    'javascript',
    'python',
    'go',
    'rust',
    'sql',
    'shell',
    'html',
    'css',
    'json'
  ];

  useEffect(() => {
    const unsubscribe = dataService.subscribeToSnippets(userId, (data) => {
      setSnippets(data);
    });
    if (searchParams.get('create') === 'true') {
      setIsModalOpen(true);
    }
    return () => {
      unsubscribe();
    };
  }, [userId, searchParams]);

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    const tagList = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newSnippet: SnippetItem = {
      id: 'snippet-' + Date.now(),
      userId,
      title: title.trim(),
      language,
      code,
      description: description.trim() || undefined,
      tags: tagList,
      createdAt: Date.now(),
    };

    await dataService.saveSnippet(userId, newSnippet);
    setTitle('');
    setCode('');
    setDescription('');
    setTags('');
    setIsModalOpen(false);
  };

  const handleDeleteSnippet = async (id: string) => {
    if (confirm('Delete this code snippet?')) {
      await dataService.deleteSnippet(userId, id);
    }
  };

  const handleCopyCode = (id: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSnippets = snippets.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.title.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      s.code.toLowerCase().includes(q) ||
      s.tags.some((t: string) => t.toLowerCase().includes(q));

    const matchesLang = selectedLanguage === 'all' || s.language === selectedLanguage;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Snippets Vault
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Personal code repository, scripts, regex library, and syntax templates
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Snippet</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets, descriptions, tags, code..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
          />
        </div>

        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none font-mono"
        >
          <option value="all">All Languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>{l.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredSnippets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 font-mono">
            No snippets found matching your query. Click "New Snippet" to add one.
          </div>
        ) : (
          filteredSnippets.map((s) => (
            <div
              key={s.id}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-750 uppercase">
                      {s.language}
                    </span>
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {s.title}
                    </h3>
                  </div>
                  {s.description && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {s.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleCopyCode(s.id, s.code)}
                    className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Copy code"
                  >
                    {copiedId === s.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteSnippet(s.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Delete snippet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Code block */}
              <div className="bg-slate-950 p-3 overflow-x-auto max-h-56">
                <pre className="font-mono text-xs text-slate-200 leading-relaxed tabular-nums">
                  <code>{s.code}</code>
                </pre>
              </div>

              {/* Tags footer */}
              {s.tags.length > 0 && (
                <div className="p-2 px-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                  <Tag className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <div className="flex items-center space-x-1 overflow-x-auto">
                    {s.tags.map((t: string) => (
                      <span
                        key={t}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Save Code Snippet</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSnippet} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                    Snippet Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Quick Sort Algorithm"
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                  >
                    {languages.map((l) => (
                      <option key={l} value={l}>{l.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Code Content *
                </label>
                <textarea
                  rows={8}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste or write your code here..."
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md border border-slate-200 dark:border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none leading-relaxed tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. algo, sorting, performance"
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short explanation of how to use this snippet..."
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
