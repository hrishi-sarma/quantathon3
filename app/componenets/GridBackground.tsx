"use client";

import { useEffect, useState, useRef } from "react";

export default function GridBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let lastUpdate = 0;
    const throttle = 16; // ~60fps max

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate < throttle) return;
      lastUpdate = now;
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const gridSize = 50; // Increased for fewer dots
    const maxDistance = 150; // Reduced interaction radius
    const maxDistanceSq = maxDistance * maxDistance;
    let dots: { x: number; y: number; baseX: number; baseY: number }[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dots = [];
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          dots.push({ x, y, baseX: x, baseY: y });
        }
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let lastMousePos = { ...mousePos };
    let isAnimating = true;

    const animate = () => {
      if (!isAnimating) return;

      // Check if mouse moved significantly
      const mouseMoved = Math.abs(mousePos.x - lastMousePos.x) > 1 || 
                        Math.abs(mousePos.y - lastMousePos.y) > 1;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines once - batched
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      // Separate dots by proximity
      const affectedDots: typeof dots = [];
      const normalDots: typeof dots = [];
      
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const dx = mousePos.x - dot.baseX;
        const dy = mousePos.y - dot.baseY;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq < maxDistanceSq) {
          affectedDots.push(dot);
          if (mouseMoved) {
            const distance = Math.sqrt(distanceSq);
            const force = (maxDistance - distance) / maxDistance;
            dot.x = dot.baseX + dx * force * 0.2; // Reduced movement
            dot.y = dot.baseY + dy * force * 0.2;
          }
        } else {
          normalDots.push(dot);
          // Ease back to position
          if (Math.abs(dot.x - dot.baseX) > 0.1 || Math.abs(dot.y - dot.baseY) > 0.1) {
            dot.x += (dot.baseX - dot.x) * 0.15;
            dot.y += (dot.baseY - dot.y) * 0.15;
          } else {
            dot.x = dot.baseX;
            dot.y = dot.baseY;
          }
        }
      }

      // Draw all normal dots in one batch
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.beginPath();
      for (let i = 0; i < normalDots.length; i++) {
        ctx.moveTo(normalDots[i].x + 1.5, normalDots[i].y);
        ctx.arc(normalDots[i].x, normalDots[i].y, 1.5, 0, Math.PI * 2);
      }
      ctx.fill();

      // Draw affected dots - simplified, no glow
      for (let i = 0; i < affectedDots.length; i++) {
        const dot = affectedDots[i];
        const dx = mousePos.x - dot.baseX;
        const dy = mousePos.y - dot.baseY;
        const distanceSq = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSq);
        const force = (maxDistance - distance) / maxDistance;
        
        const opacity = 0.2 + force * 0.5; // Reduced opacity range
        const radius = 1.5 + force * 2; // Smaller size change

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      lastMousePos = { ...mousePos };
      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isAnimating = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}