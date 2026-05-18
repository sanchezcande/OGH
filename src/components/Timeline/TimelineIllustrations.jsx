import React, { useEffect, useRef } from "react";
import styled from "styled-components";

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
  background: #060606;
`;

// Particle network that responds to nothing — pure ambient life
function useParticleNetwork(canvasRef, config) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let w, h, particles, mouse;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };

    const init = () => {
      resize();
      mouse = { x: w / 2, y: h / 2 };
      particles = [];
      const count = config.particleCount || 80;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * (config.speed || 0.4),
          vy: (Math.random() - 0.5) * (config.speed || 0.4),
          r: Math.random() * (config.maxRadius || 2.5) + 0.5,
          accent: Math.random() < (config.accentRatio || 0.15),
        });
      }
    };

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Connections
      const maxDist = config.connectionDist || 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = dist(particles[i], particles[j]);
          if (d < maxDist) {
            const alpha = (1 - d / maxDist) * 0.15;
            const isAccent = particles[i].accent || particles[j].accent;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isAccent
              ? `rgba(204, 90, 80, ${alpha * 1.5})`
              : `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Mouse attraction lines
      for (const p of particles) {
        const d = dist(p, mouse);
        if (d < 180) {
          const alpha = (1 - d / 180) * 0.08;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(204, 90, 80, ${alpha})`;
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }

      // Particles
      for (const p of particles) {
        // Subtle glow
        if (p.accent && p.r > 1.5) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          grad.addColorStop(0, "rgba(204, 90, 80, 0.08)");
          grad.addColorStop(1, "rgba(204, 90, 80, 0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.accent
          ? `rgba(204, 90, 80, ${0.5 + Math.sin(Date.now() * 0.002 + p.x) * 0.3})`
          : `rgba(255, 255, 255, ${0.12 + Math.sin(Date.now() * 0.001 + p.y) * 0.08})`;
        ctx.fill();
      }

      // Update positions
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Soft mouse repulsion
        const md = dist(p, mouse);
        if (md < 100 && md > 0) {
          const force = (100 - md) * 0.0003;
          p.vx += ((p.x - mouse.x) / md) * force;
          p.vy += ((p.y - mouse.y) / md) * force;
        }

        // Damping
        p.vx *= 0.999;
        p.vy *= 0.999;

        // Wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }

      animId = requestAnimationFrame(draw);
    };

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    init();
    draw();
    canvas.addEventListener("mousemove", onMouse);
    window.addEventListener("resize", () => { resize(); });

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", onMouse);
    };
  }, []);
}

// ─── 01 HISTORY ─── Dense rising particles
export const HistoryIllustration = () => {
  const ref = useRef(null);
  useParticleNetwork(ref, {
    particleCount: 70,
    speed: 0.25,
    maxRadius: 2,
    accentRatio: 0.2,
    connectionDist: 100,
  });
  return <Canvas ref={ref} />;
};

// ─── 02 MISSION ─── Wider connections, fewer particles
export const MissionIllustration = () => {
  const ref = useRef(null);
  useParticleNetwork(ref, {
    particleCount: 50,
    speed: 0.2,
    maxRadius: 3,
    accentRatio: 0.25,
    connectionDist: 150,
  });
  return <Canvas ref={ref} />;
};

// ─── 03 TECH ─── Dense neural network
export const TechIllustration = () => {
  const ref = useRef(null);
  useParticleNetwork(ref, {
    particleCount: 100,
    speed: 0.35,
    maxRadius: 2.5,
    accentRatio: 0.12,
    connectionDist: 110,
  });
  return <Canvas ref={ref} />;
};

// ─── 04 INNOVATION ─── Fast, energetic, more accent
export const InnovationIllustration = () => {
  const ref = useRef(null);
  useParticleNetwork(ref, {
    particleCount: 90,
    speed: 0.5,
    maxRadius: 3,
    accentRatio: 0.3,
    connectionDist: 130,
  });
  return <Canvas ref={ref} />;
};
