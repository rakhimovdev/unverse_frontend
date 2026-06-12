export const createAttemptKey = (moduleType = "module", testId = "test") => {
    const safeModule = String(moduleType || "module").toLowerCase();
    const safeTestId = String(testId || "test");
    const time = Date.now();

    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
        return `${safeModule}-${safeTestId}-${time}-${window.crypto.randomUUID()}`;
    }

    return `${safeModule}-${safeTestId}-${time}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
};
