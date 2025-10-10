// app/dashboard/page.jsx
'use client';

import { useEffect, useState, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { Bell, ChevronDown, Edit2, Trash2, Filter } from 'lucide-react';
import NotificationDrawer from '@/components/NotificationDrawer';
import ProfileDrawer from '@/components/ProfileDrawer';

/**
 * Dashboard page
 * - Filter dropdown (All / Due in 4 hours / Completed)
 * - Edit / Delete / Toggle-complete functions
 * - Refreshes list after changes
 */

function SimpleLoading({ text = 'Loading...' }) {
  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-gray-500">
      <div className="w-1/2 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-400 via-blue-500 to-indigo-600 animate-[slide_1.2s_linear_infinite]" />
      </div>
      <p className="mt-4 text-sm text-gray-400">{text}</p>
      <style jsx>{`
        @keyframes slide { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }
        .animate-[slide_1.2s_linear_infinite] { animation: slide 1.2s linear infinite; }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | upcoming | completed
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  // Edit modal/drawer state
  const [editingTodo, setEditingTodo] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Helper: load todos
  async function loadTodos() {
    setLoading(true);
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) {
        // unauthorized or server error
        setTodos([]);
        setNotifCount(0);
        return;
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setTodos(arr);

      // compute upcoming (next 4 hours)
      const now = new Date();
      const in4h = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const upcoming4h = arr.filter((t) => {
        const d = new Date(t.scheduledAt);
        return !t.completed && d >= now && d <= in4h;
      }).length;
      setNotifCount(upcoming4h);
    } catch (err) {
      console.error('Failed to fetch todos', err);
      setTodos([]);
      setNotifCount(0);
    } finally {
      setLoading(false);
    }
  }

  // Ensure auth / redirect
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sign-in');
  }, [status, router]);

  // Load on auth
  useEffect(() => {
    if (status === 'authenticated') loadTodos();
  }, [status]);

  if (status === 'loading' || loading) return <SimpleLoading text="Loading dashboard..." />;
  if (!session) return null;

  // Utility for counts & filters
  const now = new Date();
  const in4h = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const counts = {
    all: todos.length,
    upcoming4h: todos.filter((t) => {
      const d = new Date(t.scheduledAt);
      return !t.completed && d >= now && d <= in4h;
    }).length,
    completed: todos.filter((t) => t.completed).length,
  };

  // Filtered view based on selected filter
  const filtered = todos.filter((t) => {
    if (filter === 'upcoming') {
      const d = new Date(t.scheduledAt);
      return !t.completed && d >= now && d <= in4h;
    }
    if (filter === 'completed') return t.completed;
    return true;
  });

  // ---------- Actions ----------
  async function handleDelete(id) {
    const ok = confirm('Are you sure you want to delete this todo?');
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        alert(err.error || 'Failed to delete');
      } else {
        await loadTodos();
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(todo) {
    // convert todo.scheduledAt to datetime-local value (YYYY-MM-DDTHH:MM)
    const dt = new Date(todo.scheduledAt);
    const pad = (n) => String(n).padStart(2, '0');
    const local = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    setEditingTodo({ ...todo, scheduledAtLocal: local });
  }

  async function saveEdit(e) {
    e?.preventDefault?.();
    if (!editingTodo) return;
    const { id, title, description, scheduledAtLocal, completed } = editingTodo;
    if (!title || !scheduledAtLocal) {
      alert('Title and due date/time are required');
      return;
    }

    // convert local to ISO and validate future
    const iso = new Date(scheduledAtLocal);
    if (isNaN(iso.getTime())) {
      alert('Invalid date/time');
      return;
    }
    if (iso <= new Date()) {
      alert('Please pick a future date/time');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          scheduledAt: iso.toISOString(),
          completed: !!completed,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Save failed' }));
        alert(err.error || 'Failed to save');
      } else {
        setEditingTodo(null);
        await loadTodos();
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('Save failed');
    } finally {
      setSavingEdit(false);
    }
  }

  async function toggleComplete(todo) {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Update failed' }));
        alert(err.error || 'Failed to update');
      } else {
        await loadTodos();
      }
    } catch (err) {
      console.error('Toggle failed', err);
      alert('Failed to update');
    }
  }

  // ---------- UI ----------
  return (
    <>
      <NotificationDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ProfileDrawer isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Hello, {session.user?.name?.split(' ')[0] || 'there'}</h1>
            <p className="text-gray-500 mt-1">Here’s a summary of your tasks and what's coming up.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter dropdown */}
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">
                    {filter === 'all' ? 'Filter' : filter === 'upcoming' ? 'Due 4h' : 'Completed'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-white border rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setFilter('all')}
                          className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}
                        >
                          All
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setFilter('upcoming')}
                          className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}
                        >
                          Due in 4 hours
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setFilter('completed')}
                          className={`w-full text-left px-4 py-2 text-sm ${active ? 'bg-gray-100' : ''}`}
                        >
                          Completed
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Add Todo */}
            <button
              onClick={() => router.push('/dashboard/todos')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              ＋ Add Todo
            </button>
          </div>
        </div>

        {/* Stats block */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-white">
              <div className="text-xs text-gray-500 uppercase">All Todos</div>
              <div className="mt-4 text-3xl font-semibold text-gray-800">{counts.all}</div>
            </div>

            <div className="p-6 rounded-xl bg-white">
              <div className="text-xs text-gray-500 uppercase">Upcoming</div>
              <div className="mt-4 text-3xl font-semibold text-amber-700">{counts.upcoming4h}</div>
            </div>

            <div className="p-6 rounded-xl bg-white">
              <div className="text-xs text-gray-500 uppercase">Completed</div>
              <div className="mt-4 text-3xl font-semibold text-emerald-700">{counts.completed}</div>
            </div>
          </div>
        </div>

        {/* Todos list */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold text-gray-800">All Todos</div>
              <div className="text-xs text-gray-400 mt-1">Last Updated : {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="text-xs text-gray-500">
                <tr>
                  <th className="py-3 px-4">Todo</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="4" className="py-8 text-center text-gray-400">No todos found</td></tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="border-t border-dashed">
                      <td className="py-6 px-4">
                        <div className="font-medium text-gray-700">{t.title}</div>
                        <div className="text-sm text-gray-400 mt-2">{t.description || ''}</div>
                      </td>

                      <td className="py-6 px-4">
                        <div className="text-sm">{t.scheduledAt ? new Date(t.scheduledAt).toLocaleDateString() : '—'}</div>
                        <div className="text-xs text-gray-400">{t.scheduledAt ? new Date(t.scheduledAt).toLocaleTimeString() : ''}</div>
                      </td>

                      <td className="py-6 px-4">
                        {t.completed ? (
                          <span className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Completed</span>
                        ) : (
                          <span className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Upcoming</span>
                        )}
                      </td>

                      <td className="py-6 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            title="Edit"
                            onClick={() => openEdit(t)}
                            className="p-2 rounded-lg bg-violet-50 text-violet-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            title={t.completed ? 'Undo complete' : 'Mark complete'}
                            onClick={() => toggleComplete(t)}
                            className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-sm"
                          >
                            {t.completed ? 'Undo' : 'Done'}
                          </button>

                          <button
                            title="Delete"
                            onClick={() => handleDelete(t.id)}
                            className="p-2 rounded-lg bg-pink-50 text-pink-600"
                          >
                            {deletingId === t.id ? <span className="text-xs">Deleting…</span> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit drawer/modal */}
      {editingTodo && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => !savingEdit && setEditingTodo(null)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full sm:w-[480px] bg-white shadow-2xl p-6 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Todo</h3>
              <button onClick={() => !savingEdit && setEditingTodo(null)} className="text-gray-600">✕</button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input
                  className="w-full border rounded-lg p-2"
                  value={editingTodo.title}
                  onChange={(e) => setEditingTodo({ ...editingTodo, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea
                  className="w-full border rounded-lg p-2"
                  rows={4}
                  value={editingTodo.description || ''}
                  onChange={(e) => setEditingTodo({ ...editingTodo, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg p-2"
                  value={editingTodo.scheduledAtLocal}
                  onChange={(e) => setEditingTodo({ ...editingTodo, scheduledAtLocal: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!editingTodo.completed}
                    onChange={(e) => setEditingTodo({ ...editingTodo, completed: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">Mark as completed</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={savingEdit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                  {savingEdit ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" onClick={() => setEditingTodo(null)} disabled={savingEdit} className="px-3 py-2 border rounded-lg">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}

