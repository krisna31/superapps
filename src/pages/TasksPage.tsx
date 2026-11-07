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

  const columns: { id: TaskStatus; label: string; dotColor: string; code: string }[] = [
    { id: 'todo', label: 'To Do', dotColor: 'bg-slate-400', code: '01' },
    { id: 'in_progress', label: 'In Progress', dotColor: 'bg-accent-primary', code: '02' },
    { id: 'review', label: 'Review', dotColor: 'bg-amber-500', code: '03' },
    { id: 'done', label: 'Done', dotColor: 'bg-status-success', code: '04' },
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
          <span className="px-2 py-0.5 text-[10px] rounded-full font-semibold bg-status-danger/10 text-status-danger border border-status-danger/20">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 text-[10px] rounded-full font-semibold bg-status-warning/10 text-status-warning border border-status-warning/20">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 text-[10px] rounded-full font-semibold bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] rounded-full font-semibold bg-subtle text-ink-muted border border-border-subtle">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div>
          <div className="text-xs font-semibold text-accent-primary uppercase tracking-wider mb-0.5">Kanban Workflow</div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">
            Tasks (Kanban)
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Track tasks across continuous columns with priority tagging and due dates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="ios-btn ios-btn-primary rounded-[10px] self-start sm:self-auto text-xs font-semibold min-h-[40px] px-4"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and stats row - Inset Grouped */}
      <div className="ios-inset-grouped p-3.5 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-medium text-ink">
          <span className="tabular-nums font-semibold">
            {tasks.filter((t) => t.status === 'done').length} / {tasks.length}
          </span>
          <span className="text-ink-secondary">completed</span>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-ink-muted" />
          <select
            aria-label="Filter tasks by priority"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-border-subtle bg-subtle/60 text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/20 font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Columns: iOS Inset Grouped Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
              className={`ios-inset-grouped p-3.5 flex flex-col transition-colors min-h-[380px] ${
                isOver ? 'border-accent-primary bg-accent-primary/5' : 'bg-subtle/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-border-subtle">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span className="font-semibold text-xs text-ink">
                    {col.label}
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-surface text-ink-secondary border border-border-subtle tabular-nums shadow-sm">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="py-12 text-center text-ink-muted text-xs border border-dashed border-border-default rounded-[12px] bg-canvas/30">
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
                      className={`p-3.5 bg-surface rounded-[14px] border border-border-subtle hover:border-accent-primary/40 hover:shadow-md transition-all duration-fast flex flex-col justify-between space-y-2.5 cursor-grab active:cursor-grabbing shadow-sm ${
                        draggedTaskId === t.id ? 'opacity-40 border-dashed' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          {getPriorityBadge(t.priority)}
                          {t.dueDate && (
                            <span className="flex items-center space-x-1 text-[11px] text-ink-muted tabular-nums">
                              <Calendar className="w-3 h-3 text-accent-primary" />
                              <span>{t.dueDate}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-ink leading-snug">
                          {t.title}
                        </h4>
                        {t.description && (
                          <p className="text-[11px] text-ink-secondary mt-1 line-clamp-2 leading-relaxed">
                            {t.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                        <select
                          aria-label={`Change status for ${t.title}`}
                          value={t.status}
                          onChange={(e) => handleStatusChange(t, e.target.value as TaskStatus)}
                          className="text-[11px] py-1 px-2 rounded-lg bg-subtle text-ink border border-border-subtle font-medium focus:outline-none focus:ring-1 focus:ring-accent-primary"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>

                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-status-danger hover:bg-status-danger/10 transition-colors"
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

      {/* New Task Modal: Apple Modal Sheet */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-task-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-elevated/95 backdrop-blur-2xl border border-border-subtle rounded-[20px] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-border-subtle">
              <div>
                <span className="text-[11px] text-accent-primary font-semibold uppercase tracking-wider">New Item</span>
                <h3 id="new-task-modal-title" className="font-display font-bold text-base text-ink">
                  Create New Task
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-ink-muted hover:text-ink rounded-full hover:bg-subtle transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label htmlFor="task-title-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Task Title *
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement WebAuthn passkey unlock"
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="task-desc-input" className="block text-xs font-medium text-ink-secondary mb-1">
                  Description
                </label>
                <textarea
                  id="task-desc-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task context, checklist, or acceptance criteria..."
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="task-priority-select" className="block text-xs font-medium text-ink-secondary mb-1">
                    Priority
                  </label>
                  <select
                    id="task-priority-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink font-medium focus:outline-none focus:ring-2 focus:ring-accent-primary/20 min-h-[44px]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="task-due-date-input" className="block text-xs font-medium text-ink-secondary mb-1">
                    Due Date
                  </label>
                  <input
                    id="task-due-date-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[10px] border border-border-default bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-accent-primary/20 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="ios-btn ios-btn-primary w-full py-2.5 rounded-[10px] text-xs font-semibold shadow-sm min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
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
