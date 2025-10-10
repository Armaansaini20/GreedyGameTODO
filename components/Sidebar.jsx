import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function Sidebar() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role || 'USER';

  // Determine styles based on role
  const isSuper = role === 'SUPER';
  const bgColor = isSuper ? 'bg-[#202428]' : 'bg-white';
  const textColor = isSuper ? 'text-white' : 'text-black';
  const hoverBg = isSuper ? 'hover:bg-[#2e383c]' : 'hover:bg-gray-100';
  const activeBg = isSuper ? 'bg-[#2e383c]' : 'bg-gray-200';

  return (
    <aside className={`w-72 ${bgColor} ${textColor} min-h-screen p-6 transition-colors duration-300`}>
      <div className="mb-8">
        <img src="/logo.svg" alt="logo" className="w-32" />
      </div>
      <nav className="space-y-2">
        <Link href="/dashboard" className={`block p-3 rounded-lg ${activeBg}`}>
          Dashboard
        </Link>
        <Link href="/dashboard/todos" className={`block p-3 rounded-lg ${hoverBg}`}>
          To do list
        </Link>
        {isSuper && (
          <Link href="/dashboard/users" className={`block p-3 rounded-lg ${hoverBg}`}>
            Users
          </Link>
        )}
      </nav>
    </aside>
  );
}
