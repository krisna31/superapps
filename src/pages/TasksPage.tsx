import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Calendar, 
  Trash2, 
  Filter, 
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dataService } from '@/services/dataService';
import { TaskItem, TaskPriority, TaskStatus } from '@/types';
import { generateSecureId } from '@/utils/security';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest-default';

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const unsubscribe = dataService.subscribeToTasks(userId, (data) => {
      setTasks(data);
    });
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('create') === 'true') {
      setIsModalOpen(true);
    }
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Dismiss New Task modal with Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: TaskItem = {
      id: generateSecureId('task'),
      userId,
      title: title.trim(),
      description: description.trim() || undefined,
      status: 'todo',
      priority,
      dueDate: dueDate || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await dataService.saveTask(userId, newTask);
    setTitle('');
    setDescription('');
    setDueDate('');
    setIsModalOpen(false);
  };

  const handleStatusChange = async (task: TaskItem, nextStatus: TaskStatus) => {
    const updated: TaskItem = {
      ...task,
      status: nextStatus,
      updatedAt: Date.now(),
    };
    await dataService.saveTask(userId, updated);
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Delete this task permanently?')) {
      await dataService.deleteTask(userId, id);
    }
  };

  const columns: { id: TaskStatus; label: string; bandColor: string; code: string }[] = [
    { id: 'todo', label: 'To Do', bandColor: 'border-t-border-default', code: '01' },
    { id: 'in_progress', label: 'In Progress', bandColor: 'border-t-signal', code: '02' },
    { id: 'review', label: 'Review', bandColor: 'border-t-status-warning', code: '03' },
    { id: 'done', label: 'Done', bandColor: 'border-t-status-success', code: '04' },
  ];

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (selectedPriority === 'all') return true;
        return t.priority === selectedPriority;
      }),
    [tasks, selectedPriority]
  );

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold bg-status-danger text-white border border-border-strong">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold bg-status-warning text-white border border-border-strong">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold bg-signal text-canvas border border-border-strong">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold bg-subtle text-ink border border-border-strong">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-1.5 border-border-strong pb-4">
        <div>
          <div className="werkbund-coord mb-1">[MODULE-01] WORKFLOW KANBAN MATRIX</div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-ink">
            Tasks (Kanban)
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Track tasks across continuous structural columns with priority tagging and due dates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="werkbund-btn werkbund-btn-signal self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-surface border-1.5 border-border-strong">
        <div className="flex items-center space-x-2 text-xs font-mono text-ink">
          <span className="font-bold tabular-nums">
            {tasks.filter((t) => t.status === 'done').length} / {tasks.length}
          </span>
          <span className="uppercase tracking-wider">completed</span>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-ink-muted" />
          <select
            aria-label="Filter tasks by priority"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1 text-xs border-1.5 border-border-strong bg-canvas text-ink focus:outline-none font-mono uppercase font-bold"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Columns: Continuous Structural Frame */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumn === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverColumn !== col.id) {
                  setDragOverColumn(col.id);
                }
              }}
              onDragLeave={() => {
                if (dragOverColumn === col.id) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setDragOverColumn(null);
                const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                if (!taskId) return;
                const taskToMove = tasks.find((t) => t.id === taskId);
                if (taskToMove && taskToMove.status !== col.id) {
                  await handleStatusChange(taskToMove, col.id);
                }
                setDraggedTaskId(null);
              }}
              className={`bg-subtle border-1.5 ${
                isOver ? 'border-signal bg-signal-tint' : 'border-border-strong'
              } border-t-4 ${col.bandColor} p-3 flex flex-col transition-colors min-h-[360px]`}
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b-1.5 border-border-strong">
                <div className="flex items-center space-x-1.5">
                  <span className="werkbund-coord text-[10px]">[{col.code}]</span>
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-ink">
                    {col.label}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 text-[10px] font-mono tabular-nums bg-surface text-ink font-bold border border-border-strong">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="py-10 text-center text-ink-muted text-xs font-mono uppercase tracking-wider border-1.5 border-dashed border-border-default bg-canvas/40">
                    Drop tasks here
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', t.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedTaskId(t.id);
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverColumn(null);
                      }}
                      className={`p-3 bg-surface border-1.5 border-border-strong hover:bg-canvas transition-colors duration-fast flex flex-col justify-between space-y-2 cursor-grab active:cursor-grabbing ${
                        draggedTaskId === t.id ? 'opacity-40 border-dashed' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          {getPriorityBadge(t.priority)}
                          {t.dueDate && (
                            <span className="flex items-center space-x-1 text-[10px] font-mono text-ink-muted tabular-nums">
                              <Calendar className="w-3 h-3 text-signal" />
                              <span>{t.dueDate}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-ink leading-snug">
                          {t.title}
                        </h4>
                        {t.description && (
                          <p className="text-[11px] text-ink-secondary mt-1 line-clamp-2">
                            {t.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t-1.5 border-border-subtle text-xs">
                        <select
                          aria-label={`Change status for ${t.title}`}
                          value={t.status}
                          onChange={(e) => handleStatusChange(t, e.target.value as TaskStatus)}
                          className="text-[10px] font-mono py-1 px-1.5 bg-canvas text-ink border border-border-strong uppercase font-bold focus:outline-none"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>

                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 text-ink-muted hover:text-status-danger transition-colors duration-fast"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal: Unblurred Hard Frame */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/75"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-task-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-elevated border-1.5 border-border-strong p-6"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b-1.5 border-border-strong">
              <div>
                <span className="werkbund-coord text-[10px]">[TASK-NEW]</span>
                <h3 id="new-task-modal-title" className="font-display font-bold text-sm uppercase text-ink">
                  Create New Task
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

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label htmlFor="task-title-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Task Title *
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement WebAuthn passkey unlock"
                  className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
                />
              </div>

              <div>
                <label htmlFor="task-desc-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                  Description
                </label>
                <textarea
                  id="task-desc-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task context, checklist, or acceptance criteria..."
                  className="w-full px-3 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink placeholder:text-ink-muted focus:outline-none focus:border-signal"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="task-priority-select" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                    Priority
                  </label>
                  <select
                    id="task-priority-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-2 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink uppercase font-bold focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="task-due-date-input" className="block text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-1">
                    Due Date
                  </label>
                  <input
                    id="task-due-date-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono border-1.5 border-border-strong bg-canvas text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="werkbund-btn werkbund-btn-signal w-full py-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
