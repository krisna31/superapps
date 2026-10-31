import React, { useState, useEffect } from 'react';
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
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
    setTasks((prev) => [newTask, ...prev]);
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
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Delete this task permanently?')) {
      await dataService.deleteTask(userId, id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'border-t-slate-400' },
    { id: 'in_progress', label: 'In Progress', color: 'border-t-sky-500' },
    { id: 'review', label: 'Review', color: 'border-t-amber-500' },
    { id: 'done', label: 'Done', color: 'border-t-emerald-500' },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (selectedPriority === 'all') return true;
    return t.priority === selectedPriority;
  });

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tasks (Kanban)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional project workflow board with priority indicators and due dates
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
            {tasks.filter((t) => t.status === 'done').length} / {tasks.length}
          </span>
          <span>completed</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none font-mono"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Columns */}
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
              className={`rounded-lg bg-slate-50/70 dark:bg-slate-900/60 border ${
                isOver ? 'border-sky-500 ring-1 ring-sky-500/20' : 'border-slate-200 dark:border-slate-800'
              } border-t-2 ${col.color} p-2.5 flex flex-col transition-colors min-h-[300px]`}
            >
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
                <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-mono border border-dashed border-slate-200 dark:border-slate-800 rounded-md">
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
                      className={`p-2.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition flex flex-col justify-between space-y-2 cursor-grab active:cursor-grabbing ${
                        draggedTaskId === t.id ? 'opacity-40 border-dashed' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          {getPriorityBadge(t.priority)}
                          {t.dueDate && (
                            <span className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 tabular-nums">
                              <Calendar className="w-3 h-3" />
                              <span>{t.dueDate}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                          {t.title}
                        </h4>
                        {t.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {t.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-700 text-xs">
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t, e.target.value as TaskStatus)}
                          className="text-[10px] font-mono py-0.5 px-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-none focus:outline-none"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>

                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
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

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Create New Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement WebAuthn passkey unlock"
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task context, checklist, or acceptance criteria..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none font-mono tabular-nums"
                  />
                </div>
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
