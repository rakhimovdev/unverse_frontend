import React, { useEffect, useMemo, useState } from "react";
import axios from "../../Api/Axios";

const EMPTY_ANALYTICS = {
    totalUsers: 0,
    activeUsersToday: 0,
    activeUsersThisWeek: 0,
    proUsers: 0,
    freeUsers: 0,
    totalTestsTaken: 0,
    totalAIWritingChecks: 0,
};

function AdminAnalyticsPanel({ headers, active, refreshNonce, setActionMsg }) {
    const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS);
    const [loading, setLoading] = useState(false);
    const [localRefreshNonce, setLocalRefreshNonce] = useState(0);

    useEffect(() => {
        if (!active) return;

        let ignore = false;

        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await axios.get("/admin/analytics", { headers });
                if (!ignore) {
                    setAnalytics({ ...EMPTY_ANALYTICS, ...(res.data || {}) });
                }
            } catch (err) {
                if (!ignore) {
                    setActionMsg(
                        err.response?.data?.message || "Analytics yuklashda xatolik ❌"
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchAnalytics();

        return () => {
            ignore = true;
        };
    }, [active, headers, refreshNonce, localRefreshNonce, setActionMsg]);

    const warning = useMemo(() => {
        if (analytics.activeUsersThisWeek > 500) {
            return "Server upgrade required.";
        }
        if (analytics.activeUsersThisWeek > 100) {
            return "Server upgrade recommended soon.";
        }
        return "";
    }, [analytics.activeUsersThisWeek]);

    const cards = [
        { label: "Total Users", value: analytics.totalUsers },
        { label: "Active Today", value: analytics.activeUsersToday },
        { label: "Active This Week", value: analytics.activeUsersThisWeek },
        { label: "PRO Users", value: analytics.proUsers },
        { label: "Free Users", value: analytics.freeUsers },
        { label: "Total Tests Taken", value: analytics.totalTestsTaken },
        { label: "Total AI Writing Checks", value: analytics.totalAIWritingChecks },
    ];

    return (
        <div className="admin-card">
            <div className="admin-section-head">
                <div>
                    <h2>Admin Analytics Dashboard</h2>
                    <p className="admin-muted">
                        Platform usage and PRO distribution overview.
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setLocalRefreshNonce((prev) => prev + 1)}
                    disabled={loading}
                >
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {warning && <div className="admin-banner admin-banner--warning">{warning}</div>}

            <div className="admin-stat-grid">
                {cards.map((card) => (
                    <article className="admin-stat-card" key={card.label}>
                        <span>{card.label}</span>
                        <strong>{loading ? "..." : card.value}</strong>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default AdminAnalyticsPanel;
