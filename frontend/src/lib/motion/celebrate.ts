import { byTier, prefersReducedMotion } from "@/lib/motion/quality";

/**
 * celebrate() — the post-payment eruption (DESIGN_V2.md: "checkout is sacred —
 * delight AFTER payment, never during").
 *
 * A one-shot, dependency-free canvas confetti burst: two fountains from the
 * lower corners in the V3 brand palette, simple physics
 * (gravity, drag, spin), ~1.8s, then the canvas removes itself. Particle count
 * scales by GPU tier; under reduced motion it is a silent no-op — the success
 * toast already carries the news.
 *
 * Fire-and-forget and idempotent-safe: concurrent calls just add particles to
 * the live burst instead of stacking canvases.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  life: number; // 1 → 0
  shape: "rect" | "dot";
}

const PALETTE = ["#2563EB", "#06B6D4", "#F97316", "#16A34A", "#FFFFFF", "#3B82F6"];

let activeCanvas: HTMLCanvasElement | null = null;
let particles: Particle[] = [];
let rafId = 0;

function spawnBurst(originX: number, originY: number, count: number, driftX: number) {
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.1 + driftX * 0.35;
    const speed = 9 + Math.random() * 10;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed + driftX * 2.2,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 5,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      life: 1,
      shape: Math.random() < 0.75 ? "rect" : "dot",
    });
  }
}

export function celebrate(): void {
  if (typeof window === "undefined" || prefersReducedMotion()) return;

  const count = byTier({ high: 90, medium: 55, low: 25 });

  if (!activeCanvas) {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:10000;";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    document.body.appendChild(canvas);
    activeCanvas = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      cleanup();
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3); // normalized to ~60fps steps
      last = now;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles = particles.filter((p) => p.life > 0 && p.y < window.innerHeight + 40);
      for (const p of particles) {
        p.vy += 0.42 * dt; // gravity
        p.vx *= Math.pow(0.985, dt); // drag
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.spin * dt;
        p.life -= 0.008 * dt;

        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
        ctx.fillStyle = p.color;
        if (p.shape === "dot") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;

      if (particles.length > 0) {
        rafId = requestAnimationFrame(frame);
      } else {
        cleanup();
      }
    };
    rafId = requestAnimationFrame(frame);
  }

  const h = window.innerHeight;
  const w = window.innerWidth;
  spawnBurst(w * 0.12, h * 0.92, count, 1);
  spawnBurst(w * 0.88, h * 0.92, count, -1);
}

function cleanup() {
  cancelAnimationFrame(rafId);
  activeCanvas?.remove();
  activeCanvas = null;
  particles = [];
}
