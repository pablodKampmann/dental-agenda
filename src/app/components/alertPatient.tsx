import { MdPersonRemoveAlt1 } from 'react-icons/md';
import { deletePatient } from "./../components/deletePatient";
import { useRouter } from 'next/navigation'
interface ModalSettProps {
    onCloseModal: () => void;
    message: string;
    id: string | null;
}

export function AlertPatient({ id, message, onCloseModal }: ModalSettProps) {
    const router = useRouter()

    async function handleAgree() {
        onCloseModal();
        await deletePatient(id);
        router.push('/patients')
    }

    function handleCloseModal() {
        onCloseModal();
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col p-5 rounded-lg shadow bg-white border-4 border-teal-500">
                <div className="flex flex-col items-center text-center">
                    <div className="inline-block p-3 bg-teal-700 rounded-full">
                        <MdPersonRemoveAlt1 size={40} className="text-teal-100" />
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-gray-800">Cuidado</h2>
                    <p className="mt-2 text-md text-gray-600 leading-relaxed">¿Estás seguro/a de que deseas eliminar a este paciente?</p>
                    <p className=" text-md text-gray-900 font-semibold leading-relaxed">Esta accion sera permanente y no se podra volver atras</p>
                </div>
                <div className="flex items-center mt-3">
                    <button onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md transition duration-200">
                        Cancelar
                    </button>
                    <button onClick={handleAgree} className="flex-1 px-4 py-2 ml-2 bg-red-400 hover:bg-red-700 text-white text-md font-medium rounded-md transition duration-200">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
