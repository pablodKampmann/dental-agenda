"use client";

import React, { useEffect, useRef, useState } from "react";
import { BsCalendar2WeekFill } from "react-icons/bs";
import { MdCake, MdPersonAdd, MdBarChart } from "react-icons/md";
import {
  getSidebarCarouselData,
  type SidebarCarouselData,
} from "@/services/navigation/getSidebarCarouselData";
import { SIDEBAR_CAROUSEL_REFRESH_EVENT } from "@/services/navigation/sidebarCarouselEvents";

const NUM_SLIDES = 4;
const CAROUSEL_INTERVAL = 9000;
const SWIPE_THRESHOLD = 40;
const TRACK_TRANSITION = "transform 220ms ease";

function SlideLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-white/40">
      {icon}
      <span className="text-[9px] font-semibold uppercase tracking-[0.13em]">{text}</span>
    </div>
  );
}

function EmptySlideBody({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-1.5 text-center">
      {icon}
      <span className="text-[11px] text-white/40">{text}</span>
    </div>
  );
}

function LoadingSlide() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      <div className="h-2 w-16 rounded bg-white/10" />
      <div className="h-6 w-10 rounded bg-white/10" />
      <div className="h-2 w-24 rounded bg-white/10" />
    </div>
  );
}

function ErrorSlide() {
  return (
    <div className="flex items-center justify-center text-center">
      <span className="text-[11px] text-white/40">No se pudo cargar</span>
    </div>
  );
}

function TurnosHoySlide({ today }: { today: SidebarCarouselData["today"] }) {
  if (today.count === 0) {
    return (
      <EmptySlideBody
        icon={<BsCalendar2WeekFill size={18} className="text-white/30" />}
        text="Sin turnos para hoy"
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <SlideLabel icon={<BsCalendar2WeekFill size={12} />} text="Hoy" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-white leading-none">{today.count}</span>
        <span className="text-xs text-white/60">{today.count === 1 ? "turno" : "turnos"}</span>
      </div>
      {today.upcoming.length > 0 ? (
        <div className="flex flex-col gap-1 pt-1.5 border-t border-white/10">
          {today.upcoming.slice(0, 3).map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-xs text-white/70 truncate">{a.name}</span>
              <span className="text-[11px] font-semibold text-teal-300 shrink-0">{a.time}</span>
            </div>
          ))}
          {today.upcoming.length > 3 && (
            <span className="text-[10px] text-white/40">+{today.upcoming.length - 3} más</span>
          )}
        </div>
      ) : (
        <span className="text-[11px] text-white/40 pt-1.5 border-t border-white/10">
          Ya pasaron todos los turnos de hoy
        </span>
      )}
    </div>
  );
}

