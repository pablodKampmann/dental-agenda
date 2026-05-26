"use client";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Loading } from "../../components/shared/loading";
import { getChapter } from "../../services/practices/getChapter";
import { ClipLoader } from "react-spinners";
import { HiFolderAdd } from "react-icons/hi";
import { Alert } from "../../components/shared/alert";
import { ImCancelCircle } from "react-icons/im";
import { updatePracticePrice } from "../../services/practices/updatePracticePrice";
import { setPractice } from "../../services/practices/setPractice";
import { updateChapterPrices } from "../../services/practices/updateChapterPrices";
import { PracticeTable } from "../../components/practices/ui/PracticeTable";
import { AddPracticeForm } from "../../components/practices/ui/AddPracticeForm";
import { PriceAdjustmentPanel } from "../../components/practices/ui/PriceAdjustmentPanel";
import { Toast } from '@/components/shared/Toast';
import type { ToastVariant } from '@/components/shared/Toast';

const ALL_AREAS = [
  "CONSULTAS",
  "OPERATORIA DENTAL",
  "ENDODONCIA",
  "PRÓTESIS",
  "ODONTOLOGÍA PREVENTIVA",
  "ORTODONCIA Y ORTOPEDIA FUNCIONAL",
  "ODONTOPEDIATRÍA",
  "PERIODONCIA",
  "RADIOLOGÍA",
  "CIRUGÍA",
];

