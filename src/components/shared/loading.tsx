import { FaTooth } from "react-icons/fa";

export function Loading() {
    return (
        <div className='fixed inset-0 sm:left-56 backdrop-blur-md flex items-center justify-center'>
            <div className='bg-teal-900 p-8 rounded-full shadow-lg animate-spin'>
                <FaTooth size={70} />
            </div>
        </div>
    );
}
