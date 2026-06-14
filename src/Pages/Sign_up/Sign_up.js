import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import axios from "../../Api/Axios";
import AuthShell from "../../components/auth/AuthShell";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import { useAuth } from "../../context/AuthContext";
import {
    setPendingVerificationEmail
} from "../../utils/authStorage";
import { resolveDashboardPath } from "../../utils/authRoutes";

function SignUp() {
    const navigate = useNavigate();
    const { persistSession } = useAuth();

    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        password: "",
        confirmPassword: "",
        studentType: "outsider",
        teacherId: "",
        timeGroup: "",
        time: "",
        timeSlotIds: []
    });
    const [teachers, setTeachers] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const goToOtpScreen = (pendingEmail, message, retryAfter = 60) => {
        if (!pendingEmail) return;

        setPendingVerificationEmail(pendingEmail);
        navigate(`/verify-otp?email=${encodeURIComponent(pendingEmail)}`, {
            state: {
                message,
                retryAfter
            }
        });
    };

    useEffect(() => {
        let isMounted = true;

        const fetchTeachers = async () => {
            setLoadingOptions(true);

            try {
                const response = await axios.get("/student/teachers");
                if (isMounted) {
                    setTeachers(response.data || []);
                }
            } catch (requestError) {
                if (isMounted) {
                    setError(
                        requestError.response?.data?.message ||
                            "Teacher list could not be loaded."
                    );
                }
            } finally {
                if (isMounted) setLoadingOptions(false);
            }
        };

        fetchTeachers();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchSlots = async () => {
            if (
                formData.studentType === "outsider" ||
                !formData.teacherId ||
                !formData.timeGroup
            ) {
                setTimeSlots([]);
                return;
            }

            setLoadingOptions(true);

            try {
                const response = await axios.get("/student/timeslots", {
                    params: {
                        teacherId: formData.teacherId,
                        group: formData.timeGroup
                    }
                });

                if (isMounted) {
                    setTimeSlots(response.data || []);
                }
            } catch (requestError) {
                if (isMounted) {
                    setError(
                        requestError.response?.data?.message ||
                            "Time slot list could not be loaded."
                    );
                }
            } finally {
                if (isMounted) setLoadingOptions(false);
            }
        };

        fetchSlots();

        return () => {
            isMounted = false;
        };
    }, [formData.studentType, formData.teacherId, formData.timeGroup]);

    const finishGoogleAuth = (payload) => {
        persistSession({
            token: payload.token,
            user: payload.user
        });
        navigate(resolveDashboardPath(payload.user?.role), { replace: true });
    };

    const handleGoogleSignup = async (credential) => {
        if (!credential) {
            setError("Google sign-up did not return a credential.");
            return;
        }

        setGoogleLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await axios.post("/auth/google", { credential });
            finishGoogleAuth(response.data);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "Google sign-up failed. Please try again."
            );
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (formData.fullname.trim().length < 3) {
            setError("Please enter your full name.");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        if (formData.studentType !== "outsider") {
            if (!formData.teacherId || !formData.timeGroup || !formData.time) {
                setError("Please choose your teacher and time slot.");
                setLoading(false);
                return;
            }
        }

        try {
            const payload = {
                fullname: formData.fullname,
                email: formData.email.trim(),
                password: formData.password,
                studentType: formData.studentType,
                teacherId: formData.teacherId || undefined,
                timeGroup: formData.timeGroup || undefined,
                time: formData.time || undefined,
                timeSlotIds: formData.timeSlotIds
            };

            const response = await axios.post("/auth/register", payload);
            const pendingEmail = response.data?.email || formData.email.trim().toLowerCase();
            const nextMessage =
                response.data?.message ||
                "Your OTP code is on the way. Verify your email to continue.";

            setSuccess(nextMessage);
            goToOtpScreen(
                pendingEmail,
                nextMessage,
                response.data?.cooldownSeconds || 60
            );
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "We could not create your account right now."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            badge="Create Account"
            title="Start learning with a secure student account"
            subtitle="Register with email + OTP or sign up instantly with Google. Everything is designed to feel fast, modern, and trustworthy."
            footer={
                <>
                    Already have an account? <Link to="/sign_in">Sign in</Link>
                </>
            }
        >
            <div className="auth-card__header">
                <h2>Create account</h2>
                <p>
                    We will send a 6-digit verification code to activate your
                    account before first login.
                </p>
            </div>

            {success ? <div className="auth-alert auth-alert--success">{success}</div> : null}
            {error ? <div className="auth-alert auth-alert--error">{error}</div> : null}

            <GoogleAuthButton
                onSuccess={handleGoogleSignup}
                onError={() =>
                    setError("Google sign-up could not be completed. Please try again.")
                }
            />

            {googleLoading ? (
                <div className="auth-helper-text">Creating your Google account...</div>
            ) : null}

            <div className="auth-divider">or</div>

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-grid">
                    <div className="auth-field">
                        <label htmlFor="fullname">Full name</label>
                        <input
                            id="fullname"
                            type="text"
                            placeholder="Muhammad Ali"
                            value={formData.fullname}
                            autoComplete="name"
                            onChange={(event) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    fullname: event.target.value
                                }))
                            }
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@bandup.uz"
                            value={formData.email}
                            autoComplete="email"
                            onChange={(event) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    email: event.target.value
                                }))
                            }
                            required
                        />
                    </div>
                </div>

                <div className="auth-grid">
                    <div className="auth-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="At least 6 characters"
                            value={formData.password}
                            autoComplete="new-password"
                            onChange={(event) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    password: event.target.value
                                }))
                            }
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="confirmPassword">Confirm password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Repeat your password"
                            value={formData.confirmPassword}
                            autoComplete="new-password"
                            onChange={(event) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    confirmPassword: event.target.value
                                }))
                            }
                            required
                        />
                    </div>
                </div>

                <span className="auth-section-title">Learning setup</span>

                <div className="auth-field">
                    <label htmlFor="studentType">Student type</label>
                    <select
                        id="studentType"
                        value={formData.studentType}
                        onChange={(event) => {
                            const nextType = event.target.value;
                            setFormData((prev) => ({
                                ...prev,
                                studentType: nextType,
                                teacherId: nextType === "outsider" ? "" : prev.teacherId,
                                timeGroup: nextType === "outsider" ? "" : prev.timeGroup,
                                time: nextType === "outsider" ? "" : prev.time,
                                timeSlotIds: nextType === "outsider" ? [] : prev.timeSlotIds
                            }));
                            setTimeSlots([]);
                        }}
                    >
                        <option value="outsider">Outsider</option>
                        <option value="insider">Insider</option>
                    </select>
                    <span className="auth-field__hint">
                        Choose outsider if you are learning independently, or insider if
                        you need a teacher + schedule assignment.
                    </span>
                </div>

                {formData.studentType !== "outsider" ? (
                    <div className="auth-grid">
                        <div className="auth-field">
                            <label htmlFor="teacherId">Teacher</label>
                            <select
                                id="teacherId"
                                value={formData.teacherId}
                                onChange={(event) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        teacherId: event.target.value,
                                        time: "",
                                        timeSlotIds: []
                                    }))
                                }
                                disabled={loadingOptions}
                                required
                            >
                                <option value="">Choose a teacher</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher._id} value={teacher._id}>
                                        {teacher.fullname ||
                                            [teacher.name, teacher.lastname].filter(Boolean).join(" ") ||
                                            teacher.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="timeGroup">Group</label>
                            <select
                                id="timeGroup"
                                value={formData.timeGroup}
                                onChange={(event) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        timeGroup: event.target.value,
                                        time: "",
                                        timeSlotIds: []
                                    }))
                                }
                                disabled={loadingOptions || !formData.teacherId}
                                required
                            >
                                <option value="">Choose juft or toq</option>
                                <option value="juft">
                                    Juft (Tue / Thu / Sat)
                                </option>
                                <option value="toq">
                                    Toq (Mon / Wed / Fri)
                                </option>
                            </select>
                        </div>

                        <div className="auth-field" style={{ gridColumn: "1 / -1" }}>
                            <label htmlFor="time">Time slot</label>
                            <select
                                id="time"
                                value={formData.time}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    const matched = timeSlots.find((slot) => slot.time === value);
                                    setFormData((prev) => ({
                                        ...prev,
                                        time: value,
                                        timeSlotIds: matched?.slotIds || []
                                    }));
                                }}
                                disabled={
                                    loadingOptions ||
                                    !formData.teacherId ||
                                    !formData.timeGroup
                                }
                                required
                            >
                                <option value="">Choose a time</option>
                                {timeSlots.map((slot) => (
                                    <option key={slot.time} value={slot.time}>
                                        {slot.time}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                ) : null}

                <button className="auth-button" type="submit" disabled={loading}>
                    {loading ? "Sending verification code..." : "Create account"}
                </button>
            </form>
        </AuthShell>
    );
}

export default SignUp;
