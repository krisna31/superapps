import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Pin, 
  Search, 
  Eye, 
  Edit3, 
  Tag, 
  Save,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { NoteItem } from '@/types';

export const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isSaved, setIsSaved] = useState(false);

  // Active note editor state
  const [activeTitle, setActiveTitle] = useState('');
  const [activeContent, setActiveContent] = useState('');
  const [activeTags, setActiveTags] = useState('');
  const [activePinned, setActivePinned] = useState(false);

  const selectedNoteIdRef = useRef<string | null>(null);
  selectedNoteIdRef.current = selectedNoteId;

  const selectNote = (note: NoteItem) => {
    setSelectedNoteId(note.id);
    setActiveTitle(note.title);
    setActiveContent(note.content);
    setActiveTags(note.tags.join(', '));
    setActivePinned(note.isPinned);
  };

  useEffect(() => {
    const unsubscribe = dataService.subscribeToNotes(userId, (data) => {
      setNotes(data);
      const currentId = selectedNoteIdRef.current;
      // Auto-select initial note if none is currently selected
      if (!currentId && data.length > 0) {
        selectNote(data[0]);
      } else if (currentId && !data.some((n) => n.id === currentId)) {
        // Active note was removed externally; fallback to first available or reset
        if (data.length > 0) {
          selectNote(data[0]);
        } else {
          setSelectedNoteId(null);
          setActiveTitle('');
          setActiveContent('');
          setActiveTags('');
          setActivePinned(false);
        }
      }
      // Note: If currentId is still present in data, activeTitle/activeContent
      // are deliberately NOT overwritten to preserve active typing state!
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const handleCreateNote = async () => {
    const newNote: NoteItem = {
      id: 'note-' + Date.now(),
      userId,
      title: 'Untitled Note',
      content: '# New Note\n\nStart typing your markdown here...',
      tags: ['general'],
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dataService.saveNote(userId, newNote);
    setNotes((prev) => [newNote, ...prev]);
    selectNote(newNote);
  };

  const handleSaveActiveNote = async () => {
    if (!selectedNoteId) return;

    const tagsArray = activeTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const updated: NoteItem = {
      id: selectedNoteId,
      userId,
      title: activeTitle.trim() || 'Untitled Note',
      content: activeContent,
      tags: tagsArray,
      isPinned: activePinned,
      createdAt: notes.find((n) => n.id === selectedNoteId)?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await dataService.saveNote(userId, updated);
    setNotes((prev) => prev.map((n) => (n.id === selectedNoteId ? updated : n)));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDeleteNote = async (id: string) => {
    await dataService.deleteNote(userId, id);
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (selectedNoteId === id) {
      if (remaining.length > 0) {
        selectNote(remaining[0]);
      } else {
        setSelectedNoteId(null);
        setActiveTitle('');
        setActiveContent('');
        setActiveTags('');
      }
    }
  };

  // Simple Markdown Renderer for Preview Mode
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-2xl font-bold text-slate-900 dark:text-white my-3">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-bold text-slate-900 dark:text-white my-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-semibold text-slate-800 dark:text-slate-100 my-2">{line.slice(4)}</h3>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={idx} className="ml-4 list-disc text-sm text-slate-700 dark:text-slate-300">{line.slice(2)}</li>;
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-emerald-500 pl-3 my-2 text-sm italic text-slate-600 dark:text-slate-400 bg-emerald-50/20 dark:bg-emerald-500/5 py-1 rounded-r">
            {line.slice(2)}
          </blockquote>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-3" />;
      }
      return <p key={idx} className="text-sm text-slate-700 dark:text-slate-300 my-1 leading-relaxed">{line}</p>;
    });
  };

  const filteredNotes = notes
    .filter((n) => {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 animate-fade-in">
      {/* Notes Sidebar List */}
      <div className="w-full md:w-80 flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Notes Vault</h2>
          </div>
          <button
            onClick={handleCreateNote}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            title="Create New Note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes or tags..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No notes found.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = note.id === selectedNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`p-3 rounded-xl cursor-pointer transition text-left relative group ${
                    isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate pr-4">
                      {note.title}
                    </h4>
                    {note.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                    {note.content.replace(/[#*`>-]/g, '').trim()}
                  </p>

                  <div className="flex items-center space-x-1.5 mt-2 overflow-x-hidden">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono"
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
      <div className="flex-1 flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 overflow-hidden shadow-sm">
        {selectedNoteId ? (
          <>
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <input
                type="text"
                value={activeTitle}
                onChange={(e) => setActiveTitle(e.target.value)}
                placeholder="Note Title..."
                className="text-lg font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none flex-1"
              />

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActivePinned(!activePinned)}
                  className={`p-2 rounded-lg transition ${
                    activePinned
                      ? 'text-amber-500 bg-amber-500/10'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title={activePinned ? 'Unpin note' : 'Pin note'}
                >
                  <Pin className="w-4 h-4" />
                </button>

                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
                  <button
                    onClick={() => setMode('edit')}
                    className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 ${
                      mode === 'edit'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-medium'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setMode('preview')}
                    className={`px-2.5 py-1 rounded-md transition flex items-center space-x-1 ${
                      mode === 'preview'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-medium'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>

                <button
                  onClick={handleSaveActiveNote}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-sm"
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  onClick={() => handleDeleteNote(selectedNoteId)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Delete Note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tags row */}
            <div className="flex items-center space-x-2 py-2 text-xs border-b border-slate-100 dark:border-slate-800">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={activeTags}
                onChange={(e) => setActiveTags(e.target.value)}
                placeholder="tags separated by comma (e.g. project, idea, todo)"
                className="bg-transparent flex-1 text-slate-600 dark:text-slate-400 focus:outline-none text-xs"
              />
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto pt-4">
              {mode === 'edit' ? (
                <textarea
                  value={activeContent}
                  onChange={(e) => setActiveContent(e.target.value)}
                  placeholder="Start writing markdown notes..."
                  className="w-full h-full bg-transparent text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none resize-none leading-relaxed"
                />
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  {renderMarkdown(activeContent)}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-600 dark:text-slate-300">No Note Selected</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Select an existing note from the vault or create a new note to start writing markdown.
            </p>
            <button
              onClick={handleCreateNote}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition"
            >
              Create First Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
