import React from "react";
import { formatBand } from "../../utils/ieltsResults";

function BandBadge({ value, label = "Band" }) {
    const displayValue =
        typeof value === "string" ? value : formatBand(value);

    return (
        <div className="result-band-badge">
            <span className="result-band-badge__label">{label}</span>
            <strong className="result-band-badge__value">{displayValue}</strong>
        </div>
    );
}

export default BandBadge;
