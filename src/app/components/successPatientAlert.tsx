import { useEffect } from 'react';
import { gsap } from 'gsap';

export function SuccessPatientAlert() {
    useEffect(() => {
        const tl = gsap.timeline({ repeat: 1, repeatDelay: 2.5 });

        tl.fromTo(
            '.animate-slide-in-right',
            { yPercent: -100 },
            {
                yPercent: 0,
                duration: 0.5,
                ease: 'power2.out',
            }
        );

        tl.to('.animate-slide-in-right', {
            yPercent: -100,
            duration: 0.5,
            delay: 2,
            ease: 'power2.in',
        });
    }, []);

    return (
        <div className="fixed top-16 flex justify-end w-4/6">
            <div className="animate-slide-in-right mr-40">
                <div
                    className="flex items-center p-4 mb-4 text-md text-green-800 border border-green-300 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800"
                    role="alert"
                >
                    <svg
                        className="flex-shrink-0 inline w-5 h-5 mr-3"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                    </svg>
                    <span className="sr-only">Info</span>
                    <div>
                        <span className="font-medium">Paciente Añadido Exitosamente!</span>
                    </div>
                </div>
            </div>
        </div>
    );
}