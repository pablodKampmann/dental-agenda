"use client";

import { useState, useEffect } from "react";
import { Loading } from "./../../components/shared/loading";
import { InputAndOthers } from "./../../components/patients/ui/inputAndOthers";
import { Table } from "./../../components/patients/ui/table";
import { getPatients } from "./../../services/patients/getPatients";
import { SheetCreatePatient } from "../../components/patients/ui/createPatient/sheetCreatePatient";
import { ModalCreatePatient } from "../../components/patients/ui/modalCreatePatient";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useAuth } from "@/context/AuthContext";

export default function Patients() {
  const [isLoad, setIsLoad] = useState(true);
  const [isOpenSheetCreatePatient, setIsOpenSheetCreatePatient] =
    useState(false);
  const [isOpenModalCreatePatient, setIsOpenModalCreatePatient] =
    useState(false);
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const [listOfPatients, setListOfPatients] = useState<null | any[]>(null);
  const [isListOfPatientsComplete, setIsListOfPatientsComplete] =
    useState(false);
  const [loadMorePatientsButtom, setLoadMorePatientsButtom] = useState(true);
  const [searchContent, setSearchContent] = useState("");
  const [loadRow, setLoadRow] = useState<number | null>(null);
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? null;

  useEffect(() => {
    if (clinicId) {
      handleGetPatients(20);
    }
  }, [clinicId]);

  async function handleGetPatients(quantity: number) {
    if (!clinicId) return;
    const data = await getPatients(quantity, clinicId);
    if (data) {
      setIsListOfPatientsComplete(data.isFull);
      setListOfPatients(data.patients);
    }
    setLoadMorePatientsButtom(false);
  }

  useEffect(() => {
    if (listOfPatients) {
      setIsLoad(false);
    }
  }, [listOfPatients]);

  return (
    <div className="h-[calc(100vh-68px)] flex flex-col px-4 pb-4 pt-3 w-full overflow-hidden">
      {isLoad && <Loading />}
      {isMobile ? (
        <SheetCreatePatient
          open={isOpenSheetCreatePatient}
          onClose={() => setIsOpenSheetCreatePatient(false)}
          onSuccess={() => handleGetPatients(20)}
        />
      ) : (
        <ModalCreatePatient
          open={isOpenModalCreatePatient}
          onClose={() => setIsOpenModalCreatePatient(false)}
          onSuccess={() => handleGetPatients(20)}
        />
      )}
      <div
        className={`${isLoad ? "opacity-0" : "opacity-100"} transition-opacity duration-150 flex flex-col h-full gap-3`}
      >
        {/* Barra de búsqueda y acciones */}
        <div className="shrink-0">
          <InputAndOthers
            clinicId={clinicId}
            searchContent={searchContent}
            setSearchContent={setSearchContent}
            loadRow={loadRow}
            setListOfPatients={setListOfPatients}
            handleGetPatients={handleGetPatients}
            setIsOpenSheetCreatePatient={(v) =>
              isMobile
                ? setIsOpenSheetCreatePatient(v)
                : setIsOpenModalCreatePatient(v)
            }
          />
        </div>

        {/* Tabla */}
        <div className="flex-1 min-h-0">
          <Table
            searchContent={searchContent}
            listOfPatients={listOfPatients}
            setLoadRow={setLoadRow}
            loadRow={loadRow}
            isListOfPatientsComplete={isListOfPatientsComplete}
            loadMorePatientsButtom={loadMorePatientsButtom}
            setLoadMorePatientsButtom={setLoadMorePatientsButtom}
            handleGetPatients={handleGetPatients}
          />
        </div>
      </div>
    </div>
  );
}
