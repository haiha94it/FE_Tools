"use client";

import type React from "react";
import CustomSelect, {
  type CustomSelectOption,
} from "@/components/form/CustomSelect";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value,
  disabled,
}) => {
  const selectOptions: CustomSelectOption[] = options.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  return (
    <CustomSelect
      options={selectOptions}
      placeholder={placeholder}
      onChange={onChange}
      className={className}
      defaultValue={defaultValue}
      value={value}
      disabled={disabled}
    />
  );
};

export default Select;