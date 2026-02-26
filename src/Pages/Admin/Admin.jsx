import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "../../Api/Axios";
import "./Admin.css";

const READING_ACADEMIC_TABLE = [
    { min: 39, max: 40, band: 9 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8 },
    { min: 33, max: 34, band: 7.5 },
    { min: 30, max: 32, band: 7 },
    { min: 27, max: 29, band: 6.5 },
    { min: 23, max: 26, band: 6 },
    { min: 19, max: 22, band: 5.5 },
    { min: 15, max: 18, band: 5 },
    { min: 12, max: 14, band: 4.5 },
    { min: 9, max: 11, band: 4 },
    { min: 5, max: 8, band: 3 },
    { min: 0, max: 4, band: 0 }
];

const READING_GENERAL_TABLE = [
    { min: 39, max: 40, band: 9 },
    { min: 38, max: 38, band: 8.5 },
    { min: 37, max: 37, band: 8 },
    { min: 36, max: 36, band: 7.5 },
    { min: 34, max: 35, band: 7 },
    { min: 32, max: 33, band: 6.5 },
    { min: 30, max: 31, band: 6 },
    { min: 27, max: 29, band: 5.5 },
    { min: 23, max: 26, band: 5 },
    { min: 19, max: 22, band: 4.5 },
    { min: 15, max: 18, band: 4 },
    { min: 12, max: 14, band: 3 },
    { min: 0, max: 11, band: 0 }
];

const LISTENING_BAND_TABLE = [
    { min: 39, max: 40, band: 9 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8 },
    { min: 32, max: 34, band: 7.5 },
    { min: 30, max: 31, band: 7 },
    { min: 26, max: 29, band: 6.5 },
    { min: 23, max: 25, band: 6 },
    { min: 18, max: 22, band: 5.5 },
    { min: 16, max: 17, band: 5 },
    { min: 13, max: 15, band: 4.5 },
    { min: 10, max: 12, band: 4 },
    { min: 6, max: 9, band: 3.5 },
    { min: 4, max: 5, band: 3 },
    { min: 2, max: 3, band: 2.5 },
    { min: 1, max: 1, band: 1 },
    { min: 0, max: 0, band: 0 }
];

const getBandScore = (rawScore, table) => {
    const value = Number(rawScore);
    if (!Number.isFinite(value)) return null;
    const row = table.find((r) => value >= r.min && value <= r.max);
    return row ? row.band : null;
};

