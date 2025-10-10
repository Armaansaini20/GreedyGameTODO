'use client';
import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  async function load() {
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(id) {
    await fetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ userId: id }),
      headers: { 'Content-Type': 'application/json' }
    });
    load();
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">User Management</h2>

      <div className="bg-white p-6 rounded-xl shadow-soft">
        <table className="w-full">
          <thead className="text-left text-sm text-gray-500 bg-gray-50">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-dashed">
                <td className="py-3 px-4">{u.name}</td>
                <td className="py-3 px-4">{u.email}</td>
                <td className="py-3 px-4">{u.role}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleRole(u.id)}
                    className="px-4 py-1 bg-brand text-white rounded-lg text-sm"
                  >
                    Toggle Role
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
