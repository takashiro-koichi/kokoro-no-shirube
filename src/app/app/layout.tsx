import { AppShell } from '@/components/layout';
import { BackgroundCanvas } from '@/components/backgrounds';
import { Toaster } from '@/components/ui/toaster';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackgroundCanvas />
      <AppShell>{children}</AppShell>
      <Toaster />
    </>
  );
}
