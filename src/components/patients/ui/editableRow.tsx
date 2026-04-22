import { TbPencilCog } from 'react-icons/tb';
import { BsFillCheckCircleFill } from 'react-icons/bs';
import { useRef } from 'react';

interface props {
    label: string;
    value: any;
    rowKey: string;
    category: string;
    rowModify: string;
    hovered: string;
    setRowModify: (value: string) => void;
    setHovered: (value: string) => void;
    setChanges: (value: string) => void;
    submitChanges: (changes: string, table: string, category: string) => void;
    changes: string;
    renderInput?: React.ReactNode;
}

export function EditableRow({ label, value, rowKey, category, rowModify, hovered, setRowModify, setHovered, setChanges, submitChanges, changes, renderInput }: props) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    function handleTextArea() {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.focus();
            textarea.selectionStart = textarea.value.length;
        }
    }

    function handleKeyPress(event: any) {
        if (event.key === 'Enter') {
            submitChanges(changes, rowKey, category);
        } else if (event.key === 'Escape') {
            setRowModify('');
        }
    }

    return (
        <div
            onClick={() => {
                if (rowModify !== rowKey) {
                    setRowModify(rowKey);
                    setChanges('');
                }
            }}
            onMouseEnter={() => setHovered(rowKey)}
            onMouseLeave={() => setHovered('')}
            className={`transition duration-100 hover:cursor-pointer w-[25rem] border-2 border-gray-500 border-dashed ml-4 mb-1 flex items-center rounded-lg p-1 ${hovered === rowKey || rowModify === rowKey ? '' : 'border-transparent'} ${rowModify === rowKey ? 'border-teal-600' : ''}`}
        >
            <h1 className='text-md text-black font-semibold'>{label}:</h1>
            {rowModify === rowKey ? (
                renderInput ?? (
                    <textarea
                        onKeyDown={handleKeyPress}
                        ref={textareaRef}
                        onMouseEnter={handleTextArea}
                        autoFocus
                        defaultValue={value}
                        className="rounded-md text-black bg-teal-600 bg-opacity-20 pl-1 flex h-7 font-semibold focus:outline-transparent focus:text-black text-lg overflow-auto w-full ml-4 mr-4"
                        onChange={(e) => setChanges(e.target.value)}
                    />
                )
            ) : (
                <p className='ml-2 text-gray-700 text-lg w-4/6 overflow-auto'>{value || '-'}</p>
            )}
            <div className='ml-auto'>
                {hovered === rowKey && rowModify !== rowKey && <TbPencilCog size={26} className="text-gray-600" />}
            </div>
            {rowModify === rowKey && (
                <button className="ml-auto" onClick={() => submitChanges(changes, rowKey, category)}>
                    <BsFillCheckCircleFill className="hover:scale-125 duration-150 ease-in-out mr-1 text-teal-600" size={30} />
                </button>
            )}
        </div>
    );
}