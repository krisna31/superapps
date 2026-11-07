import React, { useState, useEffect, useMemo } from 'react';
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
import { generateSecureId } from '@/utils/security';

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

  // Dismiss New Snippet modal with Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    const tagList = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newSnippet: SnippetItem = {
      id: generateSecureId('snippet'),
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

  const filteredSnippets = useMemo(() => {
    const q = search.toLowerCase();
    return snippets.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        s.code.toLowerCase().includes(q) ||
        s.tags.some((t: string) => t.toLowerCase().includes(q));

      const matchesLang = selectedLanguage === 'all' || s.language === selectedLanguage;
      return matchesSearch && matchesLang;
    });
  }, [snippets, search, selectedLanguage]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-1.5 border-border-strong pb-4">
        <div>
          <div className="werkbund-coord mb-1">[MODULE-05] MULTI-LANGUAGE CODE REPOSITORY</div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-ink">
            Snippets Vault
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Architectural code repository, syntax templates, and regex vaults in Space Mono.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="werkbund-btn werkbund-btn-signal self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Snippet</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH SNIPPETS, TAGS, CODE..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono uppercase tracking-wider border-1.5 border-border-strong bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
          />
        </div>

        <select
          aria-label="Filter by language"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-surface text-ink uppercase font-bold focus:outline-none"
        >
          <option value="all">All Languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>{l.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Snippets Grid: Continuous Shared-Border Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSnippets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs font-mono text-ink-muted border-1.5 border-dashed border-border-strong bg-surface">
            [NULL] NO SNIPPETS MATCHING QUERY. CLICK "NEW SNIPPET" TO SCAFFOLD CODE.
          </div>
        ) : (
          filteredSnippets.map((s) => (
            <div
              key={s.id}
              className="bg-surface border-1.5 border-border-strong flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-3 border-b-1.5 border-border-strong flex items-center justify-between bg-subtle">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-ink text-canvas border border-border-strong uppercase">
                      {s.language}
                    </span>
                    <h3 className="text-xs font-bold text-ink uppercase truncate">
                      {s.title}
                    </h3>
                  </div>
                  {s.description && (
                    <p className="text-[11px] text-ink-secondary truncate mt-1">
                      {s.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleCopyCode(s.id, s.code)}
                    className="p-1.5 border border-border-strong bg-canvas text-ink hover:bg-ink hover:text-canvas transition-colors duration-fast"
                    title="Copy code"
                  >
                    {copiedId === s.id ? (
                      <Check className="w-3.5 h-3.5 text-status-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteSnippet(s.id)}
                    className="p-1.5 border border-border-strong bg-canvas text-ink hover:bg-status-danger hover:text-white transition-colors duration-fast"
                    title="Delete snippet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Code block */}
              <div className="bg-canvas p-3.5 overflow-x-auto max-h-60 border-b-1.5 border-border-strong">
                <pre className="font-mono text-xs text-ink leading-relaxed tabular-nums">
                  <code>{s.code}</code>
                </pre>
              </div>

              {/* Tags footer */}
              {s.tags.length > 0 && (
                <div className="p-2 px-3 bg-subtle flex items-center space-x-2">
                  <Tag className="w-3 h-3 text-signal flex-shrink-0" />
                  <div className="flex items-center space-x-1.5 overflow-x-auto">
                    {s.tags.map((t: string) => (
                      <span
                        key={t}
                        className="text-[9px] px-1.5 py-0.2 border border-border-strong bg-canvas text-ink font-mono font-bold uppercase"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/75"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-snippet-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-elevated border-1.5 border-border-strong p-6"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b-1.5 border-border-strong">
              <div>
                <span className="werkbund-coord text-[10px]">[SNIPPET-NEW]</span>
                <h3 id="new-snippet-modal-title" className="font-display font-bold text-sm uppercase text-ink">
                  Add New Snippet
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

            <form onSubmit={handleCreateSnippet} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label htmlFor="snippet-title-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                    Title *
                  </label>
                  <input
                    id="snippet-title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Supabase Auth RLS Policy"
                    className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
                  />
                </div>

                <div>
                  <label htmlFor="snippet-lang-select" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                    Language
                  </label>
                  <select
                    id="snippet-lang-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink uppercase font-bold focus:outline-none"
                  >
                    {languages.map((l) => (
                      <option key={l} value={l}>{l.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="snippet-code-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Code Body *
                </label>
                <textarea
                  id="snippet-code-input"
                  rows={8}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Paste or write syntax snippet here..."
                  className="w-full px-3 py-2 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal leading-relaxed"
                />
              </div>

              <div>
                <label htmlFor="snippet-desc-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Description / Context
                </label>
                <input
                  id="snippet-desc-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional usage notes or context..."
                  className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
                />
              </div>

              <div>
                <label htmlFor="snippet-tags-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Tags (comma separated)
                </label>
                <input
                  id="snippet-tags-input"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. auth, security, postgres, helper"
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
