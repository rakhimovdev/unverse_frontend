import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "../../Api/Axios";
import AuthShell from "../../components/auth/AuthShell";
import { useAuth } from "../../context/AuthContext";
import { resolveDashboardPath } from "../../utils/authRoutes";

function StudentSetup() {
    const navigate = useNavigate();
    const { persistSession, user } = useAuth();

    const [studentType, setStudentType] = useState("");
    const [teachers, setTeachers] = useState([]);
    const [timeGroup, setTimeGroup] = useState("");
    const [teacherId, setTeacherId] = useState("");
    const [time, setTime] = useState("");
    const [timeSlotIds, setTimeSlotIds] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (studentType !== "insider" || teachers.length) {
            setLoadingTeachers(false);
            return undefined;
        }

        let isMounted = true;
        const fetchTeachers = async () => {
            setLoadingTeachers(true);
            setError("");

            try {
                const response = await axios.get("/student/teachers");
                if (isMounted) setTeachers(response.data || []);
            } catch (requestError) {
                if (isMounted) {
                    setError(
                        requestError.response?.data?.message ||
                            "Teacher list could not be loaded. Please try again."
                    );
                }
            } finally {
                if (isMounted) setLoadingTeachers(false);
            }
        };

        fetchTeachers();
        return () => {
            isMounted = false;
        };
    }, [studentType, teachers.length]);

    useEffect(() => {
        if (studentType !== "insider" || !teacherId || !timeGroup) {
            setTimeSlots([]);
            setLoadingSlots(false);
            return undefined;
        }

        let isMounted = true;
        const fetchSlots = async () => {
            setLoadingSlots(true);
            setError("");

            try {
                const response = await axios.get("/student/timeslots", {
                    params: { teacherId, group: timeGroup }
                });
                if (isMounted) setTimeSlots(response.data || []);
            } catch (requestError) {
                if (isMounted) {
                    setError(
                        requestError.response?.data?.message ||
                            "Time slots could not be loaded. Please try again."
                    );
                }
            } finally {
                if (isMounted) setLoadingSlots(false);
            }
        };

        fetchSlots();
        return () => {
            isMounted = false;
        };
    }, [studentType, teacherId, timeGroup]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!["outsider", "insider"].includes(studentType)) {
            setError("Please choose whether you are an outsider or insider.");
            return;
        }

        if (
            studentType === "insider" &&
            (!teacherId || !timeGroup || !time || timeSlotIds.length === 0)
        ) {
            setError("Please choose your teacher, days, and time slot.");
            return;
        }

        setSaving(true);
        try {
            const response = await axios.post("/auth/student-setup", {
                studentType,
                teacherId: studentType === "insider" ? teacherId : undefined,
                timeGroup: studentType === "insider" ? timeGroup : undefined,
                time: studentType === "insider" ? time : undefined,
                timeSlotIds: studentType === "insider" ? timeSlotIds : []
            });
            persistSession({ token: response.data.token, user: response.data.user });
            navigate(resolveDashboardPath(response.data.user?.role), { replace: true });
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                    "We could not save your learning setup. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <AuthShell
            badge="Almost There"
            title="Personalize your learning"
            subtitle="Choose how you study. If you are an insider, we will also connect you with your teacher and schedule."
        >
            <div className="auth-card__header">
                <h2>Welcome{user?.fullname ? `, ${user.fullname}` : ""}!</h2>
                <p>Are you an outsider or an insider?</p>
            </div>

            {error ? <div className="auth-alert auth-alert--error">{error}</div> : null}

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-field">
                    <label htmlFor="studentType">Student type</label>
                    <select
                        id="studentType"
                        value={studentType}
                        onChange={(event) => {
                            setStudentType(event.target.value);
                            setTeacherId("");
                            setTimeGroup("");
                            setTime("");
                            setTimeSlotIds([]);
                            setTimeSlots([]);
                            setError("");
                        }}
                        required
                    >
                        <option value="">Choose outsider or insider</option>
                        <option value="outsider">Outsider</option>
                        <option value="insider">Insider</option>
                    </select>
                    <span className="auth-field__hint">
                        Outsiders can continue with a standard account. Insiders choose
                        their teacher and class schedule.
                    </span>
                </div>

                {studentType === "insider" ? (
                    <div className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="teacherId">Teacher</label>
                            <select
                                id="teacherId"
                                value={teacherId}
                                onChange={(event) => {
                                    setTeacherId(event.target.value);
                                    setTime("");
                                    setTimeSlotIds([]);
                                }}
                                disabled={loadingTeachers}
                                required
                            >
                                <option value="">
                                    {loadingTeachers ? "Loading teachers..." : "Choose a teacher"}
                                </option>
                                {teachers.map((teacher) => (
                                    <option key={teacher._id} value={teacher._id}>
                                        {teacher.fullname ||
                                            [teacher.name, teacher.lastname]
                                                .filter(Boolean)
                                                .join(" ") ||
                                            teacher.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="timeGroup">Class days</label>
                            <select
                                id="timeGroup"
                                value={timeGroup}
                                onChange={(event) => {
                                    setTimeGroup(event.target.value);
                                    setTime("");
                                    setTimeSlotIds([]);
                                }}
                                disabled={!teacherId}
                                required
                            >
                                <option value="">Choose class days</option>
                                <option value="juft">Juft (Tue / Thu / Sat)</option>
                                <option value="toq">Toq (Mon / Wed / Fri)</option>
                            </select>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="time">Time slot</label>
                            <select
                                id="time"
                                value={time}
                                onChange={(event) => {
                                    const selectedTime = event.target.value;
                                    const matched = timeSlots.find(
                                        (slot) => slot.time === selectedTime
                                    );
                                    setTime(selectedTime);
                                    setTimeSlotIds(matched?.slotIds || []);
                                }}
                                disabled={!teacherId || !timeGroup || loadingSlots}
                                required
                            >
                                <option value="">
                                    {loadingSlots ? "Loading times..." : "Choose a time"}
                                </option>
                                {timeSlots.map((slot) => (
                                    <option key={slot.time} value={slot.time}>
                                        {slot.time}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                ) : null}

                <button
                    className="auth-button"
                    type="submit"
                    disabled={
                        saving ||
                        !studentType ||
                        (studentType === "insider" && (loadingTeachers || loadingSlots))
                    }
                >
                    {saving ? "Saving setup..." : "Continue"}
                </button>
            </form>
        </AuthShell>
    );
}

export default StudentSetup;
