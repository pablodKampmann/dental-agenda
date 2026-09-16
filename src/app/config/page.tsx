"use client";

import * as React from "react";
import { AvatarFallback } from "../../components/shared/AvatarFallback";
import { useState, useEffect } from "react";
import { Loading } from "../../components/shared/loading";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUser } from "../../services/auth/getUser";
import { MdVisibilityOff, MdPerson, MdGroups, MdBusiness, MdHealthAndSafety } from "react-icons/md";
import { getClinicData } from "../../services/config/getClinicData";
import { InsurancesConfig } from "../../components/config/insurancesConfig";
import { ScaleLoader } from "react-spinners";
import { FaCircleXmark } from "react-icons/fa6";
import { setRowChanges } from "../../services/config/setRowChanges";
import { updateUserEmail } from "../../services/config/updateUserEmail";
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
import { useToast } from '@/context/ToastContext';
import { ConfirmAlert } from "../../components/shared/dialogAlerts/confirmAlert";
import { EditableRow } from "../../components/patients/ui/editableRow";
import { SelectField } from "../../components/patients/ui/fields/selectField";
import { combine, required, email as emailValidator } from "@/lib/validators";

function noSpaces(message = "No puede contener espacios") {
  return (value: string) => (value.includes(" ") ? message : null);
}

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
  const [changes, setChanges] = useState<string>("");
  const [openInputCredential, setOpenInputCredential] = useState(false);
  const [userCredential, setUserCredential] = useState<string>("");
  const [passwordStep, setPasswordStep] = useState<number>(0);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [scheduleChanges, setScheduleChanges] = useState<{
    initial: string;
    final: string;
  }>({ initial: "", final: "" });
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
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

  async function handleEditClinicRow(field: string, value: string) {
    if (!value) { reset(); return; }
    setLoadingGet(true);
    await setClinicInfoChanges(user.clinicId, field, value);
    const result = await getClinicData(user.clinicId, "info");
    if (result) setClinicInfo(result);
    reset();
    showToast("success", "Cambio guardado correctamente");
  }

  async function submitSchedule() {
    setLoadingGet(true);
    await setClinicInfoChanges(user.clinicId, "initialSchedule", scheduleChanges.initial);
    await setClinicInfoChanges(user.clinicId, "finalSchedule", scheduleChanges.final);
    const result = await getClinicData(user.clinicId, "info");
    if (result) setClinicInfo(result);
    showToast("success", "Horario guardado correctamente");
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

  //FUNCTIONS PROFESSIONALS

  async function handleAddPro() {
    if (!newPro.trim()) return;
    const name = newPro.trim();
    setNewPro("");
    await setPro(user.clinicId, name);
    const result = await getClinicData(user.clinicId, "pros");
    if (result) setPros(result);
    showToast("success", "Profesional agregado exitosamente");
  }

  async function handleUpdatePro(key: string, name: string) {
    if (!name) { reset(); return; }
    setLoadingGet(true);
    await updatePro(user.clinicId, key, name);
    setPros((prev) =>
      prev ? prev.map((p) => (p.key === key ? { ...p, nameComplete: name } : p)) : prev,
    );
    reset();
    showToast("success", "Profesional actualizado exitosamente");
  }

  async function handleDeletePro(key: string) {
    setConfirmDeletePro(null);
    await deletePro(user.clinicId, key);
    setPros((prev) => prev ? prev.filter((p) => p.key !== key) : prev);
    showToast("success", "Profesional eliminado exitosamente");
  }

  //FUNCTIONS EDIT ROW

  function reset() {
    setEditRow("");
    setLoadingGet(false);
    setChanges("");
    setPasswordStep(0);
    setPasswordInput("");
    setCurrentPassword("");
    setNewPassword("");
    if (openInputCredential) setOpenInputCredential(false);
  }

  async function handleEditRow(table: string, changes: string) {
    reset();

    if (changes) {
      setLoadingGet(true);
      let result;
      switch (table) {
        case "displayName":
          result = await setRowChanges(table, changes, userUid);
          if (result !== null) {
            const updatedUser = await getUser(false);
            setUser(updatedUser);
            await refreshUser();
            showToast("success", "Cambio guardado correctamente");
          }
          break;
        case "language":
          result = await setRowChanges(table, changes, userUid);
          if (result !== null) {
            await refreshUser();
            showToast("success", "Cambio guardado correctamente");
          }
          break;
        default:
          break;
      }
    }

    reset();
  }

  //FUNCTIONS CHANGE EMAIL

  async function handleChangeEmail(table: string, changes: string) {
    if (changes) {
      setLoadingGet(true);
      const result = (await updateUserEmail(
        table,
        changes,
        userUid,
        userCredential,
      )) as { message: string };
      if (result) {
        if (result.message === "Firebase: Error (auth/wrong-password).") {
          showToast("error", "Contraseña incorrecta");
        } else if (result.message === "Firebase: Error (auth/invalid-email).") {
          showToast("error", "El email ingresado no es válido");
        }
        setLoadingGet(false);
      } else {
        const user = await getUser(false);
        setUser(user);
        reset();
        showToast("success", "Email actualizado correctamente");
      }
    }
  }

  function submitEmailChanges(changes: string) {
    if (openInputCredential) {
      handleChangeEmail("email", changes);
    } else if (changes) {
      setOpenInputCredential(true);
    } else {
      reset();
    }
  }

  async function handleChangeUserName() {
    if (!changes || changes.trim() === "") { reset(); return; }

    setLoadingGet(true);
    const result = await updateUserName(changes.trim(), userUid);

    if (result === "ok") {
      const updatedUser = await getUser(false);
      setUser(updatedUser);
    } else if (result === "already-in-use") {
      showToast("error", "El nombre de usuario ya está en uso");
    } else {
      showToast("error", "Error al actualizar el nombre de usuario");
    }

    reset();
  }

  async function handlePasswordStep() {
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
          showToast("error", "Contraseña incorrecta");
        }
      }
      setLoadingGet(false);
    } else if (passwordStep === 2) {
      if (passwordInput.length < 6) {
        showToast("error", "La contraseña debe tener al menos 6 caracteres");
        return;
      }
      setNewPassword(passwordInput);
      setPasswordInput("");
      setPasswordStep(3);
    } else if (passwordStep === 3) {
      if (passwordInput !== newPassword) {
        showToast("error", "Las contraseñas no coinciden");
        setPasswordInput("");
        return;
      }
      setLoadingGet(true);
      const result = await updateUserPassword(newPassword, currentPassword);
      if (result === "wrong-password") {
        showToast("error", "Contraseña incorrecta");
      } else {
        showToast("success", "Contraseña actualizada correctamente");
      }
      reset();
    }
  }

  const NAV_ITEMS = [
    { id: "profile",      label: "Perfil",          icon: MdPerson,           action: () => setSelectedField("profile") },
    { id: "pros",         label: "Profesionales",   icon: MdGroups,           action: handleGetPros },
    { id: "clinicConfig", label: "Consultorio",     icon: MdBusiness,         action: handleGetClinicConfig },
    { id: "insurances",   label: "Obras Sociales",  icon: MdHealthAndSafety,  action: () => setSelectedField("insurances") },
  ] as const;

  const SECTION_TITLE: Record<string, string> = {
    profile:      "Perfil",
    pros:         "Profesionales",
    clinicConfig: "Consultorio",
    insurances:   "Obras Sociales",
  };

  return (
    <div className="h-[calc(100vh-58px)] flex flex-col overflow-hidden">
      {isLoad ? (
        <Loading />
      ) : (
        <div className="flex flex-col h-full animate-page-drop">
          <ConfirmAlert
            open={confirmDeletePro !== null}
            setOpen={(v) => { if (!v) setConfirmDeletePro(null); }}
            title="¿Eliminar profesional?"
            description="Esta acción es permanente y no se puede deshacer."
            onConfirm={async () => {
              if (confirmDeletePro) await handleDeletePro(confirmDeletePro);
            }}
            confirmText="Eliminar"
          />

          {/* Page header */}
          <div className="shrink-0 px-6 pt-6 pb-4 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-black tracking-tight">Configuración</h1>
              {loadingGet && (
                <ScaleLoader margin={2} color="#0F766E" width={2} height={18} speedMultiplier={1.4} />
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-black leading-tight">{user.displayName}</p>
                <p className="text-xs text-gray-400 leading-tight">{user.email}</p>
              </div>
              <AvatarFallback
                displayName={user.displayName}
                size={40}
                className="rounded-full border-2 border-white shadow-md select-none shrink-0"
              />
            </div>
          </div>

          {/* Body: left nav + right card */}
          <div className="flex flex-1 min-h-0 gap-4 px-6 pb-6">

            {/* Left nav card */}
            <div className="w-52 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 p-2 flex flex-col gap-0.5 select-none">
              {NAV_ITEMS.map(({ id, label, icon: Icon, action }) => (
                <button
                  key={id}
                  onClick={action}
                  className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition duration-150 ${
                    selectedField === id
                      ? "bg-teal-700 text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content card */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-y-auto">
              {/* Card header */}
              <div className="px-6 pt-5 pb-4 border-b border-gray-200 shrink-0">
                <h2 className="text-base font-bold text-black tracking-tight">
                  {SECTION_TITLE[selectedField]}
                </h2>
              </div>

              {/* Card body */}
              <div className="px-6 pt-5 pb-8 text-black">
                {selectedField === "profile" && (
                  <div className="max-w-lg">
                    <h1 className="text-base font-bold tracking-wide mb-3">Básico:</h1>
                    <div className="flex flex-col gap-2 mb-4">
                      <EditableRow
                        label="Nombre visible"
                        value={user.displayName}
                        rowKey="displayName"
                        category="profile"
                        rowModify={editRow}
                        setRowModify={setEditRow}
                        setChanges={setChanges}
                        submitChanges={(value) => handleEditRow("displayName", value)}
                        changes={changes}
                        validate={combine(required("El nombre visible es obligatorio"))}
                      />
                      <EditableRow
                        label={openInputCredential ? "Contraseña actual" : "Email"}
                        value={user.email}
                        rowKey="email"
                        category="profile"
                        rowModify={editRow}
                        setRowModify={setEditRow}
                        setChanges={setChanges}
                        submitChanges={(value) => submitEmailChanges(value)}
                        changes={changes}
                        validate={openInputCredential ? undefined : emailValidator()}
                        renderInput={
                          openInputCredential ? (
                            <input
                              autoFocus
                              type="password"
                              autoComplete="off"
                              placeholder="Confirmá con tu contraseña"
                              onChange={(e) => setUserCredential(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitEmailChanges(changes);
                                else if (e.key === "Escape") reset();
                              }}
                              className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                            />
                          ) : undefined
                        }
                      />
                    </div>

                    <h1 className="text-base font-bold tracking-wide mb-3">Acceso:</h1>
                    <div className="flex flex-col gap-2 mb-4">
                      <EditableRow
                        label="Usuario"
                        value={user.userName}
                        displayValue={
                          <span className="inline-flex items-center gap-1">
                            {showUserName ? user.userName : "?".repeat(user.userName.length)}
                            <MdVisibilityOff
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowUserName((v) => !v); }}
                              className="cursor-pointer hover:scale-110 text-gray-400"
                              size={16}
                            />
                          </span>
                        }
                        rowKey="userName"
                        category="profile"
                        rowModify={editRow}
                        setRowModify={setEditRow}
                        setChanges={setChanges}
                        submitChanges={() => handleChangeUserName()}
                        changes={changes}
                        validate={combine(required("El usuario es obligatorio"), noSpaces())}
                      />
                      <EditableRow
                        label={
                          editRow === "password"
                            ? passwordStep === 1
                              ? "Contraseña actual"
                              : passwordStep === 2
                                ? "Nueva contraseña"
                                : "Repetir nueva"
                            : "Contraseña"
                        }
                        value="?????????????"
                        rowKey="password"
                        category="profile"
                        rowModify={editRow}
                        setRowModify={setEditRow}
                        setChanges={setChanges}
                        submitChanges={() => handlePasswordStep()}
                        changes={changes}
                        onEdit={() => setPasswordStep(1)}
                        renderInput={
                          <input
                            key={passwordStep}
                            autoFocus
                            type="password"
                            placeholder={
                              passwordStep === 1
                                ? "Contraseña actual"
                                : passwordStep === 2
                                  ? "Nueva contraseña (mín. 6 caracteres)"
                                  : "Repetí la nueva contraseña"
                            }
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handlePasswordStep();
                              else if (e.key === "Escape") reset();
                            }}
                            className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                          />
                        }
                      />
                    </div>

                    <h1 className="text-base font-bold tracking-wide mb-3">Preferencias de interfaz:</h1>
                    <div className="flex flex-col gap-2">
                      <EditableRow
                        label="Idioma"
                        value={user.language}
                        rowKey="language"
                        category="profile"
                        rowModify={editRow}
                        setRowModify={setEditRow}
                        setChanges={setChanges}
                        submitChanges={(value) => handleEditRow("language", value)}
                        changes={changes}
                        renderInput={
                          <SelectField
                            value={changes || user.language}
                            onChange={setChanges}
                            onSubmit={() => handleEditRow("language", changes)}
                            onCancel={() => reset()}
                            options={[
                              { value: "spanish", label: "spanish" },
                              { value: "english", label: "english" },
                            ]}
                          />
                        }
                      />
                    </div>
                  </div>
                )}

                {selectedField === "pros" && loadingGet === false && pros && (
                  <div className="max-w-lg">
                    <h1 className="text-base font-bold tracking-wide mb-3">Lista de profesionales:</h1>

                    <div className="flex flex-col gap-2 mb-4">
                      {pros.map((professional) => (
                        <EditableRow
                          key={professional.key}
                          label="Profesional"
                          value={professional.nameComplete}
                          rowKey={professional.key}
                          category="pros"
                          rowModify={editRow}
                          setRowModify={setEditRow}
                          setChanges={setChanges}
                          submitChanges={(value) => handleUpdatePro(professional.key, value)}
                          changes={changes}
                          validate={combine(required("El nombre es obligatorio"))}
                          extraActions={
                            <FaCircleXmark
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setConfirmDeletePro(professional.key); }}
                              className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer"
                              size={18}
                            />
                          }
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nombre completo..."
                        value={newPro}
                        onChange={(e) => setNewPro(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddPro();
                          }
                        }}
                        className="border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-teal-700 bg-gray-100 text-black w-full"
                      />
                      <button
                        onClick={handleAddPro}
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

                {selectedField === "clinicConfig" && loadingGet === false && clinicInfo && (
                  <div className="max-w-lg">
                    <h1 className="text-base font-bold tracking-wide mb-3">Básico:</h1>
                    <div className="flex flex-col gap-2 mb-4">
                      {(
                        [
                          { key: "name", label: "Nombre", value: clinicInfo.name, required: true },
                          { key: "country", label: "País", value: clinicInfo.country, required: false },
                          { key: "address", label: "Dirección", value: clinicInfo.address, required: false },
                        ] as { key: string; label: string; value: string; required: boolean }[]
                      ).map(({ key, label, value, required: isRequired }) => (
                        <EditableRow
                          key={key}
                          label={label}
                          value={value}
                          rowKey={key}
                          category="clinicConfig"
                          rowModify={editRow}
                          setRowModify={setEditRow}
                          setChanges={setChanges}
                          submitChanges={(v) => handleEditClinicRow(key, v)}
                          changes={changes}
                          validate={isRequired ? combine(required(`${label} es obligatorio`)) : undefined}
                        />
                      ))}

                      {/* Horarios */}
                      <EditableRow
                        label="Horarios de atención"
                        value={`${clinicInfo.initialSchedule} a ${clinicInfo.finalSchedule}`}
                        rowKey="schedule"
                        category="clinicConfig"
                        rowModify={editRow}
                        setRowModify={setEditRow}
                        setChanges={setChanges}
                        submitChanges={() => submitSchedule()}
                        changes={changes}
                        onEdit={() => setScheduleChanges({ initial: clinicInfo.initialSchedule, final: clinicInfo.finalSchedule })}
                        renderInput={
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              autoFocus
                              defaultValue={clinicInfo.initialSchedule}
                              placeholder="inicio"
                              onChange={(e) => setScheduleChanges((prev) => ({ ...prev, initial: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitSchedule();
                                else if (e.key === "Escape") reset();
                              }}
                              className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black w-20"
                            />
                            <span className="text-gray-400">a</span>
                            <input
                              defaultValue={clinicInfo.finalSchedule}
                              placeholder="fin"
                              onChange={(e) => setScheduleChanges((prev) => ({ ...prev, final: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitSchedule();
                                else if (e.key === "Escape") reset();
                              }}
                              className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black w-20"
                            />
                          </div>
                        }
                      />
                    </div>

                    <h1 className="text-base font-bold tracking-wide mb-3">Contacto:</h1>
                    <div className="flex flex-col gap-2">
                      {(
                        [
                          { key: "telContact", label: "Tel de contacto", value: clinicInfo.telContact, saveKey: "telContact" },
                          { key: "secondTelContact", label: "Tel auxiliar", value: clinicInfo.secondTelContact, saveKey: "secondTelContact" },
                          { key: "clinicEmail", label: "Correo electrónico", value: clinicInfo.email, saveKey: "email" },
                        ] as { key: string; label: string; value: string; saveKey: string }[]
                      ).map(({ key, label, value, saveKey }) => (
                        <EditableRow
                          key={key}
                          label={label}
                          value={value}
                          rowKey={key}
                          category="clinicConfig"
                          rowModify={editRow}
                          setRowModify={setEditRow}
                          setChanges={setChanges}
                          submitChanges={(v) => handleEditClinicRow(saveKey, v)}
                          changes={changes}
                          validate={key === "clinicEmail" ? emailValidator() : undefined}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
