// components/ProfileDrawer.jsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Edit3 } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * ProfileDrawer
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *
 * Matches the dashboard/profile drawer design:
 *  - slides from right
 *  - avatar, role badge, joined on
 *  - editable name + avatar URL/upload
 *  - profile stats (All / Upcoming / Completed)
 *  - update profile button + logout option with icons
 *
 * Usage:
 * <ProfileDrawer isOpen={open} onClose={() => setOpen(false)} />
 */

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileDrawer({ isOpen, onClose }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState('/avatar-default.png');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ all: '—', upcoming: '—', completed: '—' });
  const [message, setMessage] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setName(session.user.name || '');
      setAvatarUrl(session.user.image || '');
      setPreview(session.user.image || '/avatar-default.png');
      fetchStats();
    }
  }, [status, session]);

  useEffect(() => {
    if (!avatarFile) return;
    const objectUrl = URL.createObjectURL(avatarFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  async function fetchStats() {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const now = new Date();
      const in4h = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      setStats({
        all: list.length,
        upcoming: list.filter((t) => {
          const d = new Date(t.scheduledAt);
          return !t.completed && d >= now && d <= in4h;
        }).length,
        completed: list.filter((t) => t.completed).length,
      });
    } catch (err) {
      setStats({ all: '—', upcoming: '—', completed: '—' });
      console.error('Failed fetching stats', err);
    } finally {
      setLoadingStats(false);
    }
  }

  async function handleSave(e) {
    e?.preventDefault?.();
    setSaving(true);
    setMessage(null);

    try {
      let avatarData = null;
      if (avatarFile) avatarData = await fileToBase64(avatarFile);
      else if (avatarUrl && avatarUrl !== session?.user?.image) avatarData = avatarUrl;

      const payload = { name: name.trim(), avatarData };

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setMessage({ type: 'error', text: err.error || 'Failed to update profile' });
      } else {
        setMessage({ type: 'success', text: 'Profile updated' });
        // refresh server-side session-derived UI
        setTimeout(() => router.refresh(), 600);
      }
    } catch (err) {
      console.error('Profile update error', err);
      setMessage({ type: 'error', text: 'Server error' });
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    // close drawer then sign out
    onClose?.();
    signOut({ callbackUrl: '/sign-in' });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* overlay */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.36 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black"
          />

          {/* drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28 }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-white shadow-2xl p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Profile</h2>
                <p className="text-sm text-gray-500">View and edit your account</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 rounded-full p-1"
                aria-label="Close profile"
              >
                ✕
              </button>
            </div>

            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 relative">
                  <img src={preview || '/avatar-default.png'} alt="avatar" className="w-full h-full object-cover" />
                  <div className="absolute -right-1 -bottom-1 bg-white rounded-full p-1 shadow">
                    <Edit3 className="w-4 h-4 text-gray-600" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-medium text-gray-800">{name || session?.user?.email}</div>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">User</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Joined: <span className="font-medium">{session?.user?.createdAt ? new Date(session.user.createdAt).toLocaleDateString() : '—'}</span></div>
                </div>
              </div>

              <form onSubmit={handleSave} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-lg p-2"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Avatar URL</label>
                  <input
                    value={avatarUrl}
                    onChange={(e) => { setAvatarUrl(e.target.value); setAvatarFile(null); setPreview(e.target.value || '/avatar-default.png'); }}
                    className="w-full border rounded-lg p-2"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <div className="text-xs text-gray-400 mt-2">Or upload an image</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setAvatarFile(f);
                      if (f) setAvatarUrl('');
                    }}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow">
                    {saving ? 'Saving...' : 'Update Profile'}
                  </button>

                  <button
                    type="button"
                    className="px-3 py-2 border rounded-lg"
                    onClick={() => {
                      setName(session?.user?.name || '');
                      setAvatarUrl(session?.user?.image || '/avatar-default.png');
                      setAvatarFile(null);
                      setPreview(session?.user?.image || '/avatar-default.png');
                      setMessage(null);
                    }}
                  >
                    Reset
                  </button>
                </div>

                {message && (
                  <div className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</div>
                )}
              </form>

              <div className="mt-6 border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-400">All Todos</div>
                    <div className="text-2xl font-semibold">{loadingStats ? '—' : statsSafe(stats => stats.all)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Upcoming</div>
                    <div className="text-2xl font-semibold">{loadingStats ? '—' : statsSafe(stats => stats.upcoming)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Completed</div>
                    <div className="text-2xl font-semibold">{loadingStats ? '—' : statsSafe(stats => stats.completed)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 justify-center text-sm px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  // Helper closures so we don't try to read stats before defined
  function statsSafe(selector) {
    // stats might be e.g. { all: '—' } or real numbers
    try {
      return selector(stats);
    } catch {
      return '—';
    }
  }
}
