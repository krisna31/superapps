import React, { useState, useEffect, useRef } from 'react';
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

export const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'vault-owner';
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
    const unsubscribe = dataService.subscribeToNotes(userId, (data) => {
      setNotes(data);
      if (data.length > 0 && !selectedNoteId) {
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
    setSelectedNoteId(note.id);
    setActiveTitle(note.title);
    setActiveContent(note.content);
    setActiveTags(note.tags.join(', '));
    setActivePinned(note.isPinned);
    setIsSaved(false);
  };

  const handleCreateNote = async () => {
    const newNote: NoteItem = {
      id: 'note-' + Date.now(),
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
      await dataService.deleteNote(userId, id);
      setSelectedNoteId(null);
    }
  };

  // Safe markdown renderer
  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-3 mb-1.5">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2.5 mb-1">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2 mb-1">{line.substring(4)}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={idx} className="ml-4 list-disc text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{line.substring(2)}</li>;
      }
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="border-l-2 border-slate-300 dark:border-slate-700 pl-3 italic text-xs text-slate-500 my-1">{line.substring(2)}</blockquote>;
      }
      if (line.startsWith('```')) {
        return <div key={idx} className="font-mono text-xs text-emerald-500 bg-slate-950 px-2 py-0.5 rounded my-0.5">{line}</div>;
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-0.5">{line}</p>;
    });
  };

  const filteredNotes = notes
    .filter((n) => {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t: string) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col md:flex-row gap-3">
      {/* Notes Sidebar List */}
      <div className="w-full md:w-72 flex flex-col rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Notes Vault
            </h2>
          </div>
          <button
            onClick={handleCreateNote}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition"
            title="Create New Note"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes or tags..."
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
          />
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 font-mono">
              No notes found.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = note.id === selectedNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`p-2 rounded-md cursor-pointer transition text-left relative ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate pr-2">
                      {note.title}
                    </h4>
                    {note.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {note.content.replace(/[#*`>-]/g, '').trim()}
                  </p>

                  <div className="flex items-center space-x-1 mt-1.5 overflow-x-hidden">
                    {note.tags.map((t: string) => (
                      <span
                        key={t}
                        className="text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono"
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

      {/* Editor & Preview Area */}
      <div className="flex-1 flex flex-col rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 overflow-hidden">
        {selectedNoteId ? (
          <>
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
              <input
                type="text"
                value={activeTitle}
                onChange={(e) => setActiveTitle(e.target.value)}
                placeholder="Note Title..."
                className="text-base font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none flex-1"
              />

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setActivePinned(!activePinned)}
                  className={`p-1.5 rounded-md transition ${
                    activePinned
                      ? 'text-amber-500 bg-amber-500/10'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title={activePinned ? 'Unpin note' : 'Pin note'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>

                <div className="flex rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-mono">
                  <button
                    onClick={() => setMode('edit')}
                    className={`px-2 py-0.5 rounded transition flex items-center space-x-1 ${
                      mode === 'edit'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setMode('preview')}
                    className={`px-2 py-0.5 rounded transition flex items-center space-x-1 ${
                      mode === 'preview'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>
                </div>

                <button
                  onClick={handleSaveActiveNote}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  onClick={() => handleDeleteNote(selectedNoteId)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tags row */}
            <div className="flex items-center space-x-2 py-1.5 text-xs border-b border-slate-100 dark:border-slate-800">
              <Tag className="w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={activeTags}
                onChange={(e) => setActiveTags(e.target.value)}
                placeholder="tags separated by comma (e.g. project, idea, todo)"
                className="bg-transparent flex-1 text-slate-600 dark:text-slate-400 focus:outline-none text-xs font-mono"
              />
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto pt-2 flex flex-col">
              {mode === 'edit' ? (
                <>
                  {/* Markdown Quick Formatting Toolbar */}
                  <div className="flex items-center flex-wrap gap-1 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('**', '**')}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Bold (**text**)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('*', '*')}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Italic (*text*)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-800 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => insertMarkdown('# ')}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Heading 1 (# )"
                    >
                      <Heading1 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('## ')}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Heading 2 (## )"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-800 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => insertMarkdown('- [ ] ')}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Checklist item (- [ ] )"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('- ')}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Bullet list (- )"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-800 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => insertMarkdown('`', '`')}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Inline Code (`code`)"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('> ')}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
                    className="w-full flex-1 bg-transparent text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none resize-none leading-relaxed"
                  />
                </>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  {renderMarkdown(activeContent)}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">No Note Selected</h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xs font-mono">
              Select an existing note from the vault or create a new note.
            </p>
            <button
              onClick={handleCreateNote}
              className="mt-3 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium transition"
            >
              Create First Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
