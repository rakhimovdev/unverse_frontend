import React, { useEffect, useMemo, useState } from "react";
import axios from "../Api/Axios";
import {
    formatBand,
    formatWritingDate,
    getLatestWritingAttempt,
    normalizeWritingRecord
} from "../utils/writingResults";
import "./WritingScoreResult.css";

const SCORE_ITEMS = [
    { key: "taskResponse", label: "Task Response" },
    { key: "coherenceCohesion", label: "Coherence & Cohesion" },
    { key: "lexicalResource", label: "Lexical Resource" },
    { key: "grammarRangeAccuracy", label: "Grammar" }
];

function WritingScoreResult({ user }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

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
                setResults(payload.map((item) => normalizeWritingRecord(item)));
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

    const latestAttempt = useMemo(
        () => getLatestWritingAttempt(results),
        [results]
    );

    const summaryRecord = latestAttempt.overall || latestAttempt.latestTask;
    const criteriaSource = latestAttempt.criteriaSource;

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

    const overallBand = formatBand(
        latestAttempt.overall?.scores?.overall ??
            latestAttempt.latestTask?.scores?.overall
    );

    return (
        <div className="writing-score-shell">
            <div className={`writing-score-page ${loaded ? "is-loaded" : ""}`}>
                <div className="writing-score-header">
                    <div className="writing-score-heading">
                        <p className="writing-score-eyebrow">IELTS Writing Result</p>
                        <h1 className="writing-score-title">Writing Assessment</h1>
                        <p className="writing-score-subtitle">
                            Official IELTS criteria with server-side band calculation.
                        </p>
                    </div>
                    <div className="writing-score-band">
                        <div className="writing-score-circle">
                            <span className="writing-score-value">{overallBand}</span>
                        </div>
                        <div className="writing-score-caption">Overall Band</div>
                    </div>
                </div>

                {loading ? (
                    <div className="writing-score-spinner" />
                ) : error ? (
                    <div className="writing-score-error">{error}</div>
                ) : !summaryRecord ? (
                    <div className="writing-score-empty">No AI results yet.</div>
                ) : (
                    <>
                        <div className="writing-score-meta">
                            <span>{summaryRecord.testName || "Writing Test"}</span>
                            <span>{formatWritingDate(summaryRecord.createdAt)}</span>
                            <span>Words: {criteriaSource?.wordCount ?? 0}</span>
                        </div>

                        <div className="writing-score-grid writing-score-grid--scores">
                            {SCORE_ITEMS.map((item) => (
                                <div className="writing-score-card" key={item.key}>
                                    <h3>{item.label}</h3>
                                    <p className="writing-score-card__score">
                                        {formatBand(criteriaSource?.scores?.[item.key])}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="writing-score-grid">
                            <div className="writing-score-card">
                                <h3>Strengths</h3>
                                <ul className="writing-score-list">
                                    {(criteriaSource?.feedback?.strengths || []).map(
                                        (item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        )
                                    )}
                                    {!criteriaSource?.feedback?.strengths?.length && <li>—</li>}
                                </ul>
                            </div>
                            <div className="writing-score-card">
                                <h3>Weaknesses</h3>
                                <ul className="writing-score-list">
                                    {(criteriaSource?.feedback?.weaknesses || []).map(
                                        (item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        )
                                    )}
                                    {!criteriaSource?.feedback?.weaknesses?.length && <li>—</li>}
                                </ul>
                            </div>
                            <div className="writing-score-card">
                                <h3>Improvement Tips</h3>
                                <ul className="writing-score-list">
                                    {(criteriaSource?.feedback?.improvementTips || []).map(
                                        (item, index) => (
                                            <li key={`${item}-${index}`}>{item}</li>
                                        )
                                    )}
                                    {!criteriaSource?.feedback?.improvementTips?.length && <li>—</li>}
                                </ul>
                            </div>
                            <div className="writing-score-card">
                                <h3>Question</h3>
                                <p>{criteriaSource?.question || "—"}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="writing-score-toggle"
                            onClick={() => setShowDetails((prev) => !prev)}
                        >
                            {showDetails
                                ? "Hide Detailed Criterion Feedback"
                                : "Show Detailed Criterion Feedback"}
                        </button>

                        {showDetails && (
                            <div className="writing-score-grid">
                                {SCORE_ITEMS.map((item) => (
                                    <div className="writing-score-card" key={`${item.key}-detail`}>
                                        <h3>{item.label} Feedback</h3>
                                        <p>{criteriaSource?.criterionFeedback?.[item.key] || "—"}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="writing-score-divider" />

                        <div className="writing-score-footer">
                            <span className="writing-score-footer-task">
                                {summaryRecord.taskType === "task1"
                                    ? "Task 1"
                                    : summaryRecord.taskType === "task2"
                                        ? "Task 2"
                                        : "Combined Writing Result"}
                            </span>
                            <span className="writing-score-footer-dot" />
                            <span className="writing-score-footer-date">
                                {formatWritingDate(summaryRecord.createdAt)}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default WritingScoreResult;
