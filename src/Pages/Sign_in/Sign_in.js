import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import axios from "../../Api/Axios";
import AuthShell from "../../components/auth/AuthShell";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import { useAuth } from "../../context/AuthContext";
import { setPendingVerificationEmail } from "../../utils/authStorage";
import { resolveDashboardPath } from "../../utils/authRoutes";

function SignIn() {
    const navigate = useNavigate();
    const location = useLocation();
    const { persistSession } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");

    const successMessage = useMemo(
        () => location.state?.message || "",
        [location.state]
    );

    const redirectTo = location.state?.from?.pathname || "";

    const finishLogin = (payload) => {
        persistSession({
            token: payload.token,
            user: payload.user
        });
        navigate(redirectTo || resolveDashboardPath(payload.user?.role), {
            replace: true
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await axios.post("/auth/login", {
                email: formData.email.trim(),
                password: formData.password
            });
            finishLogin(response.data);
        } catch (requestError) {
            const responseData = requestError.response?.data || {};
            const verificationEmail =
                responseData?.details?.email || formData.email.trim().toLowerCase();

            if (responseData?.details?.requiresVerification && verificationEmail) {
                setPendingVerificationEmail(verificationEmail);
                navigate(`/verify-otp?email=${encodeURIComponent(verificationEmail)}`, {
                    replace: true,
                    state: {
                        message:
                            responseData.message ||
                            "Verify your email to complete sign in and unlock your dashboard."
                    }
                });
                return;
            }

            setError(
                responseData.message ||
                    "Unable to sign in right now. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (credential) => {
        if (!credential) {
            setError("Google sign-in did not return a credential.");
            return;
        }

        setGoogleLoading(true);
        setError("");

        try {
            const response = await axios.post("/auth/google", { credential });
            finishLogin(response.data);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    (requestError.request
                        ? "Google sign-in could not reach the server. Make sure the API is running and restart the frontend after env changes."
                        : "Google sign-in failed. Please try again.")
            );
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <AuthShell
            badge="Secure Access"
            title="Welcome back to BandUp"
            subtitle="Sign in with email or continue with Google to jump straight into your learning dashboard."
            footer={
                <>
                    New here? <Link to="/sign_up">Create your account</Link>
                </>
            }
        >
            <div className="auth-card__header">
                <h2>Log in</h2>
                <p>
                    Access your courses, scores, and AI-powered tools from one
                    secure place.
                </p>
            </div>

            {successMessage ? (
                <div className="auth-alert auth-alert--success">{successMessage}</div>
            ) : null}
            {error ? <div className="auth-alert auth-alert--error">{error}</div> : null}

            <GoogleAuthButton
                onSuccess={handleGoogleLogin}
                onError={() =>
                    setError("Google sign-in could not be completed. Please try again.")
                }
            />

            {googleLoading ? (
                <div className="auth-helper-text">Signing you in with Google...</div>
            ) : null}

            <div className="auth-divider">or</div>

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-field">
                    <label htmlFor="email">Email or username</label>
                    <input
                        id="email"
                        type="text"
                        placeholder="you@bandup.uz or ali001"
                        value={formData.email}
                        autoComplete="username"
                        onChange={(event) =>
                            setFormData((prev) => ({ ...prev, email: event.target.value }))
                        }
                        required
                    />
                </div>

                <div className="auth-field">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        autoComplete="current-password"
                        onChange={(event) =>
                            setFormData((prev) => ({ ...prev, password: event.target.value }))
                        }
                        required
                    />
                </div>

                <button className="auth-button" type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                </button>
            </form>
        </AuthShell>
    );
}

export default SignIn;
