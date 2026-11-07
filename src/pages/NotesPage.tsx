import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Pin, 
  Save, 
  Check, 
  Eye, 
  Edit3,
  Tag,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Code,
  Quote,
  CheckSquare,
  List
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { NoteItem } from '@/types';
import { generateSecureId } from '@/utils/security';

export const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isSaved, setIsSaved] = useState(false);

  // Active note editing states
  const [activeTitle, setActiveTitle] = useState('');
  const [activeContent, setActiveContent] = useState('');
  const [activeTags, setActiveTags] = useState('');
  const [activePinned, setActivePinned] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectedNoteIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedNoteIdRef.current = selectedNoteId;
  }, [selectedNoteId]);

  const insertMarkdown = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = activeContent.substring(start, end);
    const replacement = prefix + (selectedText || 'text') + suffix;

    const nextContent = activeContent.substring(0, start) + replacement + activeContent.substring(end);
    setActiveContent(nextContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 0);
  };

  useEffect(() => {
    selectedNoteIdRef.current = null;
    setSelectedNoteId(null);
    setActiveTitle('');
    setActiveContent('');
    setActiveTags('');
    setActivePinned(false);

    const unsubscribe = dataService.subscribeToNotes(userId, (data) => {
      setNotes(data);
      if (data.length > 0 && !selectedNoteIdRef.current) {
        selectNote(data[0]);
      }
    });
    if (searchParams.get('create') === 'true') {
      handleCreateNote();
    }
    return () => {
      unsubscribe();
    };
  }, [userId, searchParams]);

  const selectNote = (note: NoteItem) => {
    selectedNoteIdRef.current = note.id;
    setSelectedNoteId(note.id);
    setActiveTitle(note.title);
    setActiveContent(note.content);
    setActiveTags(note.tags.join(', '));
    setActivePinned(note.isPinned);
    setIsSaved(false);
  };

  const handleCreateNote = async () => {
    const newNote: NoteItem = {
      id: generateSecureId('note'),
      userId,
      title: 'Untitled Note',
      content: '# Untitled\n\nStart writing markdown notes here...',
      tags: [],
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dataService.saveNote(userId, newNote);
    selectNote(newNote);
    setMode('edit');
  };

  const handleSaveActiveNote = async () => {
    if (!selectedNoteId) return;
    const tagArray = activeTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const existing = notes.find((n) => n.id === selectedNoteId);
    const updated: NoteItem = {
      id: selectedNoteId,
      userId,
      title: activeTitle.trim() || 'Untitled Note',
      content: activeContent,
      tags: tagArray,
      isPinned: activePinned,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await dataService.saveNote(userId, updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Delete this note permanently?')) {
      const remaining = notes.filter((n) => n.id !== id);
      const nextNote = remaining.length > 0 ? remaining[0] : null;
      selectedNoteIdRef.current = nextNote ? nextNote.id : null;
      await dataService.deleteNote(userId, id);
      if (nextNote) {
        selectNote(nextNote);
      } else {
        setSelectedNoteId(null);
      }
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S to save active note
  useEffect(() => {
    if (!selectedNoteId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveActiveNote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteId, activeTitle, activeContent, activeTags, activePinned, notes]);

  // Safe inline formatter for **bold**, *italic*, and `code`
  const renderInlineMarkdown = (text: string) => {
    const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return tokens.map((tok, i) => {
      if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
        return <strong key={i} className="font-bold text-ink">{tok.slice(2, -2)}</strong>;
      }
      if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
        return <em key={i} className="italic">{tok.slice(1, -1)}</em>;
      }
      if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
        return (
          <code key={i} className="px-1.5 py-0.5 bg-subtle border border-border-default text-signal font-mono text-[11px]">
            {tok.slice(1, -1)}
          </code>
        );
      }
      return tok;
    });
  };

  // Safe markdown renderer with fenced code block state tracking
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    let inCodeBlock = false;
    return lines.map((line, idx) => {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return (
          <div key={idx} className="font-mono text-[11px] text-ink-muted bg-subtle px-3 py-1 my-1 border-1.5 border-border-strong select-none">
            {line}
          </div>
        );
      }
      if (inCodeBlock) {
        return (
          <pre key={idx} className="font-mono text-xs text-signal bg-subtle px-3 py-0.5 overflow-x-auto leading-relaxed border-l-2 border-signal">
            <code>{line || ' '}</code>
          </pre>
        );
      }
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-display font-bold text-ink uppercase tracking-tight mt-4 mb-2">{renderInlineMarkdown(line.substring(2))}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-display font-bold text-ink uppercase tracking-tight mt-3 mb-1.5">{renderInlineMarkdown(line.substring(3))}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-display font-bold text-ink uppercase tracking-tight mt-2.5 mb-1">{renderInlineMarkdown(line.substring(4))}</h3>;
      }
      if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
        return (
          <div key={idx} className="flex items-center space-x-2 ml-2 my-1 text-xs text-ink-muted line-through">
            <span className="w-3.5 h-3.5 bg-signal border border-border-strong flex items-center justify-center text-canvas text-[9px] font-bold">✓</span>
            <span>{renderInlineMarkdown(line.substring(6))}</span>
          </div>
        );
      }
      if (line.startsWith('- [ ] ')) {
        return (
          <div key={idx} className="flex items-center space-x-2 ml-2 my-1 text-xs text-ink">
            <span className="w-3.5 h-3.5 border-1.5 border-border-strong bg-canvas" />
            <span>{renderInlineMarkdown(line.substring(6))}</span>
          </div>
        );
      }
      if (line.startsWith('- ')) {
        return <li key={idx} className="ml-4 list-disc text-xs text-ink leading-relaxed">{renderInlineMarkdown(line.substring(2))}</li>;
      }
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="border-l-4 border-signal pl-3 italic text-xs text-ink-secondary my-1.5">{renderInlineMarkdown(line.substring(2))}</blockquote>;
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-xs text-ink leading-relaxed my-1">{renderInlineMarkdown(line)}</p>;
    });
  };

  const filteredNotes = useMemo(() => {
    const q = search.toLowerCase();
    return notes
      .filter((n) => {
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, search]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-1.5 border-border-strong pb-4">
        <div>
          <div className="werkbund-coord mb-1">[MODULE-02] DOCUMENTATION & NOTES VAULT</div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-ink">
            Notes Vault
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Architectural markdown knowledge vault with instant preview, tag taxonomy, and pinning.
          </p>
        </div>

        <button
          onClick={handleCreateNote}
          className="werkbund-btn werkbund-btn-signal self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Note</span>
        </button>
      </div>

      {/* Main Asymmetric Split: Continuous Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-1.5 border-border-strong bg-border-strong">
        {/* Left column: Notes Directory */}
        <div className="md:col-span-4 bg-surface p-4 flex flex-col border-b-1.5 md:border-b-0 md:border-r-1.5 border-border-strong min-h-[500px]">
          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH NOTES OR #TAGS..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono uppercase tracking-wider border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
            />
          </div>

          <div className="flex items-center justify-between werkbund-coord text-[10px] mb-2 px-1">
            <span>INDEX [{filteredNotes.length}]</span>
            <span>SORT: PINNED / NEWEST</span>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[560px] pr-0.5">
            {filteredNotes.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-ink-muted border-1.5 border-dashed border-border-default">
                [NULL] NO NOTES FOUND.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNoteId === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-3 cursor-pointer transition-colors duration-fast border-1.5 ${
                      isSelected
                        ? 'bg-ink text-canvas border-border-strong'
                        : 'bg-surface hover:bg-subtle text-ink border-border-subtle hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold truncate pr-2 uppercase">
                        {note.title}
                      </h4>
                      {note.isPinned && <Pin className="w-3 h-3 text-signal-secondary flex-shrink-0" />}
                    </div>

                    <p className={`text-[11px] line-clamp-1 mt-1 ${isSelected ? 'text-canvas/80' : 'text-ink-secondary'}`}>
                      {note.content.replace(/[#*`>-]/g, '').trim()}
                    </p>

                    <div className="flex items-center space-x-1 mt-2 overflow-x-hidden">
                      {note.tags.map((t: string) => (
                        <span
                          key={t}
                          className={`text-[9px] px-1 py-0.5 border font-mono uppercase ${
                            isSelected
                              ? 'bg-canvas text-ink border-canvas font-bold'
                              : 'bg-subtle text-ink border-border-strong'
                          }`}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Editor & Preview */}
        <div className="md:col-span-8 bg-surface p-5 flex flex-col min-h-[500px]">
          {selectedNoteId ? (
            <>
              {/* Top Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b-1.5 border-border-strong gap-3">
                <input
                  type="text"
                  value={activeTitle}
                  onChange={(e) => setActiveTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="text-lg font-display font-bold uppercase tracking-tight bg-transparent text-ink focus:outline-none flex-1 border-b border-transparent focus:border-border-strong pb-1"
                />

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActivePinned(!activePinned)}
                    className={`p-1.5 border-1.5 border-border-strong transition-colors duration-fast ${
                      activePinned
                        ? 'bg-signal-secondary text-ink font-bold'
                        : 'bg-surface text-ink-muted hover:text-ink hover:bg-subtle'
                    }`}
                    title={activePinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex border-1.5 border-border-strong p-0.5 text-xs font-mono bg-subtle">
                    <button
                      onClick={() => setMode('edit')}
                      className={`px-2.5 py-1 transition-colors duration-fast flex items-center space-x-1 uppercase font-bold text-[10px] ${
                        mode === 'edit'
                          ? 'bg-ink text-canvas'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setMode('preview')}
                      className={`px-2.5 py-1 transition-colors duration-fast flex items-center space-x-1 uppercase font-bold text-[10px] ${
                        mode === 'preview'
                          ? 'bg-ink text-canvas'
                          : 'text-ink-secondary hover:text-ink'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>

                  <button
                    onClick={handleSaveActiveNote}
                    className="werkbund-btn werkbund-btn-signal text-xs py-1.5 px-3"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteNote(selectedNoteId)}
                    className="p-1.5 border-1.5 border-border-strong text-ink hover:bg-status-danger hover:text-white transition-colors duration-fast"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tags row */}
              <div className="flex items-center space-x-2 py-2 text-xs border-b-1.5 border-border-strong bg-subtle/50 px-2 mt-2">
                <Tag className="w-3.5 h-3.5 text-signal" />
                <input
                  type="text"
                  value={activeTags}
                  onChange={(e) => setActiveTags(e.target.value)}
                  placeholder="tags separated by comma (e.g. project, idea, todo)"
                  className="bg-transparent flex-1 text-ink focus:outline-none text-xs font-mono uppercase tracking-wider"
                />
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto pt-3 flex flex-col">
                {mode === 'edit' ? (
                  <>
                    {/* Markdown Quick Formatting Toolbar */}
                    <div className="flex items-center flex-wrap gap-1 pb-2.5 mb-2.5 border-b-1.5 border-border-subtle text-ink">
                      <button
                        type="button"
                        onClick={() => insertMarkdown('**', '**')}
                        className="p-1.5 border border-border-strong bg-canvas hover:bg-ink hover:text-canvas transition-colors duration-fast"
                        title="Bold (**text**)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('*', '*')}
                        className="p-1.5 border border-border-strong bg-canvas hover:bg-ink hover:text-canvas transition-colors duration-fast"
                        title="Italic (*text*)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-px h-4 bg-border-strong mx-1" />
                      <button
                        type="button"
                        onClick={() => insertMarkdown('# ')}
                        className="p-1.5 border border-border-strong bg-canvas hover:bg-ink hover:text-canvas transition-colors duration-fast"
                        title="Heading 1 (# )"
                      >
                        <Heading1 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('## ')}
                        className="p-1.5 border border-border-strong bg-canvas hover:bg-ink hover:text-canvas transition-colors duration-fast"
                        title="Heading 2 (## )"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-px h-4 bg-border-strong mx-1" />
                      <button
                        type="button"
                        onClick={() => insertMarkdown('- [ ] ')}
                        className="p-1.5 border border-border-strong bg-canvas hover:bg-ink hover:text-canvas transition-colors duration-fast"
                        title="Checklist item (- [ ] )"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('- ')}
                        className="p-1.5 border border-border-strong bg-canvas hover:bg-ink hover:text-canvas transition-colors duration-fast"
                        title="Bullet list (- )"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-px h-4 bg-border-strong mx-1" />
                      <button
                        type="button"
                        onClick={() => insertMarkdown('`', '`')}
                        className="p-1.5 border border-border-strong bg-canvas hover:bg-ink hover:text-canvas transition-colors duration-fast"
                        title="Inline Code (`code`)"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('> ')}
                        className="p-1.5 border border-border-strong bg-canvas hover:bg-ink hover:text-canvas transition-colors duration-fast"
                        title="Blockquote (> )"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={activeContent}
                      onChange={(e) => setActiveContent(e.target.value)}
                      placeholder="Start writing markdown notes..."
                      className="w-full flex-1 bg-transparent text-xs font-mono text-ink focus:outline-none resize-none leading-relaxed p-1"
                    />
                  </>
                ) : (
                  <div className="p-2 space-y-2">
                    {renderMarkdown(activeContent)}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-ink-muted">
              <FileText className="w-12 h-12 text-border-default mb-3" />
              <h3 className="text-base font-display font-bold uppercase text-ink">No Note Selected</h3>
              <p className="text-xs text-ink-secondary mt-1 max-w-xs font-mono">
                Select an existing note from the vault index or create a new document.
              </p>
              <button
                onClick={handleCreateNote}
                className="werkbund-btn werkbund-btn-signal mt-4"
              >
                Create First Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
