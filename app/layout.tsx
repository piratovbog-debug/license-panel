import './globals.css';
import AppShell from './AppShell';
import { StoreProvider } from '@/lib/store';

export const metadata = {
  title: 'License Panel',
  description: 'Admin panel for key management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body className="bg-[#0a0c14] text-zinc-100 min-h-screen antialiased">
        <StoreProvider>
          <AppShell />
        </StoreProvider>
      </body>
    </html>
  );
}
