import { MdPersonRemoveAlt1 } from 'react-icons/md';
import { FaRunning } from 'react-icons/fa';
import { deletePatient } from "./deletePatient";
import { useRouter } from 'next/navigation'
import { logOut } from "./../components/logOut";

interface ModalSettProps {
    onCloseModal: () => void;
    firstMessage: string | null;
    secondMessage: string | null;
    action: string | null;
    id: string | null;
}

export function Alert({ id, firstMessage, secondMessage, action, onCloseModal }: ModalSettProps) {
    const router = useRouter()

    async function handleDelete() {
        onCloseModal();
        await deletePatient(id);
        router.push('/patients')
    }

    async function handleLogOut() {
        onCloseModal();
        await logOut();
    }

    function handleCloseModal() {
        onCloseModal();
    }

    if (action === 'Cerrar Sesion') {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col p-5 rounded-lg shadow bg-white border-4 border-teal-600">
                    <div className="flex flex-col items-center text-center">
                        <div className="inline-block p-3 bg-teal-700 rounded-full">
                            <FaRunning size={40} className="text-teal-100" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-gray-800">Ojo!</h2>
                        <p className="mt-2 text-md text-gray-600 leading-relaxed">{firstMessage}</p>
                    </div>
                    <div className="flex items-center mt-3">
                        <button onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md transition duration-200">
                            Cancelar
                        </button>
                        <button onClick={handleLogOut} className="flex-1 px-4 py-2 ml-2 bg-red-400 hover:bg-red-700 text-white text-md font-medium rounded-md transition duration-200">
                            {action}
                        </button>
                    </div>
                </div>
            </div>
        );
    } else if (action === 'Eliminar') {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col p-5 rounded-lg shadow bg-white border-4 border-teal-500">
                    <div className="flex flex-col items-center text-center">
                        <div className="inline-block p-3 bg-teal-700 rounded-full">
                            <MdPersonRemoveAlt1 size={40} className="text-teal-100" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-gray-800">Ojo!</h2>
                        <p className="mt-2 text-md text-gray-600 leading-relaxed">{firstMessage}</p>
                        <p className=" text-md text-gray-900 font-semibold leading-relaxed">{secondMessage}</p>
                    </div>
                    <div className="flex items-center mt-3">
                        <button onClick={handleCloseModal} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md transition duration-200">
                            Cancelar
                        </button>
                        <button onClick={handleDelete} className="flex-1 px-4 py-2 ml-2 bg-red-400 hover:bg-red-700 text-white text-md font-medium rounded-md transition duration-200">
                            {action}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

}
