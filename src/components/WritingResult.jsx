import React, { useEffect, useMemo, useState } from "react";
import axios from "../Api/Axios";
import {
    formatBand,
    formatWritingDate,
    getLatestWritingAttempt,
    normalizeWritingRecord
} from "../utils/writingResults";
import "./WritingResult.css";

const SCORE_ITEMS = [
    { key: "taskResponse", label: "Task Response" },
    { key: "coherenceCohesion", label: "Coherence & Cohesion" },
    { key: "lexicalResource", label: "Lexical Resource" },
    { key: "grammarRangeAccuracy", label: "Grammar" }
];

function WritingResult({ user, readingBand, listeningBand, speakingBand }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [loaded, setLoaded] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

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
                setResults(payload.map((item) => normalizeWritingRecord(item)));
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

    const latestAttempt = useMemo(
        () => getLatestWritingAttempt(results),
        [results]
    );

    const summaryRecord = latestAttempt.overall || latestAttempt.latestTask;
    const criteriaSource = latestAttempt.criteriaSource;

    const toBandNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    };

    const roundToHalf = (value) => {
        if (value == null) return null;
        return Math.round(value * 2) / 2;
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

    const writingBandValue = formatBand(
        latestAttempt.overall?.scores?.overall ??
            latestAttempt.latestTask?.scores?.overall
    );

    const overallBand = (() => {
        const values = [
            toBandNumber(readingBand),
            toBandNumber(listeningBand),
            toBandNumber(
                latestAttempt.overall?.scores?.overall ??
                    latestAttempt.latestTask?.scores?.overall
            ),
            toBandNumber(speakingBand)
        ].filter((value) => value != null);

        if (!values.length) return writingBandValue;
        const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
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
                ) : error || !summaryRecord ? (
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
                                <div className="writing-result-score-md">
                                    {formatBand(listeningBand)}
                                </div>
                                <span className="writing-result-arrow">›</span>
                            </div>
                            <div className="writing-result-card">
                                <div className="writing-result-label">Reading</div>
                                <div className="writing-result-score-md">
                                    {formatBand(readingBand)}
                                </div>
                                <span className="writing-result-arrow">›</span>
                            </div>
                            <div className="writing-result-card is-writing">
                                <div className="writing-result-label">Writing</div>
                                <div className="writing-result-score-md">{writingBandValue}</div>
                                <span className="writing-result-arrow">›</span>
                            </div>
                            <div className="writing-result-card">
                                <div className="writing-result-label">Speaking</div>
                                <div className="writing-result-score-md">
                                    {formatBand(speakingBand)}
                                </div>
                                <span className="writing-result-arrow">›</span>
                            </div>
                        </div>

                        <div className="writing-result-section">
                            <div className="writing-result-section-header">
                                <h2>Writing feedback</h2>
                                <span className="writing-result-date">
                                    {formatWritingDate(summaryRecord.createdAt)}
                                </span>
                            </div>

                            <div className="writing-result-meta">
                                <span>{summaryRecord.testName || "Writing Test"}</span>
                                <span>
                                    {summaryRecord.taskType === "overall"
                                        ? "Task 1 + Task 2"
                                        : summaryRecord.taskType === "task1"
                                            ? "Task 1"
                                            : "Task 2"}
                                </span>
                                <span>Words: {criteriaSource?.wordCount ?? 0}</span>
                            </div>

                            <div className="writing-result-criteria-grid">
                                {SCORE_ITEMS.map((item) => (
                                    <div className="writing-result-criteria-card" key={item.key}>
                                        <div className="writing-result-label">{item.label}</div>
                                        <div className="writing-result-score-md">
                                            {formatBand(criteriaSource?.scores?.[item.key])}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="writing-result-feedback-grid">
                                <div className="writing-result-feedback-panel">
                                    <h3>Strengths</h3>
                                    <ul>
                                        {(criteriaSource?.feedback?.strengths || []).map(
                                            (item, index) => (
                                                <li key={`${item}-${index}`}>{item}</li>
                                            )
                                        )}
                                        {!criteriaSource?.feedback?.strengths?.length && <li>—</li>}
                                    </ul>
                                </div>
                                <div className="writing-result-feedback-panel">
                                    <h3>Weaknesses</h3>
                                    <ul>
                                        {(criteriaSource?.feedback?.weaknesses || []).map(
                                            (item, index) => (
                                                <li key={`${item}-${index}`}>{item}</li>
                                            )
                                        )}
                                        {!criteriaSource?.feedback?.weaknesses?.length && <li>—</li>}
                                    </ul>
                                </div>
                                <div className="writing-result-feedback-panel">
                                    <h3>Improvement Tips</h3>
                                    <ul>
                                        {(criteriaSource?.feedback?.improvementTips || []).map(
                                            (item, index) => (
                                                <li key={`${item}-${index}`}>{item}</li>
                                            )
                                        )}
                                        {!criteriaSource?.feedback?.improvementTips?.length && <li>—</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="writing-result-detail-toggle"
                            onClick={() => setShowDetails((prev) => !prev)}
                        >
                            {showDetails
                                ? "Hide Detailed Criterion Feedback"
                                : "Show Detailed Criterion Feedback"}
                        </button>

                        {showDetails && (
                            <div className="writing-result-detail-grid">
                                {SCORE_ITEMS.map((item) => (
                                    <div className="writing-result-feedback-panel" key={`${item.key}-detail`}>
                                        <h3>{item.label}</h3>
                                        <p>{criteriaSource?.criterionFeedback?.[item.key] || "—"}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default WritingResult;
