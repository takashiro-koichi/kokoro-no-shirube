import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative z-10">
      <Header />
      <Sidebar />
      <main className="pt-14 pb-16 md:pb-0 md:pl-60">
        <div className="p-4 md:p-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
