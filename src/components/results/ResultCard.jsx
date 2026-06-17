import React from "react";
import BandBadge from "./BandBadge";
import {
    formatBand,
    formatDateTime,
    getPrimaryBand,
    getResultToggleLabel,
    getUserDisplayName
} from "../../utils/ieltsResults";

const renderList = (items = [], emptyText = "No feedback provided.") => {
    if (!items.length) {
        return <p className="result-card__empty-copy">{emptyText}</p>;
    }

    return (
        <ul className="result-card__list">
            {items.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
            ))}
        </ul>
    );
};

const renderFeedbackBlock = (title, items = [], emptyText) => (
    <div className="result-card__feedback-block">
        <h5>{title}</h5>
        {renderList(items, emptyText)}
    </div>
);

const renderWritingCriterionMetrics = (task = {}) => {
    const metricItems = [
        { label: "Task Response", value: task.taskResponseScore },
        { label: "Coherence", value: task.coherenceCohesionScore },
        { label: "Lexical", value: task.lexicalResourceScore },
        { label: "Grammar", value: task.grammarRangeAccuracyScore },
        { label: "Overall", value: task.bandScore }
    ];

    return (
        <div className="result-card__metrics result-card__metrics--writing">
            {metricItems.map((item) => (
                <div className="result-card__metric" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{formatBand(item.value)}</strong>
                </div>
            ))}
        </div>
    );
};