function CumpleañosSlide({ birthdays }: { birthdays: SidebarCarouselData["birthdaysThisWeek"] }) {
  if (birthdays.length === 0) {
    return (
      <EmptySlideBody
        icon={<MdCake size={18} className="text-white/30" />}
        text="Sin cumpleaños esta semana"
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <SlideLabel icon={<MdCake size={13} />} text="Cumpleaños" />
      <div className="flex flex-col gap-1.5">
        {birthdays.slice(0, 3).map((b, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="text-xs text-white/80 truncate">{b.name}</span>
            <span className="text-[11px] font-semibold text-teal-300 shrink-0">{b.date}</span>
          </div>
        ))}
        {birthdays.length > 3 && (
          <span className="text-[10px] text-white/40">+{birthdays.length - 3} más</span>
        )}
      </div>
    </div>
  );
}

function NuevosPacientesSlide({ newPatients }: { newPatients: SidebarCarouselData["newPatients"] }) {
  return (
    <div className="flex flex-col gap-2">
      <SlideLabel icon={<MdPersonAdd size={13} />} text="Pacientes nuevos" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-white leading-none">{newPatients.count}</span>
        <span className="text-xs text-white/60">este mes</span>
      </div>
      {newPatients.count > 0 ? (
        <div className="flex flex-col gap-1 pt-1.5 border-t border-white/10">
          {newPatients.names.slice(0, 3).map((name, i) => (
            <span key={i} className="text-xs text-white/70 truncate">
              {name}
            </span>
          ))}
          {newPatients.names.length > 3 && (
            <span className="text-[10px] text-white/40">+{newPatients.names.length - 3} más</span>
          )}
        </div>
      ) : (
        <span className="text-[11px] text-white/40">Todavía no se sumó ninguno</span>
      )}
    </div>
  );
}

function CargaSemanalSlide({ week }: { week: SidebarCarouselData["week"] }) {
  const maxCount = Math.max(1, ...week.days.map((d) => d.count));
  return (
    <div className="flex flex-col gap-2">
      <SlideLabel icon={<MdBarChart size={13} />} text="Carga semanal" />
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-white leading-none">{week.total}</span>
        <span className="text-xs text-white/60">{week.total === 1 ? "turno" : "turnos"}</span>
      </div>
      <span className="text-[10px] text-white/40 -mt-1">{week.rangeLabel}</span>
      {week.total === 0 ? (
        <span className="text-[11px] text-white/40">Semana libre por ahora</span>
      ) : (
        <div className="flex items-end justify-between gap-1 pt-1">
          {week.days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-full rounded-sm transition-all duration-300 ${
                  d.isToday ? "bg-teal-300" : "bg-white bg-opacity-20"
                }`}
                style={{ height: `${Math.max(3, (d.count / maxCount) * 20)}px` }}
              />
              <span
                className={`text-[8px] leading-none ${
                  d.isToday ? "text-teal-300 font-semibold" : "text-white/30"
                }`}
              >
                {d.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderSlide(index: number, data: SidebarCarouselData) {
  switch (index) {
    case 0:
      return <TurnosHoySlide today={data.today} />;
    case 1:
      return <CumpleañosSlide birthdays={data.birthdaysThisWeek} />;
    case 2:
      return <NuevosPacientesSlide newPatients={data.newPatients} />;
    case 3:
      return <CargaSemanalSlide week={data.week} />;
    default:
      return null;
  }
}

export function SidebarCarousel() {
  const [data, setData] = useState<SidebarCarouselData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    async function load(showLoading: boolean) {
      if (showLoading) setStatus("loading");
      const result = await getSidebarCarouselData();
      if (!active) return;
      if (result) {
        setData(result);
        setStatus("ready");
      } else if (showLoading) {
        // Un refresh silencioso que falla mantiene los datos previos en
        // pantalla en vez de tapar una tarjeta ya cargada con un error.
        setStatus("error");
      }
    }

    load(true);

    function handleRefresh() {
      load(false);
    }

    window.addEventListener(SIDEBAR_CAROUSEL_REFRESH_EVENT, handleRefresh);
    return () => {
      active = false;
      window.removeEventListener(SIDEBAR_CAROUSEL_REFRESH_EVENT, handleRefresh);
    };
  }, []);

  // Slider real: los 4 slides van en fila dentro de un track, y lo único que
  // se anima es su transform. No hay swap de contenido ni setTimeout — soltar
  // el drag solo cambia `slide`, y la misma transición interpola desde donde
  // quedó el dedo hasta la posición final, sin saltos.
  const [slide, setSlide] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function pauseAutoAdvance() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function resumeAutoAdvance() {
    pauseAutoAdvance();
    intervalRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % NUM_SLIDES);
    }, CAROUSEL_INTERVAL);
  }

  useEffect(() => {
    if (status !== "ready") return;
    resumeAutoAdvance();
    return pauseAutoAdvance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragStartX = useRef<number | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    if (status !== "ready") return;
    dragStartX.current = e.clientX;
    setDragging(true);
    pauseAutoAdvance();
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    setDragX(e.clientX - dragStartX.current);
  }

  function releaseDrag(delta: number) {
    dragStartX.current = null;
    setDragging(false);
    setDragX(0);
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      const dir = delta < 0 ? 1 : -1; // arrastrar a la izquierda = siguiente
      setSlide((s) => (s + dir + NUM_SLIDES) % NUM_SLIDES);
    }
    resumeAutoAdvance();
  }

  function handlePointerUp() {
    releaseDrag(dragX);
  }

  function handlePointerCancel() {
    releaseDrag(0);
  }

  function goToSlide(i: number) {
    setSlide(i);
    resumeAutoAdvance();
  }

  // Alto animado: cada slide mide lo que su propio contenido necesita (nunca
  // el más alto de los 4), y también se anima al pasar de loading/error a
  // contenido real -- todo mide contra el mismo `outerRef`, solo cambia qué
  // nodo se toma como referencia según `status`/`slide`.
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const nonReadyRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const el = status === "ready" ? slideRefs.current[slide] : nonReadyRef.current;
    if (!outer || !el) return;
    const setHeight = () => {
      outer.style.height = `${el.scrollHeight}px`;
    };
    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [status, slide]);

  const trackOffset = `calc(${-slide * (100 / NUM_SLIDES)}% + ${dragX}px)`;

  return (
    <div className="rounded-xl border border-white border-opacity-10 bg-white bg-opacity-5 overflow-hidden animate-carousel-reveal">
      <div ref={outerRef} style={{ overflow: "hidden", transition: "height 220ms ease" }}>
        {status === "ready" && data ? (
          <div
            className="flex items-start"
            style={{
              width: `${NUM_SLIDES * 100}%`,
              transform: `translateX(${trackOffset})`,
              transition: dragging ? "none" : TRACK_TRANSITION,
              cursor: dragging ? "grabbing" : "grab",
              touchAction: "pan-y",
              userSelect: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            {Array.from({ length: NUM_SLIDES }, (_, i) => (
              <div
                key={i}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                className="px-3 py-2.5 shrink-0"
                style={{ width: `${100 / NUM_SLIDES}%` }}
              >
                {renderSlide(i, data)}
              </div>
            ))}
          </div>
        ) : (
          <div ref={nonReadyRef} className="px-3 py-2.5">
            {status === "loading" && <LoadingSlide />}
            {status === "error" && <ErrorSlide />}
          </div>
        )}
      </div>

      {status === "ready" && (
        <div className="flex items-center justify-center gap-1.5 pb-2.5">
          {Array.from({ length: NUM_SLIDES }, (_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                slide === i ? "w-3.5 bg-teal-300" : "w-1.5 bg-white bg-opacity-25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
