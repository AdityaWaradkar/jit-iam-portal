"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TOUR_STEPS } from "@/lib/tour-steps";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type Props = {
  active: boolean;
  onFinish: () => void;
  onSkip: () => void;
};

export function TourOverlay({ active, onFinish, onSkip }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const step = TOUR_STEPS[stepIndex];

  // Navigate when the step requires a route change.
  useEffect(() => {
    if (!active) return;
    if (step.route && step.route !== pathname) {
      router.push(step.route);
    }
  }, [active, step.route, pathname, router]);

  // Measure the target element after render and on resize.
  const measure = useCallback(() => {
    if (!step.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.target);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = (el as HTMLElement).getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [step.target]);

  useLayoutEffect(() => {
    if (!active) return;
    // Defer one frame so the page navigation has time to render.
    const handle = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(handle);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, measure]);

  // Re-measure when the step changes.
  useEffect(() => {
    if (!active) return;
    const timeout = setTimeout(measure, 150);
    return () => clearTimeout(timeout);
  }, [active, stepIndex, measure]);

  if (!active) return null;

  function handleNext() {
    if (stepIndex >= TOUR_STEPS.length - 1) {
      onFinish();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function handleBack() {
    if (stepIndex === 0) return;
    setStepIndex((i) => i - 1);
  }

  const padding = 8;

  // Compute the position of the tooltip relative to the target.
  const tooltipStyle: React.CSSProperties = targetRect
    ? {
        position: "fixed",
        top: Math.min(
          targetRect.top + targetRect.height + 16,
          window.innerHeight - 240,
        ),
        left: Math.max(
          16,
          Math.min(
            targetRect.left,
            window.innerWidth - 400,
          ),
        ),
        maxWidth: 380,
        zIndex: 10000,
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: 420,
        zIndex: 10000,
      };

  return (
    <>
      {/* Overlay with a hole for the target element. The hole is
          created by rendering four dark panels around the target
          rect. The target area itself is not covered, so it renders
          at full brightness. */}
      <div
        className="pointer-events-auto fixed inset-0 z-[9990]"
        onClick={(e) => e.stopPropagation()}
      >
        {targetRect ? (
          <>
            {/* Top panel */}
            <div
              className="absolute bg-black/70"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: Math.max(0, targetRect.top - padding),
              }}
            />
            {/* Bottom panel */}
            <div
              className="absolute bg-black/70"
              style={{
                top: targetRect.top + targetRect.height + padding,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            {/* Left panel */}
            <div
              className="absolute bg-black/70"
              style={{
                top: Math.max(0, targetRect.top - padding),
                left: 0,
                width: Math.max(0, targetRect.left - padding),
                height: targetRect.height + padding * 2,
              }}
            />
            {/* Right panel */}
            <div
              className="absolute bg-black/70"
              style={{
                top: Math.max(0, targetRect.top - padding),
                left: targetRect.left + targetRect.width + padding,
                right: 0,
                height: targetRect.height + padding * 2,
              }}
            />
            {/* Highlight ring around the target */}
            <div
              className="absolute rounded-md ring-2 ring-white/90 transition-all duration-200"
              style={{
                top: targetRect.top - padding,
                left: targetRect.left - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2,
                pointerEvents: "none",
              }}
            />
          </>
        ) : (
          /* No target: dim the entire screen */
          <div className="absolute inset-0 bg-black/70" />
        )}
      </div>

      {/* Tooltip card. */}
      <div
        style={tooltipStyle}
        className="rounded-lg border border-border bg-card p-4 shadow-xl"
      >
        <p className="text-xs text-muted-foreground">
          Step {stepIndex + 1} of {TOUR_STEPS.length}
        </p>
        <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {step.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground"
            onClick={onSkip}
          >
            Skip tour
          </button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleBack}
              disabled={stepIndex === 0}
            >
              Back
            </Button>
            <Button size="sm" onClick={handleNext}>
              {stepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}