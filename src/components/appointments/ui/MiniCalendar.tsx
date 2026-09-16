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
  /** Ocupa el 100% del alto del contenedor y reparte las filas de días en fracciones
   * flexibles (1fr), en vez de un alto intrínseco fijo por padding. Para usar dentro
   * de un contenedor con altura ya definida (ej. flex-1 de un layout), nunca en un
   * popover flotante sin altura propia. */
  fill?: boolean;
}

export function MiniCalendar({ value, onChange, compact = false, fill = false }: MiniCalendarProps) {
  const todayDayjs = dayjs();
  // `value` puede llegar como un Dayjs "Invalid Date" (ej. dayjs(undefined, 'DD/MM/YYYY') de
  // un paciente sin fecha de nacimiento cargada) en vez de null — es truthy igual, así que
  // el chequeo tiene que ser de validez, no de nullidad, o todo el cálculo de celdas da NaN.
  const validValue = value && value.isValid() ? value : null;
  const [viewMonth, setViewMonth] = useState(validValue ?? todayDayjs);
  const [showYearPicker, setShowYearPicker] = useState(false);

  useEffect(() => {
    if (validValue) setViewMonth(validValue);
  }, [validValue]);

  const startOfMonth = viewMonth.startOf("month");
  const daysInMonth = viewMonth.daysInMonth();
  const startDow = startOfMonth.day();
  const blanks = startDow === 0 ? 6 : startDow - 1;

  const TOTAL_CELLS = 42; // 6 filas fijas, para que el alto no cambie entre meses de 4/5/6 filas

  const prevMonthEnd = startOfMonth.subtract(1, "day");
  const leading = Array.from({ length: blanks }, (_, i) =>
    prevMonthEnd.date(prevMonthEnd.date() - blanks + 1 + i)
  );
  const current = Array.from({ length: daysInMonth }, (_, i) =>
    startOfMonth.date(i + 1)
  );
  const trailingCount = TOTAL_CELLS - leading.length - current.length;
  const nextMonthStart = startOfMonth.add(1, "month");
  const trailing = Array.from({ length: trailingCount }, (_, i) =>
    nextMonthStart.date(i + 1)
  );

  const cells = [...leading, ...current, ...trailing];

  const cellBase = cn(
    "w-full flex items-center justify-center rounded-md font-medium transition-colors duration-100 cursor-pointer",
    compact ? "text-xs" : "text-sm",
    fill ? "h-full" : compact ? "py-1" : "py-1.5"
  );

  if (showYearPicker) {
    const currentYear = viewMonth.year();
    const years = Array.from({ length: 16 }, (_, i) => currentYear - 4 + i);
    return (
      <div
        className={cn(
          "select-none w-full",
          compact ? "p-1.5" : "p-3",
          fill && "h-full flex flex-col"
        )}
      >
        <div className="shrink-0 flex items-center justify-between mb-2 bg-white border border-gray-200 rounded-lg px-1 py-0.5">
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
        <div
          className={cn(
            "grid grid-cols-4 gap-1",
            fill && "flex-1 min-h-0 grid-rows-4"
          )}
        >
          {years.map((year) => (
            <button
              key={year}
              onClick={() => {
                setViewMonth(viewMonth.year(year));
                setShowYearPicker(false);
              }}
              className={cn(
                "text-xs rounded-md font-medium transition-colors",
                fill ? "h-full" : "py-1.5",
                year === currentYear
                  ? "bg-teal-700 text-white shadow-sm"
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
    <div
      className={cn(
        "select-none w-full",
        compact ? "p-2" : "p-3",
        fill && "h-full flex flex-col"
      )}
    >
      {/* Month navigation */}
      <div className="shrink-0 flex items-center justify-between mb-2 bg-white border border-gray-200 rounded-lg px-1 py-0.5">
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
      <div className="shrink-0 grid grid-cols-7 mb-1">
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
      <div
        className={cn(
          "grid grid-cols-7",
          fill ? "flex-1 min-h-0 grid-rows-6 gap-0.5" : "gap-y-0.5"
        )}
      >
        {cells.map((day, i) => {
          const isOutsideMonth = !day.isSame(viewMonth, "month");
          const isSelected = value?.isSame(day, "day");
          const isToday = day.isSame(todayDayjs, "day");
          return (
            <button
              key={i}
              onClick={() => {
                onChange(day);
                if (isOutsideMonth) setViewMonth(day);
              }}
              className={cn(
                cellBase,
                isOutsideMonth
                  ? "text-gray-300 hover:bg-teal-50 hover:text-teal-400"
                  : isSelected
                  ? "bg-teal-700 text-white shadow-sm"
                  : isToday
                  ? "border-2 border-teal-600 text-teal-700 hover:bg-teal-50"
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
