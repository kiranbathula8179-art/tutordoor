/**
 * The quality contract (DESIGN_V2.md §"The quality contract").
 *
 * Every ambient visual — particles, blur, WebGL, smooth scroll — scales itself
 * from these two signals instead of assuming a gaming rig:
 *
 *   1. prefersReducedMotion(): the user asked for stillness. Honor it absolutely.
 *   2. getGpuTier(): a boot-time heuristic ("high" | "medium" | "low") from
 *      device memory, cores, DPR, and the WebGL renderer string. Cached.
 *
 * The heuristic is deliberately conservative: misjudging a fast machine as
 * "medium" costs a few particles; misjudging a slow one as "high" costs 60fps.
 */

export type GpuTier = "high" | "medium" | "low";

let cachedTier: GpuTier | null = null;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isTouchPrimary(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/** Renderer strings that indicate software rendering or notoriously weak GPUs. */
const LOW_RENDERER_HINTS = ["swiftshader", "software", "llvmpipe", "mali-4", "adreno 3", "intel(r) hd graphics 4"];

function readWebglRenderer(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    if (!gl) return "none";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    // Free the context politely where supported.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return renderer.toLowerCase();
  } catch {
    return "unknown";
  }
}

export function getGpuTier(): GpuTier {
  if (cachedTier) return cachedTier;
  if (typeof window === "undefined") return "medium";

  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 4; // GB; undefined on Safari — assume mid
  const cores = navigator.hardwareConcurrency ?? 4;
  const dpr = window.devicePixelRatio ?? 1;
  const renderer = readWebglRenderer();

  if (renderer === "none" || LOW_RENDERER_HINTS.some((hint) => renderer.includes(hint))) {
    cachedTier = "low";
  } else if (memory >= 8 && cores >= 8) {
    cachedTier = "high";
  } else if (memory >= 4 && cores >= 4) {
    // Very high-DPR mid devices push a lot of pixels — treat as medium, not high.
    cachedTier = dpr > 2.5 ? "medium" : "medium";
  } else {
    cachedTier = "low";
  }
  return cachedTier;
}

/** Convenience: what the ambient environment should render as. */
export function environmentMode(): "animated" | "still" {
  return prefersReducedMotion() || getGpuTier() === "low" ? "still" : "animated";
}

/** Scale a particle/instance count by tier. */
export function byTier(counts: { high: number; medium: number; low: number }): number {
  const tier = getGpuTier();
  return counts[tier];
}
