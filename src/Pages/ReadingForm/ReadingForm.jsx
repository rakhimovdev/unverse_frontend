import React, { useEffect, useState } from "react";

import { FaClock } from "react-icons/fa6";
import { useParams } from "react-router-dom";

import axios from "../../Api/Axios";

import "./ReadingForm.css";

const MARKER_REGEX = /\[\[([^\]]+)\]\]/g;
const TFNG_OPTIONS = ["True", "False", "Not Given"];
const YNNG_OPTIONS = ["Yes", "No", "Not Given"];
const DEFAULT_MC_OPTIONS = ["A", "B", "C", "D"];

const ACADEMIC_BAND_TABLE = [
    { min: 39, max: 40, band: 9 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8 },
    { min: 33, max: 34, band: 7.5 },
    { min: 30, max: 32, band: 7 },
    { min: 27, max: 29, band: 6.5 },
    { min: 23, max: 26, band: 6 },
    { min: 19, max: 22, band: 5.5 },
    { min: 15, max: 18, band: 5 },
    { min: 12, max: 14, band: 4.5 },
    { min: 9, max: 11, band: 4 },
    { min: 5, max: 8, band: 3 },
];

const GENERAL_BAND_TABLE = [
    { min: 39, max: 40, band: 9 },
    { min: 38, max: 38, band: 8.5 },
    { min: 37, max: 37, band: 8 },
    { min: 36, max: 36, band: 7.5 },
    { min: 34, max: 35, band: 7 },
    { min: 32, max: 33, band: 6.5 },
    { min: 30, max: 31, band: 6 },
    { min: 27, max: 29, band: 5.5 },
    { min: 23, max: 26, band: 5 },
    { min: 19, max: 22, band: 4.5 },
    { min: 15, max: 18, band: 4 },
    { min: 12, max: 14, band: 3 },
];

const normalizeTokenType = (rawType) =>
    rawType
        .toLowerCase()
        .replace(/&nbsp;/g, " ")
        .replace(/[^a-z]/g, "");

const normalizeOptionsString = (rawOptions) =>
    rawOptions ? rawOptions.replace(/&nbsp;/g, " ").trim() : "";

const parseOptions = (rawOptions, fallbackOptions) => {
    const cleaned = normalizeOptionsString(rawOptions);
    if (!cleaned) return fallbackOptions;

    const keyword = cleaned.toLowerCase().replace(/[^a-z]/g, "");

    if (
        keyword === "tfng" ||
        keyword === "truefalse" ||
        keyword === "truefalsenotgiven"
    ) {
        return TFNG_OPTIONS;
    }

    if (
        keyword === "yn" ||
        keyword === "ynng" ||
        keyword === "yesno" ||
        keyword === "yesnonotgiven"
    ) {
        return YNNG_OPTIONS;
    }

    return cleaned
        .split("|")
        .map((opt) => opt.trim())
        .filter(Boolean);
};

const parseOptionsStrict = (rawOptions) => {
    const cleaned = normalizeOptionsString(rawOptions);
    if (!cleaned) return [];

    return cleaned
        .split("|")
        .map((opt) => opt.trim())
        .filter(Boolean);
};

const inputTypes = new Set([
    "input",
    "short",
    "shortanswer",
    "sentence",
    "sentencecompletion",
    "table",
    "tablecompletion",
    "diagram",
    "diagramlabel",
    "flow",
    "flowchart",
    "summary",
    "summarycompletion",
]);

const parseToken = (rawToken) => {
    const [rawType, rawOptions] = rawToken.split(/:(.*)/s);
    const type = normalizeTokenType(rawType);

    if (inputTypes.has(type)) {
        return { kind: "input" };
    }

    if (type === "select") {
        return {
            kind: "select",
            options: parseOptions(rawOptions, TFNG_OPTIONS),
        };
    }

    if (
        type === "tfng" ||
        type === "truefalse" ||
        type === "truefalsenotgiven"
    ) {
        return { kind: "select", options: TFNG_OPTIONS };
    }

    if (
        type === "yn" ||
        type === "ynng" ||
        type === "yesno" ||
        type === "yesnonotgiven"
    ) {
        return { kind: "select", options: YNNG_OPTIONS };
    }

    if (
        type === "matchingheadings" ||
        type === "matching" ||
        type === "match" ||
        type === "headings" ||
        type === "heading"
    ) {
        return {
            kind: "select",
            options: parseOptionsStrict(rawOptions).length
                ? parseOptionsStrict(rawOptions)
                : DEFAULT_MC_OPTIONS,
            includeEmpty: true,
        };
    }

    if (
        type === "radio" ||
        type === "redio" ||
        type === "mc" ||
        type === "multiplechoice"
    ) {
        return {
            kind: "radio",
            options: parseOptions(rawOptions, DEFAULT_MC_OPTIONS),
        };
    }

    return null;
};

