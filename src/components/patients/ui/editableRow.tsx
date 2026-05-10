import { TbPencilCog } from 'react-icons/tb';
import { FaCircleCheck, FaCircleXmark } from 'react-icons/fa6';

interface props {
    label: string;
    value: any;
    rowKey: string;
    category: string;
    rowModify: string;
    setRowModify: (value: string) => void;
    setChanges: (value: string) => void;
    submitChanges: (changes: string, table: string, category: string) => void;
    changes: string;
    renderInput?: React.ReactNode;
}

export function EditableRow({ label, value, rowKey, category, rowModify, setRowModify, setChanges, submitChanges, changes, renderInput }: props) {
    function handleKeyPress(event: React.KeyboardEvent) {
        if (event.key === 'Enter') {
            submitChanges(changes, rowKey, category);
        } else if (event.key === 'Escape') {
            setRowModify('');
        }
    }

    return (
        <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                {rowModify === rowKey ? (
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm text-gray-500 flex-shrink-0">{label}:</span>
                        {renderInput ?? (
                            <input
                                autoFocus
                                defaultValue={value}
                                onChange={(e) => setChanges(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
                            />
                        )}
                        <FaCircleXmark
                            onClick={() => setRowModify('')}
                            className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                        />
                        <FaCircleCheck
                            onClick={() => submitChanges(changes, rowKey, category)}
                            className="text-teal-600 hover:text-teal-700 transition duration-150 cursor-pointer flex-shrink-0"
                            size={20}
                        />
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{label}:</span>
                            <span className="text-sm font-semibold text-black">{value || '-'}</span>
                        </div>
                        <button
                            onClick={() => { setRowModify(rowKey); setChanges(''); }}
                            className="text-gray-400 hover:text-teal-700 transition duration-150"
                        >
                            <TbPencilCog size={18} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
