import React from 'react';
import { signOut } from "firebase/auth";
import { auth } from "./../firebase";

interface ModalSettProps {
    onCloseModal: () => void;
}

export function ModalSett({ onCloseModal }: ModalSettProps) {
    const user = auth.currentUser;

    function HandleModalClick(e: any) {
        e.stopPropagation();
    }

    function HandleCloseModal() {
        onCloseModal();
    }

    async function HandleSignOut(e: any) {
        e.preventDefault();
        await signOut(auth);
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute top-14 right-0" onClick={HandleModalClick}>
                <div className="bg-white rounded-lg shadow dark:bg-gray-800" onClick={HandleModalClick}>
                    <button
                        type="button"
                        className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                        data-modal-hide="authentication-modal"
                        onClick={HandleCloseModal}
                    >
                        <svg
                            className="w-3 h-3"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 14"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                            />
                        </svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                    <div className="px-4 py-4 lg:px-6">
                        <h3 className="mb-2 mt-7 text-xl font-medium text-gray-900 dark:text-white">{user?.displayName}</h3>
                        <form className="space-y-4" action="#">
                            <button onClick={HandleSignOut}
                                type="submit"
                                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            >
                                Cerrar Sesion
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
