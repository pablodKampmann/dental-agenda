'use client'
import * as React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { FirstCard } from "./firstCard";
import { SecondCard } from "./secondCard";
import { ThirdCard } from "./thirdCard";
import { SetPatients } from "../../db/setPatients";
import { formatPhoneNumberIntl } from 'react-phone-number-input';
import { getInsuranceOptions } from "../../../options/getInsuranceOpt";
import dayjs from 'dayjs';

const MINI_INPUT_CLS = "h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-70 text-black";
const MINI_BTN = "font-semibold flex justify-center items-center w-full px-4 py-3 rounded-md focus:outline-none transition duration-200";

interface props {
    onClose: () => void;
    onSuccess: () => void;
}

export function CarouselFormCreatePatient({ onClose, onSuccess }: props) {
    // Form state
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [gender, setGender] = useState("");
    const [date, setDate] = useState("");
    const [dni, setDni] = useState("");
    const [address, setAddress] = useState("");
    const [num, setNum] = useState("");
    const [email, setEmail] = useState("");
    const [insurance, setInsurance] = useState("");
    const [plan, setPlan] = useState("");
    const [affiliate, setAffiliate] = useState("");

    const [insuranceOptions, setInsuranceOptions] = useState<null | any[]>(null);
    const [planOptions, setPlanOptions] = useState<string[]>([]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [carouselKey, setCarouselKey] = useState(0);
    const [validationError, setValidationError] = useState("");

    // Mini modal — insurance
    const [openInsuranceModal, setOpenInsuranceModal] = useState(false);
    const [newInsuranceName, setNewInsuranceName] = useState("");
    const [insuranceMounted, setInsuranceMounted] = useState(false);

    // Mini modal — plan
    const [openPlanModal, setOpenPlanModal] = useState(false);
    const [newPlanName, setNewPlanName] = useState("");
    const [planMounted, setPlanMounted] = useState(false);

    useEffect(() => {
        async function Get() {
            const options = await getInsuranceOptions();
            if (options !== null) setInsuranceOptions(options);
        }
        Get();
    }, []);

    useEffect(() => {
        if (openInsuranceModal) {
            const frame = requestAnimationFrame(() => setInsuranceMounted(true));
            return () => cancelAnimationFrame(frame);
        }
        setInsuranceMounted(false);
    }, [openInsuranceModal]);

    useEffect(() => {
        if (openPlanModal) {
            const frame = requestAnimationFrame(() => setPlanMounted(true));
            return () => cancelAnimationFrame(frame);
        }
        setPlanMounted(false);
    }, [openPlanModal]);

    // Reset plan when insurance changes
    useEffect(() => {
        setPlan("");
    }, [insurance]);

    function resetForm() {
        setName(""); setLastName(""); setGender(""); setDate("");
        setDni(""); setAddress(""); setNum(""); setEmail("");
        setInsurance(""); setPlan(""); setAffiliate("");
        setValidationError("");
        setCurrentIndex(0);
        setCarouselKey(k => k + 1);
    }

    function handleAddInsurance() {
        if (!newInsuranceName.trim()) return;
        setInsuranceOptions(prev => prev ? [...prev, newInsuranceName.trim()] : [newInsuranceName.trim()]);
        setInsurance(newInsuranceName.trim());
        setNewInsuranceName("");
        setOpenInsuranceModal(false);
    }

    function handleAddPlan() {
        if (!newPlanName.trim()) return;
        const trimmed = newPlanName.trim();
        setPlanOptions(prev => [...prev, trimmed]);
        setPlan(trimmed);
        setNewPlanName("");
        setOpenPlanModal(false);
    }

    const cards = [
        <FirstCard key="first" name={name} setName={setName} lastName={lastName} setLastName={setLastName} gender={gender} setGender={setGender} date={date} setDate={setDate} dni={dni} setDni={setDni} address={address} setAddress={setAddress} />,
        <SecondCard key="second" num={num} setNum={setNum} email={email} setEmail={setEmail} />,
        <ThirdCard key="third" insurance={insurance} setInsurance={setInsurance} plan={plan} setPlan={setPlan} affiliate={affiliate} setAffiliate={setAffiliate} insuranceOptions={insuranceOptions} planOptions={planOptions} onOpenInsuranceModal={() => setOpenInsuranceModal(true)} onOpenPlanModal={() => setOpenPlanModal(true)} />
    ];

    const handleNextClick = async () => {
        setValidationError("");
        if (currentIndex === 0 && (!name || !lastName || !gender || !date || !dni)) {
            setValidationError("Completá todos los campos obligatorios (*) antes de continuar.");
            return;
        }
        if (currentIndex === 1 && !num) {
            setValidationError("El número de teléfono es obligatorio.");
            return;
        }
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            (document.querySelector('.carousel-next') as HTMLElement)?.click();
        } else {
            if (!insurance) {
                setValidationError("La obra social es obligatoria.");
                return;
            }
            const formattedDate = dayjs(date).format('DD/MM/YYYY');
            const formattedNum = formatPhoneNumberIntl(num);
            await SetPatients(name, lastName, gender, formattedDate, dni, formattedNum, address, email, insurance, plan, affiliate);
            resetForm();
            onSuccess();
            onClose();
        }
    };

    const handlePreviousClick = () => {
        setValidationError("");
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            (document.querySelector('.carousel-previous') as HTMLElement)?.click();
        }
    };

    return (
        <>
            <Carousel key={carouselKey} opts={{ duration: 12 }} className="w-full max-w-xs">
                <CarouselContent>
                    {cards.map((card, index) => (
                        <CarouselItem key={index}>
                            <Card className="w-full border-none">
                                {card}
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {validationError && (
                    <p className="text-red-600 text-xs mt-2">{validationError}</p>
                )}

                <div className="flex ml-auto justify-end space-x-3 mt-3">
                    <button
                        className={`px-3 py-1.5 ${currentIndex === 0 ? 'opacity-30 cursor-default' : 'hover:border-black hover:border-opacity-50'} text-sm tracking-tight text-black border-gray-300 border-2 mb-4 transition duration-150 rounded-xl`}
                        onClick={handlePreviousClick}
                    >
                        Retroceder
                    </button>
                    <button
                        className={`px-3 py-1.5 text-sm tracking-tight ${currentIndex === cards.length - 1 ? 'bg-teal-700 border-transparent hover:bg-teal-600 text-white' : 'text-black border-gray-300 hover:border-black hover:border-opacity-50'} mb-4 border-2 transition duration-150 rounded-xl`}
                        onClick={handleNextClick}
                    >
                        {currentIndex === cards.length - 1 ? 'Confirmar' : 'Avanzar'}
                    </button>
                </div>

                <CarouselPrevious className="hidden carousel-previous" />
                <CarouselNext className="hidden carousel-next" />
            </Carousel>

            {openInsuranceModal && (
                <>
                    <div
                        className={`fixed inset-0 z-[100] backdrop-blur-sm bg-black/30 transition-opacity duration-150 ${insuranceMounted ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => { setNewInsuranceName(""); setOpenInsuranceModal(false); }}
                    />
                    <div className="fixed inset-0 z-[101] flex items-center justify-center px-6 pointer-events-none">
                        <div
                            className={`w-full max-w-[400px] border-4 border-gray-600 bg-white shadow-xl rounded-xl px-6 py-5 transition-all duration-150 ease-out pointer-events-auto ${insuranceMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-semibold text-black mb-4">Nueva Obra Social</h2>
                            <input
                                type="text"
                                placeholder="Nombre de la obra social"
                                value={newInsuranceName}
                                onChange={(e) => setNewInsuranceName(e.target.value)}
                                className={MINI_INPUT_CLS}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInsurance(); } }}
                            />
                            <div className="flex space-x-3 mt-4">
                                <button type="button" onClick={() => { setNewInsuranceName(""); setOpenInsuranceModal(false); }} className={`${MINI_BTN} bg-red-900 hover:bg-red-800 text-red-200 hover:text-white`}>CANCELAR</button>
                                <button type="button" onClick={handleAddInsurance} className={`${MINI_BTN} bg-teal-600 hover:bg-teal-500 text-teal-950 hover:text-white`}>AGREGAR</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {openPlanModal && (
                <>
                    <div
                        className={`fixed inset-0 z-[100] backdrop-blur-sm bg-black/30 transition-opacity duration-150 ${planMounted ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => { setNewPlanName(""); setOpenPlanModal(false); }}
                    />
                    <div className="fixed inset-0 z-[101] flex items-center justify-center px-6 pointer-events-none">
                        <div
                            className={`w-full max-w-[400px] border-4 border-gray-600 bg-white shadow-xl rounded-xl px-6 py-5 transition-all duration-150 ease-out pointer-events-auto ${planMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-semibold text-black mb-4">Nuevo Plan <span className="text-gray-500 font-normal">({insurance})</span></h2>
                            <input
                                type="text"
                                placeholder="Nombre del plan"
                                value={newPlanName}
                                onChange={(e) => setNewPlanName(e.target.value)}
                                className={MINI_INPUT_CLS}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPlan(); } }}
                            />
                            <div className="flex space-x-3 mt-4">
                                <button type="button" onClick={() => { setNewPlanName(""); setOpenPlanModal(false); }} className={`${MINI_BTN} bg-red-900 hover:bg-red-800 text-red-200 hover:text-white`}>CANCELAR</button>
                                <button type="button" onClick={handleAddPlan} className={`${MINI_BTN} bg-teal-600 hover:bg-teal-500 text-teal-950 hover:text-white`}>AGREGAR</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
