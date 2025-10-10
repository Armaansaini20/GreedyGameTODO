import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-ui-light">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
