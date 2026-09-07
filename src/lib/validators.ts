type Validator = (value: string) => string | null;

export function required(message = 'Campo obligatorio'): Validator {
    return (value) => (value.trim() === '' ? message : null);
}

export function numeric(message = 'Solo se permiten números'): Validator {
    return (value) => (value.trim() !== '' && !/^\d+$/.test(value.trim()) ? message : null);
}

export function phone(message = 'Teléfono inválido'): Validator {
    return (value) => (value.trim() !== '' && !/^\+?[\d\s-]+$/.test(value.trim()) ? message : null);
}

export function email(message = 'Correo inválido'): Validator {
    return (value) => (value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? message : null);
}

export function combine(...validators: Validator[]): Validator {
    return (value) => {
        for (const validate of validators) {
            const error = validate(value);
            if (error) return error;
        }
        return null;
    };
}
