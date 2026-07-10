import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({
    theme: "light",
    isDark: false,
    setTheme: () => {},
    toggleTheme: () => {},
});

const THEME_STORAGE_KEY = "bandup-theme";

const resolveInitialTheme = () => {
    if (typeof window === "undefined") return "light";

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
        return storedTheme;
    }

    if (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
        return "dark";
    }

    return "light";
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(resolveInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const value = useMemo(
        () => ({
            theme,
            isDark: theme === "dark",
            setTheme,
            toggleTheme: () =>
                setTheme((currentTheme) =>
                    currentTheme === "dark" ? "light" : "dark"
                ),
        }),
        [theme]
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
