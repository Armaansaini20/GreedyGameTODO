// components/Header.jsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';

import NotificationDrawer from '@/components/NotificationDrawer';
import ProfileDrawer from '@/components/ProfileDrawer';

export default function Header({ onManageTodos }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // client-only; can bubble up if needed
  const [notifCount, setNotifCount] = useState(0); // optionally set from props or fetched

  return (
    <>
      {/* Drawers */}
      <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <ProfileDrawer isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Header bar */}
      <div className="w-full bg-white border-b px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: logo / search */}
        <div className="flex items-center gap-4">
          <img src="/logo.svg" alt="logo" className="h-8" />
          <div className="hidden sm:block">
            <input
              placeholder="Search"
              className="w-72 px-4 py-2 rounded-lg border bg-gray-50 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-3">

          {/* Notification bell */}
          <motion.button
            onClick={() => setNotifOpen(true)}
            className="relative p-2 rounded-full hover:bg-gray-100 transition"
            whileTap={{ scale: 0.96 }}
          >
            🔔
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {notifCount}
              </span>
            )}
          </motion.button>

          {/* Avatar (opens profile drawer) */}
          <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2">
            <img
              src={session?.user?.image || '/avatar-default.png'}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover border"
            />
            <span className="hidden sm:inline text-sm text-gray-700">{session?.user?.name?.split(' ')[0] || 'User'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
