'use client';

import { usePathname } from 'next/navigation';
import { GradientBackground } from './GradientBackground';
import { DreamBackground } from './DreamBackground';
import { BokehBackground } from './BokehBackground';
import { CloudBackground } from './CloudBackground';
import { TimelineBackground } from './TimelineBackground';
import { SparkleBackground } from './SparkleBackground';
import { SimpleGradientBackground } from './SimpleGradientBackground';

export function BackgroundCanvas() {
  const pathname = usePathname();

  const getBackground = () => {
    // Settings pages
    if (pathname.startsWith('/app/settings')) {
      return <SimpleGradientBackground />;
    }

    switch (pathname) {
      case '/app/dream':
        return <DreamBackground />;
      case '/app/diary':
        return <BokehBackground />;
      case '/app/calendar':
        return <CloudBackground />;
      case '/app/timeline':
        return <TimelineBackground />;
      case '/app/wishlist':
        return <SparkleBackground />;
      case '/app/home':
      default:
        return <GradientBackground />;
    }
  };

  return <div className="fixed inset-0 z-0">{getBackground()}</div>;
}
