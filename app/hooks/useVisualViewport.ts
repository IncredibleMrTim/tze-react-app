"use client";

import { useEffect, useState } from "react";

interface VisualViewportMetrics {
  height: number;
  offsetTop: number;
}

/**
 * Tracks window.visualViewport height/offsetTop. iOS Safari never shrinks
 * window.innerHeight when the on-screen keyboard opens (only the visual
 * viewport shrinks), so fixed-position UI anchored with `bottom: 0` ends up
 * partly hidden underneath the keyboard. Consumers use these metrics to
 * position against the true visible area instead.
 */
export function useVisualViewport(): VisualViewportMetrics | null {
  const [metrics, setMetrics] = useState<VisualViewportMetrics | null>(null);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const updateMetrics = () =>
      setMetrics({
        height: visualViewport.height,
        offsetTop: visualViewport.offsetTop,
      });

    updateMetrics();
    visualViewport.addEventListener("resize", updateMetrics);
    visualViewport.addEventListener("scroll", updateMetrics);
    return () => {
      visualViewport.removeEventListener("resize", updateMetrics);
      visualViewport.removeEventListener("scroll", updateMetrics);
    };
  }, []);

  return metrics;
}
