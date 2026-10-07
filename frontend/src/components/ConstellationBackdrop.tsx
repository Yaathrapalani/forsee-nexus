import React, { useEffect, useState } from 'react';

/**
 * Procedural spatial backdrop representing the "Subtle Academic Grid".
 * Renders precise engineering graph lines, academic registry coordinates,
 * subtle intersection crosshairs (+), and gentle ambient depth.
 * Fully responsive and respects prefers-reduced-motion.
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
      // Gentle normalized parallax offset (-12px to +12px)
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
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
    <div className="academic-grid-backdrop" aria-hidden="true">
      {/* Precision Academic Graph Rulings */}
      <div className="academic-grid-pattern" />

      {/* Radial Depth Lighting */}
      <div className="academic-glow-vignette" />

      {/* Procedural Academic Coordinates & Calibration Crosshairs */}
      <svg
        className="academic-grid-svg"
        style={transformStyle}
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Major Grid Lines */}
        <line x1="120" y1="0" x2="120" y2="900" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.12" />
        <line x1="360" y1="0" x2="360" y2="900" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.1" />
        <line x1="720" y1="0" x2="720" y2="900" stroke="currentColor" strokeWidth="0.6" strokeDasharray="4 8" opacity="0.16" />
        <line x1="1080" y1="0" x2="1080" y2="900" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.1" />
        <line x1="1320" y1="0" x2="1320" y2="900" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.12" />

        <line x1="0" y1="120" x2="1440" y2="120" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.12" />
        <line x1="0" y1="300" x2="1440" y2="300" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.1" />
        <line x1="0" y1="600" x2="1440" y2="600" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.1" />
        <line x1="0" y1="780" x2="1440" y2="780" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.12" />

        {/* Academic Precision Crosshairs (+) at key coordinate intersections */}
        {/* Top row */}
        <g opacity="0.3" stroke="currentColor" strokeWidth="0.8">
          <path d="M 115 120 H 125 M 120 115 V 125" />
          <path d="M 355 120 H 365 M 360 115 V 125" />
          <path d="M 715 120 H 725 M 720 115 V 125" />
          <path d="M 1075 120 H 1085 M 1080 115 V 125" />
          <path d="M 1315 120 H 1325 M 1320 115 V 125" />
        </g>

        {/* Middle row */}
        <g opacity="0.35" stroke="currentColor" strokeWidth="0.8">
          <path d="M 115 450 H 125 M 120 445 V 455" />
          <path d="M 355 450 H 365 M 360 445 V 455" />
          <path d="M 1075 450 H 1085 M 1080 445 V 455" />
          <path d="M 1315 450 H 1325 M 1320 445 V 455" />
        </g>

        {/* Bottom row */}
        <g opacity="0.3" stroke="currentColor" strokeWidth="0.8">
          <path d="M 115 780 H 125 M 120 775 V 785" />
          <path d="M 355 780 H 365 M 360 775 V 785" />
          <path d="M 715 780 H 725 M 720 775 V 785" />
          <path d="M 1075 780 H 1085 M 1080 775 V 785" />
          <path d="M 1315 780 H 1325 M 1320 775 V 785" />
        </g>

        {/* Faint academic observatory concentric calibration rings */}
        <circle cx="720" cy="450" r="320" stroke="currentColor" strokeWidth="0.6" strokeDasharray="3 9" opacity="0.08" />
        <circle cx="720" cy="450" r="480" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 12" opacity="0.06" />

        {/* Marginal Academic Ledger Annotations */}
        <text x="135" y="115" fill="currentColor" opacity="0.22" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1px">
          FORESE // REG-2024
        </text>
        <text x="135" y="775" fill="currentColor" opacity="0.22" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1px">
          SEC // CS-01
        </text>
        <text x="1220" y="115" fill="currentColor" opacity="0.22" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1px">
          ACAD-GRID // 100%
        </text>
        <text x="1210" y="775" fill="currentColor" opacity="0.22" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1px">
          INDEX-ID // #0142
        </text>
      </svg>
    </div>
  );
};
