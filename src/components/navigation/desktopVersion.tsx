import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { FaUsers, FaTooth } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { IoLogoWhatsapp } from "react-icons/io";
import { MdNotificationsNone, MdBarChart, MdMedicalServices } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { BsCalendar2WeekFill } from "react-icons/bs";
import { LogOut } from "lucide-react";
import { AvatarFallback } from "../shared/AvatarFallback";
import { UserMenu } from "./UserMenu";
import { SidebarCarousel } from "./SidebarCarousel";

interface props {
  openLogOutAlert: boolean;
  setOpenLogOutAlert: (value: boolean) => void;
}

const NAV_ITEMS = [
  { href: "/agenda", label: "Agenda", icon: BsCalendar2WeekFill, match: (p: string) => p === "/agenda" },
  { href: "/patients", label: "Pacientes", icon: FaUsers, match: (p: string) => p.includes("/patients") },
  { href: "/treatments", label: "Tratamientos", icon: MdMedicalServices, match: (p: string) => p === "/treatments" },
  { href: "/messenger", label: "Mensajería", icon: IoLogoWhatsapp, match: (p: string) => p === "/messenger" },
  { href: "/estadisticas", label: "Estadísticas", icon: MdBarChart, match: (p: string) => p === "/estadisticas" },
] as const;

export function DesktopVersion({ openLogOutAlert, setOpenLogOutAlert }: props) {
  const pathname = usePathname();
  const { user: data } = useAuth();

  return (
    <div>
      <div className="fixed top-0 h-14 left-0 z-50 w-full border-b-2 bg-teal-950 border-teal-700">
        <div className="flex h-full px-3 items-center justify-between">
          <div className="flex items-center select-none font-bold">
            <FaTooth size={22} />
            <span className="ml-2 text-lg">Admin</span>
            <span className="bg-teal-600 px-1.5 rounded-lg ml-1 text-sm">
              PANEL
            </span>
          </div>
          {data ? (
            <div className="flex items-center">
              <MdNotificationsNone
                size={32}
                className="mr-2 bg-white rounded-full bg-opacity-10 hover:bg-opacity-15 hover:border-opacity-70 border-2 border-transparent hover:border-white transition duration-150 cursor-pointer p-1"
              />
              <UserMenu
                displayName={data.displayName ?? ""}
                onLogOut={() => setOpenLogOutAlert(true)}
                className="mr-2"
              />
              <Link className="focus:outline-none" href={"/config"}>
                <AvatarFallback displayName={data.displayName} size={32} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-10" />
              <div className="w-48 h-7 rounded-xl bg-white bg-opacity-10 mr-2" />
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-10" />
            </div>
          )}
        </div>
      </div>

      <div
        className="fixed top-0 left-0 z-40 w-40 h-screen pt-14 transition-transform -translate-x-full border-r-2 border-teal-700 sm:translate-x-0 bg-teal-900"
        aria-label="Sidebar"
      >
        <div className="h-full pb-3 space-y-2 mx-2 pt-2 font-medium overflow-y-auto tracking-tight">
          {NAV_ITEMS.map(({ href, label, icon: Icon, match }, i) => (
            <React.Fragment key={href}>
              <Link
                href={href}
                prefetch={true}
                className={`${match(pathname) ? "bg-teal-950" : "bg-white bg-opacity-5 hover:bg-opacity-10"} flex items-center gap-2.5 border-2 border-transparent hover:border-white hover:border-opacity-70 text-left px-2.5 py-2 rounded-xl w-full text-sm transition duration-150`}
              >
                <Icon size={17} className="shrink-0" />
                <span className="select-none truncate">{label}</span>
              </Link>
              {i < NAV_ITEMS.length - 1 && (
                <hr className="border-teal-700 border rounded-full" />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="absolute bottom-0 w-full">
          <div className="mx-2 mb-2">
            <SidebarCarousel />
          </div>
          <hr className="border-teal-700 border mx-2 rounded-full mb-2" />
          <div className="flex mb-2 mx-2 gap-1.5">
            <button
              onClick={() => setOpenLogOutAlert(!openLogOutAlert)}
              className="bg-white px-1 py-1.5 bg-opacity-5 hover:bg-opacity-10 flex items-center justify-center gap-1 text-nowrap text-[10px] font-medium border-2 border-transparent hover:border-white border-opacity-20 rounded-xl flex-1 min-w-0 transition duration-150"
            >
              <LogOut size={14} className="shrink-0" />
              Cerrar Sesión
            </button>
            <Link
              href="/config"
              prefetch={true}
              className={`${pathname === "/config" ? "bg-teal-950" : "bg-white bg-opacity-5 hover:bg-opacity-10"} flex px-1.5 py-1.5 border-2 border-transparent hover:border-white border-opacity-20 items-center justify-center rounded-xl shrink-0 transition duration-150`}
            >
              <IoSettingsOutline size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
