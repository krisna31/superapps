import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Note } from '../types';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Download,
  Eye,
  Edit3,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const NotesPage: React.FC = () => {
  const { runQuery, runMutation, refreshSignal } = useDb();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewMode, setPreviewMode] = useState(false);

  // Active note editing fields
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('Work');
  const [editPinned, setEditPinned] = useState(false);

  // Load notes from SQLite
  useEffect(() => {
    const res = runQuery('SELECT id, title, content, category, isPinned, createdAt, updatedAt FROM notes ORDER BY isPinned DESC, updatedAt DESC;');
    if (res.values) {
      const items: Note[] = res.values.map((v) => ({
        id: v[0],
        title: v[1],
        content: v[2],
        category: v[3] || 'Work',
        isPinned: v[4] === 1,
        createdAt: v[5],
        updatedAt: v[6],
      }));
      setNotes(items);

      if (items.length > 0 && !activeNoteId) {
        selectNote(items[0]);
      }
    }
  }, [runQuery, refreshSignal]);

  const selectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setEditPinned(note.isPinned);
  };

  const handleCreateNote = () => {
    const id = 'note_' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newNote: Note = {
      id,
      title: 'Untitled Note',
      content: '# New Note\n\nStart typing here...',
      category: 'Work',
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    };

    runMutation(
      'INSERT INTO notes (id, title, content, category, isPinned, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [newNote.id, newNote.title, newNote.content, newNote.category, 0, now, now]
    );

    selectNote(newNote);
  };

  const handleSaveNote = () => {
    if (!activeNoteId) return;
    const now = new Date().toISOString();
    runMutation(
      'UPDATE notes SET title = ?, content = ?, category = ?, isPinned = ?, updatedAt = ? WHERE id = ?;',
      [editTitle.trim() || 'Untitled Note', editContent, editCategory, editPinned ? 1 : 0, now, activeNoteId]
    );
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Delete this note permanently?')) {
      runMutation('DELETE FROM notes WHERE id = ?;', [id]);
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
    }
  };

  const handleDownloadNote = () => {
    const blob = new Blob([editContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${editTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = ['All', 'Work', 'Personal', 'Ideas', 'Snippets'];

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || n.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Encrypted Markdown Notes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zero-knowledge encrypted notes stored directly inside your browser SQLite database.
          </p>
        </div>

        <button
          onClick={handleCreateNote}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-16rem)] min-h-[500px]">
        {/* Left: Notes List (1 Column) */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-4 flex flex-col gap-3 h-full">
          {/* Search & Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Notes Scroll List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                No notes found. Click "New Note" to begin.
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectNote(note)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeNoteId === note.id
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate max-w-[170px]">
                      {note.title || 'Untitled Note'}
                    </span>
                    {note.isPinned && <Pin className="w-3 h-3 text-emerald-400 fill-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-mono">
                    {note.content.replace(/[#*`]/g, '') || 'Empty note...'}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {note.category}
                    </span>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Active Note Editor & Preview (2 Columns) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col h-full">
          {activeNoteId ? (
            <div className="flex flex-col h-full space-y-4">
              {/* Header Editor Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => {
                    setEditTitle(e.target.value);
                  }}
                  onBlur={handleSaveNote}
                  placeholder="Note Title..."
                  className="bg-transparent text-lg font-bold text-white focus:outline-none flex-1 min-w-[180px]"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      setEditCategory(e.target.value);
                      handleSaveNote();
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Ideas">Ideas</option>
                    <option value="Snippets">Snippets</option>
                  </select>

                  <button
                    onClick={() => {
                      setEditPinned(!editPinned);
                      handleSaveNote();
                    }}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      editPinned
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Pin Note"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                    title={previewMode ? 'Switch to Edit' : 'Switch to Preview'}
                  >
                    {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={handleDownloadNote}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                    title="Download .md"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteNote(activeNoteId)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Editor / Preview Area */}
              <div className="flex-1 overflow-hidden relative">
                {previewMode ? (
                  <div className="h-full overflow-y-auto p-4 bg-slate-900/60 rounded-xl prose prose-invert max-w-none text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {editContent}
                  </div>
                ) : (
                  <textarea
                    value={editContent}
                    onChange={(e) => {
                      setEditContent(e.target.value);
                    }}
                    onBlur={handleSaveNote}
                    placeholder="Write Markdown content here..."
                    className="w-full h-full bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
                  />
                )}
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>{editContent.length} characters • {editContent.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-saved to SQLite</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <FileText className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">No note selected</p>
              <p className="text-xs mt-1">Select an existing note from the left or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
