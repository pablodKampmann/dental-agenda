"use client";

import { Loading } from "@/components/shared/loading";
import { useAuth } from "@/context/AuthContext";
import { MdBarChart } from "react-icons/md";

export default function Page() {
  const { loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <div className="h-screen flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400 select-none">
        <MdBarChart size={48} />
        <p className="text-lg font-semibold">Estadísticas — próximamente</p>
      </div>
    </div>
  );
}
