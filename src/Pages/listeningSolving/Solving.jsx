import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import axios from "../../Api/Axios";
import TestCompletionScreen from "../../components/results/TestCompletionScreen";
import ResolvingPrompt from "../../components/results/ResolvingPrompt";
import { renderHtmlWithQuestionTokens } from "../../utils/questionMarkup";
import { createAttemptKey } from "../../utils/resultAttempt";
import "./Solving.css";

const MARKER_REGEX = /\[\[([^\]]+)\]\]/g;
const TFNG_OPTIONS = ["True", "False", "Not Given"];
const YNNG_OPTIONS = ["Yes", "No", "Not Given"];
const DEFAULT_MC_OPTIONS = ["A", "B", "C", "D"];
const LISTENING_BAND_TABLE = [
    { min: 39, max: 40, band: 9 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8 },
    { min: 32, max: 34, band: 7.5 },
    { min: 30, max: 31, band: 7 },
    { min: 26, max: 29, band: 6.5 },
    { min: 23, max: 25, band: 6 },
    { min: 18, max: 22, band: 5.5 },
    { min: 16, max: 17, band: 5 },
    { min: 13, max: 15, band: 4.5 },
    { min: 10, max: 12, band: 4 },
    { min: 6, max: 9, band: 3.5 },
    { min: 4, max: 5, band: 3 },
    { min: 2, max: 3, band: 2.5 },
    { min: 1, max: 1, band: 1 },
    { min: 0, max: 0, band: 0 }
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

const parseCheckboxOptions = (rawOptions, fallbackOptions, fallbackMax = 2) => {
    const cleaned = normalizeOptionsString(rawOptions);
    if (!cleaned) {
        return { max: fallbackMax, options: fallbackOptions };
    }

    const parts = cleaned.split(/:(.+)/s);
    const maybeMax = Number.parseInt(parts[0], 10);

    if (Number.isFinite(maybeMax) && maybeMax > 0) {
        const optionsSource = parts[1] || "";
        return {
            max: maybeMax,
            options: parseOptions(optionsSource, fallbackOptions),
        };
    }

    return {
        max: fallbackMax,
        options: parseOptions(cleaned, fallbackOptions),
    };
};

const getAudioMime = (src) => {
    if (!src) return "audio/mpeg";
    const lower = src.toLowerCase();
    if (lower.endsWith(".m4a") || lower.endsWith(".mp4") || lower.includes("audio/mp4")) {
        return "audio/mp4";
    }
    if (lower.endsWith(".ogg") || lower.includes("audio/ogg")) return "audio/ogg";
    if (lower.endsWith(".wav") || lower.includes("audio/wav")) return "audio/wav";
    if (lower.endsWith(".webm") || lower.includes("audio/webm")) return "audio/webm";
    return "audio/mpeg";
};

const formatDuration = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "—";
    const total = Math.round(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${minutes}:${String(secs).padStart(2, "0")}`;
};

const parseSingleDimension = (rawValue, defaultUnit) => {
    if (!rawValue) return null;
    const value = rawValue.trim();
    if (!value) return null;
    if (value.toLowerCase() === "auto") return "auto";
    const match = value.match(/^(\d+(?:\.\d+)?)(px|%|em|rem|ch|vh|vw)?$/i);
    if (!match) return null;
    const number = match[1];
    const unit = match[2] || defaultUnit;
    return `${number}${unit}`;
};

const splitMultiValue = (value) =>
    String(value || "")
        .split(/[,|&+]/g)
        .map((item) => item.trim())
        .filter(Boolean);

const toggleMultiValue = (currentValue, option, max) => {
    const normalizedOption = String(option || "").trim();
    if (!normalizedOption) return currentValue || "";
    const current = splitMultiValue(currentValue);
    const existsIndex = current.findIndex(
        (item) => item.toLowerCase() === normalizedOption.toLowerCase()
    );

    if (existsIndex >= 0) {
        const next = current.filter((_, idx) => idx !== existsIndex);
        return next.join(", ");
    }

    if (current.length >= max) {
        return current.join(", ");
    }

    return [...current, normalizedOption].join(", ");
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

const textareaTypes = new Set(["textarea", "long", "longanswer", "paragraph"]);

const parseToken = (rawToken) => {
    const [rawType, rawOptions] = rawToken.split(/:(.*)/s);
    const type = normalizeTokenType(rawType);

    if (textareaTypes.has(type)) {
        return {
            kind: "textarea",
            width: parseSingleDimension(rawOptions, "ch"),
        };
    }

    if (inputTypes.has(type)) {
        return {
            kind: "input",
            width: parseSingleDimension(rawOptions, "ch"),
        };
    }

    if (
        type === "multi" ||
        type === "multi2" ||
        type === "choose2" ||
        type === "twoselect"
    ) {
        return {
            kind: "multi",
            options: parseOptions(rawOptions, DEFAULT_MC_OPTIONS),
            max: 2,
        };
    }

    if (type === "checkbox") {
        const { max, options } = parseCheckboxOptions(
            rawOptions,
            DEFAULT_MC_OPTIONS,
            2
        );
        return {
            kind: "multi",
            options,
            max,
        };
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
            type:
                parsed.kind === "input" || parsed.kind === "textarea"
                    ? "text"
                    : parsed.kind === "multi"
                        ? "multi"
                        : "select",
        });
    }

    return defs;
};

const normalizeAnswer = (value) =>
    String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

const isCorrectAnswer = (userValue, correctValue, questionType) => {
    const user = normalizeAnswer(userValue);
    const correct = normalizeAnswer(correctValue);
    if (!user || !correct) return false;

    if (questionType === "multi") {
        const userList = Array.from(new Set(splitMultiValue(user))).sort();
        const correctList = Array.from(new Set(splitMultiValue(correct))).sort();
        if (!userList.length || !correctList.length) return false;
        if (userList.length !== correctList.length) return false;
        return userList.join("|") === correctList.join("|");
    }

    const alternatives = correct
        .split(/\/|\|/g)
        .map((item) => item.trim())
        .filter(Boolean);

    return alternatives.includes(user);
};

const getBandScore = (rawScore) => {
    const value = Number(rawScore);
    if (!Number.isFinite(value)) return null;
    const row = LISTENING_BAND_TABLE.find(
        (item) => value >= item.min && value <= item.max
    );
    return row ? row.band : null;
};

function ListeningTest() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);
    const mode = query.get("mode") === "resolving" ? "resolving" : "solving";
    const solvingAttemptId = query.get("solvingAttemptId");
    const token = localStorage.getItem("token");
    const [test, setTest] = useState(null);
    const [parts, setParts] = useState([]);
    const [activePart, setActivePart] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [results, setResults] = useState(null);
    const [scoreSummary, setScoreSummary] = useState(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [savingScore, setSavingScore] = useState(false);
    const [showResolvingPrompt, setShowResolvingPrompt] = useState(false);
    const [savedResultId, setSavedResultId] = useState(null);
    const [comparison, setComparison] = useState(null);
    const startedAtRef = useRef(new Date());
    const [error, setError] = useState(null);
    const audioRef = useRef(null);
    const [totalAudioSeconds, setTotalAudioSeconds] = useState(0);
    const autoSubmitTimerRef = useRef(null);
    const autoStartPendingRef = useRef(false);

    const audioUrls = useMemo(() => {
        const urls = [];
        const fallback = test?.audioUrl || "";

        if (parts?.length) {
            parts.forEach((part) => {
                const url = part?.audioUrl || fallback;
                if (url) urls.push(url);
            });
        } else if (fallback) {
            urls.push(fallback);
        }

        return Array.from(new Set(urls));
    }, [parts, test?.audioUrl]);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const res = await axios.get(`/testl/info/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (!res.data) {
                    setError("Test ma'lumotlari topilmadi.");
                    return;
                }

                setTest(res.data);
                const incomingParts =
                    Array.isArray(res.data.parts) && res.data.parts.length
                        ? res.data.parts
                        : [
                              {
                                  partNumber: 1,
                                  transcript: res.data.transcript || "",
                                  testText: res.data.testText || "",
                                  questions: res.data.questions || [],
                                  imageUrl: res.data.imageUrl || null,
                                  audioUrl: res.data.audioUrl || null,
                              },
                          ];

                setParts(incomingParts);
                setActivePart(0);
                setResults(null);
                setScoreSummary(null);
                setIsResultModalOpen(false);
                setShowResolvingPrompt(false);
                startedAtRef.current = new Date();

                const answers = incomingParts.map((part) => {
                    const defs = part.testText ? getQuestionDefs(part.testText) : [];
                    const length = defs.length || (part.questions || []).length;
                    return Array(length).fill("");
                });
                setUserAnswers(answers);
            } catch (err) {
                console.error("Test yuklashda xatolik:", err);
                setError("Test yuklashda xatolik yuz berdi.");
            }
        };
        fetchTest();
    }, [id, token, mode]);

    useEffect(() => {
        let isActive = true;
        setTotalAudioSeconds(0);

        if (!audioUrls.length) return () => {};

        const loadDuration = (url) =>
            new Promise((resolve) => {
                const audio = new Audio();
                audio.preload = "metadata";
                audio.src = url;

                const finalize = (duration) => {
                    audio.removeAttribute("src");
                    audio.load();
                    resolve(duration);
                };

                audio.addEventListener(
                    "loadedmetadata",
                    () => {
                        const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
                        finalize(duration);
                    },
                    { once: true }
                );

                audio.addEventListener(
                    "error",
                    () => {
                        finalize(0);
                    },
                    { once: true }
                );
            });

        Promise.all(audioUrls.map(loadDuration)).then((durations) => {
            if (!isActive) return;
            const total = durations.reduce((sum, value) => sum + (value || 0), 0);
            setTotalAudioSeconds(total);
        });

        return () => {
            isActive = false;
        };
    }, [audioUrls]);

    const handleChange = (val, index) => {
        setUserAnswers((prev) => {
            const next = prev.map((answers) => [...answers]);
            if (!next[activePart]) next[activePart] = [];
            next[activePart][index] = val;
            return next;
        });
    };

    const handleSubmit = useCallback(async () => {
        if (!test || results) return;

        if (audioRef.current) {
            audioRef.current.pause();
        }
        if (autoSubmitTimerRef.current) {
            clearTimeout(autoSubmitTimerRef.current);
            autoSubmitTimerRef.current = null;
        }

        let globalQuestionNumber = 0;
        const correctAnswers = [];
        const wrongAnswers = [];

        const check = parts.map((part, partIndex) => {
            const answers = userAnswers[partIndex] || [];
            const questionMeta = part.questions || [];
            const defs = part.testText ? getQuestionDefs(part.testText) : [];

            return answers.map((ans, idx) => {
                globalQuestionNumber += 1;
                const meta = questionMeta[idx] || {};
                const correct = meta.value || "";
                const qType = meta.type || defs[idx]?.type || "";
                const isRight = isCorrectAnswer(ans, correct, qType);
                const reviewItem = {
                    questionNumber: globalQuestionNumber,
                    groupNumber: partIndex + 1,
                    label: `Section ${partIndex + 1} · Q${globalQuestionNumber}`,
                    prompt: meta.question || `Question ${globalQuestionNumber}`,
                    questionType: qType || "text",
                    userAnswer: String(ans || ""),
                    correctAnswer: correct,
                    explanation: correct
                        ? `Correct answer: ${correct}. Replay the matching moment in Section ${partIndex + 1}.`
                        : "No official answer key was provided for this item."
                };

                if (isRight) {
                    correctAnswers.push(reviewItem);
                } else if (String(ans || "").trim() || String(correct || "").trim()) {
                    wrongAnswers.push(reviewItem);
                }

                return isRight;
            });
        });

        setResults(check);
        const partTotals = check.map((partResults, partIndex) => {
            const questionMeta = parts?.[partIndex]?.questions || [];
            return partResults.reduce(
                (acc, isRight, idx) => {
                    const qType = questionMeta[idx]?.type;
                    const weight = qType === "multi" ? 2 : 1;
                    acc.total += weight;
                    if (isRight) acc.correct += weight;
                    return acc;
                },
                { correct: 0, total: 0 }
            );
        });
        const totalCorrect = partTotals.reduce((sum, part) => sum + part.correct, 0);
        const totalQuestions = partTotals.reduce((sum, part) => sum + part.total, 0);
        const academicBand = totalQuestions === 40 ? getBandScore(totalCorrect) : null;
        const generalBand = totalQuestions === 40 ? getBandScore(totalCorrect) : null;
        setScoreSummary({
            totalCorrect,
            totalQuestions,
            partTotals,
            academicBand,
            generalBand,
            correctAnswers,
            wrongAnswers
        });

        try {
            setSavingScore(true);
            const attemptKey = createAttemptKey("listening", test._id);
            const response = await axios.post(
                "/scorel/add",
                {
                    listeningId: test._id,
                    score: totalCorrect,
                    attemptKey,
                    mode,
                    solvingAttemptId: mode === "resolving" ? solvingAttemptId : undefined,
                    startedAt: startedAtRef.current.toISOString(),
                    completedAt: new Date().toISOString(),
                    timeSpent: Math.round((Date.now() - startedAtRef.current.getTime()) / 1000),
                    answers: userAnswers,
                    listeningDetails: {
                        sectionScores: partTotals.map((part, index) => ({
                            label: `Section ${index + 1}`,
                            correct: part.correct,
                            total: part.total
                        })),
                        rawScore: totalCorrect,
                        rawTotal: totalQuestions,
                        academicBand,
                        generalBand,
                        correctAnswers,
                        wrongAnswers
                    }
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            const savedId = response.data?.result?._id;
            setSavedResultId(savedId || null);
            if (mode === "resolving" && savedId) {
                const comparisonResponse = await axios.get(`/results/compare/${savedId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                setComparison(comparisonResponse.data);
                setIsResultModalOpen(true);
            }
            if (mode === "solving" && savedId) setShowResolvingPrompt(true);
            console.log("Score saqlandi ✅");
        } catch (err) {
            console.error("Score saqlashda xato:", err.response?.data || err);
        } finally {
            setSavingScore(false);
        }
    }, [test, parts, userAnswers, results, mode, solvingAttemptId]);

    const startAutoTimer = useCallback(() => {
        if (results) return;
        if (totalAudioSeconds <= 0) {
            autoStartPendingRef.current = true;
            return;
        }
        if (autoSubmitTimerRef.current) return;

        autoSubmitTimerRef.current = setTimeout(() => {
            autoSubmitTimerRef.current = null;
            if (audioRef.current) {
                audioRef.current.pause();
            }
            handleSubmit();
        }, Math.ceil(totalAudioSeconds * 1000));
    }, [handleSubmit, results, totalAudioSeconds]);

    useEffect(() => {
        if (autoStartPendingRef.current && totalAudioSeconds > 0) {
            startAutoTimer();
            autoStartPendingRef.current = false;
        }
    }, [totalAudioSeconds, startAutoTimer]);

    useEffect(() => {
        if (results && autoSubmitTimerRef.current) {
            clearTimeout(autoSubmitTimerRef.current);
            autoSubmitTimerRef.current = null;
        }
    }, [results]);

    useEffect(() => {
        autoStartPendingRef.current = false;
        if (autoSubmitTimerRef.current) {
            clearTimeout(autoSubmitTimerRef.current);
            autoSubmitTimerRef.current = null;
        }
    }, [id]);

    const renderQuestionHTML = (part, partIndex) => {
        const answers = userAnswers[partIndex] || [];
        const partResults = results?.[partIndex] || [];
        const correctAnswers = part?.questions || [];

        const renderFeedback = (currentIndex) => {
            if (!results) return null;
            return partResults[currentIndex] ? (
                <span className="correct">✅</span>
            ) : (
                <span className="wrong">
                    ❌ To‘g‘ri: <b>{correctAnswers[currentIndex]?.value}</b>
                </span>
            );
        };

        const renderTokenElement = (parsed, currentIndex, key) => {
            if (parsed.kind === "input") {
                return (
                    <span key={key} className="answer-inline">
                        <input
                            type="text"
                            style={parsed.width ? { width: parsed.width } : undefined}
                            value={answers[currentIndex] || ""}
                            onChange={(e) => handleChange(e.target.value, currentIndex)}
                            disabled={!!results}
                        />
                        {renderFeedback(currentIndex)}
                    </span>
                );
            }

            if (parsed.kind === "textarea") {
                return (
                    <span key={key} className="answer-inline">
                        <textarea
                            rows={3}
                            style={parsed.width ? { width: parsed.width } : undefined}
                            value={answers[currentIndex] || ""}
                            onChange={(e) => handleChange(e.target.value, currentIndex)}
                            disabled={!!results}
                        />
                        {renderFeedback(currentIndex)}
                    </span>
                );
            }

            if (parsed.kind === "select") {
                return (
                    <span key={key} className="answer-inline">
                        <select
                            value={answers[currentIndex] || ""}
                            onChange={(e) => handleChange(e.target.value, currentIndex)}
                            disabled={!!results}
                        >
                            {parsed.includeEmpty !== false && <option value=""></option>}
                            {parsed.options.map((opt, optIndex) => (
                                <option key={`select-${currentIndex}-${optIndex}`} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        {renderFeedback(currentIndex)}
                    </span>
                );
            }

            if (parsed.kind === "multi") {
                const selected = splitMultiValue(answers[currentIndex]);
                return (
                    <span key={key} className="answer-inline">
                        {parsed.options.map((opt, optIndex) => {
                            const checked = selected.some(
                                (item) => item.toLowerCase() === opt.toLowerCase()
                            );
                            return (
                                <label key={`multi-${partIndex}-${currentIndex}-${optIndex}`}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                            const nextValue = toggleMultiValue(
                                                answers[currentIndex],
                                                opt,
                                                parsed.max || 2
                                            );
                                            handleChange(nextValue, currentIndex);
                                        }}
                                        disabled={!!results}
                                    />
                                    {opt}
                                </label>
                            );
                        })}
                        {renderFeedback(currentIndex)}
                    </span>
                );
            }

            if (parsed.kind === "radio") {
                return (
                    <span key={key} className="answer-inline">
                        {parsed.options.map((opt, optIndex) => (
                            <label key={`radio-${partIndex}-${currentIndex}-${optIndex}`}>
                                <input
                                    type="radio"
                                    name={`radio-${partIndex}-${currentIndex}`}
                                    value={opt}
                                    checked={answers[currentIndex] === opt}
                                    onChange={(e) => handleChange(e.target.value, currentIndex)}
                                    disabled={!!results}
                                />
                                {opt}
                            </label>
                        ))}
                        {renderFeedback(currentIndex)}
                    </span>
                );
            }

            return null;
        };

        return renderHtmlWithQuestionTokens({
            html: part?.testText || "",
            parseToken,
            rootKey: `listening-${partIndex}`,
            renderToken: ({ parsed, currentIndex, key }) =>
                renderTokenElement(parsed, currentIndex, key),
        });
    };

    const activePartData = parts[activePart];
    const hasTextQuestions = !!activePartData?.testText?.trim();
    const partImageUrl = activePartData?.imageUrl || test?.imageUrl;
    const partQuestions = activePartData?.questions || [];
    const partAnswers = userAnswers[activePart] || [];
    const partResults = results?.[activePart] || [];
    const audioSrc = activePartData?.audioUrl || test?.audioUrl || "";
    const shouldAutoSubmitOnEnded = audioUrls.length <= 1;
    const totalAudioLabel = mode === "resolving"
        ? "No Time Limit"
        : totalAudioSeconds > 0 ? formatDuration(totalAudioSeconds) : audioUrls.length ? "Hisoblanmoqda..." : "—";
    const completedResult = useMemo(() => {
        if (!scoreSummary || !test) return null;

        return {
            moduleType: "Listening",
            mode,
            testName: test.title || "Listening Test",
            createdAt: new Date().toISOString(),
            listening: {
                sectionScores: scoreSummary.partTotals.map((part, index) => ({
                    label: `Section ${index + 1}`,
                    correct: part.correct,
                    total: part.total
                })),
                rawScore: scoreSummary.totalCorrect,
                rawTotal: scoreSummary.totalQuestions,
                academicBand: scoreSummary.academicBand,
                generalBand: scoreSummary.generalBand,
                correctAnswers: scoreSummary.correctAnswers || [],
                wrongAnswers: scoreSummary.wrongAnswers || []
            }
        };
    }, [scoreSummary, test, mode]);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.load();
        audioRef.current.currentTime = 0;
    }, [audioSrc]);

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!test) return <p>Loading test...</p>;

    return (
        <div className="listeningform">
            <header>
                <div className="listening-header-left">
                    <h1>{test.title || "Listening Test"}</h1>
                    <span className="listening-time">
                        {mode === "resolving" ? "Resolving Mode · " : "Audio time: "}{totalAudioLabel}
                    </span>
                </div>
                <Link to="/listening" className="menu-item">
                    All IELTS Listening Tests
                </Link>
            </header>

            {parts.length > 1 && (
                <div className="listening-part-tabs">
                    {parts.map((_, i) => (
                        <button
                            key={`part-tab-${i}`}
                            type="button"
                            className={activePart === i ? "active" : ""}
                            onClick={() => setActivePart(i)}
                        >
                            Part {i + 1}
                        </button>
                    ))}
                </div>
            )}

            <div className="media-section">
                <div className="audio-player">
                    <audio
                        key={audioSrc || "no-audio"}
                        ref={audioRef}
                        controls
                        onEnded={mode === "solving" && shouldAutoSubmitOnEnded ? handleSubmit : undefined}
                        onPlay={mode === "solving" ? startAutoTimer : undefined}
                    >
                        <source
                            src={audioSrc || undefined}
                            type={getAudioMime(audioSrc)}
                        />
                        Sizning brauzeringiz audio qo‘llab-quvvatlamaydi.
                    </audio>
                </div>

                {hasTextQuestions ? (
                    <div
                        className={`listening-text-layout ${
                            activePartData?.transcript?.trim() ? "has-transcript" : ""
                        }`}
                    >
                        {activePartData?.transcript?.trim() && (
                            <div
                                className="listening-panel listening-transcript"
                                dangerouslySetInnerHTML={{ __html: activePartData.transcript }}
                            />
                        )}
                        <div className="listening-panel listening-questions">
                            {partImageUrl && (
                                <img
                                    className="listening-inline-image"
                                    src={partImageUrl}
                                    alt="listening visual"
                                />
                            )}
                            <div className="listening-question-text">
                                {renderQuestionHTML(activePartData, activePart)}
                            </div>
                        </div>
                    </div>
                ) : (
                    partImageUrl && (
                        <div className="test-image" style={{ position: "relative" }}>
                            <img src={partImageUrl} alt="listening" />

                            {partQuestions.map((q, i) => (
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
                                            value={partAnswers[i] || ""}
                                            onChange={(e) => handleChange(e.target.value, i)}
                                            disabled={!!results}
                                            style={{ width: "100%" }}
                                        />
                                    ) : q.type === "yn" ? (
                                        <select
                                            value={partAnswers[i] || ""}
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
                                            value={partAnswers[i] || ""}
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
                                        (partResults[i] ? (
                                            <span className="correct">✅</span>
                                        ) : (
                                            <span className="wrong">
                                                ❌ To‘g‘ri javob: <b>{partQuestions[i]?.value}</b>
                                            </span>
                                        ))}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {!results ? (
                <button className="submit-btn" onClick={handleSubmit} disabled={savingScore}>
                    {savingScore ? "Saving..." : "Javobni yuborish"}
                </button>
            ) : completedResult && !isResultModalOpen ? (
                <button
                    className="submit-btn"
                    type="button"
                    onClick={() => setIsResultModalOpen(true)}
                >
                    Natijani ko‘rish
                </button>
            ) : null}

            {completedResult && isResultModalOpen ? (
                <TestCompletionScreen
                    result={completedResult}
                    eyebrow="Listening Completed"
                    title="Your listening result is ready"
                    description="Test tugagandan keyin natija shu yerning ustida bitta oynada ko‘rsatiladi."
                    statusText={
                        savingScore
                            ? "Natija accountingizga saqlanmoqda."
                            : "Natija accountingizga saqlandi va sectionlar bo‘yicha review tayyor."
                    }
                    onClose={() => setIsResultModalOpen(false)}
                    primaryActionTo="/account"
                    primaryActionLabel="Open Result Center"
                    secondaryActionTo="/listening"
                    secondaryActionLabel="Take Another Listening Test"
                    comparison={comparison}
                />
            ) : null}

            {showResolvingPrompt ? (
                <ResolvingPrompt
                    onYes={() =>
                        (() => {
                            setShowResolvingPrompt(false);
                            navigate(
                                `/listening/audio/${id}?mode=resolving&solvingAttemptId=${savedResultId}`
                            );
                        })()
                    }
                    onNo={() => {
                        setShowResolvingPrompt(false);
                        setIsResultModalOpen(true);
                    }}
                />
            ) : null}
        </div>
    );
}

export default ListeningTest;
