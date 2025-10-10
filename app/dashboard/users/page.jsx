// app/dashboard/users/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function UsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') return;
    load();
  }, [status]);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSuper(user) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role === 'SUPER' ? 'USER' : 'SUPER' }),
      });
      if (!res.ok) throw new Error('Failed');
      load();
    } catch (err) {
      console.error(err);
      alert('Failed to update user role');
    }
  }

  if (status === 'loading' || loading) {
    return <div className="p-8 text-gray-500">Loading users...</div>;
  }

  if (status !== 'authenticated') return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">All Users</h1>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="text-sm text-gray-500 mb-4">Last Updated : {new Date().toLocaleDateString()}</div>

        <table className="w-full text-left">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="4" className="py-8 text-center text-gray-400">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-t border-dashed">
                <td className="py-6 px-4">
                  <div className="font-medium">{u.name || '-'}</div>
                </td>
                <td className="py-6 px-4 text-sm text-gray-600">{u.email}</td>
                <td className="py-6 px-4">
                  <div className="text-sm">{u.role === 'SUPER' ? 'Super Admin' : 'Viewer'}</div>
                </td>
                <td className="py-6 px-4">
                  <button onClick={() => toggleSuper(u)} className={`px-3 py-1 rounded-full text-sm ${u.role === 'SUPER' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>
                    {u.role === 'SUPER' ? 'Revoke Super' : 'Make Super'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
