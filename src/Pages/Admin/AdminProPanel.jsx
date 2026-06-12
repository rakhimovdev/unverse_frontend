import React, { useMemo, useState } from "react";
import axios from "../../Api/Axios";
import {
    formatPlanExpiry,
    PRO_DURATION_OPTIONS,
} from "../../utils/subscription";

function AdminProPanel({ headers, onActionComplete, setActionMsg }) {
    const [email, setEmail] = useState("");
    const [duration, setDuration] = useState(PRO_DURATION_OPTIONS[0].value);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [foundUser, setFoundUser] = useState(null);

    const planText = useMemo(() => {
        if (!foundUser) return "";
        if (foundUser.plan === "pro") {
            return foundUser.proExpiresAt
                ? `PRO until: ${formatPlanExpiry(foundUser.proExpiresAt)}`
                : "PRO active";
        }
        return "Free Plan";
    }, [foundUser]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            setActionMsg("Email kiriting ❌");
            return;
        }

        setLoading(true);
        setFoundUser(null);
        setActionMsg("");

        try {
            const res = await axios.get("/admin/users/search", {
                headers,
                params: { email: email.trim() }
            });
            setFoundUser(res.data?.user || null);
            if (!res.data?.user) {
                setActionMsg("Foydalanuvchi topilmadi ❌");
            }
        } catch (err) {
            setActionMsg(err.response?.data?.message || "Qidirishda xatolik ❌");
        } finally {
            setLoading(false);
        }
    };

    const runPlanAction = async (url, body, successMessage) => {
        if (!foundUser?._id && !foundUser?.id) return;

        setSaving(true);
        setActionMsg("");

        try {
            const userId = foundUser._id || foundUser.id;
            const res = await axios.post(url.replace(":id", userId), body, { headers });
            const nextUser = res.data?.user || null;
            setFoundUser(nextUser);
            setActionMsg(successMessage);
            onActionComplete?.();
        } catch (err) {
            setActionMsg(err.response?.data?.message || "Amalda xatolik ❌");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-pro-grid">
            <section className="admin-card">
                <h2>Search User by Email</h2>
                <form className="admin-form" onSubmit={handleSearch}>
                    <div className="admin-form__row admin-form__row--search">
                        <input
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button className="btn btn--primary" type="submit" disabled={loading}>
                            {loading ? "Qidirilmoqda..." : "Search"}
                        </button>
                    </div>
                </form>

                <p className="admin-muted">
                    Admin user email orqali account topib, PRO ni qo'lda yoqishi yoki o'chirishi
                    mumkin.
                </p>
            </section>

            <section className="admin-card">
                <h2>PRO Management</h2>
                {!foundUser ? (
                    <p>Avval userni qidiring.</p>
                ) : (
                    <div className="admin-user-detail">
                        <div className="admin-user-detail__row">
                            <span>Full name</span>
                            <strong>{foundUser.fullname || "—"}</strong>
                        </div>
                        <div className="admin-user-detail__row">
                            <span>Email</span>
                            <strong>{foundUser.email}</strong>
                        </div>
                        <div className="admin-user-detail__row">
                            <span>Current plan</span>
                            <strong
                                className={`admin-plan-badge ${
                                    foundUser.plan === "pro" ? "is-pro" : ""
                                }`}
                            >
                                {planText}
                            </strong>
                        </div>
                        <div className="admin-user-detail__row">
                            <span>Created</span>
                            <strong>
                                {foundUser.createdAt
                                    ? new Date(foundUser.createdAt).toLocaleString()
                                    : "—"}
                            </strong>
                        </div>

                        <div className="admin-form__row admin-form__row--search">
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                disabled={saving}
                            >
                                {PRO_DURATION_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                className="btn btn--primary"
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                    runPlanAction(
                                        "/admin/users/:id/upgrade-pro",
                                        { duration },
                                        "PRO muvaffaqiyatli yoqildi ✅"
                                    )
                                }
                            >
                                {saving ? "Saqlanmoqda..." : "Upgrade to PRO"}
                            </button>
                        </div>

                        <div className="admin-actions">
                            <button
                                className="btn btn--danger"
                                type="button"
                                disabled={saving || foundUser.plan !== "pro"}
                                onClick={() =>
                                    runPlanAction(
                                        "/admin/users/:id/stop-pro",
                                        {},
                                        "PRO to'xtatildi ✅"
                                    )
                                }
                            >
                                Stop PRO
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default AdminProPanel;
