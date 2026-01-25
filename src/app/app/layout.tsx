import { AppShell } from '@/components/layout';
import { BackgroundCanvas } from '@/components/backgrounds';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackgroundCanvas />
      <AppShell>{children}</AppShell>
    </>
  );
}
