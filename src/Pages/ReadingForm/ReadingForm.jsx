import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const createTextWalker = (container) =>
    document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            if (!node.nodeValue || !node.nodeValue.trim()) {
                return NodeFilter.FILTER_REJECT;
            }
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (
                parent.closest(
                    "input, select, option, textarea, button, script, style"
                )
            ) {
                return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest(".highlight-toolbar")) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        },
    });

const getFilteredTextLength = (container, range) => {
    const walker = createTextWalker(container);
    let length = 0;

    while (walker.nextNode()) {
        const node = walker.currentNode;
        try {
            if (!range.intersectsNode(node)) continue;
        } catch (err) {
            continue;
        }

        let start = 0;
        let end = node.nodeValue?.length || 0;

        if (range.startContainer === node) {
            start = range.startOffset;
        }

        if (range.endContainer === node) {
            end = range.endOffset;
        }

        if (start < end) {
            length += end - start;
        }
    }

    return length;
};

const createRangeFromOffsets = (container, offsets) => {
    if (!offsets) return null;
    const { start, end } = offsets;
    const range = document.createRange();

    let current = 0;
    let startNode = null;
    let endNode = null;
    let startOffset = 0;
    let endOffset = 0;

    const walker = createTextWalker(container);

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const length = node.nodeValue?.length || 0;
        const next = current + length;

        if (!startNode && start <= next) {
            startNode = node;
            startOffset = Math.max(0, start - current);
        }

        if (!endNode && end <= next) {
            endNode = node;
            endOffset = Math.max(0, end - current);
            break;
        }

        current = next;
    }

    if (!startNode || !endNode) return null;

    range.setStart(
        startNode,
        Math.min(startOffset, startNode.nodeValue.length)
    );
    range.setEnd(endNode, Math.min(endOffset, endNode.nodeValue.length));
    return range;
};

const unwrapHighlightSpan = (span) => {
    const parent = span.parentNode;
    if (!parent) return;

    while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
    }

    parent.removeChild(span);
    parent.normalize();
};

const removeHighlightInRange = (container, range) => {
    const highlights = container.querySelectorAll(
        ".highlight-yellow, .highlight-green, .highlight-blue"
    );

    highlights.forEach((span) => {
        try {
            if (!range.intersectsNode(span)) return;
        } catch (err) {
            return;
        }

        unwrapHighlightSpan(span);
    });
};

const removeAllHighlights = (container) => {
    if (!container) return;
    const highlights = container.querySelectorAll(
        ".highlight-yellow, .highlight-green, .highlight-blue"
    );
    highlights.forEach((span) => unwrapHighlightSpan(span));
};

const getTextNodesInRange = (container, range) => {
    const nodes = [];
    const walker = createTextWalker(container);

    while (walker.nextNode()) {
        const node = walker.currentNode;
        try {
            if (!range.intersectsNode(node)) continue;
        } catch (err) {
            continue;
        }
        nodes.push(node);
    }

    return nodes;
};

const wrapRangeInClass = (container, range, className) => {
    const textNodes = getTextNodesInRange(container, range);

    textNodes.forEach((node) => {
        const length = node.nodeValue?.length || 0;
        if (!length) return;
        const startOffset =
            node === range.startContainer ? range.startOffset : 0;
        const endOffset = node === range.endContainer ? range.endOffset : length;

        if (startOffset === endOffset) return;

        const text = node.nodeValue || "";
        const before = text.slice(0, startOffset);
        const middle = text.slice(startOffset, endOffset);
        const after = text.slice(endOffset);

        const fragment = document.createDocumentFragment();
        if (before) fragment.appendChild(document.createTextNode(before));
        if (middle) {
            const span = document.createElement("span");
            span.className = className;
            span.textContent = middle;
            fragment.appendChild(span);
        }
        if (after) fragment.appendChild(document.createTextNode(after));

        node.parentNode.replaceChild(fragment, node);
    });
};

