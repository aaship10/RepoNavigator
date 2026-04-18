import { useEffect, useRef } from 'react';

export default function InteractiveGrid() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 }); // Starts offscreen
  const requestRef = useRef();

  const GRID_SIZE = 50; 
  const MAX_GLOW_RADIUS = 200;
  const GLOW_COLOR = '175, 161, 255'; 
  const SPHERE_RADIUS = 150; // Size of the 3D bubble tracking the mouse

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Fisheye/Magnifying Bubble Distortion
    const spherize = (x, y, cx, cy) => {
      const dx = x - cx;
      const dy = y - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Seamlessly return to a flat 2D grid if outside the bubble
      if (distance >= SPHERE_RADIUS || distance === 0) {
        return { x, y, scale: 1 };
      }

      // Calculate the curve to push points outward (creating the 3D bulge)
      const r = distance / SPHERE_RADIUS; 
      const curvedR = Math.sin(r * Math.PI / 2); 
      const factor = curvedR / r; 
      
      // Dots get slightly larger as they reach the peak of the bubble
      const scale = 1 + (1 - r) * 0.5; 

      return {
        x: cx + dx * factor,
        y: cy + dy * factor,
        scale: scale
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { x: mx, y: my } = mouseRef.current;

      // Draw slightly off-screen to avoid elements popping in
      const startX = -GRID_SIZE;
      const endX = canvas.width + GRID_SIZE;
      const startY = -GRID_SIZE;
      const endY = canvas.height + GRID_SIZE;

      for (let ix = startX; ix <= endX; ix += GRID_SIZE) {
        for (let iy = startY; iy <= endY; iy += GRID_SIZE) {
          
          // Apply distortion centered EXACTLY on the mouse
          const { x: px, y: py, scale } = spherize(ix, iy, mx, my);

          const dx = mx - px;
          const dy = my - py;
          const mouseDist = Math.sqrt(dx * dx + dy * dy);

          // 1. Draw the base grid dot
          ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * scale})`;
          ctx.beginPath();
          ctx.arc(px, py, 1 * scale, 0, Math.PI * 2);
          ctx.fill();

          // 2. Draw the localized golden/purple glow
          if (mouseDist < MAX_GLOW_RADIUS) {
            const intensity = Math.pow(1 - mouseDist / MAX_GLOW_RADIUS, 2);
            
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, 50 * scale);
            gradient.addColorStop(0, `rgba(${GLOW_COLOR}, ${intensity * 0.4})`);
            gradient.addColorStop(0.5, `rgba(${GLOW_COLOR}, ${intensity * 0.1})`);
            gradient.addColorStop(1, 'rgba(175, 161, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, 50 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Bright inner core
            ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.8})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.5 * scale, 0, Math.PI * 2);
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
      style={{ zIndex: 0, mixBlendMode: 'screen' }}
    />
  );
}