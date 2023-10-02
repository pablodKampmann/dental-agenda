import { LuInfo } from 'react-icons/lu';

export function SuccessPatientAlert() {
    return (
        <div className='bg-zinc-200'>
            <div className="flex mt-4 h-20">
                <div className="flex items-center p-4 text-lg bg-gradient-to-b from-teal-700 via-teal-600 to-teal-500 rounded-b-xl border-4 border-teal-700">
                    <LuInfo size={30} className="text-white ml-2 mt-2" />
                    <span className="ml-2 font-md font-bold text-white mr-2 mt-2" >Paciente Guardado</span>
                </div>
            </div>
        </div>

    );
}
