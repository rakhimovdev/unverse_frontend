import React, { useMemo } from "react";
import { formatBand } from "../../utils/ieltsResults";

const WIDTH = 720;
const HEIGHT = 260;
const PADDING_X = 42;
const PADDING_Y = 28;

function HistoryChart({ points = [] }) {
    const chart = useMemo(() => {
        if (!points.length) return null;

        const minBand = 0;
        const maxBand = 9;
        const stepX =
            points.length > 1
                ? (WIDTH - PADDING_X * 2) / (points.length - 1)
                : 0;

        const coords = points.map((point, index) => {
            const x = PADDING_X + index * stepX;
            const ratio = (point.band - minBand) / (maxBand - minBand || 1);
            const y = HEIGHT - PADDING_Y - ratio * (HEIGHT - PADDING_Y * 2);
            return { ...point, x, y };
        });

        const path = coords
            .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
            .join(" ");

        const areaPath = `${path} L ${coords[coords.length - 1].x} ${HEIGHT - PADDING_Y} L ${coords[0].x} ${HEIGHT - PADDING_Y} Z`;

        return { coords, path, areaPath };
    }, [points]);

    if (!points.length || !chart) {
        return (
            <div className="result-chart result-chart--empty">
                No performance history yet.
            </div>
        );
    }

    return (
        <div className="result-chart">
            <div className="result-chart__header">
                <div>
                    <p className="result-chart__eyebrow">Performance History</p>
                    <h3>Progress Over Time</h3>
                </div>
                <span className="result-chart__caption">
                    Latest band: {formatBand(points[points.length - 1]?.band)}
                </span>
            </div>

            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="result-chart__svg"
                role="img"
                aria-label="IELTS band progress chart"
            >
                {[0, 2, 4, 6, 8, 9].map((tick) => {
                    const ratio = tick / 9;
                    const y = HEIGHT - PADDING_Y - ratio * (HEIGHT - PADDING_Y * 2);
                    return (
                        <g key={tick}>
                            <line
                                x1={PADDING_X}
                                x2={WIDTH - PADDING_X}
                                y1={y}
                                y2={y}
                                className="result-chart__grid"
                            />
                            <text x={10} y={y + 4} className="result-chart__axis">
                                {tick}
                            </text>
                        </g>
                    );
                })}

                <path d={chart.areaPath} className="result-chart__area" />
                <path d={chart.path} className="result-chart__line" />

                {chart.coords.map((point) => (
                    <g key={point.id}>
                        <circle cx={point.x} cy={point.y} r="5.5" className="result-chart__dot" />
                        <text x={point.x} y={HEIGHT - 6} className="result-chart__axis result-chart__axis--x">
                            {point.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

export default HistoryChart;
