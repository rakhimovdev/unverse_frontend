import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import axios from "../../Api/Axios";
import AuthShell from "../../components/auth/AuthShell";
import OtpCodeInput from "../../components/auth/OtpCodeInput";
import { useAuth } from "../../context/AuthContext";
import {
    clearPendingVerificationEmail,
    getPendingVerificationEmail,
    setPendingVerificationEmail
} from "../../utils/authStorage";
import { resolveDashboardPath } from "../../utils/authRoutes";

function OtpVerification() {
    const location = useLocation();
    const navigate = useNavigate();
    const { persistSession } = useAuth();

    const initialEmail = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return (
            params.get("email") ||
            location.state?.email ||
            getPendingVerificationEmail() ||
            ""
        );
    }, [location.search, location.state]);

    const [email, setEmail] = useState(initialEmail);
    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(
        Number(location.state?.retryAfter || 60)
    );
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(location.state?.message || "");

    useEffect(() => {
        if (!email) return;
        setPendingVerificationEmail(email.trim().toLowerCase());
    }, [email]);

    useEffect(() => {
        if (secondsLeft <= 0) return undefined;

        const timer = window.setTimeout(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [secondsLeft]);

    const handleVerify = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await axios.post("/auth/verify-otp", {
                email: email.trim(),
                otpCode
            });

            persistSession({
                token: response.data.token,
                user: response.data.user
            });
            clearPendingVerificationEmail();
            navigate(resolveDashboardPath(response.data.user?.role), {
                replace: true
            });
        } catch (requestError) {
            const retryAfter = requestError.response?.data?.details?.retryAfter;
            if (retryAfter) {
                setSecondsLeft(retryAfter);
            }
            setError(
                requestError.response?.data?.message ||
                    "Verification failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email || secondsLeft > 0) return;

        setResending(true);
        setError("");
        setSuccess("");

        try {
            const response = await axios.post("/auth/resend-otp", { email: email.trim() });
            setSuccess(
                response.data?.message || "A fresh verification code has been sent."
            );
            setSecondsLeft(Number(response.data?.cooldownSeconds || 60));
        } catch (requestError) {
            const retryAfter = requestError.response?.data?.details?.retryAfter;
            if (retryAfter) {
                setSecondsLeft(retryAfter);
            }
            setError(
                requestError.response?.data?.message ||
                    "Could not resend the code right now."
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <AuthShell
            badge="Verify Email"
            title="Enter the 6-digit code we sent you"
            subtitle="Complete verification to activate your DigiEduSystem account and continue straight into your dashboard."
            footer={
                <>
                    Need a new account? <Link to="/sign_up">Go back to sign up</Link>
                </>
            }
        >
            <div className="auth-card__header">
                <h2>OTP verification</h2>
                <p>
                    Your code expires in 5 minutes. You can resend a new code if the
                    timer reaches zero.
                </p>
            </div>

            {email ? <div className="auth-email-pill">Sending code to {email}</div> : null}

            {success ? <div className="auth-alert auth-alert--success">{success}</div> : null}
            {error ? <div className="auth-alert auth-alert--error">{error}</div> : null}

            <form className="auth-form" onSubmit={handleVerify}>
                <div className="auth-field">
                    <label htmlFor="verify-email">Email</label>
                    <input
                        id="verify-email"
                        type="email"
                        placeholder="you@digiedu.com"
                        value={email}
                        autoComplete="email"
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div className="auth-field">
                    <label>Verification code</label>
                    <OtpCodeInput
                        value={otpCode}
                        onChange={setOtpCode}
                        disabled={loading}
                    />
                </div>

                <div className="auth-inline-actions">
                    <span className="auth-timer">
                        Resend in {String(Math.max(secondsLeft, 0)).padStart(2, "0")}s
                    </span>
                    <button
                        type="button"
                        className="auth-button auth-button--secondary"
                        disabled={secondsLeft > 0 || resending}
                        onClick={handleResend}
                    >
                        {resending ? "Resending..." : "Resend code"}
                    </button>
                </div>

                <button
                    className="auth-button"
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                >
                    {loading ? "Verifying..." : "Verify and continue"}
                </button>
            </form>
        </AuthShell>
    );
}

export default OtpVerification;
