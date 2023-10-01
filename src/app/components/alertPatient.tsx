
interface ModalSettProps {
    onCloseModal: () => void;
}

export function AlertPatient({ onCloseModal }: ModalSettProps) {

    function handleAgree() {
        onCloseModal();
    }

    function handleCloseModal() {
        onCloseModal();
    }

    return (
        <div className="absolute inset-x-0 mt-80 mx-96 px-40 ">
            <div className="flex flex-col p-5 rounded-lg shadow bg-white border-4 border-teal-500">
                <div className="flex flex-col items-center text-center">
                    <div className="inline-block p-4 bg-red-100 rounded-full">
                        <svg className="w-12 h-12 fill-current text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" /></svg>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-gray-800">Cuidado</h2>
                    <p className="mt-2 text-md text-gray-600 leading-relaxed">¿Estás seguro/a de que deseas eliminar a este paciente?</p>
                    <p className=" text-md text-gray-900 font-semibold leading-relaxed">Esta accion sera permanente y no se podra volver atras</p>
                </div>
                <div className="flex items-center mt-3">
                    <button onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md">
                        Cancelar
                    </button>
                    <button onClick={handleAgree} className="flex-1 px-4 py-2 ml-2 bg-red-500 hover:bg-red-400 text-white text-md font-medium rounded-md">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
