import React from "react";
import { formatBand } from "../../utils/ieltsResults";

function BandCard({ title, value, subtitle }) {
    return (
        <article className="result-score-card">
            <div>
                <p className="result-score-card__eyebrow">IELTS Score</p>
                <h3>{title}</h3>
                <p>{subtitle}</p>
            </div>
            <div className="result-score-card__band">{formatBand(value)}</div>
        </article>
    );
}

export default BandCard;
