import React, { useEffect, useMemo, useState } from "react";
import axios from "../Api/Axios";
import {
    formatBand,
    formatWritingDate,
    getLatestWritingAttempt,
    getWritingScoreItems,
    normalizeWritingRecord
} from "../utils/writingResults";
import "./WritingScoreResult.css";

const renderList = (items = [], emptyText = "—") =>
    items.length ? (
        <ul className="writing-score-list">
            {items.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
            ))}
        </ul>
    ) : (
        <ul className="writing-score-list">
            <li>{emptyText}</li>
        </ul>
    );

const WritingTaskPanel = ({ task }) => {
    const scoreItems = getWritingScoreItems(task);

    return (
        <div className="writing-score-card">
            <h3>{task.taskTypeLabel}</h3>
            <p>{task.question || "—"}</p>
            <p>Words: {task.wordCount ?? 0}</p>

            <div className="writing-score-grid writing-score-grid--scores">
                {scoreItems.map((item) => (
                    <div className="writing-score-card" key={`${task._id}-${item.key}`}>
                        <h3>{item.label}</h3>
                        <p className="writing-score-card__score">
                            {formatBand(item.value)}
                        </p>
                    </div>
                ))}
            </div>

            <div className="writing-score-grid">
                <div className="writing-score-card">
                    <h3>Strengths</h3>
                    {renderList(task.strengths, "No specific strengths recorded.")}
                </div>
                <div className="writing-score-card">
                    <h3>Weaknesses</h3>
                    {renderList(task.weaknesses, "No specific weaknesses recorded.")}
                </div>
                <div className="writing-score-card">
                    <h3>Improvement Focus</h3>
                    {renderList(
                        task.improvementTips,
                        "No improvement priorities recorded."
                    )}
                </div>
            </div>

            <div className="writing-score-grid">
                {scoreItems.map((item) => {
                    const detail = task.criterionFeedback?.[item.key];

                    return (
                        <div className="writing-score-card" key={`${task._id}-${item.key}-detail`}>
                            <h3>
                                {item.label} Feedback
                                {detail?.band != null ? ` (Band ${formatBand(detail.band)})` : ""}
                            </h3>
                            <p>{detail?.analysis || "No analysis recorded."}</p>
                            {renderList(detail?.evidence || [], "No evidence quoted.")}
                        </div>
                    );
                })}
            </div>

            <div className="writing-score-grid">
                <div className="writing-score-card">
                    <h3>Grammar Corrections</h3>
                    {task.grammarCorrections?.length ? (
                        <ul className="writing-score-list">
                            {task.grammarCorrections.map((item, index) => (
                                <li key={`${item.original}-${index}`}>
                                    <strong>{item.original}</strong>
                                    {" -> "}
                                    <strong>{item.correct}</strong>
                                    {`: ${item.reason}`}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <ul className="writing-score-list">
                            <li>No grammar corrections recorded.</li>
                        </ul>
                    )}
                </div>
                <div className="writing-score-card">
                    <h3>Vocabulary Suggestions</h3>
                    {task.vocabularySuggestions?.length ? (
                        <ul className="writing-score-list">
                            {task.vocabularySuggestions.map((item, index) => (
                                <li key={`${item.original}-${index}`}>
                                    <strong>{item.original}</strong>
                                    {`: ${item.alternatives.join(", ")}`}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <ul className="writing-score-list">
                            <li>No vocabulary suggestions recorded.</li>
                        </ul>
                    )}
                </div>
                <div className="writing-score-card">
                    <h3>Estimated Examiner Comment</h3>
                    <p>{task.estimatedExaminerComment || "—"}</p>
                </div>
            </div>
        </div>
    );
};

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
    const displayTasks = latestAttempt.displayTasks;

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
                            Official IELTS criteria with evidence-based feedback.
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
                            <span>
                                Words:{" "}
                                {displayTasks.reduce(
                                    (sum, item) => sum + (Number(item?.wordCount) || 0),
                                    0
                                )}
                            </span>
                        </div>

                        {latestAttempt.overall ? (
                            <div className="writing-score-card">
                                <h3>Combined Writing Result</h3>
                                <p>{formatBand(latestAttempt.overall?.scores?.overall)}</p>
                                <p>{latestAttempt.overall?.estimatedExaminerComment || "—"}</p>
                            </div>
                        ) : null}

                        {displayTasks.map((task) => (
                            <WritingTaskPanel key={task._id || task.taskType} task={task} />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}

export default WritingScoreResult;
