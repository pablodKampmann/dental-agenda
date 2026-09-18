import { TbUserSearch } from 'react-icons/tb';
import { CustomSelect } from '../../shared/CustomSelect';
import { ColumnsVisibilityMenu, type ToggleableColumn } from './columnsVisibilityMenu';

interface props {
    searchContent: string;
    setSearchContent: (value: string) => void;
    selectedField: 'name' | 'dni';
    setSelectedField: (value: 'name' | 'dni') => void;
    insuranceOptions: { value: string; label: string }[];
    selectedInsurance: string;
    setSelectedInsurance: (value: string) => void;
    columns: ToggleableColumn[];
    visibleColumns: Record<string, boolean>;
    onToggleColumn: (key: string) => void;
}

const FIELDS = [
    { id: 'name', label: 'Nombre', placeholder: 'Buscar por nombre o apellido...' },
    { id: 'dni', label: 'DNI', placeholder: 'Buscar por DNI...' },
] as const;

export function PatientsToolbar({
    searchContent,
    setSearchContent,
    selectedField,
    setSelectedField,
    insuranceOptions,
    selectedInsurance,
    setSelectedInsurance,
    columns,
    visibleColumns,
    onToggleColumn,
}: props) {
    const activeField = FIELDS.find((field) => field.id === selectedField)!;

    function handleSelectField(id: 'name' | 'dni') {
        setSelectedField(id);
        setSearchContent('');
    }

    return (
        <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="relative flex-1 min-w-0 md:flex-none md:w-[26rem] flex items-stretch h-9 border-2 border-gray-300 rounded-lg bg-white transition-colors focus-within:border-teal-700">
                <TbUserSearch
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-700 pointer-events-none"
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
                    className="flex-1 min-w-0 pl-9 pr-3 bg-transparent text-sm text-black placeholder:text-gray-400 outline-none rounded-l-lg"
                />
                <div className="flex gap-0.5 p-1 shrink-0 border-l border-gray-200 select-none">
                    {FIELDS.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => handleSelectField(id)}
                            className={`px-3 rounded-md text-xs font-semibold transition duration-150 ${
                                selectedField === id
                                    ? 'bg-teal-700 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-black hover:bg-gray-100'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="shrink-0 w-48">
                <CustomSelect
                    value={selectedInsurance}
                    onChange={setSelectedInsurance}
                    options={insuranceOptions}
                    placeholder="Todas las obras sociales"
                    size="sm"
                    triggerClassName="bg-white"
                />
            </div>

            <div className="ml-auto shrink-0">
                <ColumnsVisibilityMenu
                    columns={columns}
                    visible={visibleColumns}
                    onToggle={onToggleColumn}
                    triggerClassName="bg-white"
                />
            </div>
        </div>
    );
}
