import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "../Api/Axios";
import {
    clearAuthSession,
    getStoredToken,
    getStoredUser,
    saveAuthSession
} from "../utils/authStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => getStoredToken());
    const [user, setUser] = useState(() => getStoredUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const bootstrap = async () => {
            const storedToken = getStoredToken();

            if (!storedToken) {
                if (isMounted) setLoading(false);
                return;
            }

            try {
                const response = await axios.get("/auth/me", {
                    headers: { Authorization: `Bearer ${storedToken}` }
                });

                if (!isMounted) return;

                const nextUser = response.data?.user || response.data;
                if (nextUser) {
                    saveAuthSession({ token: storedToken, user: nextUser });
                    setToken(storedToken);
                    setUser(nextUser);
                } else {
                    clearAuthSession();
                    setToken("");
                    setUser(null);
                }
            } catch (error) {
                if (!isMounted) return;
                clearAuthSession();
                setToken("");
                setUser(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        bootstrap();

        return () => {
            isMounted = false;
        };
    }, []);

    const persistSession = ({ token: nextToken, user: nextUser }) => {
        saveAuthSession({ token: nextToken, user: nextUser });
        setToken(nextToken);
        setUser(nextUser);
    };

    const logout = () => {
        clearAuthSession();
        setToken("");
        setUser(null);
    };

    const refreshCurrentUser = async () => {
        const activeToken = getStoredToken();
        if (!activeToken) return null;

        const response = await axios.get("/auth/me", {
            headers: { Authorization: `Bearer ${activeToken}` }
        });
        const nextUser = response.data?.user || response.data;
        if (nextUser) {
            persistSession({ token: activeToken, user: nextUser });
        }
        return nextUser;
    };

    const value = {
        token,
        user,
        loading,
        isAuthenticated: Boolean(token && user),
        persistSession,
        logout,
        refreshCurrentUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
