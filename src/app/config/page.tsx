"use client";

import * as React from "react";
import { AvatarFallback } from "../../components/shared/AvatarFallback";
import { useState, useEffect } from "react";
import { Loading } from "../../components/shared/loading";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUser } from "../../services/auth/getUser";
import { MdVisibilityOff } from "react-icons/md";
import { TbPencilCog } from "react-icons/tb";
import { getClinicData } from "../../services/config/getClinicData";
import { InsurancesConfig } from "../../components/config/insurancesConfig";
import { ScaleLoader } from "react-spinners";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import { setRowChanges } from "../../services/config/setRowChanges";
import { updateUserEmail } from "../../services/config/updateUserEmail";
import { RiErrorWarningLine } from "react-icons/ri";
import { updateUserName } from "../../services/config/updateUserName";
import { updateUserPassword } from "../../services/config/updateUserPassword";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { setClinicInfoChanges } from "../../services/config/setClinicInfoChanges";
import { setPro } from "../../services/config/setPro";
import { updatePro } from "../../services/config/updatePro";
import { deletePro } from "../../services/config/deletePro";
import { useAuth } from "../../context/AuthContext";

export default function Page() {
  const router = useRouter();
  const [userUid, setUserUid] = useState<string>("");
  const [isLoad, setIsLoad] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedField, setSelectedField] = useState<string>("profile");
  const [showUserName, setShowUserName] = useState(false);
  const [loadingGet, setLoadingGet] = useState(false);
  const [clinicInfo, setClinicInfo] = useState<any>(null);
  const [pros, setPros] = useState<null | any[]>(null);
  const [editRow, setEditRow] = useState<string>("");
  const [changes, setChanges] = useState<string | null>(null);
  const [openInputCredential, setOpenInputCredential] = useState(false);
  const [userCredential, setUserCredential] = useState<string>("");
  const [showAlert, setShowAlert] = useState<string>("");
  const [passwordStep, setPasswordStep] = useState<number>(0);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [scheduleChanges, setScheduleChanges] = useState<{
    initial: string;
    final: string;
  }>({ initial: "", final: "" });
  const { refreshUser } = useAuth();
  const [newPro, setNewPro] = useState<string>("");
  const [confirmDeletePro, setConfirmDeletePro] = useState<string | null>(null);

  //CHECK IF THE USER IS LOGGED IN && GET USER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserUid(user.uid);
        handleGetUser();
      } else if (!user) {
        router.push("/notSign");
      }
    });

    async function handleGetUser() {
      const user = await getUser(false);
      setUser(user);
      setIsLoad(false);
    }

    return () => unsubscribe();
  }, [router]);

  //FUNCTION TO SAVE EDITINGS IN CONFIG
  async function handleEditClinicRow(e: any, field: string, value: any) {
    e.stopPropagation();
    if (!value) {
      reset();
      return;
    }
    setLoadingGet(true);
    await setClinicInfoChanges(user.clinicId, field, value);
    const result = await getClinicData(user.clinicId, "info");
    if (result) setClinicInfo(result);
    reset();
  }

  //FUNCTIONS GETS

  async function handleGetClinicConfig() {
    setSelectedField("clinicConfig");
    if (!clinicInfo) {
      setLoadingGet(true);
      const result = await getClinicData(user.clinicId, "info");

      if (result !== null) {
        result.initialSchedule =
          typeof result.initialSchedule === "object"
            ? (result.initialSchedule?.final ?? "")
            : (result.initialSchedule ?? "");

        setClinicInfo(result);
        setLoadingGet(false);
      }
    }
  }

  async function handleGetPros() {
    setSelectedField("pros");
    if (!pros) {
      setLoadingGet(true);
      const result = await getClinicData(user.clinicId, "pros");
      if (result !== null) {
        setPros(result);
        setLoadingGet(false);
      }
    }
  }

  //FUNCTIONS EDIT ROW

  function reset() {
    setEditRow("");
    setLoadingGet(false);
    setChanges(null);
    setPasswordStep(0);
    setPasswordInput("");
    setCurrentPassword("");
    setNewPassword("");
    if (openInputCredential) setOpenInputCredential(false);
  }

  async function handleEditRow(e: any, table: string, changes: any) {
    e.stopPropagation();
    reset();

    if (changes !== null) {
      setLoadingGet(true);
      let result;
      switch (table) {
        case "displayName":
          result = await setRowChanges(table, changes, userUid);
          if (result !== null) {
            const user = await getUser(false);
            setUser(user);
          }
          break;
        case "language":
          result = await setRowChanges(table, changes, userUid);
          if (result !== null) {
            await refreshUser();
          }
          break;
        default:
          break;
      }
    }

    reset();
  }

  function handleCancelEditRow(e: any) {
    e.stopPropagation();
    reset();
  }

  function handleKeyPress(e: any, table: string, changes: any) {
    if (e.key === "Escape") {
      reset();
    } else if (e.key === "Enter" && changes !== null) {
      if (table === "email") {
        if (openInputCredential === true) {
          handleChangeEmail(e, table, changes);
        } else {
          setOpenInputCredential(true);
        }
      } else {
        handleEditRow(e, table, changes);
      }
    }
  }

  //FUNCTIONS CHANGE EMAIL

  async function handleChangeEmail(e: any, table: string, changes: any) {
    e.stopPropagation();
    reset();

    if (changes !== null) {
      setLoadingGet(true);
      const result = (await updateUserEmail(
        table,
        changes,
        userUid,
        userCredential,
      )) as { message: string };
      if (result) {
        if (result.message === "Firebase: Error (auth/wrong-password).") {
          setShowAlert("wrong-password");
        } else if (result.message === "Firebase: Error (auth/invalid-email).") {
          setShowAlert("invalid-email");
        }
      } else {
        const user = await getUser(false);
        setUser(user);
      }
    }

    reset();
  }

  async function handleChangeUserName(e: any) {
    e.stopPropagation();

    if (!changes || changes.trim() === "") return;
    if (changes.includes(" ")) {
      setShowAlert("userName-spaces");
      reset();
      return;
    }

    setLoadingGet(true);
    const result = await updateUserName(changes.trim(), userUid);

    if (result === "ok") {
      const updatedUser = await getUser(false);
      setUser(updatedUser);
    } else if (result === "already-in-use") {
      setShowAlert("userName-in-use");
    } else {
      setShowAlert("userName-error");
    }

    reset();
  }

  async function handlePasswordStep(e: any) {
    e.stopPropagation();

    if (passwordStep === 1) {
      if (!passwordInput) return;
      setLoadingGet(true);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        try {
          const credential = EmailAuthProvider.credential(
            currentUser.email,
            passwordInput,
          );
          await reauthenticateWithCredential(currentUser, credential);
          setCurrentPassword(passwordInput);
          setPasswordInput("");
          setPasswordStep(2);
        } catch (error: any) {
          setShowAlert("wrong-password");
        }
      }
      setLoadingGet(false);
    } else if (passwordStep === 2) {
      if (passwordInput.length < 6) {
        setShowAlert("password-too-short");
        return;
      }
      setNewPassword(passwordInput);
      setPasswordInput("");
      setPasswordStep(3);
    } else if (passwordStep === 3) {
      if (passwordInput !== newPassword) {
        setShowAlert("password-mismatch");
        setPasswordInput("");
        return;
      }
      setLoadingGet(true);
      const result = await updateUserPassword(newPassword, currentPassword);
      if (result === "wrong-password") {
        setShowAlert("wrong-password");
      }
      reset();
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowAlert("");
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, [showAlert]);

  useEffect(() => {
    if (openInputCredential) {
      setOpenInputCredential(false);
    }
  }, [editRow]);

  return (
    <div className="h-screen flex flex-col overflow-hidden flex-1">
      {isLoad ? (
        <Loading />
      ) : (
        <>
          <div className="bg-white w-full relative text-black flex-shrink-0">
            {loadingGet ? (
              <h1 className="bg-gradient-to-r from-teal-900 via-teal-700 to-teal-300 flex  items-center select-none py-6 text-3xl tracking-wide  pl-56 text-white font-bold  ">
                <span className="bg-teal-300 shadow-lg bg-opacity-35 rounded-xl px-3 py-1">
                  {user.displayName}
                </span>{" "}
                <ScaleLoader
                  margin={3}
                  className="ml-4"
                  color="white"
                  width={2}
                  height={26}
                  speedMultiplier={1.4}
                />
              </h1>
            ) : (
              <h1
                onClick={() => setShowAlert("wrong-password")}
                className="bg-gradient-to-r font-bold from-teal-900 via-teal-700 to-teal-300 flex  items-center select-none py-6 text-3xl tracking-wide  pl-56 text-white  "
              >
                {" "}
                <span className="bg-teal-300 shadow-lg bg-opacity-35 rounded-xl px-3 py-1">
                  {user.displayName}
                </span>
              </h1>
            )}
            <div className="pl-52 bg-emerald-400 bg-opacity-20 text-black transition select-none">
              <button
                onClick={() => setSelectedField("profile")}
                className={`${selectedField === "profile" ? " bg-white  duration-300" : " hover:text-black hover:text-opacity-50"} mx-4  py-1 px-4 uppercase`}
              >
                Perfil
              </button>
              <button
                onClick={handleGetPros}
                className={`${selectedField === "pros" ? "bg-white   duration-300" : "hover:text-black hover:text-opacity-50"} mx-4 py-1 px-4 uppercase`}
              >
                Profesionales
              </button>
              <button
                onClick={handleGetClinicConfig}
                className={`${selectedField === "clinicConfig" ? "bg-white   duration-300" : "hover:text-black hover:text-opacity-50"} mx-4 py-1 px-4 uppercase`}
              >
                Configuración del Consultorio
              </button>
              <button
                onClick={() => setSelectedField("insurances")}
                className={`${selectedField === "insurances" ? "bg-white duration-300" : "hover:text-black hover:text-opacity-50"} mx-4 py-1 px-4 uppercase`}
              >
                Obras Sociales
              </button>
              <button
                onClick={() => setSelectedField("stats")}
                className={`${selectedField === "stats" ? "bg-white   duration-300" : "hover:text-black hover:text-opacity-50"} mx-4 py-1 px-4 uppercase`}
              >
                Estadísticas
              </button>
            </div>
            <div className="rounded-full absolute top-8 left-8 mb-8">
              <AvatarFallback
                displayName={user.displayName}
                size={160}
                className="rounded-full border-4 w-[160px] h-[160px] border-white shadow-2xl select-none"
              />
            </div>
          </div>
          <div className="ml-56 text-black pt-4 overflow-y-auto flex-1 pb-16 config-scroll">
            {selectedField === "profile" && (
              <div className="max-w-lg">
                <h1 className="text-base font-bold tracking-wide mb-3">
                  Básico:
                </h1>
                <div className="flex flex-col gap-2 mb-4">
                  {/* Nombre visible */}
                  <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      {editRow === "displayName" ? (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            Nombre visible:
                          </span>
                          <input
                            autoFocus
                            defaultValue={user.displayName}
                            onChange={(e) => setChanges(e.target.value)}
                            onKeyDown={(e: any) =>
                              handleKeyPress(e, "displayName", changes)
                            }
                            className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                          />
                          <FaCircleXmark
                            onClick={(e: any) => handleCancelEditRow(e)}
                            className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                          />
                          <FaCircleCheck
                            onClick={(e: any) =>
                              handleEditRow(e, "displayName", changes)
                            }
                            className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Nombre visible:
                            </span>
                            <span className="text-sm font-semibold text-black">
                              {user.displayName}
                            </span>
                          </div>
                          <button
                            onClick={() => setEditRow("displayName")}
                            className="text-gray-400 hover:text-teal-700 transition duration-150"
                          >
                            <TbPencilCog size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Email */}
                  <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      {editRow === "email" ? (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            {openInputCredential
                              ? "Contraseña actual:"
                              : "Email:"}
                          </span>
                          {openInputCredential ? (
                            <input
                              autoFocus
                              type="password"
                              placeholder="Confirmá con tu contraseña"
                              onChange={(e) =>
                                setUserCredential(e.target.value)
                              }
                              onKeyDown={(e: any) =>
                                handleKeyPress(e, "email", changes)
                              }
                              className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                            />
                          ) : (
                            <input
                              autoFocus
                              defaultValue={user.email}
                              onChange={(e) => setChanges(e.target.value)}
                              onKeyDown={(e: any) =>
                                handleKeyPress(e, "email", changes)
                              }
                              className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                            />
                          )}
                          <FaCircleXmark
                            onClick={(e: any) => {
                              handleCancelEditRow(e);
                              setOpenInputCredential(false);
                            }}
                            className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                          />
                          <FaCircleCheck
                            onClick={(e: any) => {
                              if (openInputCredential) {
                                handleChangeEmail(e, "email", changes);
                              } else if (changes !== null) {
                                setOpenInputCredential(true);
                              } else {
                                handleCancelEditRow(e);
                              }
                            }}
                            className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Email:
                            </span>
                            <span className="text-sm font-semibold text-black">
                              {user.email}
                            </span>
                          </div>
                          <button
                            onClick={() => setEditRow("email")}
                            className="text-gray-400 hover:text-teal-700 transition duration-150"
                          >
                            <TbPencilCog size={18} />
                          </button>
                        </>
                      )}
                    </div>
                    {showAlert === "wrong-password" && editRow === "email" && (
                      <div className="px-3 py-1.5 bg-red-50 border-t border-red-200 text-xs font-semibold text-red-600 flex items-center gap-1">
                        <RiErrorWarningLine size={14} /> Contraseña incorrecta.
                      </div>
                    )}
                    {showAlert === "invalid-email" && (
                      <div className="px-3 py-1.5 bg-red-50 border-t border-red-200 text-xs font-semibold text-red-600 flex items-center gap-1">
                        <RiErrorWarningLine size={14} /> Email inválido.
                      </div>
                    )}
                  </div>
                </div>

                <h1 className="text-base font-bold tracking-wide mb-3">
                  Acceso:
                </h1>
                <div className="flex flex-col gap-2 mb-4">
                  {/* Usuario */}
                  <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      {editRow === "userName" ? (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            Usuario:
                          </span>
                          <input
                            autoFocus
                            defaultValue={user.userName}
                            onChange={(e) => setChanges(e.target.value)}
                            onKeyDown={(e: any) => {
                              if (e.key === "Escape") reset();
                              else if (e.key === "Enter" && changes !== null)
                                handleChangeUserName(e);
                            }}
                            className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                          />
                          <FaCircleXmark
                            onClick={(e: any) => handleCancelEditRow(e)}
                            className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                          />
                          <FaCircleCheck
                            onClick={(e: any) => {
                              if (changes !== null) handleChangeUserName(e);
                            }}
                            className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Usuario:
                            </span>
                            <span className="text-sm font-semibold text-black flex items-center gap-1">
                              {showUserName
                                ? user.userName
                                : "?".repeat(user.userName.length)}
                              <MdVisibilityOff
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  setShowUserName((v) => !v);
                                }}
                                className="cursor-pointer hover:scale-110 text-gray-400"
                                size={16}
                              />
                            </span>
                          </div>
                          <button
                            onClick={() => setEditRow("userName")}
                            className="text-gray-400 hover:text-teal-700 transition duration-150"
                          >
                            <TbPencilCog size={18} />
                          </button>
                        </>
                      )}
                    </div>
                    {showAlert === "userName-in-use" && (
                      <div className="px-3 py-1.5 bg-red-50 border-t border-red-200 text-xs font-semibold text-red-600 flex items-center gap-1">
                        <RiErrorWarningLine size={14} /> Usuario ya en uso.
                      </div>
                    )}
                    {showAlert === "userName-spaces" && (
                      <div className="px-3 py-1.5 bg-red-50 border-t border-red-200 text-xs font-semibold text-red-600 flex items-center gap-1">
                        <RiErrorWarningLine size={14} /> El usuario no puede
                        tener espacios.
                      </div>
                    )}
                  </div>
                  {/* Contraseña */}
                  <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      {editRow === "password" ? (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            {passwordStep === 1
                              ? "Contraseña actual:"
                              : passwordStep === 2
                                ? "Nueva contraseña:"
                                : "Repetir nueva:"}
                          </span>
                          <input
                            key={passwordStep}
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyDown={(e: any) => {
                              if (e.key === "Escape") reset();
                              else if (e.key === "Enter") handlePasswordStep(e);
                            }}
                            autoFocus
                            type="password"
                            className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                          />
                          <FaCircleXmark
                            onClick={(e: any) => handleCancelEditRow(e)}
                            className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                          />
                          <FaCircleCheck
                            onClick={(e: any) => handlePasswordStep(e)}
                            className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Contraseña:
                            </span>
                            <span className="text-sm font-semibold text-black">
                              ?????????????
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setEditRow("password");
                              setPasswordStep(1);
                            }}
                            className="text-gray-400 hover:text-teal-700 transition duration-150"
                          >
                            <TbPencilCog size={18} />
                          </button>
                        </>
                      )}
                    </div>
                    {showAlert === "wrong-password" &&
                      editRow === "password" && (
                        <div className="px-3 py-1.5 bg-red-50 border-t border-red-200 text-xs font-semibold text-red-600 flex items-center gap-1">
                          <RiErrorWarningLine size={14} /> Contraseña
                          incorrecta.
                        </div>
                      )}
                    {showAlert === "password-too-short" && (
                      <div className="px-3 py-1.5 bg-red-50 border-t border-red-200 text-xs font-semibold text-red-600 flex items-center gap-1">
                        <RiErrorWarningLine size={14} /> Mínimo 6 caracteres.
                      </div>
                    )}
                    {showAlert === "password-mismatch" && (
                      <div className="px-3 py-1.5 bg-red-50 border-t border-red-200 text-xs font-semibold text-red-600 flex items-center gap-1">
                        <RiErrorWarningLine size={14} /> Las contraseñas no
                        coinciden.
                      </div>
                    )}
                  </div>
                </div>

                <h1 className="text-base font-bold tracking-wide mb-3">
                  Preferencias de interfaz:
                </h1>
                <div className="flex flex-col gap-2">
                  <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                      {editRow === "language" ? (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            Idioma:
                          </span>
                          <select
                            defaultValue={user.language}
                            onChange={(e) => setChanges(e.target.value)}
                            onKeyDown={(e: any) =>
                              handleKeyPress(e, "language", changes)
                            }
                            className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                          >
                            <option value="spanish">spanish</option>
                            <option value="english">english</option>
                          </select>
                          <FaCircleXmark
                            onClick={(e: any) => handleCancelEditRow(e)}
                            className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                          />
                          <FaCircleCheck
                            onClick={(e: any) =>
                              handleEditRow(e, "language", changes)
                            }
                            className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              Idioma:
                            </span>
                            <span className="text-sm font-semibold text-black">
                              {user.language}
                            </span>
                          </div>
                          <button
                            onClick={() => setEditRow("language")}
                            className="text-gray-400 hover:text-teal-700 transition duration-150"
                          >
                            <TbPencilCog size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {selectedField === "pros" && loadingGet === false && pros && (
              <div className="max-w-lg">
                <h1 className="text-base font-bold tracking-wide mb-3">
                  Lista de profesionales:
                </h1>

                <div className="flex flex-col gap-2 mb-4">
                  {pros.map((professional) => (
                    <div
                      key={professional.key}
                      className="border-2 border-gray-300 rounded-xl overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                        {editRow === professional.key ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              autoFocus
                              defaultValue={professional.nameComplete}
                              onChange={(e) => setChanges(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") reset();
                                else if (e.key === "Enter" && changes) {
                                  updatePro(
                                    user.clinicId,
                                    professional.key,
                                    changes,
                                  ).then(() => {
                                    setPros(
                                      pros.map((p) =>
                                        p.key === professional.key
                                          ? { ...p, nameComplete: changes }
                                          : p,
                                      ),
                                    );
                                    reset();
                                  });
                                }
                              }}
                              className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                            />
                            <FaCircleXmark
                              onClick={() => reset()}
                              className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer flex-shrink-0"
                              size={20}
                            />
                            <FaCircleCheck
                              onClick={() => {
                                if (changes) {
                                  updatePro(
                                    user.clinicId,
                                    professional.key,
                                    changes,
                                  ).then(() => {
                                    setPros(
                                      pros.map((p) =>
                                        p.key === professional.key
                                          ? { ...p, nameComplete: changes }
                                          : p,
                                      ),
                                    );
                                    reset();
                                  });
                                }
                              }}
                              className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer flex-shrink-0"
                              size={20}
                            />
                          </div>
                        ) : (
                          <>
                            <span className="text-sm font-semibold text-black">
                              {professional.nameComplete}
                            </span>
                            <div className="flex items-center gap-2">
                              {confirmDeletePro === professional.key ? (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-red-600 font-semibold">
                                    ¿Borrar?
                                  </span>
                                  <button
                                    onClick={() => {
                                      setConfirmDeletePro(null);
                                      deletePro(
                                        user.clinicId,
                                        professional.key,
                                      ).then(() =>
                                        setPros(
                                          pros.filter(
                                            (p) => p.key !== professional.key,
                                          ),
                                        ),
                                      );
                                    }}
                                    className="text-red-600 font-bold hover:underline"
                                  >
                                    Sí
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeletePro(null)}
                                    className="text-gray-500 hover:underline"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditRow(professional.key)}
                                    className="text-gray-400 hover:text-teal-700 transition duration-150"
                                  >
                                    <TbPencilCog size={18} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setConfirmDeletePro(professional.key)
                                    }
                                    className="text-gray-400 hover:text-red-600 transition duration-150"
                                  >
                                    <FaCircleXmark size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre completo..."
                    value={newPro}
                    onChange={(e) => setNewPro(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newPro.trim()) {
                        e.preventDefault();
                        setPro(user.clinicId, newPro.trim()).then(() => {
                          getClinicData(user.clinicId, "pros").then(
                            (result) => {
                              if (result) setPros(result);
                            },
                          );
                          setNewPro("");
                        });
                      }
                    }}
                    className="border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-teal-700 bg-gray-100 text-black w-full"
                  />
                  <button
                    onClick={() => {
                      if (newPro.trim()) {
                        setPro(user.clinicId, newPro.trim()).then(() => {
                          getClinicData(user.clinicId, "pros").then(
                            (result) => {
                              if (result) setPros(result);
                            },
                          );
                          setNewPro("");
                        });
                      }
                    }}
                    className="px-3 py-1.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150 whitespace-nowrap"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            )}
            {selectedField === "insurances" && (
              <InsurancesConfig setLoadingGet={setLoadingGet} />
            )}
            {selectedField === "clinicConfig" &&
              loadingGet === false &&
              clinicInfo && (
                <div className="max-w-lg">
                  <h1 className="text-base font-bold tracking-wide mb-3">
                    Básico:
                  </h1>
                  <div className="flex flex-col gap-2 mb-4">
                    {(
                      [
                        {
                          key: "name",
                          label: "Nombre",
                          value: clinicInfo.name,
                        },
                        {
                          key: "country",
                          label: "País",
                          value: clinicInfo.country,
                        },
                        {
                          key: "address",
                          label: "Dirección",
                          value: clinicInfo.address,
                        },
                      ] as { key: string; label: string; value: string }[]
                    ).map(({ key, label, value }) => (
                      <div
                        key={key}
                        className="border-2 border-gray-300 rounded-xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                          {editRow === key ? (
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm text-gray-500 flex-shrink-0">
                                {label}:
                              </span>
                              <input
                                autoFocus
                                defaultValue={value}
                                onChange={(e) => setChanges(e.target.value)}
                                onKeyDown={(e: any) => {
                                  if (e.key === "Escape") reset();
                                  else if (
                                    e.key === "Enter" &&
                                    changes !== null
                                  )
                                    handleEditClinicRow(e, key, changes);
                                }}
                                className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                              />
                              <FaCircleXmark
                                onClick={(e: any) => handleCancelEditRow(e)}
                                className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer flex-shrink-0"
                                size={20}
                              />
                              <FaCircleCheck
                                onClick={(e: any) =>
                                  handleEditClinicRow(e, key, changes)
                                }
                                className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer flex-shrink-0"
                                size={20}
                              />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {label}:
                                </span>
                                <span className="text-sm font-semibold text-black">
                                  {value}
                                </span>
                              </div>
                              <button
                                onClick={() => setEditRow(key)}
                                className="text-gray-400 hover:text-teal-700 transition duration-150"
                              >
                                <TbPencilCog size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {/* Horarios */}
                    <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                        {editRow === "schedule" ? (
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm text-gray-500 flex-shrink-0">
                              Horarios:
                            </span>
                            <input
                              autoFocus
                              defaultValue={clinicInfo.initialSchedule}
                              placeholder="inicio"
                              onChange={(e) =>
                                setScheduleChanges((prev) => ({
                                  ...prev,
                                  initial: e.target.value,
                                }))
                              }
                              onKeyDown={(e: any) => {
                                if (e.key === "Escape") reset();
                              }}
                              className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black w-20"
                            />
                            <span className="text-gray-400">ù</span>
                            <input
                              defaultValue={clinicInfo.finalSchedule}
                              placeholder="fin"
                              onChange={(e) =>
                                setScheduleChanges((prev) => ({
                                  ...prev,
                                  final: e.target.value,
                                }))
                              }
                              onKeyDown={(e: any) => {
                                if (e.key === "Escape") reset();
                              }}
                              className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black w-20"
                            />
                            <FaCircleXmark
                              onClick={(e: any) => handleCancelEditRow(e)}
                              className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer flex-shrink-0"
                              size={20}
                            />
                            <FaCircleCheck
                              onClick={async (e: any) => {
                                e.stopPropagation();
                                setLoadingGet(true);
                                await setClinicInfoChanges(
                                  user.clinicId,
                                  "initialSchedule",
                                  scheduleChanges.initial,
                                );
                                await setClinicInfoChanges(
                                  user.clinicId,
                                  "finalSchedule",
                                  scheduleChanges.final,
                                );
                                const result = await getClinicData(
                                  user.clinicId,
                                  "info",
                                );
                                if (result) setClinicInfo(result);
                                reset();
                              }}
                              className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer flex-shrink-0"
                              size={20}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                Horarios de atención:
                              </span>
                              <span className="text-sm font-semibold text-black">
                                {clinicInfo.initialSchedule} ù{" "}
                                {clinicInfo.finalSchedule}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setChanges(null);
                                setEditRow("schedule");
                                setScheduleChanges({
                                  initial: clinicInfo.initialSchedule,
                                  final: clinicInfo.finalSchedule,
                                });
                              }}
                              className="text-gray-400 hover:text-teal-700 transition duration-150"
                            >
                              <TbPencilCog size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <h1 className="text-base font-bold tracking-wide mb-3">
                    Contacto:
                  </h1>
                  <div className="flex flex-col gap-2">
                    {(
                      [
                        {
                          key: "telContact",
                          label: "Tel de contacto",
                          value: clinicInfo.telContact,
                          saveKey: "telContact",
                        },
                        {
                          key: "secondTelContact",
                          label: "Tel auxiliar",
                          value: clinicInfo.secondTelContact,
                          saveKey: "secondTelContact",
                        },
                        {
                          key: "clinicEmail",
                          label: "Correo electrónico",
                          value: clinicInfo.email,
                          saveKey: "email",
                        },
                      ] as {
                        key: string;
                        label: string;
                        value: string;
                        saveKey: string;
                      }[]
                    ).map(({ key, label, value, saveKey }) => (
                      <div
                        key={key}
                        className="border-2 border-gray-300 rounded-xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                          {editRow === key ? (
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm text-gray-500 flex-shrink-0">
                                {label}:
                              </span>
                              <input
                                autoFocus
                                defaultValue={value}
                                onChange={(e) => setChanges(e.target.value)}
                                onKeyDown={(e: any) => {
                                  if (e.key === "Escape") reset();
                                  else if (
                                    e.key === "Enter" &&
                                    changes !== null
                                  )
                                    handleEditClinicRow(e, saveKey, changes);
                                }}
                                className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                              />
                              <FaCircleXmark
                                onClick={(e: any) => handleCancelEditRow(e)}
                                className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer flex-shrink-0"
                                size={20}
                              />
                              <FaCircleCheck
                                onClick={(e: any) =>
                                  handleEditClinicRow(e, saveKey, changes)
                                }
                                className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer flex-shrink-0"
                                size={20}
                              />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  {label}:
                                </span>
                                <span className="text-sm font-semibold text-black">
                                  {value}
                                </span>
                              </div>
                              <button
                                onClick={() => setEditRow(key)}
                                className="text-gray-400 hover:text-teal-700 transition duration-150"
                              >
                                <TbPencilCog size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </>
      )}
    </div>
  );
}
