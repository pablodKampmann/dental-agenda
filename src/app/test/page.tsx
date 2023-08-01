import React from 'react';

export default function ModalSett() {

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-gray-700 bg-opacity-50"></div>
            <div className="absolute top-14 right-0">
                <div className="bg-white rounded-lg shadow dark:bg-gray-700">
                    <div className="px-4 py-4 lg:px-6">
                        <h3 className="mb-2 text-xl font-medium text-gray-900 dark:text-white">Nombre Usuario</h3>
                        <form className="space-y-4" action="#">
                            <button type="submit" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Cerrar Sesion</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
