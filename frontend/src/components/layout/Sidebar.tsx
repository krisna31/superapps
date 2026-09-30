import React, { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useDb } from '../../context/DbContext';
import { NAVIGATION_GROUPS } from '../../config/navigation';
import { ArrowUpRight, ChevronDown, ChevronRight, Search, X } from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { isReady, runQuery, refreshSignal } = useDb();
  const [taskCount, setTaskCount] = useState<number | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isReady) return;
    try {
      const res = runQuery("SELECT COUNT(*) FROM tasks WHERE status != 'completed';");
      if (res.values && res.values[0]) {
        setTaskCount(Number(res.values[0][0]) || 0);
      }
    } catch {
      // In case table not initialized yet
    }
  }, [isReady, runQuery, refreshSignal]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const filteredGroups = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return NAVIGATION_GROUPS;

    return NAVIGATION_GROUPS.map((group) => {
      const matchingItems = group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
      return {
        ...group,
        items: matchingItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [filterQuery]);

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between p-3.5 h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="flex flex-col flex-1 min-h-0 space-y-3">
        {/* App Search / Filter Bar */}
        <div className="relative px-1">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter apps..."
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-3 top-2 text-slate-500 hover:text-slate-300"
              title="Clear filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Scrollable Grouped Navigation List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No apps matching "{filterQuery}"
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isCollapsed = Boolean(collapsedGroups[group.id]) && !filterQuery;

              return (
                <div key={group.id} className="space-y-1">
                  {/* Group Section Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold tracking-wider text-slate-400 hover:text-slate-200 uppercase rounded-lg transition-colors group"
                  >
                    <span>{group.title}</span>
                    <span className="text-slate-500 group-hover:text-slate-300">
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </button>

                  {/* Group Items */}
                  {!isCollapsed && (
                    <nav className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.exact}
                            onClick={onCloseMobile}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                              }`
                            }
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badgeType === 'tasks' && taskCount !== null && taskCount > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold shrink-0">
                                {taskCount}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom info card */}
      <div className="mt-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-400 space-y-1.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 text-[11px]">Local-First</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          All data is encrypted & stored locally in your browser SQLite engine. Zero server tracking.
        </p>
        <a
          href="https://github.com/krisna31/superapps"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 hover:underline pt-0.5"
        >
          <span>GitHub Source</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
};