export default function Page() {
  const router = useRouter();
  const { user, loading: isLoad } = useAuth();
  const clinicId = user?.clinicId ?? "";
  const [loading, setLoading] = useState(false);
  const [loadingIncreaseOrDecrease, setLoadingIncreaseOrDecrease] =
    useState(false);
  const [chapterName, setChapterName] = useState("CONSULTAS");
  const [chapterData, setChapterData] = useState<any>(null);
  const [id, setId] = useState<any>(null);
  const [price, setPrice] = useState<any>(null);
  const [percentage, setPercentage] = useState<any>(null);
  const [percentageVisible, setPercentageVisible] = useState<any>(null);
  const [practiceName, setPracticeName] = useState<any>(null);
  const [isLoadData, setIsLoadData] = useState(true);
  const [openPriceEdit, setOpenPriceEdit] = useState(
    Array(chapterData?.length).fill(false),
  );
  const [openCreatePractice, setOpenCreatePractice] = useState(false);
  const [openFormPercentages, setOpenFormPercentages] = useState(false);
  const [showResult, setShowResult] = useState<ToastVariant | null>(null);
  const [openAlert, setOpenAlert] = useState("");
  const [billingTagetOverflowActived, setBillingTagetOverflowActived] =
    useState(false);
  const [newPrice, setNewPrice] = useState<any>(null);
  const billingTargetRef = useRef<any>(null);
  const [openPercentageEdit, setOpenPercentageEdit] = useState("");
  const [percentageEditValue, setPercentageEditValue] = useState<any>(null);
  const [globalPercentage, setGlobalPercentage] = useState<number | null>(null);
  const [globalPercentageVisible, setGlobalPercentageVisible] = useState<
    string | null
  >(null);
  const [openGlobalFormPercentages, setOpenGlobalFormPercentages] =
    useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [globalResult, setGlobalResult] = useState<{
    updated: number;
    areas: number;
    failed: string[];
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!clinicId) return;
    setOpenPriceEdit(Array(chapterData?.length).fill(false));
    setSearchQuery("");
    updatePractices();
  }, [chapterName, clinicId]);

  async function updatePractices() {
    setIsLoadData(true);
    const { data } = await getChapter(chapterName, clinicId);
    if (Array.isArray(data)) {
      const filteredData = data
        .filter(
          (item) => !Object.values(item).every((value) => value === undefined),
        )
        .sort((a, b) => (a.id && b.id ? parseInt(a.id) - parseInt(b.id) : 0));
      setChapterData(filteredData);
    }
    setIsLoadData(false);
  }

  async function handleIncreaseOrDecrease() {
    if (chapterData.length > 0) {
      setLoadingIncreaseOrDecrease(true);
      const updatedChapterData = chapterData.map(
        (chapter: { price: number }) => ({
          ...chapter,
          price: Math.round(chapter.price + chapter.price * percentage),
        }),
      );
      const result = await updateChapterPrices(
        updatedChapterData,
        chapterName,
        clinicId,
      );
      if (result === null) {
        setLoadingIncreaseOrDecrease(false);
      } else {
        updatePractices();
        setOpenFormPercentages(false);
        setLoadingIncreaseOrDecrease(false);
        setShowResult("good-prices-update");
      }
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setShowResult(null), 6000);
    return () => clearTimeout(t);
  }, [showResult]);

  function formatPrice(price: number) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  useEffect(() => {
    setBillingTagetOverflowActived(false);
    if (!isLoadData) {
      const container = document.getElementById("billing-target");
      if (container && container.scrollHeight > container.clientHeight) {
        setBillingTagetOverflowActived(true);
      }
    }
  }, [isLoadData, chapterName]);

  function togglePriceEdit(index: any) {
    cancelEdit();
    const newOpenPriceEdit = [...openPriceEdit];
    newOpenPriceEdit[index] = !newOpenPriceEdit[index];
    setOpenPriceEdit(newOpenPriceEdit);
  }

  function cancelEdit() {
    setOpenPriceEdit(Array(chapterData?.length).fill(false));
    setNewPrice(null);
  }

  async function handleUpdatePrice(practiceId: string) {
    if (newPrice !== null) {
      const priceNumber = parseFloat(newPrice.replace(/\./g, ""));
      const result = await updatePracticePrice(
        chapterName,
        practiceId,
        priceNumber,
        clinicId,
      );
      cancelEdit();
      if (result !== null) {
        updatePractices();
        setShowResult("good-price-update");
      }
    } else {
      cancelEdit();
    }
  }

  function handleKeyPress(event: any, practiceId: string) {
    if (event.key === "Enter") {
      newPrice !== null ? handleUpdatePrice(practiceId) : cancelEdit();
    } else if (event.key === "Escape") {
      cancelEdit();
    }
  }

  async function handleGlobalUpdate() {
    if (globalPercentage === null) return;
    setLoadingGlobal(true);
    let totalUpdated = 0;
    let areasSucceeded = 0;
    const failed: string[] = [];

    for (const area of ALL_AREAS) {
      try {
        const { data } = await getChapter(area, clinicId);
        if (Array.isArray(data)) {
          const filteredData = data.filter(
            (item) => !Object.values(item).every((v) => v === undefined),
          );
          if (filteredData.length === 0) {
            areasSucceeded++;
            continue;
          }
          const updatedData = filteredData.map(
            (practice: { price: number; [key: string]: unknown }) => ({
              ...practice,
              price: Math.round(
                practice.price + practice.price * globalPercentage,
              ),
            }),
          );
          const result = await updateChapterPrices(updatedData, area, clinicId);
          if (result !== null) {
            totalUpdated += filteredData.length;
            areasSucceeded++;
          } else {
            failed.push(area);
          }
        } else {
          areasSucceeded++;
        }
      } catch {
        failed.push(area);
      }
    }

    setGlobalResult({ updated: totalUpdated, areas: areasSucceeded, failed });
    setLoadingGlobal(false);
    setOpenGlobalFormPercentages(false);
    updatePractices();
  }

  async function HandleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    const priceNumber = parseFloat(price.replace(/\./g, ""));
    const result = await setPractice(
      priceNumber,
      practiceName?.trim() ?? "",
      chapterName,
      clinicId,
    );
    if (result !== null) {
      setOpenCreatePractice(false);
      setPrice(null);
      setPracticeName(null);
      setShowResult("good-practice");
      updatePractices();
    }
  }
  const filteredChapterData =
    chapterData?.filter((item: any) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];
  return (
    <div className="h-screen overflow-hidden flex-1">
      {isLoad ? (
        <Loading />
      ) : (
        <div className="h-full py-2">
          {openAlert === "delete" && (
            <div className="absolute inset-0 backdrop-blur-sm ml-56 z-10">
              <Alert
                onCloseAlert={() => setOpenAlert("")}
                onSuccess={() => {
                  setOpenAlert("");
                  updatePractices();
                  setShowResult("good-delete-practice");
                }}
                action={"Eliminar Práctica"}
                firstProp={
                  "¿Estás seguro/a de que deseas eliminar esta práctica?"
                }
                secondProp={practiceName}
                thirdProp={price}
                fourthProp={id}
                fifthProp={chapterName}
                clinicId={clinicId}
              />
            </div>
          )}
          <div className="ml-2 mr-2 p-4">
            <div className="flex justify-between select-none">
              <div className="flex items-center">
                <select
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  className="cursor-pointer hover:border-gray-600 hover:border-y-2 border-x-2 border-x-gray-600 border-x-transparent transition duration-300 bg-gray-300 bg-opacity-30 w-80 h-10 outline-none text-black text-xl font-bold border-y-4 px-4 border-teal-600 rounded-3xl shadow-lg flex justify-center items-center"
                >
                  <option value="CONSULTAS">CONSULTAS</option>
                  <option value="OPERATORIA DENTAL">OPERATORIA DENTAL</option>
                  <option value="ENDODONCIA">ENDODONCIA</option>
                  <option value="PRÓTESIS">PRÓTESIS</option>
                  <option value="ODONTOLOGÍA PREVENTIVA">
                    ODONTOLOGÍA PREVENTIVA
                  </option>
                  <option value="ORTODONCIA Y ORTOPEDIA FUNCIONAL">
                    ORTODONCIA Y ORTOPEDIA FUNCIONAL
                  </option>
                  <option value="ODONTOPEDIATRÍA">ODONTOPEDIATRÍA</option>
                  <option value="PERIODONCIA">PERIODONCIA</option>
                  <option value="RADIOLOGÍA">RADIOLOGÍA</option>
                  <option value="CIRUGÍA">CIRUGÍA</option>
                </select>
                {isLoadData && <ClipLoader className="ml-4" />}
                <input
                  type="text"
                  placeholder="Buscar práctica..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ml-4 h-10 px-4 border-2 border-teal-600 rounded-3xl bg-gray-300 bg-opacity-30 outline-none text-black font-medium w-64"
                />
              </div>
              <button
                onClick={() => {
                  setOpenCreatePractice(!openCreatePractice);
                  setId(null);
                  setPrice(null);
                  setOpenFormPercentages(false);
                  setPracticeName(null);
                  setLoading(false);
                }}
                className="shadow-lg h-10 text-black bg-gray-300 bg-opacity-30 hover:bg-teal-600 hover:border-gray-600 hover:text-white text-xl font-semibold px-4 border-b-4 border-2 border-b-teal-600 border-gray-600 rounded-lg flex items-center justify-center transition duration-200"
              >
                {openCreatePractice ? (
                  <div className="flex justify-center items-center">
                    <ImCancelCircle className="mr-2" size={24} />
                    Cancelar
                  </div>
                ) : (
                  <div className="flex justify-center items-center">
                    <HiFolderAdd className="mr-2" size={28} />
                    Agregar Práctica
                  </div>
                )}
              </button>
            </div>
          </div>
          {chapterData ? (
            <div className="flex justify-between h-screen pb-44 mt-2 overflow-y-hidden w-full">
              <PracticeTable
                chapterData={filteredChapterData}
                chapterName={chapterName}
                openPriceEdit={openPriceEdit}
                newPrice={newPrice}
                setNewPrice={setNewPrice}
                billingTagetOverflowActived={billingTagetOverflowActived}
                billingTargetRef={billingTargetRef}
                togglePriceEdit={togglePriceEdit}
                cancelEdit={cancelEdit}
                handleUpdatePrice={handleUpdatePrice}
                handleKeyPress={handleKeyPress}
                setOpenAlert={setOpenAlert}
                setId={setId}
                setPracticeName={setPracticeName}
                setPrice={setPrice}
                formatPrice={formatPrice}
                onAddPractice={() => {
                  setOpenCreatePractice(true);
                  setOpenFormPercentages(false);
                }}
              />
              {openCreatePractice ? (
                <AddPracticeForm
                  chapterName={chapterName}
                  price={price}
                  setPrice={setPrice}
                  practiceName={practiceName}
                  setPracticeName={setPracticeName}
                  loading={loading}
                  onSubmit={HandleSubmit}
                  onCancel={() => setOpenCreatePractice(false)}
                />
              ) : (
                <PriceAdjustmentPanel
                  chapterData={chapterData}
                  chapterName={chapterName}
                  openFormPercentages={openFormPercentages}
                  setOpenFormPercentages={setOpenFormPercentages}
                  percentage={percentage}
                  percentageVisible={percentageVisible}
                  setPercentage={setPercentage}
                  setPercentageVisible={setPercentageVisible}
                  loadingIncreaseOrDecrease={loadingIncreaseOrDecrease}
                  handleIncreaseOrDecrease={handleIncreaseOrDecrease}
                  globalPercentage={globalPercentage}
                  globalPercentageVisible={globalPercentageVisible}
                  setGlobalPercentage={setGlobalPercentage}
                  setGlobalPercentageVisible={setGlobalPercentageVisible}
                  openGlobalFormPercentages={openGlobalFormPercentages}
                  setOpenGlobalFormPercentages={setOpenGlobalFormPercentages}
                  loadingGlobal={loadingGlobal}
                  globalResult={globalResult}
                  setGlobalResult={setGlobalResult}
                  handleGlobalUpdate={handleGlobalUpdate}
                  formatPrice={formatPrice}
                  clinicId={clinicId}
                />
              )}
            </div>
          ) : null}
        </div>
      )}
      <Toast variant={showResult} />
    </div>
  );
}
