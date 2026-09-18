"use client";

import type { ComponentType } from "react";
import { CustomSelect } from "./CustomSelect";

interface FlagIconProps {
  country?: string;
  label?: string;
  "aria-hidden"?: boolean;
}

interface Option {
  value?: string;
  label: string;
  divider?: boolean;
}

interface PhoneCountrySelectProps {
  value?: string;
  onChange: (value?: string) => void;
  options: Option[];
  disabled?: boolean;
  readOnly?: boolean;
  iconComponent?: ComponentType<FlagIconProps>;
}

// Reemplaza el `countrySelectComponent` default de react-phone-number-input (que renderiza
// un <select> nativo) por CustomSelect, embebido sin borde propio dentro del mismo box con
// borde que ya tiene el número — ver `input-phone-number` en modalCreatePatient.tsx. La
// librería nos pasa `iconComponent` con la bandera ya resuelta por país, no hay que
// reimplementarla. "ZZ" es el valor que usa la librería para "sin país / internacional".
export function PhoneCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  iconComponent: Icon,
}: PhoneCountrySelectProps) {
  const items = options
    .filter((opt) => !opt.divider)
    .map((opt) => ({ value: opt.value ?? "ZZ", label: opt.label }));

  return (
    <CustomSelect
      value={value ?? "ZZ"}
      onChange={(v) => onChange(v === "ZZ" ? undefined : v)}
      options={items}
      disabled={disabled || readOnly}
      size="sm"
      hideSelectedLabel
      tabIndex={-1}
      triggerClassName="border-0 bg-transparent px-0 h-auto gap-1 hover:border-transparent"
      leadingContent={
        Icon ? (
          <span className="shrink-0 w-5 h-[14px] overflow-hidden rounded-[2px] flex items-center justify-center bg-gray-100">
            <Icon country={value} label={value} aria-hidden />
          </span>
        ) : null
      }
    />
  );
}
