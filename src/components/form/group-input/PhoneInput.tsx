"use client";

import CustomSelect from "@/components/form/CustomSelect";
import React, { useMemo, useState } from "react";

interface CountryCode {
  code: string;
  label: string;
}

interface PhoneInputProps {
  countries: CountryCode[];
  placeholder?: string;
  onChange?: (phoneNumber: string) => void;
  selectPosition?: "start" | "end";
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  countries,
  placeholder = "+1 (555) 000-0000",
  onChange,
  selectPosition = "start",
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("US");
  const [phoneNumber, setPhoneNumber] = useState<string>("+1");

  const countryCodes = useMemo(
    () =>
      countries.reduce<Record<string, string>>(
        (acc, { code, label }) => ({ ...acc, [code]: label }),
        {},
      ),
    [countries],
  );

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        value: country.code,
        label: country.code,
      })),
    [countries],
  );

  const handleCountryChange = (newCountry: string) => {
    setSelectedCountry(newCountry);
    setPhoneNumber(countryCodes[newCountry]);
    onChange?.(countryCodes[newCountry]);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneNumber = e.target.value;
    setPhoneNumber(newPhoneNumber);
    onChange?.(newPhoneNumber);
  };

  const countrySelect = (
    <CustomSelect
      options={countryOptions}
      value={selectedCountry}
      onChange={handleCountryChange}
      variant={selectPosition === "start" ? "inline-start" : "inline-end"}
      aria-label="Mã quốc gia"
    />
  );

  return (
    <div className="relative flex">
      {selectPosition === "start" && (
        <div className="absolute left-0 z-10">{countrySelect}</div>
      )}

      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        className={`dark:bg-dark-900 h-11 w-full ${
          selectPosition === "start" ? "pl-[84px]" : "pr-[84px]"
        } rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800`}
      />

      {selectPosition === "end" && (
        <div className="absolute right-0 z-10">{countrySelect}</div>
      )}
    </div>
  );
};

export default PhoneInput;