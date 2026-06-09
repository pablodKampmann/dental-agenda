"use client";

import { Loading } from "@/components/shared/loading";
import { useAuth } from "@/context/AuthContext";
import { MdBarChart } from "react-icons/md";
import { PiHourglassMediumFill } from "react-icons/pi";

export default function Page() {
  const { loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <div className="h-[calc(100vh-68px)] flex items-center justify-center select-none">
      <div className="flex flex-col items-center gap-6 text-center px-8 max-w-md animate-page-drop">

        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center shadow-md">
            <MdBarChart size={48} className="text-teal-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center shadow-sm">
            <PiHourglassMediumFill size={16} className="text-amber-500 animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Estadísticas
          </h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-700 text-xs font-semibold uppercase tracking-wider mx-auto">
            <PiHourglassMediumFill size={12} className="animate-pulse" />
            En desarrollo
          </span>
        </div>

        <div className="w-full flex flex-col gap-2 text-left">
          {[
            "Gráficos de turnos por semana y mes",
            "Pacientes nuevos vs. recurrentes",
            "Ingresos por categoría de práctica",
          ].map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 text-sm"
            >
              <div className="w-2 h-2 rounded-full bg-teal-300 shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
