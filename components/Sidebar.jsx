import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function Sidebar() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'USER';

  return (
    <aside className="w-72 bg-[#202428] text-white min-h-screen p-6">
      <div className="mb-8">
        <img src="/logo.svg" alt="logo" className="w-32" />
      </div>
      <nav className="space-y-2">
        <Link href="/dashboard" className="block p-3 rounded-lg bg-[#2e383c]">Dashboard</Link>
        <Link href="/dashboard/todos" className="block p-3 rounded-lg hover:bg-[#2e383c]">To do list</Link>
        {role === 'SUPER' && <Link href="/dashboard/users" className="block p-3 rounded-lg hover:bg-[#2e383c]">Users</Link>}
      </nav>
    </aside>
  );
}
