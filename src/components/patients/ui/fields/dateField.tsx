import { useRef, useState } from 'react';
import { Dayjs } from 'dayjs';
import { MiniCalendar } from '@/components/appointments/ui/MiniCalendar';
import { useOutsideClick } from '@/hooks/useOutsideClick';

interface Props {
    value: Dayjs | null;
    onChange: (date: Dayjs) => void;
}

export function DateField({ value, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    useOutsideClick(containerRef, () => setOpen(false));

    return (
        <div className="flex-1 relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full text-left border-2 border-gray-300 rounded-lg px-3 py-1 text-sm bg-[#F9FAFB] text-black"
            >
                {value ? value.format('DD/MM/YYYY') : 'DD/MM/YYYY'}
            </button>
            {open && (
                <div className="absolute bottom-full left-0 z-50 mb-1 bg-white border border-gray-200 rounded-xl shadow-xl w-64 animate-popover-rise">
                    <MiniCalendar value={value} onChange={(d) => { onChange(d); setOpen(false); }} />
                </div>
            )}
        </div>
    );
}
