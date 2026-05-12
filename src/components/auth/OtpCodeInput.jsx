import React, { useMemo, useRef } from "react";

function OtpCodeInput({ value, onChange, disabled = false }) {
    const inputsRef = useRef([]);
    const digits = useMemo(() => {
        const next = Array(6).fill("");
        String(value || "")
            .slice(0, 6)
            .split("")
            .forEach((char, index) => {
                next[index] = char;
            });
        return next;
    }, [value]);

    const focusInput = (index) => {
        inputsRef.current[index]?.focus();
        inputsRef.current[index]?.select();
    };

    const handleDigitChange = (index, nextValue) => {
        const clean = nextValue.replace(/\D/g, "").slice(-1);
        const nextDigits = [...digits];
        nextDigits[index] = clean;
        onChange(nextDigits.join(""));

        if (clean && index < 5) {
            focusInput(index + 1);
        }
    };

    const handleKeyDown = (index, event) => {
        if (event.key === "Backspace" && !digits[index] && index > 0) {
            focusInput(index - 1);
        }
        if (event.key === "ArrowLeft" && index > 0) {
            focusInput(index - 1);
        }
        if (event.key === "ArrowRight" && index < 5) {
            focusInput(index + 1);
        }
    };

    const handlePaste = (event) => {
        event.preventDefault();
        const clean = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        onChange(clean);
        const focusIndex = clean.length === 6 ? 5 : Math.max(clean.length, 0);
        focusInput(focusIndex);
    };

    return (
        <div className="otp-grid" onPaste={handlePaste}>
            {digits.map((digit, index) => (
                <input
                    key={index}
                    ref={(node) => {
                        inputsRef.current[index] = node;
                    }}
                    className="otp-grid__input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    disabled={disabled}
                    onChange={(event) => handleDigitChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                />
            ))}
        </div>
    );
}

export default OtpCodeInput;
