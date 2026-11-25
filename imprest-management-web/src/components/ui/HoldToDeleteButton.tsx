"use client";

import React, { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

interface HoldToDeleteButtonProps {
  onTrigger: () => void;
  label?: string;
  holdDurationMs?: number;
  className?: string;
}

export function HoldToDeleteButton({
  onTrigger,
  label = "Hold to delete",
  holdDurationMs = 350,
  className = "",
}: HoldToDeleteButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const holdingRef = useRef(false);
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const radius = 14;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const triggerShake = () => {
    setIsShaking(false);
    requestAnimationFrame(() => {
      setIsShaking(true);
    });
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setIsShaking(false), 340);
  };

  const startHold = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    completedRef.current = false;
    holdingRef.current = true;
    setIsShaking(false);
    setIsHolding(true);

    timerRef.current = setTimeout(() => {
      completedRef.current = true;
      holdingRef.current = false;
      setIsHolding(false);
      onTrigger();
    }, holdDurationMs);
  };

  const cancelHold = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);

    if (!completedRef.current) {
      triggerShake();
    }
  };

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        startHold();
      }}
      onPointerUp={cancelHold}
      onPointerLeave={cancelHold}
      onPointerCancel={cancelHold}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          startHold();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") {
          cancelHold();
        }
      }}
      className={`relative inline-flex h-9 w-9 select-none items-center justify-center rounded-full text-[var(--status-danger)] transition-colors hover:bg-[var(--status-danger)]/10 ${
        isShaking ? "animate-shake" : ""
      } ${className}`}
    >
      {/* Red circular progress ring */}
      <svg
        viewBox="0 0 36 36"
        className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill={isHolding ? "rgba(239, 68, 68, 0.14)" : "transparent"}
          stroke={isHolding ? "rgba(239, 68, 68, 0.25)" : "transparent"}
          strokeWidth="2.5"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="var(--status-danger)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isHolding ? 0 : circumference}
          style={{
            transition: isHolding
              ? `stroke-dashoffset ${holdDurationMs}ms linear`
              : "stroke-dashoffset 120ms ease-out",
          }}
        />
      </svg>

      <Trash2 className="relative z-10 h-4 w-4" />
    </button>
  );
}
