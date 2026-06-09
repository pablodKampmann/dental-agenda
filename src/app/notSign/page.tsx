"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RingLoader } from "react-spinners";
import { BiSolidLogInCircle } from "react-icons/bi";
import { signIn } from "./../../services/auth/signIn";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { XCircle } from "lucide-react";

export default function NotSing() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [load, setLoad] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<"user" | "password" | "">("");

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const isSubmitting = useRef(false);

  async function handleSignIn() {
    if (isSubmitting.current) return;
    if (!userName.trim() || !password) return;

    isSubmitting.current = true;
    setLoad(true);
    setError("");
    setFieldError("");

    try {
      const result = await signIn(userName.trim(), password);

      if (result === "all-good") {
        router.push("/");
        return;
      }

      if (result === "wrong-userName") {
        setFieldError("user");
        setError("El usuario proporcionado es incorrecto.");
      } else if (result === "wrong-password") {
        setFieldError("password");
        setError("La clave proporcionada no coincide con el usuario.");
        setTimeout(() => passwordInputRef.current?.focus(), 50);
      } else if (result === "network-error") {
        setFieldError("");
        setError("Asegurate de contar con una conexión a Internet.");
      } else {
        setError("Ocurrió un error inesperado. Intentá de nuevo.");
      }
    } finally {
      setLoad(false);
      isSubmitting.current = false;
    }

    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setError("");
      setFieldError("");
    }, 5000);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSignIn();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-r from-teal-500 via-emerald-700 to-emerald-900">

      {/* Alert — top-right, slide from right */}
      {error && (
        <div className="fixed top-4 right-4 z-[200] flex items-center gap-3 bg-white border border-gray-200 border-l-4 border-l-red-500 rounded-xl shadow-xl px-4 py-3 min-w-[280px] max-w-[400px] animate-messagge-from-right">
          <XCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-gray-800 select-none">{error}</p>
        </div>
      )}

      <div className="relative max-w-lg w-full p-8">
        <h1 className="flex justify-center text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-teal-100 to-white select-none">
          Admin Panel
        </h1>
        <h1 className="flex justify-center mb-16 text-md font-extralight select-none">
          Consultorio Odontológico Dra. Karina Alvarez
        </h1>
        <div className="mb-16 rounded-lg bg-teal-900 shadow-2xl transition duration-500 h-80">
          <div className="p-6">
            <h1 className="flex mb-4 text-2xl font-medium select-none">
              <span>Iniciar</span>
              <span className="text-teal-500 ml-2">Sesion</span>
              <BiSolidLogInCircle size={40} className="text-teal-500 ml-2" />
            </h1>

            <div>
              <label htmlFor="user" className="mb-1 text-sm font-medium select-none">
                Usuario
              </label>
              <input
                autoFocus
                onKeyDown={handleKeyDown}
                disabled={load}
                type="text"
                name="user"
                id="user"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={`${load ? "bg-teal-600 text-white" : "bg-gray-50 text-black"} ${fieldError === "user" ? "border-red-500 bg-red-300" : "border-teal-600"} border-2 text-sm focus:outline-none focus:border-teal-400 rounded-lg w-full p-2 font-semibold transition duration-300`}
                placeholder="nombre.apellido"
                required
              />
            </div>
            <div className="mt-4">
              <label htmlFor="password" className="mb-1 text-sm font-medium select-none">
                Clave
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  onKeyDown={handleKeyDown}
                  disabled={load}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••••••••"
                  className={`${load ? "bg-teal-600 text-white" : "bg-gray-50 text-black"} ${fieldError === "password" ? "border-red-500 bg-red-300" : "border-teal-600"} border-2 pr-10 text-sm focus:outline-none focus:border-teal-400 rounded-lg w-full p-2 font-semibold transition duration-300`}
                  required
                />
                {password && (
                  showPassword ? (
                    <MdVisibility
                      onClick={() => setShowPassword(false)}
                      size={24}
                      className="absolute inset-y-0 right-0 mr-2 mt-2 text-teal-900 cursor-pointer transform hover:scale-110 transition duration-150"
                    />
                  ) : (
                    <MdVisibilityOff
                      onClick={() => setShowPassword(true)}
                      size={24}
                      className="absolute inset-y-0 right-0 mr-2 mt-2 text-teal-900 cursor-pointer transform hover:scale-110 transition duration-150"
                    />
                  )
                )}
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={handleSignIn}
                disabled={load}
                type="button"
                className={`${load ? "w-12 rounded-full scale-110 flex justify-center" : "scale-100 w-full rounded-lg"} mt-6 bg-teal-600 hover:bg-teal-500 focus:ring-4 focus:ring-teal-500 focus:outline-none font-medium text-md py-2 transition duration-500`}
              >
                {load ? (
                  <div className="flex justify-center">
                    <RingLoader color="white" size={30} />
                  </div>
                ) : (
                  <div className="select-none">Acceder</div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