const getQuestionDefs = (html) => {
    const regex = new RegExp(MARKER_REGEX);
    const defs = [];
    let match;

    while ((match = regex.exec(html))) {
        const parsed = parseToken(match[1]);
        if (!parsed) continue;

        defs.push({
            type: parsed.kind === "input" ? "text" : "select",
        });
    }

    return defs;
};

const normalizeAnswer = (value) =>
    String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

const isCorrectAnswer = (userValue, correctValue) => {
    const user = normalizeAnswer(userValue);
    const correct = normalizeAnswer(correctValue);
    if (!user || !correct) return false;

    const alternatives = correct
        .split(/\/|\|/g)
        .map((item) => item.trim())
        .filter(Boolean);

    return alternatives.includes(user);
};

const getBandScore = (rawScore, table) => {
    for (const row of table) {
        if (rawScore >= row.min && rawScore <= row.max) return row.band;
    }
    return "<3.0";
};

function ReadingForm() {
    const { testId } = useParams();

    /* ================= STATE ================= */

    const [test, setTest] = useState(null);
    const [activePassage, setActivePassage] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [secondsLeft, setSecondsLeft] = useState(3600);
    const [scoreResult, setScoreResult] = useState(null);
    const [savingScore, setSavingScore] = useState(false);

    /* ================= LOAD TEST ================= */

    useEffect(() => {
        axios
            .get(`/test/${testId}`)
            .then((res) => {
                const data = res.data;
                setTest(data);

                const answers = data.passages.map((p) => {
                    const defs = getQuestionDefs(p.testText || "");
                    return Array(defs.length).fill("");
                });

                setUserAnswers(answers);
            })
            .catch((err) => {
                console.log("LOAD ERROR:", err.response?.data || err);
            });
    }, [testId]);

    /* ================= TIMER ================= */

    useEffect(() => {
        if (secondsLeft <= 0) return;

        const timer = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [secondsLeft]);

    /* ================= FORMAT TIME ================= */

    const formatTime = (sec) => {
        const min = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    /* ================= ANSWER CHANGE ================= */

    const handleChange = (value, index) => {
        setUserAnswers((prev) => {
            const copy = [...prev];
            copy[activePassage][index] = value;
            return copy;
        });
    };

    const calculateScores = () => {
        if (!test) {
            return {
                totalCorrect: 0,
                totalQuestions: 0,
                passageCorrect: 0,
                passageTotal: 0,
                passageResults: [],
                academicBand: "N/A",
                generalBand: "N/A",
                bandAvailable: false,
                hasAnswerKey: false,
            };
        }

        let totalCorrect = 0;
        let totalQuestions = 0;
        let passageCorrect = 0;
        let passageTotal = 0;
        let hasAnswerKey = false;
        const passageResults = test.passages.map(() => ({
            correct: 0,
            total: 0
        }));

        test.passages.forEach((p, pIndex) => {
            const defs = getQuestionDefs(p.testText || "");
            const answers = userAnswers[pIndex] || [];
            const correctAnswers = p.questions || [];

            defs.forEach((_, qIndex) => {
                totalQuestions += 1;
                passageResults[pIndex].total += 1;
                if (pIndex === activePassage) passageTotal += 1;

                const correctValue = correctAnswers[qIndex]?.value || "";
                if (correctValue.trim()) hasAnswerKey = true;

                if (isCorrectAnswer(answers[qIndex], correctValue)) {
                    totalCorrect += 1;
                    passageResults[pIndex].correct += 1;
                    if (pIndex === activePassage) passageCorrect += 1;
                }
            });
        });

        const bandAvailable = totalQuestions === 40;
        const academicBand = bandAvailable
            ? getBandScore(totalCorrect, ACADEMIC_BAND_TABLE)
            : "N/A";
        const generalBand = bandAvailable
            ? getBandScore(totalCorrect, GENERAL_BAND_TABLE)
            : "N/A";

        return {
            totalCorrect,
            totalQuestions,
            passageCorrect,
            passageTotal,
            passageResults,
            academicBand,
            generalBand,
            bandAvailable,
            hasAnswerKey,
        };
    };

    /* ================= SUBMIT ================= */

    const handleSubmit = async () => {
        if (!test) return;
        const result = calculateScores();
        setScoreResult(result);
        if (!result.hasAnswerKey) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setSavingScore(true);
            await axios.post(
                "/score/add",
                {
                    testId: test._id,
                    score: result.totalCorrect
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
        } catch (err) {
            console.error("Score save error:", err.response?.data || err);
        } finally {
            setSavingScore(false);
        }
    };

    /* ================= SAFE CHECK ================= */

    if (!test) return <p>Loading...</p>;

    const passage = test.passages[activePassage];

    /* ================= PARSE TEST TEXT ================= */

    const renderQuestionHTML = () => {
        const regex = new RegExp(MARKER_REGEX);
        let questionIndex = 0;
        let nodeKey = 0;
        let lastIndex = 0;
        const nodes = [];
        let match;

        while ((match = regex.exec(passage.testText))) {
            const rawToken = match[1];

            nodes.push(
                <span
                    key={`text-${nodeKey++}`}
                    dangerouslySetInnerHTML={{
                        __html: passage.testText.slice(lastIndex, match.index),
                    }}
                />
            );

            const parsed = parseToken(rawToken);

            if (!parsed) {
                nodes.push(
                    <span
                        key={`unknown-${nodeKey++}`}
                        dangerouslySetInnerHTML={{
                            __html: passage.testText.slice(match.index, regex.lastIndex),
                        }}
                    />
                );
                lastIndex = regex.lastIndex;
                continue;
            }

            if (parsed.kind === "input") {
                const currentIndex = questionIndex;
                nodes.push(
                    <input
                        key={`input-${nodeKey++}`}
                        value={userAnswers[activePassage]?.[currentIndex] || ""}
                        onChange={(e) => handleChange(e.target.value, currentIndex)}
                    />
                );
                questionIndex++;
            }

            if (parsed.kind === "select") {
                const currentIndex = questionIndex;
                nodes.push(
                    <select
                        key={`select-${nodeKey++}`}
                        value={userAnswers[activePassage]?.[currentIndex] || ""}
                        onChange={(e) => handleChange(e.target.value, currentIndex)}
                    >
                        {parsed.includeEmpty !== false ? (
                            <option value=""></option>
                        ) : (
                            <option value="" disabled hidden></option>
                        )}
                        {parsed.options.map((opt, optIndex) => (
                            <option key={`select-${currentIndex}-${optIndex}`} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                );
                questionIndex++;
            }

            if (parsed.kind === "radio") {
                const currentIndex = questionIndex;
                nodes.push(
                    <span key={`radio-${nodeKey++}`}>
                        {parsed.options.map((opt, optIndex) => (
                            <label key={`radio-${currentIndex}-${optIndex}`}>
                                <input
                                    type="radio"
                                    name={`radio-${activePassage}-${currentIndex}`}
                                    value={opt}
                                    checked={
                                        userAnswers[activePassage]?.[currentIndex] === opt
                                    }
                                    onChange={(e) =>
                                        handleChange(e.target.value, currentIndex)
                                    }
                                />
                                {opt}
                            </label>
                        ))}
                    </span>
                );
                questionIndex++;
            }

            lastIndex = regex.lastIndex;
        }

        nodes.push(
            <span
                key={`end-${nodeKey++}`}
                dangerouslySetInnerHTML={{
                    __html: passage.testText.slice(lastIndex),
                }}
            />
        );

        return nodes;
    };

    /* ================= UI ================= */

    return (
        <div className="readingform-blue">
            {/* HEADER */}
            <header className="reading-header">
                <h1>{test.name}</h1>

                <div className="timer">
                    <FaClock />
                    {formatTime(secondsLeft)}
                </div>
            </header>

            {/* PASSAGE TABS */}
            <div className="passage-tabs">
                {test.passages.map((_, i) => (
                    <button
                        key={i}
                        className={activePassage === i ? "active" : ""}
                        onClick={() => setActivePassage(i)}
                    >
                        Passage {i + 1}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="container-blue">
                {/* READING TEXT */}
                <div
                    className="reading-half"
                    dangerouslySetInnerHTML={{ __html: passage.readingText }}
                />

                {/* QUESTIONS */}
                <div className="test-half">
                    {renderQuestionHTML()}

                    <br />

                    <button className="submit-btn" onClick={handleSubmit} disabled={savingScore}>
                        {savingScore ? "Saving..." : `Submit Passage ${activePassage + 1}`}
                    </button>

                    {scoreResult && (
                        <div className="score-box">
                            {!scoreResult.hasAnswerKey && (
                                <div className="score-note">
                                    No answer key saved for this test yet.
                                </div>
                            )}
                            <div>
                                <strong>Passage raw score:</strong>{" "}
                                {scoreResult.passageCorrect} /{" "}
                                {scoreResult.passageTotal}
                            </div>
                            <div>
                                <strong>Total raw score:</strong>{" "}
                                {scoreResult.totalCorrect} /{" "}
                                {scoreResult.totalQuestions}
                            </div>
                            {scoreResult.passageResults.length > 0 && (
                                <div className="score-breakdown">
                                    <strong>Per passage:</strong>
                                    <div className="score-breakdown-list">
                                        {scoreResult.passageResults.map((p, idx) => (
                                            <span key={`passage-score-${idx}`}>
                                                Passage {idx + 1}: {p.correct} / {p.total}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <strong>Band (Academic):</strong>{" "}
                                {scoreResult.academicBand}
                            </div>
                            <div>
                                <strong>Band (General Training):</strong>{" "}
                                {scoreResult.generalBand}
                            </div>
                            {scoreResult.bandAvailable && (
                                <div className="score-note">
                                    Band boundaries are approximate and can vary by test.
                                </div>
                            )}
                            {!scoreResult.bandAvailable && (
                                <div className="score-note">
                                    Band score requires 40 questions.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ReadingForm;