function ReadingForm() {
    const { testId } = useParams();
    const token = localStorage.getItem("token");

    /* ================= STATE ================= */

    const [test, setTest] = useState(null);
    const [activePassage, setActivePassage] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [secondsLeft, setSecondsLeft] = useState(3600);
    const [scoreResult, setScoreResult] = useState(null);
    const [savingScore, setSavingScore] = useState(false);
    const [readingHtml, setReadingHtml] = useState([]);
    const [questionHighlights, setQuestionHighlights] = useState([]);
    const [highlightMenu, setHighlightMenu] = useState({
        visible: false,
        top: 0,
        left: 0,
        target: null,
    });

    const readingWrapRef = useRef(null);
    const readingContentRef = useRef(null);
    const questionWrapRef = useRef(null);
    const questionContentRef = useRef(null);
    const selectionOffsetsRef = useRef(null);
    const selectionTargetRef = useRef(null);

    /* ================= LOAD TEST ================= */

    useEffect(() => {
        axios
            .get(`/test/${testId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            .then((res) => {
                const data = res.data;
                setTest(data);
                setReadingHtml(data.passages.map((p) => p.readingText || ""));
                setQuestionHighlights(data.passages.map(() => []));

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

    useEffect(() => {
        setHighlightMenu((prev) =>
            prev.visible ? { ...prev, visible: false, target: null } : prev
        );
        selectionOffsetsRef.current = null;
        selectionTargetRef.current = null;
    }, [activePassage]);

    useEffect(() => {
        const handleDocumentMouseDown = (event) => {
            const readingWrap = readingWrapRef.current;
            const questionWrap = questionWrapRef.current;
            if (
                (readingWrap && readingWrap.contains(event.target)) ||
                (questionWrap && questionWrap.contains(event.target))
            ) {
                return;
            }
            setHighlightMenu((prev) =>
                prev.visible ? { ...prev, visible: false, target: null } : prev
            );
            selectionOffsetsRef.current = null;
            selectionTargetRef.current = null;
        };

        document.addEventListener("mousedown", handleDocumentMouseDown);
        return () => {
            document.removeEventListener("mousedown", handleDocumentMouseDown);
        };
    }, []);

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

    const handleChange = useCallback((value, index) => {
        setUserAnswers((prev) => {
            const copy = [...prev];
            copy[activePassage][index] = value;
            return copy;
        });
    }, [activePassage]);

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

    useEffect(() => {
        const content = readingContentRef.current;
        if (!content) return;

        if (!test) {
            content.innerHTML = "";
            return;
        }

        const html =
            readingHtml[activePassage] ??
            test.passages[activePassage]?.readingText ??
            "";

        if (content.innerHTML !== html) {
            content.innerHTML = html;
        }
    }, [test, readingHtml, activePassage]);

    useEffect(() => {
        const content = questionContentRef.current;
        if (!content) return;

        removeAllHighlights(content);

        const highlights = questionHighlights[activePassage] || [];
        highlights.forEach((item) => {
            const range = createRangeFromOffsets(content, item);
            if (range) {
                wrapRangeInClass(content, range, item.className);
            }
        });
    }, [questionHighlights, activePassage, userAnswers]);

    const passage = test?.passages?.[activePassage];

    const questionNodes = useMemo(() => {
        if (!passage?.testText) return [];

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
    }, [passage?.testText, activePassage, userAnswers, handleChange]);

    /* ================= SAFE CHECK ================= */

    if (!test) return <p>Loading...</p>;
    /* ================= HIGHLIGHTS ================= */

    const hideHighlightMenu = () => {
        setHighlightMenu((prev) =>
            prev.visible ? { ...prev, visible: false, target: null } : prev
        );
    };

    const syncReadingHtml = () => {
        const content = readingContentRef.current;
        if (!content) return;

        setReadingHtml((prev) => {
            const next = [...prev];
            next[activePassage] = content.innerHTML;
            return next;
        });
    };

    const getSelectionOffsets = (container, range) => {
        const preRange = document.createRange();
        preRange.selectNodeContents(container);
        preRange.setEnd(range.startContainer, range.startOffset);

        const start = getFilteredTextLength(container, preRange);
        const selectedLength = getFilteredTextLength(container, range);
        return { start, end: start + selectedLength };
    };

    const handleSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            hideHighlightMenu();
            selectionOffsetsRef.current = null;
            selectionTargetRef.current = null;
            return;
        }

        const range = selection.getRangeAt(0);
        const readingContent = readingContentRef.current;
        const readingWrap = readingWrapRef.current;
        const questionWrap = questionWrapRef.current;
        const questionContent = questionContentRef.current;

        let target = null;
        let content = null;
        let wrap = null;

        if (readingContent && readingContent.contains(range.commonAncestorContainer)) {
            target = "reading";
            content = readingContent;
            wrap = readingWrap;
        } else if (
            questionContent &&
            questionContent.contains(range.commonAncestorContainer)
        ) {
            target = "questions";
            content = questionContent;
            wrap = questionWrap;
        }

        if (!target || !content || !wrap) {
            hideHighlightMenu();
            selectionOffsetsRef.current = null;
            selectionTargetRef.current = null;
            return;
        }

        const offsets = getSelectionOffsets(content, range);
        if (offsets.start === offsets.end) {
            hideHighlightMenu();
            selectionOffsetsRef.current = null;
            selectionTargetRef.current = null;
            return;
        }

        selectionOffsetsRef.current = offsets;
        selectionTargetRef.current = target;

        const rect = range.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        const top = rect.top - wrapRect.top + wrap.scrollTop - 10;
        const left =
            rect.left - wrapRect.left + wrap.scrollLeft + rect.width / 2;

        setHighlightMenu({
            visible: true,
            top: Math.max(top, 48),
            left: Math.max(left, 8),
            target,
        });
    };

    const applyQuestionHighlight = (className) => {
        const offsets = selectionOffsetsRef.current;
        if (!offsets) return;

        setQuestionHighlights((prev) => {
            const next = [...prev];
            const current = [...(next[activePassage] || [])];
            const filtered = current.filter(
                (item) => item.end <= offsets.start || item.start >= offsets.end
            );

            if (className) {
                filtered.push({
                    start: offsets.start,
                    end: offsets.end,
                    className,
                });
            }

            next[activePassage] = filtered;
            return next;
        });
    };

    const applyHighlight = (className) => {
        const target = selectionTargetRef.current;
        const offsets = selectionOffsetsRef.current;
        if (!target || !offsets) return;

        if (target === "reading") {
            const content = readingContentRef.current;
            if (!content) return;

            const range = createRangeFromOffsets(content, offsets);
            if (!range) return;

            removeHighlightInRange(content, range);

            if (className) {
                const refreshedRange = createRangeFromOffsets(content, offsets);
                if (refreshedRange) {
                    wrapRangeInClass(content, refreshedRange, className);
                }
            }

            syncReadingHtml();
        }

        if (target === "questions") {
            applyQuestionHighlight(className);
        }

        hideHighlightMenu();
        selectionOffsetsRef.current = null;
        selectionTargetRef.current = null;

        const selection = window.getSelection();
        if (selection) selection.removeAllRanges();
    };

    const renderHighlightToolbar = () => (
        <div
            className="highlight-toolbar"
            style={{
                top: highlightMenu.top,
                left: highlightMenu.left,
            }}
            onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
            }}
        >
            <button
                className="highlight-btn highlight-yellow-btn"
                onClick={() => applyHighlight("highlight-yellow")}
                type="button"
            >
                Yellow
            </button>
            <button
                className="highlight-btn highlight-green-btn"
                onClick={() => applyHighlight("highlight-green")}
                type="button"
            >
                Green
            </button>
            <button
                className="highlight-btn highlight-blue-btn"
                onClick={() => applyHighlight("highlight-blue")}
                type="button"
            >
                Blue
            </button>
            <button
                className="highlight-btn highlight-remove-btn"
                onClick={() => applyHighlight("")}
                type="button"
            >
                Remove
            </button>
        </div>
    );

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
                    ref={readingWrapRef}
                    onMouseUp={handleSelection}
                    onKeyUp={handleSelection}
                    onScroll={hideHighlightMenu}
                >
                    {highlightMenu.visible &&
                        highlightMenu.target === "reading" &&
                        renderHighlightToolbar()}
                    <div
                        className="reading-content"
                        ref={readingContentRef}
                    />
                </div>

                {/* QUESTIONS */}
                <div
                    className="test-half"
                    ref={questionWrapRef}
                    onMouseUp={handleSelection}
                    onKeyUp={handleSelection}
                    onScroll={hideHighlightMenu}
                >
                    {highlightMenu.visible &&
                        highlightMenu.target === "questions" &&
                        renderHighlightToolbar()}
                    <div className="question-content" ref={questionContentRef}>
                        {questionNodes}

                        <br />

                        <button
                            className="submit-btn"
                            onClick={handleSubmit}
                            disabled={savingScore}
                        >
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
        </div>
    );
}

export default ReadingForm;
