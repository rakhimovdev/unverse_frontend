import React, { useEffect, useMemo, useState } from "react";
import axios from "../Api/Axios";
import "./WritingScoreResult.css";

function WritingScoreResult({ user }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [loaded, setLoaded] = useState(false);

    const role = user?.role;
    const canView = role === "mooc" || role === "admin";

    useEffect(() => {
        let isActive = true;
        let timerId;

        const fetchResults = async () => {
            if (!user) {
                setLoading(true);
                return;
            }

            if (!canView) {
                setResults([]);
                setError("");
                setLoading(false);
                setLoaded(true);
                return;
            }

            setLoading(true);
            setError("");
            setLoaded(false);

            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/ai/ai-results", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });

                const payload = Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data?.result)
                    ? res.data.result
                    : [];

                if (!isActive) return;
                setResults(payload);
            } catch (err) {
                if (!isActive) return;
                setError(err.response?.data?.message || "Failed to load AI results.");
            } finally {
                if (!isActive) return;
                setLoading(false);
                timerId = setTimeout(() => {
                    if (isActive) setLoaded(true);
                }, 10);
            }
        };

        fetchResults();

        return () => {
            isActive = false;
            if (timerId) clearTimeout(timerId);
        };
    }, [user, canView]);

    const latest = useMemo(() => {
        if (!results?.length) return null;
        const sorted = [...results].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        return sorted[0];
    }, [results]);

    const formatBand = (value) => {
        if (value == null || value === "") return "—";
        const num = Number(value);
        if (Number.isNaN(num)) return String(value);
        return Number.isInteger(num) ? String(num) : num.toFixed(1);
    };

    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleString();
    };

    if (!user) {
        return (
            <div className="writing-score-shell">
                <div className="writing-score-page">
                    <div className="writing-score-spinner" />
                </div>
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="writing-score-shell">
                <div className="writing-score-page is-loaded">
                    <div className="writing-score-message">
                        Teacher will check your writing result.
                    </div>
                </div>
            </div>
        );
    }

    const bandValue = formatBand(
        latest?.result?.estimated_band ?? latest?.result?.band_score
    );

    return (
        <div className="writing-score-shell">
            <div className={`writing-score-page ${loaded ? "is-loaded" : ""}`}>
                <div className="writing-score-header">
                    <div className="writing-score-heading">
                        <p className="writing-score-eyebrow">IELTS Writing Result</p>
                        <h1 className="writing-score-title">Writing Assessment</h1>
                        <p className="writing-score-subtitle">
                            Official IELTS-style evaluation
                        </p>
                    </div>
                    <div className="writing-score-band">
                        <div className="writing-score-circle">
                            <span className="writing-score-value">{bandValue}</span>
                        </div>
                        <div className="writing-score-caption">Estimated Band Score</div>
                    </div>
                </div>

                {loading ? (
                    <div className="writing-score-spinner" />
                ) : error ? (
                    <div className="writing-score-error">{error}</div>
                ) : !latest ? (
                    <div className="writing-score-empty">No AI results yet.</div>
                ) : (
                    <>
                        <div className="writing-score-grid">
                            <div className="writing-score-card">
                                <h3>Grammar</h3>
                                <p>{latest.result?.grammar_feedback || "—"}</p>
                            </div>
                            <div className="writing-score-card">
                                <h3>Vocabulary</h3>
                                <p>{latest.result?.vocabulary_feedback || "—"}</p>
                            </div>
                            <div className="writing-score-card">
                                <h3>Coherence & Cohesion</h3>
                                <p>{latest.result?.coherence_feedback || "—"}</p>
                            </div>
                            <div className="writing-score-card">
                                <h3>Improvement Tips</h3>
                                <p>{latest.result?.improvement_tips || "—"}</p>
                            </div>
                        </div>

                        <div className="writing-score-divider" />

                        <div className="writing-score-footer">
                            <span className="writing-score-footer-task">
                                {latest.taskType === "task1" ? "Task 1" : "Task 2"}
                            </span>
                            <span className="writing-score-footer-dot" />
                            <span className="writing-score-footer-date">
                                {formatDate(latest.createdAt)}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default WritingScoreResult;
