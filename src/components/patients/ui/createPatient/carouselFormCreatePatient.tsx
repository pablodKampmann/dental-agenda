import * as React from "react";
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
import { useState } from "react";
import { SetPatients } from "../../db/setPatients";

interface props {
    setOpen: (value: boolean) => void;
    handleGetPatients: (quantity: number) => void;
}

export function CarouselFormCreatePatient({ setOpen, handleGetPatients }: props) {

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

    const cards = [
        <FirstCard key="first" name={name} setName={setName} lastName={lastName} setLastName={setLastName} gender={gender} setGender={setGender} date={date} setDate={setDate} dni={dni} setDni={setDni} address={address} setAddress={setAddress} />,
        <SecondCard key="second" num={num} setNum={setNum} email={email} setEmail={setEmail} />,
        <ThirdCard key="third" insurance={insurance} setInsurance={setInsurance} plan={plan} setPlan={setPlan} affiliate={affiliate} setAffiliate={setAffiliate} />
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNextClick = async () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            (document.querySelector('.carousel-next') as HTMLElement)?.click();
        } else {
            if (!name || !lastName || !gender || !date || !dni || !num || !insurance) {
                return;
            }
            await SetPatients(name, lastName, gender, date, dni, num, address, email, insurance, plan, affiliate)
            await handleGetPatients(20);
            setOpen(false);
        }
    };

    const handlePreviousClick = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            (document.querySelector('.carousel-previous') as HTMLElement)?.click();
        }
    };

    return (
        <Carousel className="w-full text-nowrap max-w-xs">
            <CarouselContent>
                {cards.map((card, index) => (
                    <CarouselItem key={index}>
                        <Card className="w-full border-none">
                            {card}
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>

            <div className="flex ml-auto justify-end space-x-3 mt-4">
                <button
                    className={`px-3 py-1.5 ${currentIndex === 0 ? 'opacity-30 cursor-default' : 'hover:border-black hover:border-opacity-50 cur'} text-sm tracking-tight text-black border-gray-300  border-2 mb-4  transition duration-150  rounded-xl`}
                    onClick={handlePreviousClick}
                >
                    Retroceder
                </button>
                <button
                    className={`px-3 py-1.5 text-sm tracking-tight ${currentIndex === cards.length - 1 ? 'bg-teal-700 border-transparent hover:border-opacity-30 hover:border-black hover:bg-teal-600 text-white' : 'text-black border-gray-300 hover:border-black hover:border-opacity-50 '}  mb-4 border-2 transition duration-150 rounded-xl`}
                    onClick={handleNextClick}
                >
                    {currentIndex === cards.length - 1 ? 'Confirmar' : 'Avanzar'}
                </button>
            </div>

            <CarouselPrevious className="hidden carousel-previous" />
            <CarouselNext className="hidden carousel-next" />
        </Carousel>
    );
}
