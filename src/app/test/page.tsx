import React from 'react';

export default function ModalSett() {

    return (
        <div className="fixed z-50 flex items-center mt-20 mr-5 w-96">
            <div className="relative py-2 h-full flex flex-col">
                <div className="border border-2 border-blue-900 relative px-4 py-6 bg-gray-600 mx-4 md:mx-0 shadow rounded-xl sm:p-6">
                    <h1 className="text-lg flex font-semibold">Paciente: Nombre Apellido</h1>
                    <div className="py-6 text-base leading-6 space-y-3 text-gray-white sm:text-lg sm:leading-7">
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col flex-1">
                                <label className="leading-loose">Nombre</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input
                                        type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 sm:text-sm border-gray-300 bg-gray-500 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name="name"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
