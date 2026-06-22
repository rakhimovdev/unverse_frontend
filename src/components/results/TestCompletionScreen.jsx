import React from "react";
import { Link } from "react-router-dom";
import ResultCard from "./ResultCard";
import "./ResultsCenter.css";
import "./TestCompletionScreen.css";

function TestCompletionScreen({
    result,
    eyebrow,
    title,
    description,
    statusText,
    onClose,
    primaryActionTo = "/account",
    primaryActionLabel = "Open Result Center",
    secondaryActionTo,
    secondaryActionLabel
}) {
    if (!result) return null;

    return (
        <div className="test-result-modal" role="dialog" aria-modal="true">
            <div className="test-result-modal__backdrop" />
            <div className="test-result-modal__panel">
                <button
                    type="button"
                    className="test-result-modal__close"
                    onClick={onClose}
                    aria-label="Close result"
                >
                    ×
                </button>

                <div className="test-result-modal__intro">
                    <p className="results-hero__eyebrow">{eyebrow}</p>
                    <h2>{title}</h2>
                    {description ? <p>{description}</p> : null}
                    {statusText ? (
                        <p className="test-result-modal__status">{statusText}</p>
                    ) : null}
                </div>

                <div className="test-result-modal__card">
                    <ResultCard
                        result={result}
                        detail={result}
                        expanded
                        loadingDetail={false}
                        onToggle={() => {}}
                        showToggle={false}
                    />
                </div>

                <div className="test-result-modal__actions">
                    <Link
                        className="results-pill-link results-pill-link--light"
                        to={primaryActionTo}
                    >
                        {primaryActionLabel}
                    </Link>
                    {secondaryActionTo && secondaryActionLabel ? (
                        <Link className="results-pill-link" to={secondaryActionTo}>
                            {secondaryActionLabel}
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default TestCompletionScreen;
