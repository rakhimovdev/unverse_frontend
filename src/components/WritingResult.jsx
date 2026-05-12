import React, { useEffect, useMemo, useState } from "react";
import axios from "../Api/Axios";
import "./WritingResult.css";

function WritingResult({ user, readingBand, listeningBand, speakingBand }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [loaded, setLoaded] = useState(false);

    const role = user?.role;
    const canView =
        role === "student" || role === "mooc" || role === "mock_user";

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
                const res = await axios.get("/ai/writing/results", {
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
                setError(err.response?.data?.message || "No AI result available yet.");
            } finally {
                if (!isActive) return;
                setLoading(false);
                timerId = setTimeout(() => {
                    if (isActive) setLoaded(true);
                }, 20);
            }
        };

        fetchResults();

        return () => {
            isActive = false;
            if (timerId) clearTimeout(timerId);
        };
    }, [user, canView]);

    const sortedResults = useMemo(() => {
        if (!results?.length) return [];
        return [...results].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    }, [results]);

    const latestOverall = useMemo(
        () => sortedResults.find((item) => item.taskType === "overall") || null,
        [sortedResults]
    );

    const latestFeedback = useMemo(
        () => sortedResults.find((item) => item.taskType !== "overall") || null,
        [sortedResults]
    );

    const formatBand = (value) => {
        if (value == null || value === "") return "—";
        const num = Number(value);
        if (Number.isNaN(num)) return String(value);
        return Number.isInteger(num) ? String(num) : num.toFixed(1);
    };

    const formatText = (value) => {
        if (!value) return "—";
        if (Array.isArray(value)) return value.filter(Boolean).join(" ");
        return String(value);
    };

    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleString();
    };

    if (!user) {
        return (
            <div className="writing-result-shell">
                <div className="writing-result-page">
                    <div className="writing-result-spinner" />
                </div>
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="writing-result-shell">
                <div className="writing-result-page is-loaded">
                    <div className="writing-result-message">
                        Your teacher will review your writing.
                    </div>
                </div>
            </div>
        );
    }

    const bandValue = formatBand(
        latestOverall?.result?.estimated_band ??
            latestOverall?.result?.band_score ??
            latestFeedback?.result?.estimated_band ??
            latestFeedback?.result?.band_score
    );

    const numericBand = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    };

    const roundToHalf = (value) => {
        if (value == null) return null;
        return Math.round(value * 2) / 2;
    };

    const writingBand = bandValue;
    const readingBandValue = formatBand(readingBand);
    const listeningBandValue = formatBand(listeningBand);
    const speakingBandValue = formatBand(speakingBand);

    const overallBand = (() => {
        const values = [
            numericBand(readingBand),
            numericBand(listeningBand),
            numericBand(bandValue),
            numericBand(speakingBand)
        ].filter((v) => v != null);
        if (!values.length) return bandValue;
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        return formatBand(roundToHalf(avg));
    })();

    return (
        <div className="writing-result-shell">
            <div className={`writing-result-page ${loaded ? "is-loaded" : ""}`}>
                <div className="writing-result-header">
                    <div className="writing-result-title">
                        <span className="writing-result-title-bar" />
                        <h1>Your test result</h1>
                    </div>
                    <button
                        className="writing-result-download"
                        type="button"
                        onClick={() => window.print()}
                    >
                        Download eTRF
                    </button>
                </div>

                {loading ? (
                    <div className="writing-result-spinner" />
                ) : error || (!latestOverall && !latestFeedback) ? (
                    <div className="writing-result-empty">No AI result available yet.</div>
                ) : (
                    <>
                        <div className="writing-result-overall">
                            <div>
                                <div className="writing-result-label">Overall</div>
                                <div className="writing-result-score-lg">{overallBand}</div>
                            </div>
                            <span className="writing-result-arrow">›</span>
                        </div>

                        <div className="writing-result-grid">
                            <div className="writing-result-card">
                                <div className="writing-result-label">Listening</div>
                                <div className="writing-result-score-md">{listeningBandValue}</div>
                                <span className="writing-result-arrow">›</span>
                            </div>
                            <div className="writing-result-card">
                                <div className="writing-result-label">Reading</div>
                                <div className="writing-result-score-md">{readingBandValue}</div>
                                <span className="writing-result-arrow">›</span>
                            </div>
                            <div className="writing-result-card is-writing">
                                <div className="writing-result-label">Writing</div>
                                <div className="writing-result-score-md">{writingBand}</div>
                                <span className="writing-result-arrow">›</span>
                            </div>
                            <div className="writing-result-card">
                                <div className="writing-result-label">Speaking</div>
                                <div className="writing-result-score-md">{speakingBandValue}</div>
                                <span className="writing-result-arrow">›</span>
                            </div>
                        </div>

                        <div className="writing-result-section">
                            <div className="writing-result-section-header">
                                <h2>Writing feedback</h2>
                                <span className="writing-result-date">
                                    {formatDate(
                                        latestFeedback?.createdAt || latestOverall?.createdAt
                                    )}
                                </span>
                            </div>
                            <div className="writing-result-feedback">
                                <div>
                                    <strong>Grammar:</strong>{" "}
                                    {formatText(latestFeedback?.result?.grammar_feedback)}
                                </div>
                                <div>
                                    <strong>Vocabulary:</strong>{" "}
                                    {formatText(latestFeedback?.result?.vocabulary_feedback)}
                                </div>
                                <div>
                                    <strong>Coherence:</strong>{" "}
                                    {formatText(latestFeedback?.result?.coherence_feedback)}
                                </div>
                            </div>
                        </div>

                        <div className="writing-result-card writing-result-tips">
                            <div className="writing-result-label">Improvement Tips</div>
                            <p>{formatText(latestFeedback?.result?.improvement_tips)}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default WritingResult;
