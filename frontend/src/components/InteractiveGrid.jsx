import { useEffect, useRef } from 'react';

/**
 * InteractiveGrid: A full-screen canvas background that draws a golden glow
 * at grid intersections near the mouse pointer.
 */
export default function InteractiveGrid() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const requestRef = useRef();

  const GRID_SIZE = 50; // Sync with CSS holographic-grid background-size
  const MAX_GLOW_RADIUS = 200;
  const GLOW_COLOR = '175,161,255'; // #D4AF37 in RGB

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Mouse tracker
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: mx, y: my } = mouseRef.current;

      // Optimization: Only iterate intersections within the glow radius bounding box
      const startX = Math.floor((mx - MAX_GLOW_RADIUS) / GRID_SIZE) * GRID_SIZE;
      const endX = Math.ceil((mx + MAX_GLOW_RADIUS) / GRID_SIZE) * GRID_SIZE;
      const startY = Math.floor((my - MAX_GLOW_RADIUS) / GRID_SIZE) * GRID_SIZE;
      const endY = Math.ceil((my + MAX_GLOW_RADIUS) / GRID_SIZE) * GRID_SIZE;

      for (let ix = startX; ix <= endX; ix += GRID_SIZE) {
        for (let iy = startY; iy <= endY; iy += GRID_SIZE) {
          // Calculate distance from mouse to intersection
          const dx = mx - ix;
          const dy = my - iy;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < MAX_GLOW_RADIUS) {
            // Quadratic intensity decay
            const intensity = Math.pow(1 - distance / MAX_GLOW_RADIUS, 2);

            // Draw localized glow
            const gradient = ctx.createRadialGradient(ix, iy, 0, ix, iy, 50);
            gradient.addColorStop(0, `rgba(${GLOW_COLOR}, ${intensity * 0.4})`);
            gradient.addColorStop(0.5, `rgba(${GLOW_COLOR}, ${intensity * 0.1})`);
            gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ix, iy, 50, 0, Math.PI * 2);
            ctx.fill();

            // Optional: Draw a tiny "glint" at the exact intersection
            ctx.fillStyle = `rgba(${GLOW_COLOR}, ${intensity * 0.8})`;
            ctx.beginPath();
            ctx.arc(ix, iy, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="interactive-grid"
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 0, // Behind content, but above the base background color
        mixBlendMode: 'screen', // Makes the golden glow pop against dark BG
      }}
    />
  );
}
