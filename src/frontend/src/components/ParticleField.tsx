import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  alphaSpeed: number;
  life: number;
  maxLife: number;
}

const COLORS = [
  "rgba(234, 179, 8,", // gold
  "rgba(168, 85, 247,", // purple
  "rgba(249, 115, 22,", // orange
  "rgba(59, 130, 246,", // blue
];

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnParticle = (): Particle => {
      const maxLife = 120 + Math.random() * 180;
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.3 + Math.random() * 0.5),
        size: 1 + Math.random() * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0,
        alphaSpeed: 0.02,
        life: 0,
        maxLife,
      };
    };

    // Initialize with some particles
    for (let i = 0; i < 40; i++) {
      const p = spawnParticle();
      p.y = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      p.alpha = Math.min(p.life / 20, 0.6);
      particlesRef.current.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles
      if (particlesRef.current.length < 60 && Math.random() < 0.3) {
        particlesRef.current.push(spawnParticle());
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        if (progress < 0.1) {
          p.alpha = progress * 6;
        } else if (progress > 0.8) {
          p.alpha = (1 - progress) * 5;
        } else {
          p.alpha = 0.6;
        }

        if (p.life >= p.maxLife || p.y < -10) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();

        // Small glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.size * 2.5,
        );
        grad.addColorStop(0, `${p.color}${p.alpha * 0.4})`);
        grad.addColorStop(1, `${p.color}0)`);
        ctx.fillStyle = grad;
        ctx.fill();

        return true;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
    />
  );
}
