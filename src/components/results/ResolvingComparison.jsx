import React from "react";

const band = (value) =>
    Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "N/A";

function ResolvingComparison({ comparison }) {
    if (!comparison) return null;
    const before = comparison.solving;
    const after = comparison.resolving;
    const beforeData = before?.reading || before?.listening || {};
    const afterData = after?.reading || after?.listening || {};

    return (
        <section className="resolving-comparison">
            <h3>Solving vs Resolving</h3>
            <div className="resolving-comparison__metrics">
                <div><strong>Solving</strong><span>{beforeData.rawScore}/{beforeData.rawTotal}</span><small>Band {band(before?.overallBand)}</small></div>
                <div><strong>Resolving</strong><span>{afterData.rawScore}/{afterData.rawTotal}</span><small>Band {band(after?.overallBand)}</small></div>
                <div><strong>Gain</strong><span>{comparison.gain.questions >= 0 ? "+" : ""}{comparison.gain.questions} questions</span><small>{comparison.gain.band >= 0 ? "+" : ""}{band(comparison.gain.band)} band</small></div>
            </div>
            <p>{comparison.insight}</p>
            <div className="resolving-comparison__questions">
                {comparison.questions.map((item) => (
                    <div key={item.questionNumber}>
                        <strong>Question {item.questionNumber}</strong>
                        <span>Solving: {item.solvingAnswer || "Unanswered"}</span>
                        <span>Resolving: {item.resolvingAnswer || "Unanswered"}</span>
                        <em>{item.status}</em>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default ResolvingComparison;