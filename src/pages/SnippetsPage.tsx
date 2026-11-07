import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Trash2, 
  Tag, 
  X,
  Code2
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
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <div className="text-xs font-semibold text-accent-primary uppercase tracking-wider mb-0.5">Developer Vault</div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">
            Snippets Vault
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Multi-language code repository, syntax templates, and reusable logic blocks.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="ios-btn ios-btn-primary rounded-[10px] self-start sm:self-auto text-xs font-semibold min-h-[40px] px-4"
        >
          <Plus className="w-4 h-4" />
          <span>New Snippet</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snippets, tags, code..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border-subtle rounded-[10px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all min-h-[40px]"
          />
        </div>

        <div className="sm:w-52">
          <select
            aria-label="Filter by language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-surface border border-border-subtle rounded-[10px] text-ink font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all min-h-[40px] capitalize cursor-pointer"
          >
            <option value="all">All Languages ({snippets.length})</option>
            {languages.map((l) => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Snippets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSnippets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-ink-muted ios-inset-grouped bg-surface p-8 shadow-sm">
            <Code2 className="w-8 h-8 mx-auto mb-2 text-ink-muted opacity-40" />
            <p className="font-medium text-ink">No snippets matching query</p>
            <p className="text-ink-secondary mt-1">Click "New Snippet" above to add your first code snippet.</p>
          </div>
        ) : (
          filteredSnippets.map((s) => (
            <div
              key={s.id}
              className="ios-inset-grouped bg-surface shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-ios-md transition-shadow duration-200"
            >
              {/* Header */}
              <div className="p-3.5 border-b border-border-subtle flex items-start justify-between bg-subtle/40">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-accent-primary/10 text-accent-primary border border-accent-primary/20 rounded-full capitalize">
                      {s.language}
                    </span>
                    <h3 className="text-xs font-semibold text-ink truncate">
                      {s.title}
                    </h3>
                  </div>
                  {s.description && (
                    <p className="text-[11px] text-ink-secondary truncate mt-1">
                      {s.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleCopyCode(s.id, s.code)}
                    className="p-1.5 rounded-[8px] bg-surface border border-border-subtle text-ink-secondary hover:text-ink hover:bg-subtle transition-all"
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
                    className="p-1.5 rounded-[8px] bg-surface border border-border-subtle text-ink-secondary hover:text-status-danger hover:bg-status-danger/10 transition-all"
                    title="Delete snippet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Code block */}
              <div className="bg-canvas/80 p-3.5 overflow-x-auto max-h-60 border-b border-border-subtle">
                <pre className="font-mono text-xs text-ink leading-relaxed tabular-nums selection:bg-accent-primary/20">
                  <code>{s.code}</code>
                </pre>
              </div>

              {/* Tags footer */}
              {s.tags.length > 0 && (
                <div className="p-2.5 px-3.5 bg-subtle/30 flex items-center space-x-2">
                  <Tag className="w-3 h-3 text-accent-primary flex-shrink-0" />
                  <div className="flex items-center space-x-1.5 overflow-x-auto">
                    {s.tags.map((t: string) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border-subtle text-ink-secondary font-medium"
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

      {/* New Snippet Modal Sheet */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-snippet-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-elevated rounded-[20px] border border-border-subtle shadow-ios-xl overflow-hidden animate-slide-up"
          >
            {/* Sheet grabber */}
            <div className="w-9 h-1 bg-border-strong/60 rounded-full mx-auto my-2" />

            <div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-accent-primary uppercase tracking-wider block">Code Repository</span>
                <h3 id="new-snippet-modal-title" className="text-base font-semibold text-ink">
                  New Code Snippet
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSnippet} className="p-5 space-y-3.5">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label htmlFor="snippet-title-input" className="block text-xs font-medium text-ink-secondary mb-1">
                    Title *
                  </label>
                  <input
                    id="snippet-title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Supabase Auth RLS Policy"
                    className="w-full px-3 py-2 text-xs bg-canvas border border-border-subtle rounded-[10px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all min-h-[38px]"
                  />
                </div>

                <div>
                  <label htmlFor="snippet-lang-select" className="block text-xs font-medium text-ink-secondary mb-1">
                    Language
                  </label>
                  <select
                    id="snippet-lang-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-canvas border border-border-subtle rounded-[10px] text-ink font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all min-h-[38px] capitalize cursor-pointer"
                  >
                    {languages.map((l) => (
                      <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="snippet-code-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Code Body *
                </label>
                <textarea
                  id="snippet-code-input"
                  rows={8}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Paste or write syntax snippet here..."
                  className="w-full px-3 py-2.5 text-xs font-mono bg-canvas border border-border-subtle rounded-[10px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all leading-relaxed"
                />
              </div>

              <div>
                <label htmlFor="snippet-desc-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Description / Context
                </label>
                <input
                  id="snippet-desc-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional usage notes or context..."
                  className="w-full px-3 py-2 text-xs bg-canvas border border-border-subtle rounded-[10px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all min-h-[38px]"
                />
              </div>

              <div>
                <label htmlFor="snippet-tags-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Tags (comma separated)
                </label>
                <input
                  id="snippet-tags-input"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. auth, security, postgres, helper"
                  className="w-full px-3 py-2 text-xs bg-canvas border border-border-subtle rounded-[10px] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all min-h-[38px]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="ios-btn ios-btn-secondary rounded-[10px] text-xs font-medium px-4 min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ios-btn ios-btn-primary rounded-[10px] text-xs font-semibold px-4 min-h-[38px]"
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
