import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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
        if (typeof window.matchMedia !== "function") return undefined;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleSystemThemeChange = (event) => {
            const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
            if (storedTheme !== "dark" && storedTheme !== "light") {
                setTheme(event.matches ? "dark" : "light");
            }
        };

        mediaQuery.addEventListener("change", handleSystemThemeChange);
        return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }, []);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        const themeColor = getComputedStyle(document.documentElement)
            .getPropertyValue("--u-bg")
            .trim();
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
    }, [theme]);

    const updateTheme = useCallback((nextTheme) => {
        const resolvedTheme = typeof nextTheme === "function" ? nextTheme(theme) : nextTheme;
        window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
        setTheme(resolvedTheme);
    }, [theme]);

    const value = useMemo(
        () => ({
            theme,
            isDark: theme === "dark",
            setTheme: updateTheme,
            toggleTheme: () =>
                updateTheme((currentTheme) =>
                    currentTheme === "dark" ? "light" : "dark"
                ),
        }),
        [theme, updateTheme]
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
