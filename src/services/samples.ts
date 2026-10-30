import { TaskItem, NoteItem, HabitItem, ExpenseItem, SnippetItem } from '@/types';
import { notifyLocalChange } from '@/services/localBus';

export const SAMPLE_TASK_TITLES: Record<string, string> = {
  'task-1': 'Welcome to Superapps Workspace!',
  'task-2': 'Explore SwissKnife Dev Tools',
  'task-3': 'Setup Custom Domain DNS',
};

export const SAMPLE_NOTE_TITLES: Record<string, string> = {
  'note-1': 'Getting Started with Superapps',
};

export const SAMPLE_HABIT_TITLES: Record<string, string> = {
  'habit-1': 'Drink 2L Water',
  'habit-2': 'Read 20 Pages',
};

export const SAMPLE_EXPENSE_DESCRIPTIONS: Record<string, string> = {
  'exp-1': 'Monthly Allowance / Salary',
  'exp-2': 'Lunch & Coffee',
};

export const SAMPLE_SNIPPET_TITLES: Record<string, string> = {
  'snip-1': 'Debounce Function in TypeScript',
};

export const createSampleTasks = (userId: string): TaskItem[] => [
  {
    id: 'task-1',
    userId,
    title: 'Welcome to Superapps Workspace!',
    description: 'Try dragging or changing the status of this task. Everything is synced.',
    status: 'todo',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'task-2',
    userId,
    title: 'Explore SwissKnife Dev Tools',
    description: 'Check out the Password Generator, UUID, Base64, and JSON tools.',
    status: 'in_progress',
    priority: 'medium',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
  },
  {
    id: 'task-3',
    userId,
    title: 'Setup Custom Domain DNS',
    description: 'Add CNAME apps.k31.my.id in Cloudflare / DNS Provider.',
    status: 'done',
    priority: 'urgent',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now(),
  },
];

export const createSampleNotes = (userId: string): NoteItem[] => [
  {
    id: 'note-1',
    userId,
    title: 'Getting Started with Superapps',
    content: `# Welcome to Superapps Notes\n\nThis is a full-featured markdown notes vault with **live preview**, tags, and offline caching.\n\n### Features\n- Real-time markdown formatting\n- Searchable tags\n- Pinned notes support\n- Instant offline caching`,
    tags: ['guide', 'welcome'],
    isPinned: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const createSampleHabits = (userId: string): HabitItem[] => {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'habit-1',
      userId,
      title: 'Drink 2L Water',
      description: 'Stay hydrated throughout the workday',
      frequency: 'daily',
      completedDates: [today],
      streak: 1,
      createdAt: Date.now(),
    },
    {
      id: 'habit-2',
      userId,
      title: 'Read 20 Pages',
      description: 'Tech articles, books, or documentation',
      frequency: 'daily',
      completedDates: [],
      streak: 0,
      createdAt: Date.now(),
    },
  ];
};

export const createSampleExpenses = (userId: string): ExpenseItem[] => {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'exp-1',
      userId,
      type: 'income',
      amount: 5000000,
      category: 'Salary',
      description: 'Monthly Allowance / Salary',
      date: today,
      createdAt: Date.now(),
    },
    {
      id: 'exp-2',
      userId,
      type: 'expense',
      amount: 45000,
      category: 'Food',
      description: 'Lunch & Coffee',
      date: today,
      createdAt: Date.now(),
    },
  ];
};

export const createSampleSnippets = (userId: string): SnippetItem[] => [
  {
    id: 'snip-1',
    userId,
    title: 'Debounce Function in TypeScript',
    code: `export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {\n  let timer: ReturnType<typeof setTimeout>;\n  return (...args: Parameters<T>) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}`,
    language: 'typescript',
    tags: ['utility', 'javascript', 'typescript'],
    description: 'Standard debouncing utility for search inputs and resize events.',
    createdAt: Date.now(),
  },
];

/**
 * Checks whether an item is an unchanged initial sample item.
 * Used during guest migration (to skip copying default samples into cloud accounts)
 * and legacy cloud sample cleanup (Q3).
 */
export function isUnchangedSample(
  collectionName: string,
  item: { id: string; title?: string; description?: string }
): boolean {
  switch (collectionName) {
    case 'tasks':
      return SAMPLE_TASK_TITLES[item.id] !== undefined && item.title === SAMPLE_TASK_TITLES[item.id];
    case 'notes':
      return SAMPLE_NOTE_TITLES[item.id] !== undefined && item.title === SAMPLE_NOTE_TITLES[item.id];
    case 'habits':
      return SAMPLE_HABIT_TITLES[item.id] !== undefined && item.title === SAMPLE_HABIT_TITLES[item.id];
    case 'expenses':
      return (
        SAMPLE_EXPENSE_DESCRIPTIONS[item.id] !== undefined &&
        item.description === SAMPLE_EXPENSE_DESCRIPTIONS[item.id]
      );
    case 'snippets':
      return SAMPLE_SNIPPET_TITLES[item.id] !== undefined && item.title === SAMPLE_SNIPPET_TITLES[item.id];
    default:
      return false;
  }
}

/**
 * Seeds initial sample items for a guest session into localStorage once.
 * Sets the 'superapps_seeded_<id>' flag to ensure items are never re-seeded
 * if a guest later deletes or edits them (solving finding C3).
 */
export function seedGuestSamples(guestId: string, force = false): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const flagKey = `superapps_seeded_${guestId}`;
  if (!force && localStorage.getItem(flagKey) === 'true') {
    return;
  }

  const setIfEmpty = (col: string, data: unknown[]) => {
    const key = `superapps_${col}_${guestId}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(data));
      notifyLocalChange(key);
    }
  };

  setIfEmpty('tasks', createSampleTasks(guestId));
  setIfEmpty('notes', createSampleNotes(guestId));
  setIfEmpty('habits', createSampleHabits(guestId));
  setIfEmpty('expenses', createSampleExpenses(guestId));
  setIfEmpty('snippets', createSampleSnippets(guestId));

  try {
    localStorage.setItem(flagKey, 'true');
  } catch {
    // ignore
  }
}
