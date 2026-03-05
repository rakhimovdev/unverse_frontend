import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
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

const parseInlineStyle = (styleText) => {
    if (!styleText) return undefined;
    const style = {};
    styleText.split(";").forEach((chunk) => {
        const [rawKey, rawValue] = chunk.split(":");
        if (!rawKey || !rawValue) return;
        const key = rawKey
            .trim()
            .toLowerCase()
            .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
        const value = rawValue.trim();
        if (key) {
            style[key] = value;
        }
    });
    return style;
};

const mapAttributesToProps = (attributes) => {
    const props = {};
    Array.from(attributes || []).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value;

        if (name === "class") {
            props.className = value;
            return;
        }
        if (name === "for") {
            props.htmlFor = value;
            return;
        }
        if (name === "style") {
            const style = parseInlineStyle(value);
            if (style && Object.keys(style).length) {
                props.style = style;
            }
            return;
        }
        if (name === "colspan") {
            props.colSpan = Number(value) || value;
            return;
        }
        if (name === "rowspan") {
            props.rowSpan = Number(value) || value;
            return;
        }
        props[name] = value;
    });
    return props;
};

const VOID_TAGS = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);

const normalizeInlineTokens = (html) => {
    if (!html || typeof window === "undefined" || !window.DOMParser) {
        return html || "";
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
        const wrapper = doc.body.firstChild;
        if (!wrapper) return html;

        const tokenOnlyRegex = /^\s*(\[\[[^\]]+\]\]\s*)+$/;
        const isEmptyText = (node) =>
            node && node.nodeType === 3 && !node.textContent.trim();

        let node = wrapper.firstChild;
        while (node) {
            const nextNode = node.nextSibling;
            let text = "";
            if (node.nodeType === 3) {
                text = node.textContent || "";
            } else if (node.nodeType === 1) {
                text = node.textContent || "";
            }

            const cleaned = text.replace(/\u00a0/g, " ").trim();
            if (cleaned && tokenOnlyRegex.test(cleaned)) {
                let prev = node.previousSibling;
                while (prev && (isEmptyText(prev) || (prev.nodeType === 1 && !prev.textContent.trim()))) {
                    prev = prev.previousSibling;
                }

                if (prev && prev.nodeType === 1) {
                    prev.append(doc.createTextNode(` ${cleaned}`));
                    wrapper.removeChild(node);
                }
            }

            node = nextNode;
        }

        return wrapper.innerHTML;
    } catch (err) {
        return html;
    }
};

function ListeningTest() {
    const { id } = useParams();
    const token = localStorage.getItem("token");
    const [test, setTest] = useState(null);
    const [parts, setParts] = useState([]);
    const [activePart, setActivePart] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [results, setResults] = useState(null);
    const [scoreSummary, setScoreSummary] = useState(null);
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
    }, [id, token]);

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

        const check = parts.map((part, partIndex) => {
            const answers = userAnswers[partIndex] || [];
            return answers.map((ans, idx) => {
                const correct = part.questions?.[idx]?.value || "";
                const qType = part.questions?.[idx]?.type || "";
                return isCorrectAnswer(ans, correct, qType);
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
        setScoreSummary({ totalCorrect, totalQuestions, partTotals });

        try {
            await axios.post(
                "/scorel/add",
                { listeningId: test._id, score: totalCorrect },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            console.log("Score saqlandi ✅");
        } catch (err) {
            console.error("Score saqlashda xato:", err.response?.data || err);
        }
    }, [test, parts, userAnswers, results]);

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
        const html = normalizeInlineTokens(part?.testText || "");
        if (!html) return null;

        if (typeof window === "undefined" || !window.DOMParser) {
            return <span dangerouslySetInnerHTML={{ __html: html }} />;
        }

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

        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
        const root = doc.body.firstChild;
        if (!root) return null;

        let questionIndex = 0;

        const renderNode = (node, key) => {
            if (node.nodeType === 3) {
                const text = node.textContent || "";
                if (!text) return null;

                const regex = new RegExp(MARKER_REGEX);
                const parts = [];
                let lastIndex = 0;
                let match;

                while ((match = regex.exec(text))) {
                    if (match.index > lastIndex) {
                        parts.push(text.slice(lastIndex, match.index));
                    }

                    const parsed = parseToken(match[1]);
                    if (!parsed) {
                        parts.push(match[0]);
                    } else {
                        const currentIndex = questionIndex;
                        parts.push(renderTokenElement(parsed, currentIndex, `${key}-t-${currentIndex}`));
                        questionIndex++;
                    }

                    lastIndex = match.index + match[0].length;
                }

                if (lastIndex < text.length) {
                    parts.push(text.slice(lastIndex));
                }

                return parts.filter((part) => part !== null);
            }

            if (node.nodeType === 1) {
                const tag = node.tagName.toLowerCase();
                const props = mapAttributesToProps(node.attributes);
                if (VOID_TAGS.has(tag)) {
                    return React.createElement(tag, { ...props, key });
                }
                const children = [];
                node.childNodes.forEach((child, idx) => {
                    const rendered = renderNode(child, `${key}-${idx}`);
                    if (Array.isArray(rendered)) {
                        children.push(...rendered);
                    } else if (rendered != null) {
                        children.push(rendered);
                    }
                });
                return React.createElement(tag, { ...props, key }, children);
            }

            return null;
        };

        return Array.from(root.childNodes).map((child, idx) =>
            renderNode(child, `root-${partIndex}-${idx}`)
        );
    };

    const activePartData = parts[activePart];
    const hasTextQuestions = !!activePartData?.testText?.trim();
    const partImageUrl = activePartData?.imageUrl || test?.imageUrl;
    const partQuestions = activePartData?.questions || [];
    const partAnswers = userAnswers[activePart] || [];
    const partResults = results?.[activePart] || [];
    const audioSrc = activePartData?.audioUrl || test?.audioUrl || "";
    const shouldAutoSubmitOnEnded = audioUrls.length <= 1;
    const totalAudioLabel =
        totalAudioSeconds > 0 ? formatDuration(totalAudioSeconds) : audioUrls.length ? "Hisoblanmoqda..." : "—";

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
                    <span className="listening-time">Audio time: {totalAudioLabel}</span>
                </div>
                <Link to="/listen" className="menu-item">
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
                        onEnded={shouldAutoSubmitOnEnded ? handleSubmit : undefined}
                        onPlay={startAutoTimer}
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

            {scoreSummary && (
                <div className="score-box">
                    <div>
                        <strong>Total raw score:</strong>{" "}
                        {scoreSummary.totalCorrect} / {scoreSummary.totalQuestions}
                    </div>
                    {scoreSummary.partTotals.length > 0 && (
                        <div className="score-breakdown">
                            <strong>Per part:</strong>
                            <div className="score-breakdown-list">
                                {scoreSummary.partTotals.map((part, idx) => (
                                    <span key={`part-score-${idx}`}>
                                        Part {idx + 1}: {part.correct} / {part.total}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!results && (
                <button className="submit-btn" onClick={handleSubmit}>
                    Javobni yuborish
                </button>
            )}
        </div>
    );
}

export default ListeningTest;
