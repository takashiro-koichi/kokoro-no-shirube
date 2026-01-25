'use client';

import { useEffect, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // マウント時にフェードイン
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {children}
    </div>
  );
}
