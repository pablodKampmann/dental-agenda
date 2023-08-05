import React from 'react';

export default function ModalSett() {

    return (
        <div className="fixed inset-0 z-50 bg-black backdrop-blur-sm bg-opacity-10 backdrop-filter flex items-center justify-center">
            <form className="relative py-2 sm:max-w-lg sm:mx-auto">
                <div className="border border-2 border-blue-900 relative px-4 py-6 bg-gray-600 mx-4 md:mx-0 shadow rounded-xl sm:p-6 max-w-lg mx-auto">
                   
                    <div className="py-6 text-base leading-6 space-y-3 text-gray-white sm:text-lg sm:leading-7">
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col flex-1">
                                <label className="leading-loose">Nombre</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='name'
                                     
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col flex-1">
                                <label className="leading-loose">Apellido</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='lastName'
                                       
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col flex-2">
                                <label className="leading-loose">Género</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <select
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='gender'
                                        
                                    >
                                        <option value="" disabled selected>
                                            Seleccionar
                                        </option>
                                        <option value="male">Masculino</option>
                                        <option value="female">Femenino</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col" style={{ width: '110px' }}>
                                <label className="leading-loose">Nacimiento</label>
                                <style>
                                    {`input[type="date"]::-webkit-inner-spin-button,input[type="date"]::-webkit-calendar-picker-indicator {display: none; -webkit-appearance: none; }   `}
                                </style>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input
                                        type="date"
                                        className="px-2.5 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='date'
                                        
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col" style={{ width: '105px' }}>
                                <label className="leading-loose">Dni</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                <input
                                        type="date"
                                        className="px-2.5 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='date'
                                        
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col" style={{ width: '220px' }}>
                                <label className="leading-loose">Telefono</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                <input
                                        type="date"
                                        className="px-2.5 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='date'
                                        
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col w-full">
                                <label className="leading-loose">Domicilio</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input
                                        type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='address'
                                        
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col flex-1">
                                <label className="leading-loose">Plan</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='plan'
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col flex-1">
                                <label className="leading-loose">N. Afiliado</label>
                                <div className="relative focus-within:text-gray-600 text-gray-400">
                                    <input type="text"
                                        className="px-3 py-2 border focus:ring-gray-500 focus:border-gray-900 w-full sm:text-sm border-gray-300 rounded-md focus:outline-none text-gray-600"
                                        required
                                        name='affiliate'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-3 flex items-center space-x-3">
                        <button type="button" className="bg-red-900 hover:bg-red-800 font-semibold flex justify-center items-center w-full text-white px-4 py-3 rounded-md focus:outline-none">CANCELAR</button>
                        <button type="submit" className="bg-blue-800 hover:bg-blue-500 font-semibold flex justify-center items-center w-full text-white px-4 py-3 rounded-md focus:outline-none">CREAR</button>
                    </div>
                </div>
            </form>
        </div>
    );
}
