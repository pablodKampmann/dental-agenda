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

interface props {
    setOpen: (value: boolean) => void;
}

export function CarouselFormCreatePatient({ setOpen }: props) {
    const cards = [
        <FirstCard key="first" />,
        <SecondCard key="second" />,
        <ThirdCard key="third" />
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNextClick = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            (document.querySelector('.carousel-next') as HTMLElement)?.click();
        } else {
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
