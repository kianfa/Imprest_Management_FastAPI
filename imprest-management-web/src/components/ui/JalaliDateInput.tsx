"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  formatJalali,
  getJalaliDayOfWeek,
  getTodayJalali,
  jalaaliMonthLength,
  parseJalali,
  PERSIAN_MONTHS_EN,
  PERSIAN_MONTHS_FA,
  WEEKDAYS_EN,
  WEEKDAYS_FA,
} from "@/lib/jalali";

interface JalaliDateInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function JalaliDateInput({
  id,
  value,
  onChange,
  placeholder = "1403/08/03",
  required = false,
  className = "",
}: JalaliDateInputProps) {
  const { lang } = useApp();
  const popoverId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const today = getTodayJalali();
  const parsed = parseJalali(value);

  const [viewYear, setViewYear] = useState(parsed?.jy ?? today.jy);
  const [viewMonth, setViewMonth] = useState(parsed?.jm ?? today.jm);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    const p = parseJalali(value);
    if (p) {
      setViewYear(p.jy);
      setViewMonth(p.jm);
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const popWidth = 288; // w-72
    const popHeight = 320;

    // Flip above if not enough room below
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < popHeight && rect.top > popHeight
        ? Math.max(8, rect.top - popHeight - 6)
        : Math.min(window.innerHeight - popHeight - 8, rect.bottom + 6);

    // Align to right edge of input in RTL, left edge in LTR, clamped inside viewport
    const rawLeft = lang === "fa" ? rect.right - popWidth : rect.left;
    const left = Math.max(8, Math.min(window.innerWidth - popWidth - 8, rawLeft));

    setCoords({ top, left });
  }, [lang]);

  const openCalendar = () => {
    updatePosition();
    try {
      popoverRef.current?.showPopover?.();
    } catch {
      // Ignore if already open
    }
  };

  useEffect(() => {
    const pop = popoverRef.current;
    if (!pop) return;
    const onToggle = (e: Event) => {
      const toggleEvent = e as ToggleEvent;
      if (toggleEvent.newState === "open") {
        updatePosition();
      }
    };
    pop.addEventListener("toggle", onToggle);
    return () => pop.removeEventListener("toggle", onToggle);
  }, [updatePosition]);

  const months = lang === "fa" ? PERSIAN_MONTHS_FA : PERSIAN_MONTHS_EN;
  const weekdays = lang === "fa" ? WEEKDAYS_FA : WEEKDAYS_EN;

  const daysInMonth = jalaaliMonthLength(viewYear, viewMonth);
  const firstDayOffset = getJalaliDayOfWeek(viewYear, viewMonth, 1);

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDay = (day: number) => {
    onChange(formatJalali(viewYear, viewMonth, day));
    popoverRef.current?.hidePopover?.();
  };

  const selectToday = () => {
    const t = getTodayJalali();
    setViewYear(t.jy);
    setViewMonth(t.jm);
    onChange(formatJalali(t.jy, t.jm, t.jd));
    popoverRef.current?.hidePopover?.();
  };

  return (
    <div ref={wrapperRef} className="relative flex w-full items-center">
      {/* Keep className first, then enforce !pl-3 !pr-10 with icon fixed at right-0 so LTR date text never overlaps icon */}
      <input
        id={id}
        type="text"
        dir="ltr"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={openCalendar}
        onClick={openCalendar}
        className={`tabular-nums ${className} !pl-3 !pr-10 text-left`}
      />

      <button
        type="button"
        popoverTarget={popoverId}
        onClick={updatePosition}
        aria-label={lang === "fa" ? "انتخاب تاریخ شمسی" : "Open Jalali calendar"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
      >
        <Calendar className="h-4 w-4" />
      </button>

      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        style={{
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          right: "auto",
          bottom: "auto",
          margin: 0,
        }}
        className="fixed w-72 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 text-[var(--text-primary)] shadow-2xl"
      >
        {/* Header: Month & Year Navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <ChevronRight className="h-4 w-4 ltr:rotate-180" />
          </button>

          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <span>{months[viewMonth - 1]}</span>
            <span className="tabular-nums text-[var(--accent-primary)]">{viewYear}</span>
          </div>

          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft className="h-4 w-4 ltr:rotate-180" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="mb-1.5 grid grid-cols-7 text-center text-[11px] font-medium text-[var(--text-muted)]">
          {weekdays.map((wd) => (
            <div key={wd} className="py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDayOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const isSelected =
              parsed?.jy === viewYear && parsed?.jm === viewMonth && parsed?.jd === day;
            const isToday =
              today.jy === viewYear && today.jm === viewMonth && today.jd === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDay(day)}
                className={`tabular-nums flex h-8 w-full items-center justify-center rounded-lg font-medium transition ${
                  isSelected
                    ? "bg-[var(--accent-primary)] font-bold text-white shadow-sm"
                    : isToday
                    ? "border border-[var(--accent-primary)] text-[var(--accent-primary)]"
                    : "hover:bg-[var(--bg-elevated)]"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Footer: Today shortcut */}
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2.5">
          <button
            type="button"
            onClick={selectToday}
            className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
          >
            {lang === "fa" ? "امروز" : "Today"} ({formatJalali(today.jy, today.jm, today.jd)})
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                popoverRef.current?.hidePopover?.();
              }}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--status-danger)]"
            >
              {lang === "fa" ? "پاک کردن" : "Clear"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
