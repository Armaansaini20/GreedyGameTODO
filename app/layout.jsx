import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'User Dashboard',
  description: 'Modern role-based dashboard with NextAuth',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {/* ✅ Now all pages (including dashboard) can use useSession() */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