function Admin() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const [teachers, setTeachers] = useState([]);
    const [slots, setSlots] = useState([]);
    const [moocStudents, setMoocStudents] = useState([]);
    const [moocScores, setMoocScores] = useState(null);
    const [moocScoresLoading, setMoocScoresLoading] = useState(false);
    const [selectedMooc, setSelectedMooc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [actionMsg, setActionMsg] = useState("");
    const [moocSaving, setMoocSaving] = useState(false);
    const [newSlot, setNewSlot] = useState({
        group: "",
        time: "",
        teacherId: ""
    });
    const [moocForm, setMoocForm] = useState({
        username: "",
        name: "",
        lastname: "",
        email: "",
        password: ""
    });
    const [passwords, setPasswords] = useState({});
    const [activeView, setActiveView] = useState("teachers");
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slotStudents, setSlotStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const paymentTimers = useRef({});
    const slotStudentsRef = useRef([]);
    const [historyStudent, setHistoryStudent] = useState(null);
    const [historyRecords, setHistoryRecords] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const todayKey = useMemo(() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }, []);

    const weekDays = [
        "Dushanba",
        "Seshanba",
        "Chorshanba",
        "Payshanba",
        "Juma",
        "Shanba",
        "Yakshanba"
    ];

    const slotMap = useMemo(() => {
        const map = new Map();
        slots.forEach((slot) => {
            const teacherId = slot.teacher?._id || slot.teacher;
            if (!teacherId || !slot.day) return;
            const key = `${teacherId}:${slot.day}`;
            const list = map.get(key) || [];
            list.push({ id: slot._id, time: slot.time, checked: !!slot.checked });
            map.set(key, list);
        });
        for (const [key, list] of map.entries()) {
            map.set(
                key,
                list
                    .filter(Boolean)
                    .map((t) => ({ id: t.id, time: String(t.time), checked: !!t.checked }))
                    .sort((a, b) => a.time.localeCompare(b.time))
            );
        }
        return map;
    }, [slots]);

    const openSlotStudents = async (slotId) => {
        setLoadingStudents(true);
        setSelectedSlot(null);
        setSlotStudents([]);
        setHistoryStudent(null);
        setHistoryRecords([]);
        try {
            const res = await axios.get(`/admin/timeslots/${slotId}/students`, {
                headers,
                params: { date: todayKey }
            });
            setSelectedSlot(res.data?.slot || null);
            setSlotStudents(res.data?.students || []);
        } catch (err) {
            console.error(err.response?.data || err.message);
            setActionMsg(err.response?.data?.message || "Studentlar ro'yxatini olishda xatolik ❌");
        } finally {
            setLoadingStudents(false);
        }
    };

    const updateAttendanceLocal = (studentId, patch) => {
        setSlotStudents((prev) =>
            prev.map((s) =>
                s._id === studentId
                    ? {
                          ...s,
                          attendance: {
                              status: patch.status ?? s.attendance?.status ?? "",
                              payment: patch.payment ?? s.attendance?.payment ?? 0
                          }
                      }
                    : s
            )
        );
    };

    const saveAttendance = async (studentId, payload) => {
        if (!selectedSlot?._id) return;
        try {
            await axios.put(
                `/admin/timeslots/${selectedSlot._id}/students/${studentId}`,
                { ...payload, date: todayKey },
                { headers }
            );
        } catch (err) {
            console.error(err.response?.data || err.message);
            setActionMsg(err.response?.data?.message || "Saqlashda xatolik ❌");
        }
    };

    const markChecked = async () => {
        if (!selectedSlot?._id) return;
        try {
            await axios.post(
                `/admin/timeslots/${selectedSlot._id}/check`,
                { date: todayKey },
                { headers }
            );
            setSlots((prev) =>
                prev.map((s) =>
                    s._id === selectedSlot._id ? { ...s, checked: true } : s
                )
            );
        } catch (err) {
            console.error(err.response?.data || err.message);
            setActionMsg(err.response?.data?.message || "Tekshirishda xatolik ❌");
        }
    };

    const loadStudentHistory = async (student) => {
        if (!student?._id) return;
        setHistoryLoading(true);
        setHistoryStudent(student);
        setHistoryRecords([]);
        try {
            const slotIds = Array.isArray(student.timeSlots)
                ? student.timeSlots.map((s) => (typeof s === "string" ? s : s._id))
                : [];
            const res = await axios.get(`/admin/students/${student._id}/attendance`, {
                headers,
                params: slotIds.length ? { slotIds: slotIds.join(",") } : {}
            });
            setHistoryRecords(res.data || []);
        } catch (err) {
            console.error(err.response?.data || err.message);
            setActionMsg(err.response?.data?.message || "Tarixni olishda xatolik ❌");
        } finally {
            setHistoryLoading(false);
        }
    };

    const groupDays = useMemo(() => {
        const juft = ["Seshanba", "Payshanba", "Shanba"];
        const toq = ["Dushanba", "Chorshanba", "Juma"];
        if (!selectedSlot?.day) return toq;
        return juft.includes(selectedSlot.day) ? juft : toq;
    }, [selectedSlot]);

    const historyRows = useMemo(() => {
        if (!historyRecords.length) return [];
        const rows = new Map();

        const weekStart = (dateStr) => {
            const d = new Date(`${dateStr}T00:00:00`);
            const day = d.getDay();
            const diff = (day === 0 ? -6 : 1) - day; // Monday start
            d.setDate(d.getDate() + diff);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
        };

        historyRecords.forEach((rec) => {
            const key = weekStart(rec.date);
            const row = rows.get(key) || { week: key, days: {} };
            const day = rec.timeSlot?.day;
            if (day) {
                row.days[day] = { date: rec.date, status: rec.status || "" };
            }
            rows.set(key, row);
        });

        return Array.from(rows.values()).sort((a, b) => a.week.localeCompare(b.week));
    }, [historyRecords]);

    const headers = useMemo(() => ({ Authorization: token }), [token]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const [tRes, sRes, mRes] = await Promise.all([
                axios.get("/admin/teachers", { headers }),
                axios.get("/admin/timeslots", { headers, params: { date: todayKey } }),
                axios.get("/admin/mooc-students", { headers })
            ]);
            setTeachers(tRes.data || []);
            setSlots(sRes.data || []);
            setMoocStudents(mRes.data || []);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Ma'lumotlarni olishda xatolik ❌");
        } finally {
            setLoading(false);
        }
    }, [headers, todayKey]);

    useEffect(() => {
        if (role === "admin" && token) {
            loadData();
        }
    }, [role, token, loadData]);

    useEffect(() => {
        slotStudentsRef.current = slotStudents;
    }, [slotStudents]);

    useEffect(() => {
        slotStudentsRef.current = slotStudents;
    }, [slotStudents]);

    const handleAddSlot = async (e) => {
        e.preventDefault();
        setActionMsg("");
        if (!newSlot.group) {
            setActionMsg("Juft/Toq ni tanlang ❌");
            return;
        }
        try {
            const res = await axios.post(
                "/admin/timeslots",
                {
                    teacherId: newSlot.teacherId,
                    time: newSlot.time,
                    group: newSlot.group
                },
                { headers }
            );
            setNewSlot({ group: "", time: "", teacherId: "" });
            const createdCount = res.data?.created?.length || 0;
            const skippedCount = res.data?.skipped?.length || 0;
            if (createdCount && skippedCount) {
                setActionMsg(`Vaqtlar qo'shildi ✅ (${createdCount}), ba'zilari mavjud edi (${skippedCount})`);
            } else if (createdCount) {
                setActionMsg("Vaqtlar qo'shildi ✅");
            } else {
                setActionMsg("Bu vaqtlar allaqachon mavjud ❌");
            }
            loadData();
        } catch (err) {
            setActionMsg(err.response?.data?.message || "Vaqt qo'shishda xatolik ❌");
        }
    };

    const handleDeleteSlot = async (id) => {
        if (!window.confirm("Ushbu vaqtni o'chirishni xohlaysizmi?")) return;
        setActionMsg("");
        try {
            await axios.delete(`/admin/timeslots/${id}`, { headers });
            setActionMsg("Vaqt o'chirildi ✅");
            loadData();
        } catch (err) {
            setActionMsg(err.response?.data?.message || "Vaqt o'chirishda xatolik ❌");
        }
    };

    const handleDeleteTeacher = async (id) => {
        if (!window.confirm("Ushbu teacher accountni o'chirishni xohlaysizmi?")) return;
        setActionMsg("");
        try {
            await axios.delete(`/admin/teachers/${id}`, { headers });
            setActionMsg("Teacher o'chirildi ✅");
            loadData();
        } catch (err) {
            setActionMsg(err.response?.data?.message || "Teacher o'chirishda xatolik ❌");
        }
    };

    const handlePasswordUpdate = async (id) => {
        const password = passwords[id] || "";
        if (password.length < 6) {
            setActionMsg("Parol kamida 6 ta belgidan iborat bo'lsin ❌");
            return;
        }
        setActionMsg("");
        try {
            await axios.put(`/admin/teachers/${id}/password`, { password }, { headers });
            setPasswords((prev) => ({ ...prev, [id]: "" }));
            setActionMsg("Parol yangilandi ✅");
        } catch (err) {
            setActionMsg(err.response?.data?.message || "Parol yangilashda xatolik ❌");
        }
    };

    const resetMoocForm = () =>
        setMoocForm({
            username: "",
            name: "",
            lastname: "",
            email: "",
            password: ""
        });

    const handleCreateMooc = async (e) => {
        e.preventDefault();
        if (moocSaving) return;
        setActionMsg("");

        if (!moocForm.username || !moocForm.name || !moocForm.lastname || !moocForm.email) {
            setActionMsg("Barcha maydonlarni to'ldiring ❌");
            return;
        }

        if ((moocForm.password || "").length < 6) {
            setActionMsg("Parol kamida 6 ta belgidan iborat bo'lsin ❌");
            return;
        }

        try {
            setMoocSaving(true);
            await axios.post("/admin/mooc-students", moocForm, { headers });
            setActionMsg("MOOC student qo'shildi ✅");
            resetMoocForm();
            loadData();
        } catch (err) {
            setActionMsg(err.response?.data?.message || "MOOC student qo'shishda xatolik ❌");
        } finally {
            setMoocSaving(false);
        }
    };

    const handleDeleteMooc = async (id) => {
        if (!window.confirm("MOOC studentni o'chirishni xohlaysizmi?")) return;
        setActionMsg("");
        try {
            await axios.delete(`/admin/mooc-students/${id}`, { headers });
            setActionMsg("MOOC student o'chirildi ✅");
            loadData();
        } catch (err) {
            setActionMsg(err.response?.data?.message || "MOOC student o'chirishda xatolik ❌");
        }
    };

    const loadMoocScores = async (student) => {
        if (!student?._id) return;
        setSelectedMooc(student);
        setMoocScores(null);
        setMoocScoresLoading(true);
        setActionMsg("");
        try {
            const res = await axios.get(`/admin/mooc-students/${student._id}/scores`, {
                headers
            });
            setMoocScores(res.data || null);
        } catch (err) {
            setActionMsg(err.response?.data?.message || "Scorelarni olishda xatolik ❌");
        } finally {
            setMoocScoresLoading(false);
        }
    };

    if (role !== "admin") {
        return (
            <div className="admin-page">
                <div className="admin-card">
                    <h1>Admin panel</h1>
                    <p>Bu sahifaga faqat admin kira oladi.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>Admin Panel</h1>
                <p>Teacher accountlarini boshqarish va vaqtlarni sozlash</p>
            </div>

            {errorMsg && <div className="admin-banner admin-banner--error">{errorMsg}</div>}
            {actionMsg && <div className="admin-banner">{actionMsg}</div>}

            {loading ? (
                <div className="admin-card">Yuklanmoqda...</div>
            ) : (
                <div className="admin-panel">
                    <div className="admin-toggle">
                        <button
                            className={`btn ${activeView === "mooc" ? "btn--primary" : "btn--ghost"}`}
                            onClick={() => setActiveView("mooc")}
                        >
                            MOOC Accounts
                        </button>
                        <button
                            className={`btn ${activeView === "teachers" ? "btn--primary" : "btn--ghost"}`}
                            onClick={() => setActiveView("teachers")}
                        >
                            Teacher Accounts
                        </button>
                        <button
                            className={`btn ${activeView === "schedule" ? "btn--primary" : "btn--ghost"}`}
                            onClick={() => setActiveView("schedule")}
                        >
                            Dars Jadvali
                        </button>
                    </div>

                    {activeView === "mooc" ? (
                        <div className="admin-grid">
                            <section className="admin-card">
                                <h2>MOOC Student qo'shish</h2>
                                <form className="admin-form" onSubmit={handleCreateMooc}>
                                    <div className="admin-form__grid">
                                        <input
                                            type="text"
                                            placeholder="Ism"
                                            value={moocForm.name}
                                            onChange={(e) =>
                                                setMoocForm((prev) => ({ ...prev, name: e.target.value }))
                                            }
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Familiya"
                                            value={moocForm.lastname}
                                            onChange={(e) =>
                                                setMoocForm((prev) => ({ ...prev, lastname: e.target.value }))
                                            }
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={moocForm.username}
                                            onChange={(e) =>
                                                setMoocForm((prev) => ({ ...prev, username: e.target.value }))
                                            }
                                            required
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={moocForm.email}
                                            onChange={(e) =>
                                                setMoocForm((prev) => ({ ...prev, email: e.target.value }))
                                            }
                                            required
                                        />
                                        <input
                                            type="password"
                                            placeholder="Parol"
                                            value={moocForm.password}
                                            onChange={(e) =>
                                                setMoocForm((prev) => ({ ...prev, password: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                    <button className="btn btn--primary" type="submit" disabled={moocSaving}>
                                        {moocSaving ? "Saqlanmoqda..." : "Qo'shish"}
                                    </button>
                                </form>
                            </section>

                            <section className="admin-card">
                                <h2>MOOC Students</h2>
                                {moocStudents.length === 0 ? (
                                    <p>MOOC student topilmadi.</p>
                                ) : (
                                    <div className="admin-table admin-table--mooc">
                                        <div className="admin-table__row admin-table__head">
                                            <div>Ism</div>
                                            <div>Username</div>
                                            <div>Email</div>
                                            <div>Amallar</div>
                                        </div>
                                        {moocStudents.map((student) => (
                                            <div className="admin-table__row" key={student._id}>
                                                <div>{student.name} {student.lastname}</div>
                                                <div>{student.username}</div>
                                                <div>{student.email}</div>
                                                <div className="admin-actions">
                                                    <button
                                                        className="btn btn--ghost"
                                                        onClick={() => loadMoocScores(student)}
                                                    >
                                                        Scorelar
                                                    </button>
                                                    <button
                                                        className="btn btn--danger"
                                                        onClick={() => handleDeleteMooc(student._id)}
                                                    >
                                                        O'chirish
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="admin-card admin-card--scores">
                                <h2>MOOC Scorelar</h2>
                                {moocScoresLoading ? (
                                    <p>Yuklanmoqda...</p>
                                ) : moocScores ? (
                                    <div className="admin-scores">
                                        <h3>
                                            {moocScores.student?.name} {moocScores.student?.lastname} ·{" "}
                                            {moocScores.student?.email}
                                        </h3>

                                        <div className="admin-score-block">
                                            <h4>Reading</h4>
                                            {moocScores.reading?.length ? (
                                                <table className="admin-score-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Test</th>
                                                            <th>Raw</th>
                                                            <th>Band (A/G)</th>
                                                            <th>Sana</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {moocScores.reading.map((r) => {
                                                            const academic = getBandScore(
                                                                r.score,
                                                                READING_ACADEMIC_TABLE
                                                            );
                                                            const general = getBandScore(
                                                                r.score,
                                                                READING_GENERAL_TABLE
                                                            );
                                                            return (
                                                                <tr key={r._id}>
                                                                    <td>{r.testName || r.test?.name || "Reading Test"}</td>
                                                                    <td>{r.score}</td>
                                                                    <td>{academic ?? "N/A"} / {general ?? "N/A"}</td>
                                                                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p>Reading score yo'q.</p>
                                            )}
                                        </div>

                                        <div className="admin-score-block">
                                            <h4>Listening</h4>
                                            {moocScores.listening?.length ? (
                                                <table className="admin-score-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Test</th>
                                                            <th>Raw</th>
                                                            <th>Band</th>
                                                            <th>Sana</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {moocScores.listening.map((r) => {
                                                            const band = getBandScore(
                                                                r.score,
                                                                LISTENING_BAND_TABLE
                                                            );
                                                            return (
                                                                <tr key={r._id}>
                                                                    <td>{r.testName || r.test?.title || "Listening Test"}</td>
                                                                    <td>{r.score}</td>
                                                                    <td>{band ?? "N/A"}</td>
                                                                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p>Listening score yo'q.</p>
                                            )}
                                        </div>

                                        <div className="admin-score-block">
                                            <h4>Writing (AI)</h4>
                                            {moocScores.writingAi?.length ? (
                                                <table className="admin-score-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Task</th>
                                                            <th>Raw</th>
                                                            <th>Band</th>
                                                            <th>Sana</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {moocScores.writingAi.map((r) => (
                                                            <tr key={r._id}>
                                                                <td>{r.taskType || "task2"}</td>
                                                                <td>{r.result?.raw_score ?? "—"}</td>
                                                                <td>{r.result?.estimated_band ?? "N/A"}</td>
                                                                <td>{new Date(r.createdAt).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p>Writing AI score yo'q.</p>
                                            )}
                                        </div>

                                        {moocScores.writingScores?.length ? (
                                            <div className="admin-score-block">
                                                <h4>Writing (Teacher)</h4>
                                                <table className="admin-score-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Test</th>
                                                            <th>Raw</th>
                                                            <th>Band</th>
                                                            <th>Sana</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {moocScores.writingScores.map((r) => (
                                                            <tr key={r._id}>
                                                                <td>{r.testName || "Writing Test"}</td>
                                                                <td>{r.score}</td>
                                                                <td>{r.score}</td>
                                                                <td>{new Date(r.createdAt).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : selectedMooc ? (
                                    <p>Scorelar topilmadi.</p>
                                ) : (
                                    <p>Scorelarni ko'rish uchun studentni tanlang.</p>
                                )}
                            </section>
                        </div>
                    ) : activeView === "teachers" ? (
                        <div className="admin-grid">
                            <section className="admin-card">
                                <h2>Teacher Accounts</h2>
                                {teachers.length === 0 ? (
                                    <p>Teacher topilmadi.</p>
                                ) : (
                                    <div className="admin-table">
                                        <div className="admin-table__row admin-table__head">
                                            <div>Ism</div>
                                            <div>Username</div>
                                            <div>Email</div>
                                            <div>Parol</div>
                                            <div>Amallar</div>
                                        </div>
                                        {teachers.map((t) => (
                                            <div className="admin-table__row" key={t._id}>
                                                <div>{t.name} {t.lastname}</div>
                                                <div>{t.username}</div>
                                                <div>{t.email}</div>
                                                <div>
                                                    <input
                                                        type="password"
                                                        placeholder="Yangi parol"
                                                        value={passwords[t._id] || ""}
                                                        onChange={(e) =>
                                                            setPasswords((prev) => ({
                                                                ...prev,
                                                                [t._id]: e.target.value
                                                            }))
                                                        }
                                                    />
                                                </div>
                                                <div className="admin-actions">
                                                    <button
                                                        className="btn btn--ghost"
                                                        onClick={() => handlePasswordUpdate(t._id)}
                                                    >
                                                        Saqlash
                                                    </button>
                                                    <button
                                                        className="btn btn--danger"
                                                        onClick={() => handleDeleteTeacher(t._id)}
                                                    >
                                                        O'chirish
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="admin-card">
                                <h2>Vaqtlar</h2>
                                <form className="admin-form" onSubmit={handleAddSlot}>
                                    <div className="admin-form__row">
                                        <select
                                            value={newSlot.teacherId}
                                            onChange={(e) =>
                                                setNewSlot({ ...newSlot, teacherId: e.target.value })
                                            }
                                            required
                                        >
                                            <option value="">Teacher tanlang</option>
                                            {teachers.map((teacher) => (
                                                <option key={teacher._id} value={teacher._id}>
                                                    {teacher.name} {teacher.lastname}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Vaqt (masalan: 14:00)"
                                            value={newSlot.time}
                                            onChange={(e) =>
                                                setNewSlot({ ...newSlot, time: e.target.value })
                                            }
                                            required
                                        />
                                        <button className="btn btn--primary" type="submit">
                                            Qo'shish
                                        </button>
                                    </div>

                                    <div className="admin-form__row admin-form__row--days">
                                        <label className="day-label">Dars kunlari</label>
                                        <select
                                            value={newSlot.group}
                                            onChange={(e) =>
                                                setNewSlot({ ...newSlot, group: e.target.value })
                                            }
                                            required
                                        >
                                            <option value="">Juft/Toq tanlang</option>
                                            <option value="juft">
                                                Juft (Seshanba, Payshanba, Shanba)
                                            </option>
                                            <option value="toq">
                                                Toq (Dushanba, Chorshanba, Juma)
                                            </option>
                                        </select>
                                    </div>
                                </form>

                                {slots.length === 0 ? (
                                    <p>Hozircha vaqtlar yo'q.</p>
                                ) : (
                                    <ul className="slot-list">
                                        {slots.map((slot) => (
                                            <li key={slot._id} className="slot-item">
                                                <span>
                                                    {slot.day} · {slot.time}
                                                    {slot.teacher ? ` · ${slot.teacher.name} ${slot.teacher.lastname}` : ""}
                                                </span>
                                                <button
                                                    className="btn btn--danger btn--small"
                                                    onClick={() => handleDeleteSlot(slot._id)}
                                                >
                                                    O'chirish
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>
                    ) : (
                        <section className="admin-card">
                            <h2>Dars Jadvali</h2>
                            {teachers.length === 0 ? (
                                <p>Teacher topilmadi.</p>
                            ) : (
                                <div className="schedule-table">
                                    <div className="schedule-row schedule-head">
                                        <div>Teacher</div>
                                        {weekDays.map((day) => (
                                            <div key={day}>{day}</div>
                                        ))}
                                    </div>
                                    {teachers.map((teacher) => (
                                        <div className="schedule-row" key={teacher._id}>
                                            <div className="schedule-teacher">
                                                {teacher.name} {teacher.lastname}
                                            </div>
                                            {weekDays.map((day) => {
                                                const key = `${teacher._id}:${day}`;
                                                const times = slotMap.get(key) || [];
                                                return (
                                                    <div key={day} className="schedule-cell">
                                                        {times.length === 0
                                                            ? "—"
                                                            : times.map((t) => (
                                                                  <button
                                                                      key={t.id}
                                                                      type="button"
                                                                      className={`time-chip ${t.checked ? "time-chip--checked" : ""}`}
                                                                      onClick={() => openSlotStudents(t.id)}
                                                                  >
                                                                      {t.time}
                                                                  </button>
                                                              ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="schedule-students">
                                {loadingStudents ? (
                                    <p>Studentlar yuklanmoqda...</p>
                                ) : selectedSlot ? (
                                    <>
                                        <h3>
                                            {selectedSlot.day} · {selectedSlot.time} ·{" "}
                                            {selectedSlot.teacher
                                                ? `${selectedSlot.teacher.name} ${selectedSlot.teacher.lastname}`
                                                : ""}
                                        </h3>
                                        {slotStudents.length === 0 ? (
                                            <p>Bu vaqtda student yo'q.</p>
                                        ) : (
                                            <table className="attendance-table">
                                                <thead>
                                                    <tr>
                                                        <th>Ism</th>
                                                        <th>Familiya</th>
                                                        <th>Keldi/Kelmadi</th>
                                                        <th>To'lov</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {slotStudents.map((s) => (
                                                        <tr key={s._id}>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="link-button"
                                                                    onClick={() => loadStudentHistory(s)}
                                                                >
                                                                    {s.name}
                                                                </button>
                                                            </td>
                                                            <td>{s.lastname}</td>
                                                            <td>
                                                                <select
                                                                    value={s.attendance?.status || ""}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        updateAttendanceLocal(s._id, { status: value });
                                                                        saveAttendance(s._id, {
                                                                            status: value,
                                                                            payment: s.attendance?.payment ?? 0
                                                                        });
                                                                    }}
                                                                >
                                                                    <option value="">Tanlang</option>
                                                                    <option value="keldi">Keldi</option>
                                                                    <option value="kelmadi">Kelmadi</option>
                                                                    <option value="sababli">Sababli</option>
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={s.attendance?.payment ?? 0}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        const numeric = value === "" ? 0 : Number(value);
                                                                        updateAttendanceLocal(s._id, { payment: numeric });

                                                                        if (paymentTimers.current[s._id]) {
                                                                            clearTimeout(paymentTimers.current[s._id]);
                                                                        }
                                                                        paymentTimers.current[s._id] = setTimeout(() => {
                                                                            const current = slotStudentsRef.current.find(
                                                                                (row) => row._id === s._id
                                                                            );
                                                                            saveAttendance(s._id, {
                                                                                status: current?.attendance?.status || "",
                                                                                payment: numeric
                                                                            });
                                                                        }, 400);
                                                                    }}
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                        <div className="attendance-actions">
                                            <button
                                                type="button"
                                                className="btn btn--primary"
                                                onClick={markChecked}
                                                disabled={!!slots.find((s) => s._id === selectedSlot._id)?.checked}
                                            >
                                                Tekshirildi
                                            </button>
                                        </div>
                                        {historyStudent && (
                                            <div className="history-table">
                                                <h4>
                                                    {historyStudent.name} {historyStudent.lastname} · Davomat
                                                </h4>
                                                {historyLoading ? (
                                                    <p>Yuklanmoqda...</p>
                                                ) : historyRows.length === 0 ? (
                                                    <p>Hozircha tarix yo'q.</p>
                                                ) : (
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Hafta</th>
                                                                {groupDays.map((day) => (
                                                                    <th key={day}>{day}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {historyRows.map((row) => (
                                                                <tr key={row.week}>
                                                                    <td>{row.week}</td>
                                                                    {groupDays.map((day) => {
                                                                        const cell = row.days[day];
                                                                        return (
                                                                            <td key={day}>
                                                                                {cell
                                                                                    ? `${cell.date} · ${cell.status || "—"}`
                                                                                    : "—"}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p>Studentlarni ko'rish uchun vaqtni bosing.</p>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

export default Admin;
