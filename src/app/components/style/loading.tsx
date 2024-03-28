import { FaTooth } from "react-icons/fa";

export function Loading() {
    return (
        <div className='fixed inset-0 backdrop-blur-sm ml-56'>
            <div className='fixed inset-0 flex items-center justify-center'>
                <div className='bg-teal-900 p-8 rounded-full shadow-lg animate-spin'>
                    <FaTooth size={70} />
                </div>
            </div>
        </div>
    );
}