const renderAnswerReviews = (items = [], title, emptyText) => (
    <div className="result-card__detail-panel">
        <h4>{title}</h4>
        {items.length ? (
            <div className="result-review-list">
                {items.map((item, index) => (
                    <article className="result-review-card" key={`${item.label}-${index}`}>
                        <div className="result-review-card__head">
                            <strong>{item.label || `Question ${item.questionNumber}`}</strong>
                            <span>{item.prompt || "Prompt unavailable"}</span>
                        </div>
                        <div className="result-review-card__body">
                            <p>
                                <span>Your answer:</span> {item.userAnswer || "—"}
                            </p>
                            <p>
                                <span>Correct answer:</span> {item.correctAnswer || "—"}
                            </p>
                            <p>
                                <span>Explanation:</span> {item.explanation || "—"}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        ) : (
            <p className="result-card__empty-copy">{emptyText}</p>
        )}
    </div>
);

function ResultCard({
    result,
    detail,
    expanded,
    loadingDetail,
    onToggle,
    adminMode = false
}) {
    const activeResult = detail || result;
    const user = activeResult?.userId;
    const primaryBand = getPrimaryBand(activeResult);

    const renderSummary = () => {
        if (activeResult.moduleType === "Reading") {
            const passages = activeResult.reading?.passageScores || [];
            return (
                <>
                    <div className="result-card__metrics">
                        {passages.map((item) => (
                            <div className="result-card__metric" key={item.label}>
                                <span>{item.label}</span>
                                <strong>
                                    {item.correct}/{item.total}
                                </strong>
                            </div>
                        ))}
                    </div>
                    <div className="result-card__band-row">
                        <BandBadge
                            value={activeResult.reading?.academicBand}
                            label="Academic"
                        />
                        <BandBadge
                            value={activeResult.reading?.generalBand}
                            label="General"
                        />
                        <BandBadge
                            value={`${activeResult.reading?.rawScore || 0}/${activeResult.reading?.rawTotal || 40}`}
                            label="Raw Score"
                        />
                    </div>
                </>
            );
        }

        if (activeResult.moduleType === "Listening") {
            const sections = activeResult.listening?.sectionScores || [];
            return (
                <>
                    <div className="result-card__metrics">
                        {sections.map((item) => (
                            <div className="result-card__metric" key={item.label}>
                                <span>{item.label}</span>
                                <strong>
                                    {item.correct}/{item.total}
                                </strong>
                            </div>
                        ))}
                    </div>
                    <div className="result-card__band-row">
                        <BandBadge
                            value={activeResult.listening?.academicBand}
                            label="Academic"
                        />
                        <BandBadge
                            value={activeResult.listening?.generalBand}
                            label="General"
                        />
                        <BandBadge
                            value={`${activeResult.listening?.rawScore || 0}/${activeResult.listening?.rawTotal || 40}`}
                            label="Raw Score"
                        />
                    </div>
                </>
            );
        }

        if (activeResult.moduleType === "Writing") {
            return (
                <div className="result-card__band-row">
                    <BandBadge
                        value={activeResult.writing?.task1?.bandScore}
                        label="Task 1"
                    />
                    <BandBadge
                        value={activeResult.writing?.task2?.bandScore}
                        label="Task 2"
                    />
                    <BandBadge
                        value={activeResult.writing?.overallBand}
                        label="Overall"
                    />
                </div>
            );
        }

        return (
            <div className="result-card__band-row">
                <BandBadge value={activeResult.speaking?.fluency} label="Fluency" />
                <BandBadge
                    value={activeResult.speaking?.pronunciation}
                    label="Pronunciation"
                />
                <BandBadge value={activeResult.speaking?.grammar} label="Grammar" />
                <BandBadge
                    value={activeResult.speaking?.vocabulary}
                    label="Vocabulary"
                />
            </div>
        );
    };

    const renderDetails = () => {
        if (!expanded) return null;
        if (loadingDetail) {
            return <div className="result-card__loading">Loading full result...</div>;
        }

        if (activeResult.moduleType === "Reading") {
            return (
                <div className="result-card__details">
                    {renderAnswerReviews(
                        activeResult.reading?.wrongAnswers || [],
                        "Incorrect Answers",
                        "No mistakes recorded for this reading attempt."
                    )}
                    {renderAnswerReviews(
                        activeResult.reading?.correctAnswers || [],
                        "Correct Answers",
                        "Correct answer review will appear here after submission."
                    )}
                </div>
            );
        }

        if (activeResult.moduleType === "Listening") {
            return (
                <div className="result-card__details">
                    {renderAnswerReviews(
                        activeResult.listening?.wrongAnswers || [],
                        "Incorrect Answers",
                        "No mistakes recorded for this listening attempt."
                    )}
                    {renderAnswerReviews(
                        activeResult.listening?.correctAnswers || [],
                        "Correct Answers",
                        "Correct answer review will appear here after submission."
                    )}
                </div>
            );
        }

        if (activeResult.moduleType === "Writing") {
            const task1 = activeResult.writing?.task1 || {};
            const task2 = activeResult.writing?.task2 || {};

            return (
                <div className="result-card__details">
                    <div className="result-card__detail-panel">
                        <h4>Task 1 Feedback</h4>
                        {renderWritingCriterionMetrics(task1)}
                        {renderFeedbackBlock(
                            "Strengths",
                            task1.strengths,
                            "No task 1 strengths recorded."
                        )}
                        {renderFeedbackBlock(
                            "Weaknesses",
                            task1.weaknesses,
                            "No task 1 weaknesses recorded."
                        )}
                        {renderFeedbackBlock(
                            "Improvement Tips",
                            task1.improvementTips,
                            "No task 1 tips recorded."
                        )}
                        {renderFeedbackBlock(
                            "Task Response Feedback",
                            task1.criterionFeedback?.taskResponse
                                ? [task1.criterionFeedback.taskResponse]
                                : [],
                            "No task response feedback recorded."
                        )}
                        {renderFeedbackBlock(
                            "Coherence & Cohesion Feedback",
                            task1.criterionFeedback?.coherenceCohesion
                                ? [task1.criterionFeedback.coherenceCohesion]
                                : [],
                            "No coherence feedback recorded."
                        )}
                        {renderFeedbackBlock(
                            "Lexical Resource Feedback",
                            task1.criterionFeedback?.lexicalResource
                                ? [task1.criterionFeedback.lexicalResource]
                                : [],
                            "No lexical feedback recorded."
                        )}
                        {renderFeedbackBlock(
                            "Grammar Feedback",
                            task1.criterionFeedback?.grammarRangeAccuracy
                                ? [task1.criterionFeedback.grammarRangeAccuracy]
                                : task1.grammarFeedback,
                            "No grammar feedback recorded."
                        )}
                        {renderFeedbackBlock(
                            "Legacy Vocabulary Notes",
                            task1.vocabularyFeedback,
                            "No legacy vocabulary notes recorded."
                        )}
                        {renderFeedbackBlock(
                            "Legacy Coherence Notes",
                            task1.coherenceFeedback,
                            "No legacy coherence notes recorded."
                        )}
                        {renderFeedbackBlock(
                            "Question",
                            task1.question || task1.prompt ? [task1.question || task1.prompt] : [],
                            "Question text is not available."
                        )}
                    </div>

                    <div className="result-card__detail-panel">
                        <h4>Task 2 Feedback</h4>
                        {renderWritingCriterionMetrics(task2)}
                        {renderFeedbackBlock(
                            "Strengths",
                            task2.strengths,
                            "No task 2 strengths recorded."
                        )}
                        {renderFeedbackBlock(
                            "Weaknesses",
                            task2.weaknesses,
                            "No task 2 weaknesses recorded."
                        )}
                        {renderFeedbackBlock(
                            "Improvement Tips",
                            task2.improvementTips,
                            "No task 2 tips recorded."
                        )}
                        {renderFeedbackBlock(
                            "Task Response Feedback",
                            task2.criterionFeedback?.taskResponse
                                ? [task2.criterionFeedback.taskResponse]
                                : [],
                            "No task response feedback recorded."
                        )}
                        {renderFeedbackBlock(
                            "Coherence & Cohesion Feedback",
                            task2.criterionFeedback?.coherenceCohesion
                                ? [task2.criterionFeedback.coherenceCohesion]
                                : [],
                            "No coherence feedback recorded."
                        )}
                        {renderFeedbackBlock(
                            "Lexical Resource Feedback",
                            task2.criterionFeedback?.lexicalResource
                                ? [task2.criterionFeedback.lexicalResource]
                                : [],
                            "No lexical feedback recorded."
                        )}
                        {renderFeedbackBlock(
                            "Grammar Feedback",
                            task2.criterionFeedback?.grammarRangeAccuracy
                                ? [task2.criterionFeedback.grammarRangeAccuracy]
                                : task2.grammarFeedback,
                            "No grammar feedback recorded."
                        )}
                        {renderFeedbackBlock(
                            "Legacy Vocabulary Notes",
                            task2.vocabularyFeedback,
                            "No legacy vocabulary notes recorded."
                        )}
                        {renderFeedbackBlock(
                            "Legacy Coherence Notes",
                            task2.coherenceFeedback,
                            "No legacy coherence notes recorded."
                        )}
                        {renderFeedbackBlock(
                            "Question",
                            task2.question || task2.prompt ? [task2.question || task2.prompt] : [],
                            "Question text is not available."
                        )}
                    </div>

                    <div className="result-card__detail-panel result-card__detail-panel--full">
                        <h4>Final AI Feedback</h4>
                        <p className="result-card__detail-band">
                            Overall Band: {formatBand(activeResult.writing?.overallBand)}
                        </p>
                        {renderFeedbackBlock(
                            "Strength Highlights",
                            [...(task1.strengths || []), ...(task2.strengths || [])],
                            "No strengths recorded."
                        )}
                        {renderFeedbackBlock(
                            "Priority Weaknesses",
                            [...(task1.weaknesses || []), ...(task2.weaknesses || [])],
                            "No weaknesses recorded."
                        )}
                        {renderFeedbackBlock(
                            "Priority Improvement Tips",
                            [...(task1.improvementTips || []), ...(task2.improvementTips || [])],
                            "No improvement tips recorded."
                        )}
                        <p className="result-card__detail-copy">
                            {activeResult.writing?.finalSummary ||
                                "AI summary is not available for this attempt yet."}
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="result-card__details">
                <div className="result-card__detail-panel">
                    <h4>Detailed Feedback</h4>
                    {renderList(
                        activeResult.speaking?.detailedFeedback || [],
                        "Detailed speaking feedback is not available yet."
                    )}
                </div>
                <div className="result-card__detail-panel">
                    <h4>Weaknesses</h4>
                    {renderList(
                        activeResult.speaking?.weaknesses || [],
                        "No speaking weaknesses recorded."
                    )}
                </div>
                <div className="result-card__detail-panel">
                    <h4>Improvement Tips</h4>
                    {renderList(
                        activeResult.speaking?.improvementTips || [],
                        "No speaking tips recorded."
                    )}
                </div>
            </div>
        );
    };

    return (
        <article className="result-card">
            <div className="result-card__top">
                <div>
                    <p className="result-card__eyebrow">{activeResult.moduleType}</p>
                    <h3>{activeResult.testName || `${activeResult.moduleType} Test`}</h3>
                    <p className="result-card__date">
                        Completed: {formatDateTime(activeResult.createdAt)}
                    </p>
                    {adminMode && (
                        <p className="result-card__candidate">
                            Candidate: {getUserDisplayName(user)} · {user?.email || "No email"}
                        </p>
                    )}
                </div>

                <div className="result-card__side">
                    <BandBadge value={primaryBand} label="Band" />
                    <button
                        type="button"
                        className="result-card__toggle"
                        onClick={onToggle}
                    >
                        {expanded ? "Hide Details" : getResultToggleLabel(activeResult.moduleType)}
                    </button>
                </div>
            </div>

            {renderSummary()}
            {renderDetails()}
        </article>
    );
}

export default ResultCard;
