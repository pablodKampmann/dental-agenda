"use client";

import { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface MiniCalendarProps {
  value: Dayjs | null;
  onChange: (date: Dayjs) => void;
  compact?: boolean;
}

export function MiniCalendar({ value, onChange, compact = false }: MiniCalendarProps) {
  const todayDayjs = dayjs();
  const [viewMonth, setViewMonth] = useState(value ?? todayDayjs);
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    if (value) setViewMonth(value);
  }, [value]);

  const startOfMonth = viewMonth.startOf("month");
  const daysInMonth = viewMonth.daysInMonth();
  const startDow = startOfMonth.day();
  const blanks = startDow === 0 ? 6 : startDow - 1;

  const cells: (Dayjs | null)[] = [
    ...Array(blanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => startOfMonth.date(i + 1)),
  ];

  const cellBase = cn(
    "w-full flex items-center justify-center rounded-md font-medium transition-colors duration-100 cursor-pointer",
    compact ? "text-xs py-1" : "text-sm py-1.5"
  );

  if (showYearPicker) {
    const currentYear = viewMonth.year();
    const years = Array.from({ length: 16 }, (_, i) => currentYear - 4 + i);
    return (
      <div className={cn("select-none w-full", compact ? "p-1.5" : "p-3")}>
        <div className="flex items-center justify-between mb-2 bg-white border border-gray-200 rounded-lg px-1 py-0.5">
          <button
            onClick={() => setShowYearPicker(false)}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-teal-50 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
            </svg>
            {MONTHS[viewMonth.month()]} {currentYear}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => {
                setViewMonth(viewMonth.year(year));
                setShowYearPicker(false);
              }}
              className={cn(
                "text-xs py-1.5 rounded-md font-medium transition-colors",
                year === currentYear
                  ? "bg-teal-600 text-white shadow-sm"
                  : "hover:bg-teal-50 text-gray-700 hover:text-teal-700"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("select-none w-full", compact ? "p-2" : "p-3")}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2 bg-white border border-gray-200 rounded-lg px-1 py-0.5">
        <button
          onClick={() => setViewMonth(viewMonth.subtract(1, "month"))}
          className="p-1.5 rounded-md hover:bg-teal-50 text-gray-500 hover:text-teal-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
          </svg>
        </button>
        <button
          onClick={() => setShowYearPicker(true)}
          className="text-sm font-semibold capitalize text-gray-800 hover:text-teal-600 transition-colors px-2 py-0.5 rounded-md hover:bg-teal-50"
        >
          {MONTHS[viewMonth.month()]} {viewMonth.year()}
        </button>
        <button
          onClick={() => setViewMonth(viewMonth.add(1, "month"))}
          className="p-1.5 rounded-md hover:bg-teal-50 text-gray-500 hover:text-teal-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} />;
          const isSelected = value?.isSame(day, "day");
          const isToday = day.isSame(todayDayjs, "day");
          return (
            <button
              key={i}
              onClick={() => onChange(day)}
              className={cn(
                cellBase,
                isSelected
                  ? "bg-teal-600 text-white shadow-sm"
                  : isToday
                  ? "border-2 border-teal-500 text-teal-600 hover:bg-teal-50"
                  : "text-gray-700 hover:bg-teal-50 hover:text-teal-700"
              )}
            >
              {day.date()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
