const TOKEN_KEY = "token";
const ROLE_KEY = "role";
const USER_KEY = "user";
const PENDING_EMAIL_KEY = "pendingVerificationEmail";

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY) || "";

export const getStoredRole = () => localStorage.getItem(ROLE_KEY) || "";

export const getStoredUser = () => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
};

export const saveAuthSession = ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, user?.role || "");
    localStorage.setItem(USER_KEY, JSON.stringify(user || null));
};

export const clearAuthSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
};

export const setPendingVerificationEmail = (email) => {
    if (email) {
        localStorage.setItem(PENDING_EMAIL_KEY, email);
    } else {
        localStorage.removeItem(PENDING_EMAIL_KEY);
    }
};

export const getPendingVerificationEmail = () =>
    localStorage.getItem(PENDING_EMAIL_KEY) || "";

export const clearPendingVerificationEmail = () => {
    localStorage.removeItem(PENDING_EMAIL_KEY);
};
