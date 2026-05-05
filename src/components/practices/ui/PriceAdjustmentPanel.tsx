import React from 'react';
import { ClipLoader } from "react-spinners";
import { PiSealWarningThin } from "react-icons/pi";

interface Props {
    chapterData: any[];
    openFormPercentages: boolean;
    setOpenFormPercentages: (value: boolean) => void;
    percentage: any;
    percentageVisible: any;
    setPercentage: (value: any) => void;
    setPercentageVisible: (value: any) => void;
    loadingIncreaseOrDecrease: boolean;
    openPercentageEdit: string;
    setOpenPercentageEdit: (value: string) => void;
    percentageEditValue: any;
    setPercentageEditValue: (value: any) => void;
    handleIncreaseOrDecrease: () => void;
}

export function PriceAdjustmentPanel({
    chapterData, openFormPercentages, setOpenFormPercentages,
    percentage, percentageVisible, setPercentage, setPercentageVisible,
    loadingIncreaseOrDecrease, openPercentageEdit, setOpenPercentageEdit,
    percentageEditValue, setPercentageEditValue, handleIncreaseOrDecrease
}: Props) {
    return (
        <div className="overflow-hidden w-1/5">
            <div className={`${openFormPercentages ? "h-fit" : "h-fit"} animate-move-from-right-form transition-all text-black border-2 duration-500 ease border-gray-600 ml-auto mr-6 shadow-lg rounded-lg select-none bg-gray-300 bg-opacity-30`}>
                {openFormPercentages ? (
                    <div className="flex p-4 pt-6 flex-col justify-center items-center">
                        <PiSealWarningThin className="text-gray-600" size={80} />
                        {percentage > 0 ? (
                            <h1 className="text-md px-1 tracking-wide mt-1 text-center">
                                ¿Estás seguro/a de que deseas aumentar un <span className="font-semibold">{percentageVisible}</span> el valor de todas las prácticas del capítulo?
                            </h1>
                        ) : (
                            <h1 className="text-md px-1 tracking-wide mt-1 text-center">
                                ¿Estás seguro/a de que deseas disminuir un <span className="font-semibold">{percentageVisible}</span> el valor de todas las prácticas del capítulo?
                            </h1>
                        )}
                        <div className="flex mt-16 text-xl font-medium w-full">
                            <button onClick={() => setOpenFormPercentages(false)} className="mr-1.5 py-1 bg-red-600 hover:bg-opacity-70 hover:transition hover:duration-250 hover:text-gray-100 text-red-900 bg-opacity-50 rounded-lg w-full shadow-lg">
                                NO
                            </button>
                            <button onClick={handleIncreaseOrDecrease} className="ml-1.5 py-1 bg-teal-600 hover:bg-opacity-70 hover:transition hover:duration-200 hover:text-gray-100 text-teal-900 bg-opacity-50 rounded-lg w-full shadow-lg">
                                {loadingIncreaseOrDecrease ? <div className="flex justify-center items-center py-0.5"><ClipLoader color="white" size={20} /></div> : "SI"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`${chapterData.length > 0 ? "" : "pointer-events-none"}`}>
                        <h1 className={`${chapterData.length > 0 ? "" : "line-through"} bg-teal-600 flex justify-center items-center px-1 text-center text-white font-semibold text-xl py-2 border-b-2 border-gray-600 rounded-t-md`}>
                            AUMENTAR TODO
                        </h1>
                        <div className="flex font-medium transition">
                            <button onClick={() => { setPercentageVisible("+5%"); setPercentage(0.05); setOpenFormPercentages(true); }} className="hover:bg-teal-600 w-1/2 hover:duration-150 border-r-2 py-2 border-b-2 border-gray-600">+5%</button>
                            <button onClick={() => { setPercentageVisible("+10%"); setPercentage(0.1); setOpenFormPercentages(true); }} className="hover:bg-teal-600 w-1/2 hover:duration-150 border-b-2 py-2 border-gray-600">+10%</button>
                        </div>
                        <div className="flex font-medium transition">
                            <button onClick={() => { setPercentageVisible("+15%"); setPercentage(0.15); setOpenFormPercentages(true); }} className="hover:bg-teal-600 w-1/2 hover:duration-150 border-r-2 py-2 border-b-2 border-gray-600">+15%</button>
                            <button onClick={() => { setPercentageVisible("+20%"); setPercentage(0.2); setOpenFormPercentages(true); }} className="hover:bg-teal-600 w-1/2 hover:duration-150 border-b-2 py-2 border-gray-600">+20%</button>
                        </div>
                        {openPercentageEdit === "increase" ? (
                            <input
                                value={percentageEditValue}
                                className="flex w-full justify-center border-b-2 border-gray-600 items-center focus:outline-none bg-transparent h-12 text-center text-lg font-medium"
                                placeholder="X%"
                                type="text"
                                pattern="[0-9]*"
                                onChange={(event) => {
                                    const numericValue = event.target.value.replace(/\D/g, "");
                                    setPercentageEditValue(numericValue + "%");
                                }}
                            />
                        ) : (
                            <button onClick={() => setOpenPercentageEdit("increase")} className="font-medium hover:bg-teal-600 w-full hover:duration-150 border-b-2 py-2 border-gray-600">
                                Personalizar +X%
                            </button>
                        )}
                        <h1 className={`${chapterData.length > 0 ? "" : "line-through"} flex justify-center items-center bg-teal-600 text-center px-1 text-white font-semibold text-xl py-2 border-b-2 border-gray-600`}>
                            DISMINUIR TODO
                        </h1>
                        <div className="flex font-medium transition">
                            <button onClick={() => { setPercentageVisible("-5%"); setPercentage(-0.05); setOpenFormPercentages(true); }} className="hover:bg-red-800 w-1/2 hover:duration-150 border-r-2 py-2 border-b-2 border-gray-600">-5%</button>
                            <button onClick={() => { setPercentageVisible("-10%"); setPercentage(-0.1); setOpenFormPercentages(true); }} className="hover:bg-red-800 w-1/2 hover:duration-150 border-b-2 py-2 border-gray-600">-10%</button>
                        </div>
                        <div className="flex font-medium transition">
                            <button onClick={() => { setPercentageVisible("-15%"); setPercentage(-0.15); setOpenFormPercentages(true); }} className="hover:bg-red-800 w-1/2 hover:duration-150 border-r-2 py-2 rounded-bl-md border-gray-600">-15%</button>
                            <button onClick={() => { setPercentageVisible("-20%"); setPercentage(-0.2); setOpenFormPercentages(true); }} className="hover:bg-red-800 w-1/2 hover:duration-150 py-2 rounded-br-md border-gray-600">-20%</button>
                        </div>
                        {openPercentageEdit === "decrease" ? (
                            <input
                                value={percentageEditValue}
                                className="flex w-full justify-center border-t-2 border-gray-600 items-center focus:outline-none bg-transparent h-12 text-center text-lg font-medium"
                                placeholder="X%"
                                type="text"
                                pattern="[0-9]*"
                                onChange={(event) => {
                                    const numericValue = event.target.value.replace(/\D/g, "");
                                    setPercentageEditValue("-" + numericValue + "%");
                                    setPercentage(-(parseFloat(numericValue) / 100));
                                    setPercentageVisible("-" + numericValue + "%");
                                }}
                            />
                        ) : (
                            <button onClick={() => setOpenPercentageEdit("decrease")} className="font-medium hover:bg-teal-600 w-full hover:duration-150 border-t-2 py-2 border-gray-600">
                                Personalizar -X%
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}