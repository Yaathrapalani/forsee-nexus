import React, { useEffect, useState } from 'react';

/**
 * Procedural spatial backdrop representing "The Student Constellation".
 * Renders subtle coordinate marks, faint academic grid nodes, and gentle spatial depth.
 * Respects prefers-reduced-motion and maintains high text contrast.
 */
export const ConstellationBackdrop: React.FC = () => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    const handleMouseMove = (e: MouseEvent) => {
      if (mediaQuery.matches) return;
      // Gentle normalized offset (-15px to +15px)
      const x = ((e.clientX / window.innerWidth) - 0.5) * 20;
      const y = ((e.clientY / window.innerHeight) - 0.5) * 20;
      setCoords({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const transformStyle = prefersReducedMotion
    ? undefined
    : {
        transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
      };

  return (
    <div className="constellation-backdrop" aria-hidden="true">
      <div className="constellation-grid" />
      <svg
        className="constellation-svg"
        style={transformStyle}
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle coordinate anchors */}
        <circle cx="150" cy="120" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="350" cy="80" r="2.5" fill="currentColor" opacity="0.35" />
        <circle cx="600" cy="150" r="2" fill="currentColor" opacity="0.25" />
        <circle cx="850" cy="90" r="3" fill="currentColor" opacity="0.4" />
        <circle cx="1050" cy="160" r="2" fill="currentColor" opacity="0.3" />

        <circle cx="200" cy="400" r="2.5" fill="currentColor" opacity="0.3" />
        <circle cx="500" cy="480" r="3" fill="currentColor" opacity="0.35" />
        <circle cx="800" cy="420" r="2" fill="currentColor" opacity="0.25" />
        <circle cx="1000" cy="520" r="2.5" fill="currentColor" opacity="0.3" />

        <circle cx="180" cy="680" r="2" fill="currentColor" opacity="0.25" />
        <circle cx="450" cy="720" r="3" fill="currentColor" opacity="0.4" />
        <circle cx="750" cy="690" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="980" cy="740" r="2.5" fill="currentColor" opacity="0.35" />

        {/* Faint institutional constellation arcs and vectors */}
        <path
          d="M 150 120 L 350 80 L 600 150 L 850 90 L 1050 160"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="4 6"
          opacity="0.15"
        />
        <path
          d="M 200 400 L 500 480 L 800 420 L 1000 520"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="4 6"
          opacity="0.12"
        />
        <path
          d="M 350 80 Q 500 280 500 480"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.1"
        />
        <path
          d="M 850 90 Q 750 300 800 420"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.1"
        />

        {/* Coordinate crosses (+) */}
        <path d="M 80 80 L 80 90 M 75 85 L 85 85" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
        <path d="M 1120 80 L 1120 90 M 1115 85 L 1125 85" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
        <path d="M 80 720 L 80 730 M 75 725 L 85 725" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
        <path d="M 1120 720 L 1120 730 M 1115 725 L 1125 725" stroke="currentColor" strokeWidth="0.8" opacity="0.25" />
      </svg>
    </div>
  );
};
