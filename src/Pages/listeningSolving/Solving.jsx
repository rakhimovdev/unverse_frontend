import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../Api/Axios";
import "./Solving.css";

const MARKER_REGEX = /\[\[([^\]]+)\]\]/g;
const TFNG_OPTIONS = ["True", "False", "Not Given"];
const YNNG_OPTIONS = ["Yes", "No", "Not Given"];
const DEFAULT_MC_OPTIONS = ["A", "B", "C", "D"];

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

function ListeningTest() {
    const { id } = useParams();
    const [test, setTest] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const res = await axios.get(`/testl/info/${id}`);
                if (!res.data) {
                    setError("Test ma'lumotlari topilmadi.");
                    return;
                }

                setTest(res.data);

                const defs = res.data.testText
                    ? getQuestionDefs(res.data.testText)
                    : [];
                const length = defs.length || (res.data.questions || []).length;
                setUserAnswers(Array(length).fill(""));
            } catch (err) {
                console.error("Test yuklashda xatolik:", err);
                setError("Test yuklashda xatolik yuz berdi.");
            }
        };
        fetchTest();
    }, [id]);

    const handleChange = (val, index) => {
        const updated = [...userAnswers];
        updated[index] = val;
        setUserAnswers(updated);
    };

    const handleSubmit = useCallback(async () => {
        if (!test?.questions || results) return;

        const check = userAnswers.map((ans, idx) => {
            const correct = test.questions[idx]?.value || "";
            return isCorrectAnswer(ans, correct);
        });

        setResults(check);
        const score = check.filter((r) => r).length;

        try {
            await axios.post(
                "/scorel/add",
                { listeningId: test._id, score },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            console.log("Score saqlandi ✅");
        } catch (err) {
            console.error("Score saqlashda xato:", err.response?.data || err);
        }
    }, [test, userAnswers, results]);

    const renderQuestionHTML = () => {
        const html = test?.testText || "";
        const regex = new RegExp(MARKER_REGEX);
        let questionIndex = 0;
        let nodeKey = 0;
        let lastIndex = 0;
        const nodes = [];
        let match;

        while ((match = regex.exec(html))) {
            const rawToken = match[1];
            nodes.push(
                <span
                    key={`text-${nodeKey++}`}
                    dangerouslySetInnerHTML={{
                        __html: html.slice(lastIndex, match.index),
                    }}
                />
            );

            const parsed = parseToken(rawToken);

            if (!parsed) {
                nodes.push(
                    <span
                        key={`unknown-${nodeKey++}`}
                        dangerouslySetInnerHTML={{
                            __html: html.slice(match.index, regex.lastIndex),
                        }}
                    />
                );
                lastIndex = regex.lastIndex;
                continue;
            }

            if (parsed.kind === "input") {
                const currentIndex = questionIndex;
                nodes.push(
                    <span key={`input-wrap-${nodeKey++}`} className="answer-inline">
                        <input
                            type="text"
                            value={userAnswers[currentIndex] || ""}
                            onChange={(e) => handleChange(e.target.value, currentIndex)}
                            disabled={!!results}
                        />
                        {results &&
                            (results[currentIndex] ? (
                                <span className="correct">✅</span>
                            ) : (
                                <span className="wrong">
                                    ❌ To‘g‘ri: <b>{test.questions[currentIndex]?.value}</b>
                                </span>
                            ))}
                    </span>
                );
                questionIndex++;
            }

            if (parsed.kind === "select") {
                const currentIndex = questionIndex;
                nodes.push(
                    <span key={`select-wrap-${nodeKey++}`} className="answer-inline">
                        <select
                            value={userAnswers[currentIndex] || ""}
                            onChange={(e) => handleChange(e.target.value, currentIndex)}
                            disabled={!!results}
                        >
                            {parsed.includeEmpty !== false && (
                                <option value=""></option>
                            )}
                            {parsed.options.map((opt, optIndex) => (
                                <option key={`select-${currentIndex}-${optIndex}`} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        {results &&
                            (results[currentIndex] ? (
                                <span className="correct">✅</span>
                            ) : (
                                <span className="wrong">
                                    ❌ To‘g‘ri: <b>{test.questions[currentIndex]?.value}</b>
                                </span>
                            ))}
                    </span>
                );
                questionIndex++;
            }

            if (parsed.kind === "radio") {
                const currentIndex = questionIndex;
                nodes.push(
                    <span key={`radio-wrap-${nodeKey++}`} className="answer-inline">
                        {parsed.options.map((opt, optIndex) => (
                            <label key={`radio-${currentIndex}-${optIndex}`}>
                                <input
                                    type="radio"
                                    name={`radio-${currentIndex}`}
                                    value={opt}
                                    checked={userAnswers[currentIndex] === opt}
                                    onChange={(e) => handleChange(e.target.value, currentIndex)}
                                    disabled={!!results}
                                />
                                {opt}
                            </label>
                        ))}
                        {results &&
                            (results[currentIndex] ? (
                                <span className="correct">✅</span>
                            ) : (
                                <span className="wrong">
                                    ❌ To‘g‘ri: <b>{test.questions[currentIndex]?.value}</b>
                                </span>
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
                    __html: html.slice(lastIndex),
                }}
            />
        );

        return nodes;
    };

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!test) return <p>Loading test...</p>;

    const hasTextQuestions = !!test.testText?.trim();

    return (
        <div className="listeningform">
            <header>
                <h1>{test.title || "Listening Test"}</h1>
                <Link to="/listen" className="menu-item">
                    All IELTS Listening Tests
                </Link>
            </header>

            <div className="media-section">
                <div className="audio-player">
                    <audio controls onEnded={handleSubmit}>
                        <source src={test.audioUrl} type="audio/mpeg" />
                        Sizning brauzeringiz audio qo‘llab-quvvatlamaydi.
                    </audio>
                </div>

                {hasTextQuestions ? (
                    <div
                        className={`listening-text-layout ${
                            test.transcript?.trim() ? "has-transcript" : ""
                        }`}
                    >
                        {test.transcript?.trim() && (
                            <div
                                className="listening-panel listening-transcript"
                                dangerouslySetInnerHTML={{ __html: test.transcript }}
                            />
                        )}
                        <div className="listening-panel listening-questions">
                            {test.imageUrl && (
                                <img
                                    className="listening-inline-image"
                                    src={test.imageUrl}
                                    alt="listening visual"
                                />
                            )}
                            <div className="listening-question-text">
                                {renderQuestionHTML()}
                            </div>
                        </div>
                    </div>
                ) : (
                    test.imageUrl && (
                        <div className="test-image" style={{ position: "relative" }}>
                            <img src={test.imageUrl} alt="listening" />

                            {(test.questions || []).map((q, i) => (
                                <div
                                    key={i}
                                    style={{
                                        position: "absolute",
                                        top: `${q.top * 100}%`,
                                        left: `${q.left * 100}%`,
                                        width: `${q.width * 100}%`,
                                    }}
                                >
                                    {q.type === "text" ? (
                                        <input
                                            type="text"
                                            value={userAnswers[i] || ""}
                                            onChange={(e) => handleChange(e.target.value, i)}
                                            disabled={!!results}
                                            style={{ width: "100%" }}
                                        />
                                    ) : q.type === "yn" ? (
                                        <select
                                            value={userAnswers[i] || ""}
                                            onChange={(e) => handleChange(e.target.value, i)}
                                            disabled={!!results}
                                            style={{ width: "100%" }}
                                        >
                                            <option value="">-- Tanlang --</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                            <option value="not given">Not Given</option>
                                        </select>
                                    ) : (
                                        <select
                                            value={userAnswers[i] || ""}
                                            onChange={(e) => handleChange(e.target.value, i)}
                                            disabled={!!results}
                                            style={{ width: "100%" }}
                                        >
                                            <option value="">-- Tanlang --</option>
                                            {(q.options || []).map((opt, idx) => (
                                                <option key={idx} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {results &&
                                        (results[i] ? (
                                            <span className="correct">✅</span>
                                        ) : (
                                            <span className="wrong">
                                                ❌ To‘g‘ri javob: <b>{test.questions[i]?.value}</b>
                                            </span>
                                        ))}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {!results && (
                <button className="submit-btn" onClick={handleSubmit}>
                    Javobni yuborish
                </button>
            )}
        </div>
    );
}

export default ListeningTest;
