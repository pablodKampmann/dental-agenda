interface Option {
    value: string;
    label: string;
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    options: Option[];
    placeholder?: string;
}

export function SelectField({ value, onChange, onSubmit, onCancel, options, placeholder }: Props) {
    return (
        <select
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit();
                else if (e.key === 'Escape') onCancel();
            }}
            className="border-2 border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-teal-700 bg-gray-100 text-black flex-1"
        >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}
