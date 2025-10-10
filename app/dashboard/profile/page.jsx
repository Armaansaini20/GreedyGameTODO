'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Edit3 } from 'lucide-react';

/**
 * Profile page — matches Figma:
 * - avatar + role badge + joined on
 * - editable name + avatar URL or upload
 * - profile stats section (All/Upcoming/Completed)
 * - Logout action
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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ all: '—', upcoming: '—', completed: '—' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/sign-in');
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setAvatarUrl(session.user.image || 'https://avatar.iran.liara.run/public');
      setPreview(session.user.image || 'https://avatar.iran.liara.run/public');
      // Fetch counts quickly
      (async () => {
        try {
          const res = await fetch('/api/todos');
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          setStats({
            all: list.length,
            upcoming: list.filter((t) => {
              const now = new Date();
              const in4h = new Date(now.getTime() + 4 * 60 * 60 * 1000);
              const d = new Date(t.scheduledAt);
              return !t.completed && d >= now && d <= in4h;
            }).length,
            completed: list.filter((t) => t.completed).length,
          });
        } catch {
          setStats({ all: '—', upcoming: '—', completed: '—' });
        }
      })();
    }
  }, [session]);

  useEffect(() => {
    if (!avatarFile) return;
    const objectUrl = URL.createObjectURL(avatarFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let avatarData = null;
      if (avatarFile) avatarData = await fileToBase64(avatarFile);
      else if (avatarUrl && avatarUrl !== session.user.image) avatarData = avatarUrl;

      const payload = { name: name.trim(), avatarData };
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        setMessage({ type: 'error', text: err.error || 'Failed to update' });
      } else {
        setMessage({ type: 'success', text: 'Profile updated' });
        setTimeout(() => router.refresh(), 600);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server error' });
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading') return <div className="p-8 text-gray-500">Loading profile...</div>;
  if (!session) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-gray-500">Manage account details and avatar</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => signOut({ callbackUrl: '/sign-in' })} className="px-4 py-2 border rounded-lg">
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex gap-6">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 relative">
            <img src={preview || '/avatar-default.png'} alt="avatar" className="w-full h-full object-cover" />
            <div className="absolute right-1 bottom-1 bg-white rounded-full p-1 shadow">
              <Edit3 className="w-4 h-4 text-gray-600" />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs text-gray-500">Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded-lg p-2 mb-3" />

            <label className="block text-xs text-gray-500">Avatar URL</label>
            <input value={avatarUrl} onChange={(e) => { setAvatarUrl(e.target.value); setAvatarFile(null); setPreview(e.target.value || '/avatar-default.png'); }} className="w-full border rounded-lg p-2 mb-3" />

            <div className="text-xs text-gray-400 mb-2">Or upload an image</div>
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setAvatarFile(f);
              if (f) setAvatarUrl('');
            }} />

            <div className="mt-4 flex items-center gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
              <button type="button" onClick={() => {
                setName(session.user?.name || '');
                setAvatarUrl(session.user?.image || 'https://avatar.iran.liara.run/public');
                setAvatarFile(null);
                setPreview(session.user?.image || 'https://avatar.iran.liara.run/public');
                setMessage(null);
              }} className="px-3 py-2 border rounded-lg">Reset</button>
            </div>

            {message && <div className={`mt-3 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</div>}

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-400">All Todos</div>
                <div className="text-2xl font-semibold">{stats.all}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Upcoming</div>
                <div className="text-2xl font-semibold">{stats.upcoming}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Completed</div>
                <div className="text-2xl font-semibold">{stats.completed}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Email: <span className="font-medium">{session.user?.email}</span>
          <div className="text-xs text-gray-400 mt-1">Joined: {session.user?.createdAt ? new Date(session.user.createdAt).toLocaleString() : '—'}</div>
        </div>
      </form>
    </div>
  );
}
