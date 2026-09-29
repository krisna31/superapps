import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDb } from '../context/DbContext';
import { TaskItem, TaskStatus, TaskPriority, TaskChecklistItem } from '../types';
import { soundService } from '../services/soundService';
import confetti from 'canvas-confetti';
import {
  KanbanSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Tag,
  CheckSquare,
  Square,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  Trash2,
  Edit2,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const COLUMNS: { id: TaskStatus; label: string; color: string; border: string; bg: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'text-slate-400', border: 'border-slate-700/60', bg: 'bg-slate-900/40' },
  { id: 'in_progress', label: 'In Progress', color: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-950/10' },
  { id: 'review', label: 'In Review', color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-950/10' },
  { id: 'completed', label: 'Completed', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/10' },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; badge: string; icon: any }> = {
  urgent: { label: 'Urgent', badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: Flame },
  high: { label: 'High', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: AlertTriangle },
  medium: { label: 'Medium', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
  low: { label: 'Low', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: CheckSquare },
};

export const TasksPage: React.FC = () => {
  const { runQuery, runMutation, refreshSignal } = useDb();
  const location = useLocation();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('backlog');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formTagsStr, setFormTagsStr] = useState('');
  const [formChecklist, setFormChecklist] = useState<TaskChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch tasks from SQLite
  useEffect(() => {
    const res = runQuery('SELECT id, title, description, status, priority, dueDate, tags, checklist, createdAt, updatedAt FROM tasks ORDER BY createdAt DESC;');
    if (res.values) {
      setTasks(
        res.values.map((v) => ({
          id: v[0] as string,
          title: v[1] as string,
          description: (v[2] as string) || '',
          status: (v[3] as TaskStatus) || 'backlog',
          priority: (v[4] as TaskPriority) || 'medium',
          dueDate: (v[5] as string) || '',
          tags: v[6] ? JSON.parse(v[6]) : [],
          checklist: v[7] ? JSON.parse(v[7]) : [],
          createdAt: v[8] as string,
          updatedAt: v[9] as string,
        }))
      );
    }
  }, [runQuery, refreshSignal]);

  // Handle URL deep link ?action=new
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      openCreateModal('backlog');
      // Clean query parameter from URL without triggering reload
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Extract all distinct tags for filter
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesTag = tagFilter === 'all' || task.tags.includes(tagFilter);

      return matchesSearch && matchesPriority && matchesTag;
    });
  }, [tasks, searchQuery, priorityFilter, tagFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;
    const overdue = tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, urgent, overdue, rate };
  }, [tasks, todayStr]);

  // Modal Openers
  const openCreateModal = (defaultStatus: TaskStatus = 'backlog') => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormStatus(defaultStatus);
    setFormPriority('medium');
    setFormDueDate('');
    setFormTagsStr('');
    setFormChecklist([]);
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate || '');
    setFormTagsStr(task.tags.join(', '));
    setFormChecklist(task.checklist || []);
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  // Checklist Helpers
  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setFormChecklist((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: newChecklistText.trim(), completed: false },
    ]);
    setNewChecklistText('');
  };

  const removeChecklistItem = (id: string) => {
    setFormChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  // Save Task (Create or Update)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const parsedTags = formTagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const now = new Date().toISOString();

    if (editingTask) {
      runMutation(
        `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, dueDate = ?, tags = ?, checklist = ?, updatedAt = ? WHERE id = ?;`,
        [
          formTitle.trim(),
          formDescription.trim(),
          formStatus,
          formPriority,
          formDueDate || null,
          JSON.stringify(parsedTags),
          JSON.stringify(formChecklist),
          now,
          editingTask.id,
        ]
      );
    } else {
      const id = crypto.randomUUID();
      runMutation(
        `INSERT INTO tasks (id, title, description, status, priority, dueDate, tags, checklist, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          formTitle.trim(),
          formDescription.trim(),
          formStatus,
          formPriority,
          formDueDate || null,
          JSON.stringify(parsedTags),
          JSON.stringify(formChecklist),
          now,
          now,
        ]
      );
    }

    soundService.playClick();
    setIsModalOpen(false);
  };

  // Move Task Column
  const handleMoveColumn = (task: TaskItem, newStatus: TaskStatus) => {
    const now = new Date().toISOString();
    runMutation('UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?;', [newStatus, now, task.id]);

    if (newStatus === 'completed') {
      soundService.playSuccess();
      confetti({ particleCount: 35, spread: 50 });
    } else {
      soundService.playClick();
    }
  };

  // Toggle Checklist Item directly on card
  const handleToggleCardChecklist = (task: TaskItem, itemId: string) => {
    const updatedChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const now = new Date().toISOString();

    runMutation('UPDATE tasks SET checklist = ?, updatedAt = ? WHERE id = ?;', [
      JSON.stringify(updatedChecklist),
      now,
      task.id,
    ]);

    const itemJustCompleted = updatedChecklist.find((i) => i.id === itemId)?.completed;
    if (itemJustCompleted) {
      soundService.playSuccess();
    }
  };

  // Delete Task
  const handleDeleteTask = (task: TaskItem) => {
    if (window.confirm(`Delete task "${task.title}"?`)) {
      runMutation('DELETE FROM tasks WHERE id = ?;', [task.id]);
      soundService.playClick();
    }
  };

  // Column next / prev status helper
  const getPrevStatus = (status: TaskStatus): TaskStatus | null => {
    if (status === 'in_progress') return 'backlog';
    if (status === 'review') return 'in_progress';
    if (status === 'completed') return 'review';
    return null;
  };

  const getNextStatus = (status: TaskStatus): TaskStatus | null => {
    if (status === 'backlog') return 'in_progress';
    if (status === 'in_progress') return 'review';
    if (status === 'review') return 'completed';
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <KanbanSquare className="w-6 h-6 text-blue-500" />
            <span>Kanban & Task Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual project board with priorities, checklists, and local SQLite persistence.
          </p>
        </div>

        <button
          onClick={() => openCreateModal('backlog')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Total Tasks</span>
            <KanbanSquare className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{metrics.inProgress} currently active</div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{metrics.completed}</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${metrics.rate}%` }}
            />
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Urgent Tasks</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className={`text-xl font-bold mt-1 ${metrics.urgent > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {metrics.urgent}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">High priority attention</div>
        </div>

        <div className="glass-card p-4 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Overdue</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className={`text-xl font-bold mt-1 ${metrics.overdue > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            {metrics.overdue}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Due date passed</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Priorities</option>
              <option value="urgent" className="bg-slate-900">Urgent</option>
              <option value="high" className="bg-slate-900">High</option>
              <option value="medium" className="bg-slate-900">Medium</option>
              <option value="low" className="bg-slate-900">Low</option>
            </select>
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs text-slate-400">
              <Tag className="w-3.5 h-3.5" />
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag} className="bg-slate-900">
                    #{tag}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(searchQuery || priorityFilter !== 'all' || tagFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('all');
                setTagFilter('all');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.border} ${col.bg} p-3.5 flex flex-col min-h-[450px] shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-sm ${col.color}`}>{col.label}</h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 font-semibold">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => openCreateModal(col.id)}
                  title={`Add task to ${col.label}`}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="text-center py-10 px-4 border border-dashed border-slate-800/80 rounded-xl text-xs text-slate-500">
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const PriorityIcon = PRIORITY_CONFIG[task.priority].icon;
                    const isOverdue =
                      task.dueDate && task.dueDate < todayStr && task.status !== 'completed';
                    const completedChecklistCount = task.checklist.filter((i) => i.completed).length;
                    const prevStatus = getPrevStatus(task.status);
                    const nextStatus = getNextStatus(task.status);

                    return (
                      <div
                        key={task.id}
                        className="glass-card p-3.5 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-all space-y-2.5 group relative"
                      >
                        {/* Top Badges & Actions */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Priority Badge */}
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                PRIORITY_CONFIG[task.priority].badge
                              }`}
                            >
                              <PriorityIcon className="w-3 h-3" />
                              <span>{PRIORITY_CONFIG[task.priority].label}</span>
                            </span>

                            {/* Due Date Badge */}
                            {task.dueDate && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                                  isOverdue
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                                    : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                                }`}
                                title={isOverdue ? 'Overdue!' : 'Due Date'}
                              >
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{task.dueDate}</span>
                              </span>
                            )}
                          </div>

                          {/* Quick Edit/Delete */}
                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(task)}
                              title="Edit Task"
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task)}
                              title="Delete Task"
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4
                            className={`text-xs font-semibold leading-snug ${
                              task.status === 'completed'
                                ? 'line-through text-slate-400'
                                : 'text-slate-100'
                            }`}
                          >
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-3">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Checklist Section */}
                        {task.checklist.length > 0 && (
                          <div className="pt-1.5 border-t border-slate-800/60 space-y-1">
                            <div className="text-[10px] font-semibold text-slate-400 flex items-center justify-between mb-1">
                              <span>Checklist</span>
                              <span className="font-mono text-slate-400">
                                {completedChecklistCount}/{task.checklist.length}
                              </span>
                            </div>

                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {task.checklist.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => handleToggleCardChecklist(task, item.id)}
                                  className="w-full flex items-start gap-1.5 text-left text-[11px] hover:bg-slate-800/40 p-1 rounded transition-colors group/item"
                                >
                                  {item.completed ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-slate-500 group-hover/item:text-slate-300 shrink-0 mt-0.5" />
                                  )}
                                  <span
                                    className={`leading-tight truncate ${
                                      item.completed
                                        ? 'line-through text-slate-500'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    {item.text}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Column Switcher Arrows */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                          {prevStatus ? (
                            <button
                              onClick={() => handleMoveColumn(task, prevStatus)}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                              title={`Move to ${prevStatus.replace('_', ' ')}`}
                            >
                              <ArrowLeft className="w-3 h-3" />
                              <span className="capitalize">{prevStatus.replace('_', ' ')}</span>
                            </button>
                          ) : (
                            <div />
                          )}

                          {nextStatus && (
                            <button
                              onClick={() => handleMoveColumn(task, nextStatus)}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-colors"
                              title={`Move to ${nextStatus.replace('_', ' ')}`}
                            >
                              <span className="capitalize">{nextStatus.replace('_', ' ')}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <KanbanSquare className="w-5 h-5 text-blue-400" />
              <span>{editingTask ? 'Edit Task' : 'Create New Task'}</span>
            </h2>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement WebAuthn biometric unlock"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Task details, requirements, or links..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Status & Priority Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status Column
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="frontend, auth, p1"
                    value={formTagsStr}
                    onChange={(e) => setFormTagsStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Checklist Items */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Checklist Items ({formChecklist.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a step or criteria..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChecklistItem();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addChecklistItem}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs text-white font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>

                {formChecklist.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                    {formChecklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800"
                      >
                        <span className="truncate">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-colors"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
