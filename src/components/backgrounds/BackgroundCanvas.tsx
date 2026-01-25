'use client';

import { usePathname } from 'next/navigation';
import { GradientBackground } from './GradientBackground';
import { StarryBackground } from './StarryBackground';

export function BackgroundCanvas() {
  const pathname = usePathname();
  const isDreamPage = pathname === '/app/dream';

  return (
    <div className="fixed inset-0 -z-10">{isDreamPage ? <StarryBackground /> : <GradientBackground />}</div>
  );
}
