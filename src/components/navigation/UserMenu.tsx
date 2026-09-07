"use client";

import Link from "next/link";
import React, { useRef, useState } from "react";
import { IoLogOutSharp } from "react-icons/io5";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";
import { RiUserSettingsFill } from "react-icons/ri";
import { useOutsideClick } from "../../hooks/useOutsideClick";

interface UserMenuProps {
  displayName: string;
  onLogOut: () => void;
  className?: string;
}

export function UserMenu({ displayName, onLogOut, className = "" }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null!);

  useOutsideClick(menuRef, () => setOpen(false));

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={menuRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center justify-between gap-2 w-48 px-3 py-1.5 rounded-xl border-2 border-transparent bg-white bg-opacity-10 hover:bg-opacity-15 hover:border-white hover:border-opacity-70 transition duration-150"
      >
        <span className="text-sm font-medium select-none truncate">
          {displayName}
        </span>
        {open ? <IoMdArrowDropup size={18} /> : <IoMdArrowDropdown size={18} />}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] w-48 rounded-xl border border-white border-opacity-10 bg-teal-950 shadow-lg overflow-hidden text-sm animate-user-menu"
        >
          <Link
            href="/config"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-white hover:bg-opacity-10 transition duration-150"
          >
            <RiUserSettingsFill size={14} />
            Configuración
          </Link>
          <div className="h-px bg-white bg-opacity-10" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white hover:bg-opacity-10 transition duration-150"
          >
            <IoLogOutSharp size={14} />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
