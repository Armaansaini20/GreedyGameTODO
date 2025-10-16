// app/dashboard/todos/page.jsx
'use client';

import { useEffect, useState, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Transition } from '@headlessui/react';
import { ChevronDown, Trash2, Check, Plus, Edit3 } from 'lucide-react';

/**
 * Todos page + Add-Drawer (icons for actions)
 * - Uses lucide-react icons for actions (Edit3, Trash2, Check)
 * - Keep API contract the same as previous file
 */

function LoadingBar({ text = 'Loading...' }) {
  return (
    <div className="h-32 flex flex-col items-center justify-center text-gray-500">
      <div className="w-3/4 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-400 via-blue-500 to-indigo-600 animate-slide" />
      </div>
      <p className="mt-3 text-sm text-gray-400">{text}</p>
      <style>{`
        @keyframes slide { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }
        .animate-slide { animation: slide 1.2s linear infinite; }
      `}</style>
    </div>
  );
}

export default function TodosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // inline add form (top) state
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '' });
  const [savingInline, setSavingInline] = useState(false);

  // drawer (add / edit)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTodo, setEditTodo] = useState(null);
  const [drawerSaving, setDrawerSaving] = useState(false);

  // filter dropdown
  const [filter, setFilter] = useState('all'); // all | upcoming | completed

  function combineToISO(dateStr, timeStr) {
    if (!dateStr) return null;
    const t = timeStr || '00:00';
    const iso = new Date(`${dateStr}T${t}`);
    if (isNaN(iso.getTime())) return null;
    return iso.toISOString();
  }

  async function loadTodos() {
    setLoading(true);
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) {
        setTodos([]);
        return;
      }
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching todos', err);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sign-in');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') loadTodos();
  }, [status]);

  async function handleInlineCreate(e) {
    e.preventDefault();
    if (!form.title || !form.date) return alert('Title and Date are required');
    const iso = combineToISO(form.date, form.time);
    if (!iso) return alert('Invalid date/time');
    if (new Date(iso) <= new Date()) return alert('Please choose a future date/time');

    setSavingInline(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          scheduledAt: iso,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Create failed' }));
        alert(err.error || 'Create failed');
      } else {
        setForm({ title: '', description: '', date: '', time: '' });
        await loadTodos();
      }
    } catch (err) {
      console.error('Create error', err);
      alert('Create failed');
    } finally {
      setSavingInline(false);
    }
  }

  function openAddDrawer() {
    setEditTodo(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(todo) {
    const d = todo.scheduledAt ? new Date(todo.scheduledAt) : null;
    const pad = (n) => String(n).padStart(2, '0');
    const date = d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '';
    const time = d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
    setEditTodo({ ...todo, date, time });
    setDrawerOpen(true);
  }

  async function handleDrawerSave(e) {
    e?.preventDefault?.();
    if (!editTodo?.title) return alert('Title required');
    if (!editTodo?.date) return alert('Date required');
    const iso = combineToISO(editTodo.date, editTodo.time);
    if (!iso) return alert('Invalid date/time');
    if (new Date(iso) <= new Date()) return alert('Please choose future date/time');

    setDrawerSaving(true);
    try {
      if (editTodo.id) {
        const res = await fetch(`/api/todos/${editTodo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTodo.title,
            description: editTodo.description,
            scheduledAt: iso,
            completed: !!editTodo.completed,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Update failed' }));
          alert(err.error || 'Update failed');
        } else {
          setDrawerOpen(false);
          setEditTodo(null);
          await loadTodos();
        }
      } else {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTodo.title,
            description: editTodo.description,
            scheduledAt: iso,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Create failed' }));
          alert(err.error || 'Create failed');
        } else {
          setDrawerOpen(false);
          setEditTodo(null);
          await loadTodos();
        }
      }
    } catch (err) {
      console.error('Save error', err);
      alert('Save failed');
    } finally {
      setDrawerSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this todo?')) return;
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        alert(err.error || 'Delete failed');
      } else {
        await loadTodos();
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('Delete failed');
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
        alert(err.error || 'Update failed');
      } else {
        await loadTodos();
      }
    } catch (err) {
      console.error('Toggle error', err);
      alert('Update failed');
    }
  }

  const now = new Date();
  const in4h = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const filtered = todos.filter((t) => {
    if (filter === 'upcoming') {
      const d = t.scheduledAt ? new Date(t.scheduledAt) : null;
      return d && !t.completed && d >= now && d <= in4h;
    }
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Manage Todos</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-white"
          >
            <option value="all">All</option>
            <option value="upcoming">Due in 4 hours</option>
            <option value="completed">Completed</option>
          </select>

          <button
            onClick={openAddDrawer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow"
          >
            <Plus className="w-4 h-4" />
            + Add Todo
          </button>
        </div>
      </div>

      
      <div className="bg-white rounded-xl p-6 shadow">
        <div className="text-xs text-gray-500 mb-4">Last Updated : {new Date().toLocaleDateString()}</div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="text-xs text-gray-500">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="py-8"><LoadingBar text="Loading todos..." /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" className="py-8 text-center text-gray-400">No todos found</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-t border-dashed">
                    <td className="py-6 px-4">
                      <div className="font-medium text-gray-700">{t.title}</div>
                      <div className="text-sm text-gray-400 mt-2">{t.description}</div>
                    </td>

                    <td className="py-6 px-4">
                      {t.scheduledAt ? (
                        <>
                          <div className="text-sm">{new Date(t.scheduledAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">{new Date(t.scheduledAt).toLocaleTimeString()}</div>
                        </>
                      ) : '—'}
                    </td>

                    <td className="py-6 px-4">
                      {t.completed ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">Completed</span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Pending</span>
                      )}
                    </td>

                    <td className="py-6 px-4">
                      <div className="flex items-center gap-3">

                        {/* Edit icon (purple rounded square) */}
                        <button
                          onClick={() => openEditDrawer(t)}
                          className="p-2 rounded-lg bg-violet-50 text-violet-600 hover:shadow"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Complete icon (green/blue small pill with check) */}
                        <button
                          onClick={() => toggleComplete(t)}
                          className={`px-3 py-1 rounded-full text-sm ${t.completed ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'}`}
                          title={t.completed ? 'Undo complete' : 'Mark complete'}
                        >
                          <Check className="inline w-4 h-4 mr-1" /> {t.completed ? 'Undo' : 'Done'}
                        </button>

                        {/* Delete icon (pink rounded square) */}
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-2 rounded-lg bg-pink-50 text-pink-600 hover:shadow"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Drawer (Add / Edit) */}
      <Transition show={drawerOpen} as={Fragment}>
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => !drawerSaving && setDrawerOpen(false)} />

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-semibold">{editTodo?.id ? 'Edit Todo' : 'Add Todo'}</h2>
                    <button onClick={() => !drawerSaving && setDrawerOpen(false)} className="text-gray-600">✕</button>
                  </div>

                  <form onSubmit={handleDrawerSave} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Title *</label>
                      <input
                        value={editTodo?.title || ''}
                        onChange={(e) => setEditTodo((s) => ({ ...(s || {}), title: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-3"
                        placeholder="Enter Title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <textarea
                        value={editTodo?.description || ''}
                        onChange={(e) => setEditTodo((s) => ({ ...(s || {}), description: e.target.value }))}
                        className="w-full border rounded-lg px-4 py-3"
                        rows={5}
                        placeholder="Enter Description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Due Date *</label>
                        <input
                          type="date"
                          value={editTodo?.date || ''}
                          onChange={(e) => setEditTodo((s) => ({ ...(s || {}), date: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-3"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Due Time *</label>
                        <input
                          type="time"
                          value={editTodo?.time || ''}
                          onChange={(e) => setEditTodo((s) => ({ ...(s || {}), time: e.target.value }))}
                          className="w-full border rounded-lg px-3 py-3"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!editTodo?.completed}
                          onChange={(e) => setEditTodo((s) => ({ ...(s || {}), completed: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-600">Mark as completed</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <button type="submit" disabled={drawerSaving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
                        {drawerSaving ? 'Saving…' : (editTodo?.id ? 'Save changes' : 'Create Todo')}
                      </button>
                      <button type="button" onClick={() => setDrawerOpen(false)} className="px-3 py-2 border rounded-lg">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}
