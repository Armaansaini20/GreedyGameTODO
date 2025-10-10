'use client';
import { useState, useEffect } from 'react';

export default function TodoList({ initialTodos = [] }) {
  // ✅ Defensive default array
  const [todos, setTodos] = useState(Array.isArray(initialTodos) ? initialTodos : []);

  useEffect(() => {
    // Ensure data is always array even if API sends object or null
    if (!Array.isArray(initialTodos)) {
      console.warn('Expected todos array but got:', initialTodos);
      setTodos([]);
    }
  }, [initialTodos]);

  if (!todos.length) {
    return (
      <div className="text-sm text-gray-500 text-center py-6">
        No todos yet. Create one to get started!
      </div>
    );
  }

  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-left text-gray-400 border-b">
          <th className="pb-2 px-4">Title</th>
          <th className="pb-2 px-4">Description</th>
          <th className="pb-2 px-4">Scheduled At</th>
          <th className="pb-2 px-4">Status</th>
        </tr>
      </thead>
      <tbody>
        {/* ✅ Map safely */}
        {todos.map((t) => (
          <tr key={t.id} className="border-t border-dashed">
            <td className="py-6 px-4">
              <div className="font-medium">{t.title}</div>
            </td>
            <td className="py-6 px-4 text-gray-500">{t.description}</td>
            <td className="py-6 px-4 text-gray-500">
              {t.scheduledAt
                ? new Date(t.scheduledAt).toLocaleString()
                : 'No date'}
            </td>
            <td className="py-6 px-4">
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  t.completed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {t.completed ? 'Completed' : 'Pending'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
