import React, { useEffect, useRef, useState } from 'react';

interface WireframeChamberProps {
  interactive?: boolean;
}

/**
 * WireframeChamber — Renders an authentic 3D wireframe perspective room
 * matching the architectural CAD corridor design.
 * Features:
 * - Mathematical perspective projection for floor, ceiling, left & right walls
 * - Center vanishing void portal
 * - 60fps/120fps mouse parallax camera shift
 * - Ambient pulse scanline wave traveling into the depth
 * - Razor-sharp DPR rendering
 */
export const WireframeChamber: React.FC<WireframeChamberProps> = ({ interactive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameId = useRef<number | null>(null);
  const pulseOffset = useRef<number>(0);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive || prefersReducedMotion) return;
      // Normalized offset (-1 to 1)
      const nx = (e.clientX / width - 0.5) * 2;
      const ny = (e.clientY / height - 0.5) * 2;
      // Max shift: 28px horizontal, 18px vertical
      targetPos.current = { x: nx * 28, y: ny * 18 };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Render loop
    const render = () => {
      // Lerp mouse offset
      mousePos.current.x += (targetPos.current.x - mousePos.current.x) * 0.08;
      mousePos.current.y += (targetPos.current.y - mousePos.current.y) * 0.08;

      // Advance ambient pulse
      pulseOffset.current = (pulseOffset.current + 0.004) % 1;

      // Clear with deep room tone
      ctx.fillStyle = '#08090d';
      ctx.fillRect(0, 0, width, height);

      // Vanishing center point
      const cx = width / 2 + mousePos.current.x;
      const cy = height / 2 + mousePos.current.y;

      // Back portal dimensions (centered around vanishing point)
      const portalRatio = 0.44;
      const pw = width * portalRatio;
      const ph = height * portalRatio;
      const pl = cx - pw / 2;
      const pr = cx + pw / 2;
      const pt = cy - ph / 2;
      const pb = cy + ph / 2;

      // Outer frame corners
      const x0 = 0;
      const y0 = 0;
      const x1 = width;
      const y1 = height;

      // Main corner diagonal lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      // Top-Left corner
      ctx.moveTo(x0, y0);
      ctx.lineTo(pl, pt);
      // Top-Right corner
      ctx.moveTo(x1, y0);
      ctx.lineTo(pr, pt);
      // Bottom-Left corner
      ctx.moveTo(x0, y1);
      ctx.lineTo(pl, pb);
      // Bottom-Right corner
      ctx.moveTo(x1, y1);
      ctx.lineTo(pr, pb);
      ctx.stroke();

      // Back portal boundary rectangle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.strokeRect(pl, pt, pw, ph);

      // Deep void inside portal
      const voidGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(pw, ph) * 0.7);
      voidGradient.addColorStop(0, '#040507');
      voidGradient.addColorStop(0.8, '#06070a');
      voidGradient.addColorStop(1, '#08090d');
      ctx.fillStyle = voidGradient;
      ctx.fillRect(pl + 1, pt + 1, pw - 2, ph - 2);

      // Number of perspective longitudinal columns across width
      const numCols = 16;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.beginPath();
      for (let i = 1; i < numCols; i++) {
        const u = i / numCols;
        // Floor longitudinal line (from outer bottom to portal bottom)
        const outerX = x0 + u * (x1 - x0);
        const portalX = pl + u * pw;
        ctx.moveTo(outerX, y1);
        ctx.lineTo(portalX, pb);

        // Ceiling longitudinal line (from outer top to portal top)
        ctx.moveTo(outerX, y0);
        ctx.lineTo(portalX, pt);
      }
      ctx.stroke();

      // Number of perspective longitudinal rows across height
      const numRows = 10;
      ctx.beginPath();
      for (let i = 1; i < numRows; i++) {
        const v = i / numRows;
        // Left wall longitudinal line (from outer left to portal left)
        const outerY = y0 + v * (y1 - y0);
        const portalY = pt + v * ph;
        ctx.moveTo(x0, outerY);
        ctx.lineTo(pl, portalY);

        // Right wall longitudinal line (from outer right to portal right)
        ctx.moveTo(x1, outerY);
        ctx.lineTo(pr, portalY);
      }
      ctx.stroke();

      // Transversal Rings (Depth slices from camera to portal)
      const numRings = 7;
      for (let k = 1; k <= numRings; k++) {
        // Perspective foreshortening curve: rings get closer as they approach the back
        const t = Math.pow(k / (numRings + 1), 1.65);

        // Ring bounds interpolated between outer viewport and portal
        const ringL = x0 + (pl - x0) * t;
        const ringR = x1 + (pr - x1) * t;
        const ringT = y0 + (pt - y0) * t;
        const ringB = y1 + (pb - y1) * t;

        // Dynamic pulse wave calculation
        const distFromPulse = Math.abs(t - pulseOffset.current);
        const isPulseNearby = distFromPulse < 0.08;
        const alpha = isPulseNearby
          ? 0.38 + (1 - distFromPulse / 0.08) * 0.25
          : 0.14 + (1 - t) * 0.12;

        ctx.strokeStyle = isPulseNearby
          ? `rgba(56, 189, 248, ${alpha.toFixed(2)})`
          : `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
        ctx.lineWidth = isPulseNearby ? 1.4 : 1;

        // Draw transversal ring
        ctx.strokeRect(ringL, ringT, ringR - ringL, ringB - ringT);
      }

      // Subtle ambient vignette along perimeter for cinematic focus
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(8, 9, 13, 0)');
      vignette.addColorStop(1, 'rgba(4, 5, 8, 0.75)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [interactive, prefersReducedMotion]);

  return (
    <div className="wireframe-chamber-container" aria-hidden="true">
      <canvas ref={canvasRef} className="wireframe-chamber-canvas" />
    </div>
  );
};
