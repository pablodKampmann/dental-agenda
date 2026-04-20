interface props {
    insurance: string;
    setInsurance: (value: string) => void;
    plan: string;
    setPlan: (value: string) => void;
    affiliate: string;
    setAffiliate: (value: string) => void;
}

export function ThirdCard({insurance, setInsurance, plan, setPlan, affiliate, setAffiliate}: props) {

    return (
        <div>
            <h2 className="text-lg  font-semibold">Datos Medicos</h2>
            <div className="flex-col text-base space-y-4 my-4">
                <div className="flex items-center">
                    <label className="relative tracking-tighter">
                        Obra Social:
                        <p className="absolute -top-2 font-semibold text-sm -right-2 text-red-800">*</p>
                    </label>
                    <input value={insurance} onChange={(e) => setInsurance(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                </div>
                <div className="flex items-center">
                    <label className="tracking-tighter">
                        Plan:
                    </label>
                    <input value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                </div>
                <div className="flex items-center">
                    <label className="tracking-tighter">
                        Núm. Afiliado:
                    </label>
                    <input value={affiliate} onChange={(e) => setAffiliate(e.target.value)} className="w-full ml-4 border-2 border-gray-300 rounded-xl px-3 focus:outline-teal-700" />
                </div>
            </div>
        </div>
    );
}
