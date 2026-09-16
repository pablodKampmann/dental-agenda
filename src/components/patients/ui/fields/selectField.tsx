import { CustomSelect } from '@/components/shared/CustomSelect';

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

// El confirmar/cancelar de la fila (check/X) ya los resuelve EditableRow por fuera de este
// campo — onSubmit/onCancel se mantienen en la firma solo por compatibilidad con los
// callers existentes, que los pasan para el <select> nativo viejo (Enter/Escape).
export function SelectField({ value, onChange, options, placeholder }: Props) {
    return (
        <CustomSelect
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            className="flex-1"
        />
    );
}
