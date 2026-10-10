'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Wand2,
  Tag,
  AlertCircle,
  Clock,
  Download,
  ListTodo,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseNaturalLanguageTask, generateSmartSubtasks, Priority } from './nlp';
import { playAddSound, playCompleteSound, playDeleteSound } from './audio';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  dueDateLabel?: string;
  tags: string[];
  subtasks?: { id: string; title: string; completed: boolean }[];
  createdAt: string;
}

const STORAGE_KEY = 'harkco_todo_ai_tasks_v2';

const DEFAULT_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Audit Coolify apps and eliminate stale experiments',
    completed: true,
    priority: 'high',
    dueDateLabel: 'Today',
    tags: ['harkco', 'devops'],
    subtasks: [
      { id: 'sub-1', title: 'Remove 16 crashed containers', completed: true },
      { id: 'sub-2', title: 'Verify database records', completed: true },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Review XRPL amendments on testnet',
    completed: false,
    priority: 'high',
    dueDateLabel: 'Tomorrow',
    tags: ['crypto', 'xrpl'],
    subtasks: [
      { id: 'sub-3', title: 'Test AMM liquidity pools', completed: false },
      { id: 'sub-4', title: 'Verify escrow condition fulfillment', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Polish mobile layout & datepicker on Time Capsule',
    completed: true,
    priority: 'medium',
    dueDateLabel: 'Today',
    tags: ['harkco', 'ui'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Draft weekly Harkco studio dispatch',
    completed: false,
    priority: 'low',
    dueDateLabel: 'Next week',
    tags: ['life', 'writing'],
    createdAt: new Date().toISOString(),
  },
];

export function TodoApp() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

  // Load from local storage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTasks(JSON.parse(saved));
      } else {
        setTasks(DEFAULT_TASKS);
      }
    } catch (e) {
      setTasks(DEFAULT_TASKS);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (e) {}
    }
  }, [tasks, mounted]);

  // Live parsed preview of input
  const liveParsed = inputVal.trim() ? parseNaturalLanguageTask(inputVal) : null;

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    playAddSound();
    const parsed = parseNaturalLanguageTask(inputVal);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: parsed.title,
      completed: false,
      priority: parsed.priority,
      dueDate: parsed.dueDate,
      dueDateLabel: parsed.dueDateLabel,
      tags: parsed.tags,
      createdAt: new Date().toISOString(),
    };

    setTasks([newTask, ...tasks]);
    setInputVal('');
  };

  const handleToggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const willBeCompleted = !task.completed;
    if (willBeCompleted) {
      playCompleteSound();
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    }

    setTasks(
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: willBeCompleted,
              subtasks: t.subtasks?.map((s) => ({
                ...s,
                completed: willBeCompleted ? true : s.completed,
              })),
            }
          : t
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    playDeleteSound();
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleGenerateSubtasks = (taskId: string, title: string) => {
    const generated = generateSmartSubtasks(title);
    playAddSound();

    setTasks(
      tasks.map((t) => {
        if (t.id !== taskId) return t;
        const existing = t.subtasks || [];
        const newSubs = generated.map((st, i) => ({
          id: `sub-${taskId}-${Date.now()}-${i}`,
          title: st,
          completed: false,
        }));
        return {
          ...t,
          subtasks: [...existing, ...newSubs],
        };
      })
    );

    setExpandedSubtasks((prev) => ({ ...prev, [taskId]: true }));
  };

  const handleToggleSubtask = (taskId: string, subId: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== taskId || !t.subtasks) return t;
        const updatedSubs = t.subtasks.map((s) =>
          s.id === subId ? { ...s, completed: !s.completed } : s
        );
        const allCompleted = updatedSubs.every((s) => s.completed);
        if (allCompleted && !t.completed) {
          playCompleteSound();
        }
        return {
          ...t,
          completed: allCompleted ? true : t.completed,
          subtasks: updatedSubs,
        };
      })
    );
  };

  const handleExportMarkdown = () => {
    const md = [
      `# Todo AI Tasks — ${new Date().toLocaleDateString()}`,
      '',
      ...tasks.map((t) => {
        const check = t.completed ? '[x]' : '[ ]';
        const prio = t.priority === 'high' ? '🔥 HIGH' : t.priority === 'low' ? '🌱 LOW' : '';
        const tags = t.tags.length ? `(${t.tags.map((tg) => `#${tg}`).join(' ')})` : '';
        const due = t.dueDateLabel ? `[Due: ${t.dueDateLabel}]` : '';
        let line = `- ${check} ${t.title} ${prio} ${due} ${tags}`.trim();

        if (t.subtasks && t.subtasks.length) {
          const subLines = t.subtasks
            .map((s) => `  - ${s.completed ? '[x]' : '[ ]'} ${s.title}`)
            .join('\n');
          line += '\n' + subLines;
        }
        return line;
      }),
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo_ai_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) return null;

  // Filter tasks
  let filtered = tasks;
  if (filter === 'pending') filtered = filtered.filter((t) => !t.completed);
  if (filter === 'completed') filtered = filtered.filter((t) => t.completed);
  if (selectedTag) filtered = filtered.filter((t) => t.tags.includes(selectedTag));

  // Compute metrics
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;

  // All unique tags
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags)));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500/30 selection:text-purple-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Brand Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-xl shadow-purple-500/20 mb-3 border border-purple-400/30">
            <ListTodo className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Todo <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">AI</span>
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Harkco
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Natural language task management with subtask decomposition. Type naturally: dates, tags, and priorities auto-parsed.
          </p>
        </header>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <div className="text-2xl font-bold font-mono text-white">{totalCount}</div>
            <div className="text-xs text-slate-400 font-medium">Total Tasks</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <div className="text-2xl font-bold font-mono text-amber-400">{pendingCount}</div>
            <div className="text-xs text-slate-400 font-medium">Pending</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
            <div className="text-2xl font-bold font-mono text-emerald-400">{completedCount}</div>
            <div className="text-xs text-slate-400 font-medium">Completed</div>
          </div>
        </div>

        {/* Natural Language Task Input Box */}
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md mb-6">
          <form onSubmit={handleAddTask} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. Deploy smart contract !high tomorrow #crypto"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none text-white placeholder:text-slate-500 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* AI NLP Live Preview */}
          {liveParsed && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-purple-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Parsed:</span>
              </span>
              <span className="text-slate-300 font-medium">"{liveParsed.title}"</span>
              {liveParsed.dueDateLabel && (
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {liveParsed.dueDateLabel}
                </span>
              )}
              {liveParsed.priority !== 'medium' && (
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    liveParsed.priority === 'high'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {liveParsed.priority} priority
                </span>
              )}
              {liveParsed.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Suggestion Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 text-[11px] font-semibold mr-1">Quick ideas:</span>
            {[
              'Audit escrow contracts !high #xrpl',
              'Review team pull request tomorrow #code',
              'Lunch reservation #life today',
            ].map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => setInputVal(idea)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-slate-400 hover:text-slate-200 text-[11px] transition"
              >
                + {idea}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls & Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {(['all', 'pending', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded text-xs font-semibold capitalize transition ${
                  filter === tab
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition border ${
                    selectedTag === t
                      ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  #{t}
                </button>
              ))}
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-[11px] text-purple-400 hover:underline px-1"
                >
                  Clear tag
                </button>
              )}
            </div>
          )}

          {/* Export Markdown */}
          <button
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Export MD</span>
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-base font-bold text-white mb-1">No tasks in this view</h3>
              <p className="text-xs text-slate-400">
                {filter === 'completed'
                  ? 'Complete a task above to see it here!'
                  : 'All caught up! Add a new task with natural language above.'}
              </p>
            </div>
          ) : (
            filtered.map((t) => {
              const isExpanded = expandedSubtasks[t.id];
              const subCount = t.subtasks?.length || 0;
              const subCompleted = t.subtasks?.filter((s) => s.completed).length || 0;

              return (
                <div
                  key={t.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    t.completed
                      ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
                      : 'bg-slate-900/70 border-slate-800 hover:border-purple-500/40 shadow-sm'
                  }`}
                >
                  {/* Task Header Row */}
                  <div className="p-3.5 flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleTask(t.id)}
                      className="mt-0.5 text-slate-400 hover:text-purple-400 transition flex-shrink-0"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-purple-400" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-medium ${
                            t.completed
                              ? 'line-through text-slate-500'
                              : 'text-slate-100'
                          }`}
                        >
                          {t.title}
                        </span>

                        {/* Priority Badge */}
                        {t.priority === 'high' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            High
                          </span>
                        )}
                        {t.priority === 'low' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
                            Low
                          </span>
                        )}

                        {/* Due Date */}
                        {t.dueDateLabel && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-mono">
                            <Clock className="w-3 h-3" />
                            {t.dueDateLabel}
                          </span>
                        )}
                      </div>

                      {/* Tags & Subtask Counters */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {t.tags.map((tg) => (
                          <span
                            key={tg}
                            className="text-[10px] font-mono text-purple-400/80 bg-purple-500/10 px-1.5 py-0.5 rounded"
                          >
                            #{tg}
                          </span>
                        ))}

                        {subCount > 0 && (
                          <button
                            onClick={() =>
                              setExpandedSubtasks((prev) => ({
                                ...prev,
                                [t.id]: !prev[t.id],
                              }))
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-purple-300 transition"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            <span>
                              {subCompleted}/{subCount} subtasks
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* AI Subtask Generator */}
                      {subCount === 0 && !t.completed && (
                        <button
                          onClick={() => handleGenerateSubtasks(t.id, t.title)}
                          title="AI breakdown into subtasks"
                          className="p-1.5 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-purple-500/10 transition"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        title="Delete task"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subtasks Accordion */}
                  {subCount > 0 && isExpanded && (
                    <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 py-2 space-y-1.5">
                      {t.subtasks?.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center gap-2.5 text-xs text-slate-300 py-1"
                        >
                          <button
                            onClick={() => handleToggleSubtask(t.id, st.id)}
                            className="text-slate-400 hover:text-emerald-400"
                          >
                            {st.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>
                          <span
                            className={
                              st.completed ? 'line-through text-slate-500' : ''
                            }
                          >
                            {st.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Harkco Ecosystem Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-4 text-slate-400 mb-2">
          <a href="https://portfolio.apps.harkco.se" className="hover:text-purple-300 transition">Portfolio</a>
          <a href="https://time-capsule.apps.harkco.se" className="hover:text-purple-300 transition">Time Capsule</a>
          <a href="https://puls.apps.harkco.se" className="hover:text-purple-300 transition">Puls</a>
          <a href="https://knippa.apps.harkco.se" className="hover:text-purple-300 transition">Knippa</a>
        </div>
        <p>&copy; {new Date().getFullYear()} Harkco. Natural intelligence, local privacy.</p>
      </footer>
    </div>
  );
}

export default TodoApp;