// components/ClientLayout.jsx
'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Define routes that should NOT show sidebar/header
  const authPages = ['/sign-in', '/register', '/auth/error', '/auth/verify'];
  const isAuthPage = authPages.some((p) => pathname.startsWith(p));

  // ✅ If on auth page → plain layout
  if (isAuthPage) {
    return <Suspense fallback={null}>{children}</Suspense>;
  }

  // ✅ Else → full dashboard layout
  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="hidden md:block">
        <Sidebar />
      </aside>

      {/* Header + main content */}
      <div className="flex-1 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
