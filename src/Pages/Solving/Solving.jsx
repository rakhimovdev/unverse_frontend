import { useEffect, useRef, useState } from "react";

import axios from "../../Api/Axios";
import { renderHtmlWithQuestionTokens } from "../../utils/questionMarkup";

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

    if (type === "checkbox" || type === "multi") {
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

    return null;
};

const getQuestionDefs = (html) => {
    const regex = new RegExp(MARKER_REGEX);
    const defs = [];
    let match;

    while ((match = regex.exec(html))) {
        const parsed = parseToken(match[1]);
        if (!parsed) continue;

        const isMulti = parsed.kind === "multi";
        const max = isMulti ? Math.max(1, Number(parsed.max) || 1) : 1;

        defs.push({
            type:
                parsed.kind === "input"
                    ? "text"
                    : parsed.kind === "multi"
                        ? "multi"
                        : "select",
            max,
        });
    }

    return defs;
};

/* ================= PREVIEW ================= */

function Preview({ passage, testName, answers = [], onAnswersChange }) {
    const html = passage.testText || "";

    const renderQuestionHTML = () => {
        return renderHtmlWithQuestionTokens({
            html,
            parseToken,
            rootKey: "preview-question",
            renderToken: ({ parsed, currentIndex, key }) => {
                if (parsed.kind === "input") {
                    return (
                        <input
                            key={key}
                            value={answers[currentIndex] || ""}
                            onChange={(e) => {
                                const copy = [...answers];
                                copy[currentIndex] = e.target.value;
                                onAnswersChange(copy);
                            }}
                        />
                    );
                }

                if (parsed.kind === "multi") {
                    const selected = splitMultiValue(answers[currentIndex]);
                    return (
                        <span key={key} className="preview-multi">
                            {parsed.options.map((opt, optIndex) => {
                                const checked = selected.some(
                                    (item) => item.toLowerCase() === opt.toLowerCase()
                                );
                                return (
                                    <label key={`multi-${currentIndex}-${optIndex}`}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => {
                                                const copy = [...answers];
                                                copy[currentIndex] = toggleMultiValue(
                                                    copy[currentIndex],
                                                    opt,
                                                    parsed.max || 2
                                                );
                                                onAnswersChange(copy);
                                            }}
                                        />
                                        {opt}
                                    </label>
                                );
                            })}
                        </span>
                    );
                }

                if (parsed.kind === "select") {
                    return (
                        <select
                            key={key}
                            value={answers[currentIndex] || ""}
                            onChange={(e) => {
                                const copy = [...answers];
                                copy[currentIndex] = e.target.value;
                                onAnswersChange(copy);
                            }}
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
                    );
                }

                if (parsed.kind === "radio") {
                    return (
                        <span key={key}>
                            {parsed.options.map((opt, optIndex) => (
                                <label key={`radio-${currentIndex}-${optIndex}`}>
                                    <input
                                        type="radio"
                                        name={`radio-${currentIndex}`}
                                        value={opt}
                                        style={{ marginRight: "6px" }}
                                        checked={answers[currentIndex] === opt}
                                        onChange={(e) => {
                                            const copy = [...answers];
                                            copy[currentIndex] = e.target.value;
                                            onAnswersChange(copy);
                                        }}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </span>
                    );
                }

                return null;
            },
        });
    };

    useEffect(() => {
        const defs = getQuestionDefs(html);
        if (answers.length === defs.length) return;

        const next = Array(defs.length)
            .fill("")
            .map((_, i) => answers[i] || "");
        onAnswersChange(next);
    }, [html, answers, onAnswersChange]);

    return (
        <div className="readingform-blue">
            <header className="reading-header">
                <h1>{testName}</h1>
                <div className="timer">⏱ 60:00</div>
            </header>

            <div className="container-blue">
                <div
                    className="reading-half"
                    dangerouslySetInnerHTML={{
                        __html: passage.readingText,
                    }}
                />

                <div className="test-half">{renderQuestionHTML()}</div>
            </div>
        </div>
    );
}

/* ================= MAIN ================= */

const emptyPassage = {
    readingText: "",
    testText: "",
    questions: [],
};

const TOKEN_BUTTONS = [
    { key: "input", label: "Input", token: "[[input]]" },
    { key: "mc", label: "Multiple choice", token: "[[mc]]" },
    { key: "checkbox2", label: "Checkbox (2)", token: "[[checkbox:2]]" },
    { key: "checkbox3", label: "Checkbox (3)", token: "[[checkbox:3]]" },
    { key: "matching", label: "Matching headings", token: "[[matching-headings]]" },
    { key: "tfng", label: "T/F/NG", token: "[[tfng]]" },
    { key: "short", label: "Short answer", token: "[[short]]" },
    { key: "sentence", label: "Sentence completion", token: "[[sentence]]" },
    { key: "table", label: "Table completion", token: "[[table]]" },
    { key: "diagram", label: "Diagram label", token: "[[diagram-label]]" },
    { key: "flow", label: "Flow-chart completion", token: "[[flow-chart]]" },
    { key: "summary", label: "Summary completion", token: "[[summary]]" },
];

export default function CreateReadingTest() {
    const [testName, setTestName] = useState("");
    const [audience, setAudience] = useState("regular");
    const [activePassage, setActivePassage] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);

    const [passages, setPassages] = useState([
        { ...emptyPassage },
        { ...emptyPassage },
        { ...emptyPassage },
    ]);

    const editorRef = useRef(null);
    const questionEditorRef = useRef(null);

    const [toolbar, setToolbar] = useState(null);
    const [toolbarPos, setToolbarPos] = useState({
        top: 0,
        left: 0,
    });

    const current = passages[activePassage];

    /* ================= ENTER FIX ================= */

    const handleEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();

            const sel = window.getSelection();
            if (!sel.rangeCount) return;

            const range = sel.getRangeAt(0);
            const br = document.createElement("br");

            range.insertNode(br);
            range.setStartAfter(br);
            range.setEndAfter(br);

            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    /* ================= SHORTCUTS ================= */

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === "b") {
            e.preventDefault();
            applyFormat("bold");
        }

        if (e.key === "Enter") {
            handleEnter(e);
        }
    };

    /* ================= SELECT ================= */

    const handleSelect = () => {
        setTimeout(() => {
            const sel = window.getSelection();
            if (!sel.rangeCount) return;

            const range = sel.getRangeAt(0);

            if (range.collapsed) {
                setToolbar(null);
                return;
            }

            const rect = range.getBoundingClientRect();

            setToolbar(true);

            setToolbarPos({
                top: rect.top - 40,
                left: rect.left,
            });
        }, 0);
    };

    /* ================= APPLY FORMAT ================= */

    const applyFormat = (type) => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const span = document.createElement("span");

        if (type === "bold") span.className = "highlight-bold";
        if (type === "large") span.className = "highlight-large";

        span.appendChild(range.extractContents());
        range.insertNode(span);

        sel.removeAllRanges();

        setToolbar(null);
    };

    /* ================= REMOVE FORMAT ================= */

    const removeFormat = () => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        let node = range.commonAncestorContainer;

        if (node.nodeType === 3) node = node.parentNode;

        if (
            node.classList &&
            (node.classList.contains("highlight-bold") ||
                node.classList.contains("highlight-large"))
        ) {
            const parent = node.parentNode;

            while (node.firstChild) {
                parent.insertBefore(node.firstChild, node);
            }

            parent.removeChild(node);
        }

        setToolbar(null);
    };

    /* ================= SAVE ================= */

    const saveCurrentPassage = () => {
        setPassages((prev) => {
            const copy = [...prev];
            const html = questionEditorRef.current?.innerHTML || "";
            const existingQuestions = copy[activePassage]?.questions || [];

            copy[activePassage] = {
                readingText: editorRef.current.innerHTML,
                testText: html,
                questions: syncQuestions(html, existingQuestions),
            };

            return copy;
        });
    };

    useEffect(() => {
        editorRef.current.innerHTML = current.readingText;
        questionEditorRef.current.innerHTML = current.testText;
    }, [activePassage, current.readingText, current.testText]);

    const syncQuestions = (html, existingQuestions = []) => {
        const defs = getQuestionDefs(html);
        return defs.map((def, i) => ({
            value: existingQuestions[i]?.value || "",
            type: def.type,
        }));
    };

    const buildPassagesForSave = () =>
        passages.map((p, i) => {
            if (i !== activePassage) return p;

            const html = questionEditorRef.current?.innerHTML || "";
            return {
                ...p,
                readingText: editorRef.current.innerHTML,
                testText: html,
                questions: syncQuestions(html, p.questions),
            };
        });

    const handleSave = async () => {
        const payloadPassages = buildPassagesForSave();
        setPassages(payloadPassages);

        await axios.post("/test/upload", {
            name: testName,
            passages: payloadPassages,
            audience,
        });

        alert("Saved");
    };

    const handleAnswersChange = (nextAnswers) => {
        setPassages((prev) => {
            const copy = [...prev];
            const html = copy[activePassage]?.testText || "";
            const defs = getQuestionDefs(html);
            const questions = defs.map((def, i) => ({
                value: nextAnswers[i] || "",
                type: def.type,
            }));

            copy[activePassage] = {
                ...copy[activePassage],
                questions,
            };

            return copy;
        });
    };

    const copyToken = async (token, key) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(token);
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = token;
                textarea.setAttribute("readonly", "");
                textarea.style.position = "fixed";
                textarea.style.top = "-9999px";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }

            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1000);
        } catch (err) {
            setCopiedKey(null);
        }
    };

    /* ================= UI ================= */

    return (
        <div className="create-test-container">
            <h1>IELTS Reading Test Creator</h1>

            {/* PASSAGE TABS */}
            <div className="passage-tools">
                <div className="passage-tabs">
                    {passages.map((_, i) => (
                        <button
                            key={i}
                            className={i === activePassage ? "active" : ""}
                            onClick={() => {
                                saveCurrentPassage();
                                setActivePassage(i);
                            }}
                        >
                            Passage {i + 1}
                        </button>
                    ))}
                </div>

                <div className="token-buttons">
                    <span className="token-label">Tokens:</span>
                    {TOKEN_BUTTONS.map((item) => (
                        <button
                            key={item.key}
                            className={copiedKey === item.key ? "copied" : ""}
                            onClick={() => copyToken(item.token, item.key)}
                            title={item.token}
                            type="button"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TEST NAME */}
            <div className="test-name-container">
                <label className="test-name-label">Test Name</label>

                <input
                    type="text"
                    className="test-name-input"
                    placeholder="Enter test name..."
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                />

                <label className="test-name-label">Test turi</label>
                <select
                    className="test-name-select"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                >
                    <option value="regular">Oddiy test</option>
                    <option value="mooc">Mooc test uchun</option>
                </select>
            </div>

            {/* EDITORS */}
            <div className="split-screen">
                <div className="left">
                    <h3>Reading</h3>

                    <div
                        ref={editorRef}
                        className="reading-editor"
                        contentEditable
                        onMouseUp={handleSelect}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="right">
                    <h3>Questions</h3>

                    <div
                        ref={questionEditorRef}
                        className="question-editor"
                        contentEditable
                        onMouseUp={handleSelect}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>

            {/* TOOLBAR */}
            {toolbar && (
                <div className="selection-buttons" style={toolbarPos}>
                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            removeFormat();
                        }}
                    >
                        Oddiy
                    </button>

                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            applyFormat("bold");
                        }}
                    >
                        Bold
                    </button>

                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            applyFormat("large");
                        }}
                    >
                        Large
                    </button>
                </div>
            )}

            {/* ACTIONS */}
            <div className="actions">
                <button className="save-btn" onClick={handleSave}>
                    Save
                </button>

                <button
                    className="preview-btn"
                    onClick={() => {
                        saveCurrentPassage();
                        setShowPreview(!showPreview);
                    }}
                >
                    Preview
                </button>
            </div>

            {/* PREVIEW */}
            {showPreview && (
                <Preview
                    testName={testName}
                    passage={current}
                    answers={current.questions?.map((q) => q.value) || []}
                    onAnswersChange={handleAnswersChange}
                />
            )}
        </div>
    );
}
