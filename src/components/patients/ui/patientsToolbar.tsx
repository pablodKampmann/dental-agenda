import { TbUserSearch } from 'react-icons/tb';

interface props {
    searchContent: string;
    setSearchContent: (value: string) => void;
    selectedField: 'name' | 'dni';
    setSelectedField: (value: 'name' | 'dni') => void;
}

const FIELDS = [
    { id: 'name', label: 'Nombre', placeholder: 'Buscar por nombre o apellido...' },
    { id: 'dni', label: 'DNI', placeholder: 'Buscar por DNI...' },
] as const;

export function PatientsToolbar({ searchContent, setSearchContent, selectedField, setSelectedField }: props) {
    const activeField = FIELDS.find((field) => field.id === selectedField)!;

    function handleSelectField(id: 'name' | 'dni') {
        setSelectedField(id);
        setSearchContent('');
    }

    return (
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-200">
            <div className="relative flex-1 min-w-0 md:flex-none md:w-80">
                <TbUserSearch
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-700 pointer-events-none"
                    size={17}
                />
                <input
                    autoComplete="off"
                    type="text"
                    name="search"
                    placeholder={activeField.placeholder}
                    value={searchContent}
                    onChange={(e) => {
                        const inputValue = e.target.value;
                        setSearchContent(
                            selectedField === 'dni' ? inputValue.replace(/[^0-9]/g, '') : inputValue
                        );
                    }}
                    className="h-9 w-full pl-8 pr-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-sm text-black placeholder:text-gray-400 focus:outline-teal-700"
                />
            </div>

            <div className="flex gap-0.5 p-0.5 shrink-0 bg-gray-100 border-2 border-gray-300 rounded-lg select-none">
                {FIELDS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectField(id)}
                        className={`h-7 px-3 rounded-md text-xs font-semibold transition duration-150 ${
                            selectedField === id
                                ? 'bg-teal-700 text-white shadow-sm'
                                : 'text-gray-500 hover:text-black'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
