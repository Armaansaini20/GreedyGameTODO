// components/NotificationDrawer.jsx
'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationDrawer({ isOpen, onClose }) {
  const [data, setData] = useState({ upcoming: [], completed: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => {
        setData(d || { upcoming: [], completed: [] });
      })
      .catch(() => setData({ upcoming: [], completed: [] }))
      .finally(() => setLoading(false));
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28 }}
            className="fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">All Notifications</h3>
              <button onClick={onClose} className="text-gray-600">✕</button>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="animate-pulse h-14 bg-gray-100 rounded-xl" />
                <div className="animate-pulse h-14 bg-gray-100 rounded-xl" />
              </div>
            ) : (
              <>
                {Array.isArray(data.upcoming) && data.upcoming.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {data.upcoming.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl border">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{t.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{new Date(t.scheduledAt).toLocaleString()}</div>
                          </div>
                          <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Upcoming</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {Array.isArray(data.completed) && data.completed.length > 0 && (
                  <div className="space-y-3">
                    {data.completed.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl border">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium line-through text-gray-700">{t.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{new Date(t.scheduledAt).toLocaleString()}</div>
                          </div>
                          <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Completed</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {data.upcoming.length === 0 && data.completed.length === 0 && (
                  <div className="text-center text-gray-500 py-10">No notifications right now ✨</div>
                )}
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
