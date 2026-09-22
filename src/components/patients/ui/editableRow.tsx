import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
    multiline?: boolean;
    validate?: (value: string) => string | null;
    extraActions?: React.ReactNode;
    onEdit?: () => void;
    displayValue?: React.ReactNode;
    /** Tipo del `<input>` default (ignorado si `renderInput`/`multiline` reemplazan el
     * campo). Habilita teclado y validación nativa del browser acordes al dato — ej.
     * `email` para que el teclado de mobile muestre @ y el navegador valide el formato. */
    type?: string;
}

export function EditableRow({ label, value, rowKey, category, rowModify, setRowModify, setChanges, submitChanges, changes, renderInput, multiline, validate, extraActions, onEdit, displayValue, type = 'text' }: props) {
    const isEditing = rowModify === rowKey;
    const contentRef = useRef<HTMLDivElement>(null);
    const prevHeightRef = useRef<number | null>(null);
    const [height, setHeight] = useState<number | 'auto'>('auto');
    const [isAnimating, setIsAnimating] = useState(false);
    const [draft, setDraft] = useState(String(value ?? ''));

    useEffect(() => {
        if (isEditing) setDraft(String(value ?? ''));
    }, [isEditing]);

    const error = isEditing && validate ? validate(draft) : null;

    const prevSignalRef = useRef({ isEditing, error });
    if (prevSignalRef.current.isEditing !== isEditing || prevSignalRef.current.error !== error) {
        prevHeightRef.current = contentRef.current?.scrollHeight ?? null;
        prevSignalRef.current = { isEditing, error };
    }

    useLayoutEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const newHeight = el.scrollHeight;

        if (prevHeightRef.current == null || prevHeightRef.current === newHeight) {
            setHeight('auto');
            setIsAnimating(false);
            prevHeightRef.current = null;
            return;
        }

        setIsAnimating(false);
        setHeight(prevHeightRef.current);
        prevHeightRef.current = null;

        requestAnimationFrame(() => {
            setIsAnimating(true);
            setHeight(newHeight);
        });
    }, [isEditing, error]);

    function handleTransitionEnd(event: React.TransitionEvent) {
        if (event.propertyName !== 'height' || event.target !== event.currentTarget) return;
        setHeight('auto');
        setIsAnimating(false);
    }

    function handleChange(newValue: string) {
        setDraft(newValue);
        setChanges(newValue);
    }

    function handleSubmit() {
        if (error) return;
        submitChanges(changes, rowKey, category);
    }

    function handleKeyPress(event: React.KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        } else if (event.key === 'Escape') {
            setRowModify('');
        }
    }

    return (
        <div className="border-2 border-gray-300 rounded-xl">
            <div
                className={`duration-100 ease-[cubic-bezier(0.4,0,0.2,1)] ${isAnimating ? 'transition-[height] overflow-hidden' : 'overflow-visible'}`}
                style={{ height }}
                onTransitionEnd={handleTransitionEnd}
            >
                <div ref={contentRef} className="px-3 py-2 bg-gray-50 rounded-[10px]">
                    {isEditing ? (
                        <div className="flex flex-col gap-1 flex-1 animate-fade-in">
                            <div className={`flex gap-2 ${multiline ? 'flex-col' : 'items-center'}`}>
                                {!multiline && <span className="text-sm text-gray-500 flex-shrink-0">{label}:</span>}
                                <div className={`flex-1 ${height !== 'auto' ? 'opacity-0' : 'animate-fade-in'}`}>
                                    {renderInput ?? (
                                        multiline ? (
                                            <textarea
                                                autoFocus
                                                value={draft}
                                                onChange={(e) => handleChange(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
                                                rows={3}
                                                className="border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-teal-700 bg-[#F9FAFB] text-black resize-none w-full"
                                            />
                                        ) : (
                                            <input
                                                type={type}
                                                autoFocus
                                                value={draft}
                                                onChange={(e) => handleChange(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                onFocus={(e) => e.target.setSelectionRange(e.target.value.length, e.target.value.length)}
                                                className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-[#F9FAFB] text-black w-full"
                                            />
                                        )
                                    )}
                                </div>
                                <div className={`flex gap-2 flex-shrink-0 ${multiline ? 'justify-end' : ''}`}>
                                    <FaCircleXmark
                                        onClick={() => setRowModify('')}
                                        className="text-gray-400 hover:text-red-600 transition duration-150 cursor-pointer"
                                        size={20}
                                    />
                                    <FaCircleCheck
                                        onClick={handleSubmit}
                                        className={`transition duration-150 ${error ? 'text-gray-300 cursor-not-allowed' : 'text-teal-600 hover:text-teal-700 cursor-pointer'}`}
                                        size={20}
                                    />
                                </div>
                            </div>
                            {error && <span className="text-xs text-red-600 pl-0.5 animate-fade-in">{error}</span>}
                        </div>
                    ) : (
                        <div className={`flex justify-between gap-2 animate-fade-in ${multiline ? 'items-start' : 'items-center'}`}>
                            {multiline ? (
                                <p className="text-sm text-black flex-1 whitespace-pre-wrap min-h-[1.25rem]">
                                    {value || <span className="text-gray-400 italic">Sin observaciones</span>}
                                </p>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">{label}:</span>
                                    <span className="text-sm font-semibold text-black">{displayValue ?? (value || '-')}</span>
                                </div>
                            )}
                            <div className={`flex items-center gap-2 flex-shrink-0 ${multiline ? 'mt-0.5' : ''}`}>
                                {extraActions}
                                <button
                                    onClick={() => { setRowModify(rowKey); setChanges(''); onEdit?.(); }}
                                    className="text-gray-400 hover:text-teal-700 transition duration-150"
                                >
                                    <TbPencilCog size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
