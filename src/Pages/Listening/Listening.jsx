import React, { useEffect, useRef, useState } from "react";
import axios from "../../Api/Axios";
import "./Listening.css";

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

const parseDimensionList = (rawValue, defaultUnit) => {
    if (!rawValue) return [];
    return rawValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
            if (item.toLowerCase() === "auto") return "auto";
            const match = item.match(/^(\d+(?:\.\d+)?)(px|%|em|rem|vh|vw)?$/i);
            if (!match) return null;
            const value = match[1];
            const unit = match[2] || defaultUnit;
            return `${value}${unit}`;
        })
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

const TOKEN_BUTTONS = [
    { key: "input", label: "Input", token: "[[input]]" },
    { key: "textarea", label: "Textarea", token: "[[textarea]]" },
    { key: "mc", label: "Multiple choice", token: "[[mc]]" },
    { key: "multi", label: "Multi (choose 2)", token: "[[multi: A|B|C|D|E]]" },
    { key: "checkbox2", label: "Checkbox (2)", token: "[[checkbox:2]]" },
    { key: "checkbox3", label: "Checkbox (3)", token: "[[checkbox:3]]" },
    { key: "matching", label: "Matching headings", token: "[[matching-headings]]" },
    { key: "tfng", label: "T/F/NG", token: "[[tfng]]" },
    { key: "ynng", label: "Y/N/NG", token: "[[ynng]]" },
    { key: "short", label: "Short answer", token: "[[short]]" },
    { key: "sentence", label: "Sentence completion", token: "[[sentence]]" },
    { key: "table", label: "Table completion", token: "[[table]]" },
    { key: "diagram", label: "Diagram label", token: "[[diagram-label]]" },
    { key: "flow", label: "Flow-chart completion", token: "[[flow-chart]]" },
    { key: "summary", label: "Summary completion", token: "[[summary]]" },
    { key: "select", label: "Select (A|B|C)", token: "[[select: A|B|C]]" },
];

const createEmptyPart = () => ({
    questionHtml: "",
    questions: [],
    imageFile: null,
    imagePreview: null,
    audioFile: null,
});

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

function Preview({ html, answers, onAnswersChange }) {
    const renderTokenInput = (parsed, index) => {
        if (parsed.kind === "input") {
            return (
                <input
                    key={`input-${index}`}
                    type="text"
                    style={parsed.width ? { width: parsed.width } : undefined}
                    value={answers[index] || ""}
                    onChange={(e) => {
                        const copy = [...answers];
                        copy[index] = e.target.value;
                        onAnswersChange(copy);
                    }}
                />
            );
        }

        if (parsed.kind === "textarea") {
            return (
                <textarea
                    key={`textarea-${index}`}
                    rows={3}
                    style={parsed.width ? { width: parsed.width } : undefined}
                    value={answers[index] || ""}
                    onChange={(e) => {
                        const copy = [...answers];
                        copy[index] = e.target.value;
                        onAnswersChange(copy);
                    }}
                />
            );
        }

        if (parsed.kind === "multi") {
            const selected = splitMultiValue(answers[index]);
            return (
                <span key={`multi-${index}`} className="preview-multi">
                    {parsed.options.map((opt, optIndex) => {
                        const checked = selected.some(
                            (item) => item.toLowerCase() === opt.toLowerCase()
                        );
                        return (
                            <label key={`multi-${index}-${optIndex}`}>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                        const copy = [...answers];
                                        copy[index] = toggleMultiValue(
                                            copy[index],
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
                    key={`select-${index}`}
                    value={answers[index] || ""}
                    onChange={(e) => {
                        const copy = [...answers];
                        copy[index] = e.target.value;
                        onAnswersChange(copy);
                    }}
                >
                    {parsed.includeEmpty !== false && <option value=""></option>}
                    {parsed.options.map((opt, optIndex) => (
                        <option key={`select-${index}-${optIndex}`} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        }

        if (parsed.kind === "radio") {
            return (
                <span key={`radio-${index}`}>
                    {parsed.options.map((opt, optIndex) => (
                        <label key={`radio-${index}-${optIndex}`}>
                            <input
                                type="radio"
                                name={`radio-${index}`}
                                value={opt}
                                checked={answers[index] === opt}
                                onChange={(e) => {
                                    const copy = [...answers];
                                    copy[index] = e.target.value;
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
    };

    const renderWithTokens = () => {
        if (!html) return null;
        if (typeof window === "undefined" || !window.DOMParser) {
            return <span dangerouslySetInnerHTML={{ __html: html }} />;
        }

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
                        parts.push(renderTokenInput(parsed, currentIndex));
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
            renderNode(child, `root-${idx}`)
        );
    };

    return <div className="listening-preview">{renderWithTokens()}</div>;
}

function AnswerKey({ questions, onAnswersChange }) {
    const answers = questions.map((q) => q.value || "");

    if (!questions.length) {
        return <p className="answer-key-empty">Savollar yo'q.</p>;
    }

    return (
        <div className="listening-answer-key">
            <h4>Answer Key</h4>
            <div className="answer-key-list">
                {questions.map((q, index) => (
                    <label className="answer-key-row" key={`answer-${index}`}>
                        <span>Q{index + 1}</span>
                        <input
                            type="text"
                            value={answers[index]}
                            onChange={(e) => {
                                const next = [...answers];
                                next[index] = e.target.value;
                                onAnswersChange(next);
                            }}
                            placeholder={
                                q.type === "multi"
                                    ? "A,B"
                                    : q.type === "select"
                                        ? "A / B / C"
                                        : "Correct answer"
                            }
                        />
                    </label>
                ))}
            </div>
        </div>
    );
}

function ListeningTest() {
    const [title, setTitle] = useState("");
    const [audience, setAudience] = useState("regular");
    const [activePart, setActivePart] = useState(0);
    const [parts, setParts] = useState(() =>
        Array.from({ length: 4 }, () => createEmptyPart())
    );
    const [tableConfig, setTableConfig] = useState({
        rows: 2,
        cols: 2,
        width: 100,
        height: 0,
        rowHeights: "",
        colWidths: "",
    });
    const [showPreview, setShowPreview] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);
    const [saving, setSaving] = useState(false);

    const questionEditorRef = useRef(null);

    const currentPart = parts[activePart] || createEmptyPart();

    const syncQuestions = (html, existingQuestions = []) => {
        const defs = getQuestionDefs(html);
        return defs.map((def, i) => ({
            value: existingQuestions[i]?.value || "",
            type: def.type,
        }));
    };

    useEffect(() => {
        if (
            questionEditorRef.current &&
            questionEditorRef.current.innerHTML !== currentPart.questionHtml
        ) {
            questionEditorRef.current.innerHTML = currentPart.questionHtml;
        }
    }, [currentPart.questionHtml]);

    const updatePart = (index, patch) => {
        setParts((prev) => {
            const next = [...prev];
            const current = next[index] || createEmptyPart();
            next[index] = { ...current, ...patch };
            return next;
        });
    };

    const saveCurrentPart = () => {
        const questionHtml = questionEditorRef.current?.innerHTML || "";
        updatePart(activePart, {
            questionHtml,
            questions: syncQuestions(questionHtml, currentPart.questions),
        });
    };

    const handleQuestionInput = () => {
        const html = questionEditorRef.current?.innerHTML || "";
        updatePart(activePart, {
            questionHtml: html,
            questions: syncQuestions(html, currentPart.questions),
        });
    };

    const insertHtml = (html) => {
        const editor = questionEditorRef.current;
        if (!editor) return;

        editor.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            editor.insertAdjacentHTML("beforeend", html);
        } else {
            const range = selection.getRangeAt(0);
            if (!editor.contains(range.commonAncestorContainer)) {
                editor.insertAdjacentHTML("beforeend", html);
            } else {
                range.deleteContents();
                const fragment = range.createContextualFragment(html);
                range.insertNode(fragment);
                selection.removeAllRanges();
                const nextRange = document.createRange();
                nextRange.selectNodeContents(editor);
                nextRange.collapse(false);
                selection.addRange(nextRange);
            }
        }

        handleQuestionInput();
    };

    const handleInsertTable = () => {
        const rows = Math.max(1, Number(tableConfig.rows) || 1);
        const cols = Math.max(1, Number(tableConfig.cols) || 1);
        const width = Math.min(100, Math.max(20, Number(tableConfig.width) || 100));
        const height = Math.max(0, Number(tableConfig.height) || 0);
        const rowHeights = parseDimensionList(tableConfig.rowHeights, "px");
        const colWidths = parseDimensionList(tableConfig.colWidths, "%");

        const headerHeight =
            rowHeights.length === rows + 1 ? rowHeights[0] : null;
        const bodyRowHeights =
            rowHeights.length === rows + 1 ? rowHeights.slice(1) : rowHeights;

        const headerCells = Array.from({ length: cols }, (_, index) => {
            return `<th>Header ${index + 1}</th>`;
        }).join("");

        const bodyRows = Array.from({ length: rows }, (_, rowIndex) => {
            const cells = Array.from({ length: cols }, () => "<td>Cell</td>").join("");
            const rowHeight = bodyRowHeights[rowIndex];
            const rowStyle = rowHeight ? ` style="height:${rowHeight};"` : "";
            return `<tr${rowStyle}>${cells}</tr>`;
        }).join("");

        const heightStyle = height > 0 ? `height:${height}px;` : "";
        const headerStyle = headerHeight ? ` style="height:${headerHeight};"` : "";
        const colGroupHtml = colWidths.length
            ? `<colgroup>${Array.from({ length: cols }, (_, index) => {
                  const widthValue = colWidths[index];
                  return widthValue ? `<col style="width:${widthValue};" />` : "<col />";
              }).join("")}</colgroup>`
            : "";
        const tableLayout = colWidths.length ? "table-layout:fixed;" : "";
        const tableHtml = `
<div class="listening-table-wrap" style="width:${width}%;${heightStyle}">
    <table class="listening-inline-table" style="width:100%;${heightStyle}${tableLayout}">
        ${colGroupHtml}
        <thead>
            <tr${headerStyle}>${headerCells}</tr>
        </thead>
        <tbody>
            ${bodyRows}
        </tbody>
    </table>
</div>
`;

        insertHtml(tableHtml);
    };

    const handleAnswersChange = (nextAnswers) => {
        updatePart(activePart, {
            questions: currentPart.questions.map((q, i) => ({
                ...q,
                value: nextAnswers[i] || "",
            })),
        });
    };

    const handlePartImageChange = (index, e) => {
        const file = e.target.files[0] || null;
        setParts((prev) => {
            const next = [...prev];
            const current = next[index] || createEmptyPart();
            if (current.imagePreview) {
                URL.revokeObjectURL(current.imagePreview);
            }
            next[index] = {
                ...current,
                imageFile: file,
                imagePreview: file ? URL.createObjectURL(file) : null,
            };
            return next;
        });
    };

    const handlePartAudioChange = (index, e) => {
        const file = e.target.files[0] || null;
        setParts((prev) => {
            const next = [...prev];
            const current = next[index] || createEmptyPart();
            next[index] = {
                ...current,
                audioFile: file,
            };
            return next;
        });
    };

    const handleClear = () => {
        parts.forEach((part) => {
            if (part.imagePreview) {
                URL.revokeObjectURL(part.imagePreview);
            }
        });
        setTitle("");
        setAudience("regular");
        setActivePart(0);
        setParts(Array.from({ length: 4 }, () => createEmptyPart()));
        setShowPreview(false);
        setCopiedKey(null);
        if (questionEditorRef.current) questionEditorRef.current.innerHTML = "";
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

    const handleSubmitFull = async () => {
        if (!title) {
            alert("Iltimos, test nomini kiriting!");
            return;
        }

        const updatedParts = parts.map((part, index) => {
            const questionHtml =
                index === activePart
                    ? questionEditorRef.current?.innerHTML || part.questionHtml
                    : part.questionHtml;
            const syncedQuestions = syncQuestions(questionHtml, part.questions);
            return {
                ...part,
                questionHtml,
                questions: syncedQuestions,
            };
        });

        const emptyIndex = updatedParts.findIndex(
            (part) => !part.questionHtml?.trim()
        );
        if (emptyIndex !== -1) {
            alert(`Part ${emptyIndex + 1} savollar matnini kiriting!`);
            return;
        }

        const missingAudioIndex = updatedParts.findIndex(
            (part) => !part.audioFile
        );
        if (missingAudioIndex !== -1) {
            alert(`Part ${missingAudioIndex + 1} uchun audio fayl tanlang!`);
            return;
        }

        setParts(updatedParts);

        const payloadParts = updatedParts.map((part) => ({
            transcript: "",
            testText: part.questionHtml,
            questions: part.questions,
        }));

        const formData = new FormData();
        formData.append("title", title);
        formData.append("audience", audience);
        formData.append("parts", JSON.stringify(payloadParts));
        updatedParts.forEach((part, index) => {
            if (part.imageFile) {
                formData.append(`imagePart${index}`, part.imageFile);
            }
            if (part.audioFile) {
                formData.append(`audioPart${index}`, part.audioFile);
            }
        });

        try {
            setSaving(true);
            await axios.post("/testl/full", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            alert("✅ Listening test saqlandi!");
            handleClear();
        } catch (err) {
            alert("❌ Xatolik: " + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="listening-container">
            <h2>🎧 IELTS Listening Test Upload</h2>

            <div className="listening-form">
                <div className="listening-field">
                    <label>Test nomi</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Listening test nomi"
                    />
                </div>

                <div className="listening-field">
                    <label>Test turi</label>
                    <select
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                    >
                        <option value="regular">Oddiy test</option>
                        <option value="mooc">Mooc test uchun</option>
                    </select>
                </div>

                <div className="part-tabs">
                    {parts.map((_, i) => (
                        <button
                            key={`part-${i}`}
                            type="button"
                            className={activePart === i ? "active" : ""}
                            onClick={() => {
                                saveCurrentPart();
                                setActivePart(i);
                            }}
                        >
                            Part {i + 1}
                        </button>
                    ))}
                </div>

                <div className="part-image-row">
                    <div className="listening-field">
                        <label>Part {activePart + 1} audio (majburiy)</label>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handlePartAudioChange(activePart, e)}
                        />
                        {currentPart.audioFile && (
                            <p className="file-note">{currentPart.audioFile.name}</p>
                        )}
                    </div>
                    <div className="listening-field">
                        <label>Part {activePart + 1} rasm (ixtiyoriy)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePartImageChange(activePart, e)}
                        />
                        {currentPart.imageFile && (
                            <p className="file-note">{currentPart.imageFile.name}</p>
                        )}
                    </div>
                </div>

                {currentPart.imagePreview && (
                    <div className="image-preview">
                        <img src={currentPart.imagePreview} alt="preview" />
                    </div>
                )}

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

                <div className="listening-editor-toolbar">
                    <span className="toolbar-label">Table:</span>
                    <button type="button" onClick={handleInsertTable}>
                        Insert Table
                    </button>
                    <div className="toolbar-field">
                        <label htmlFor="listening-table-rows">Rows</label>
                        <input
                            id="listening-table-rows"
                            type="number"
                            min="1"
                            max="20"
                            value={tableConfig.rows}
                            onChange={(e) =>
                                setTableConfig((prev) => ({
                                    ...prev,
                                    rows: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="toolbar-field">
                        <label htmlFor="listening-table-cols">Cols</label>
                        <input
                            id="listening-table-cols"
                            type="number"
                            min="1"
                            max="12"
                            value={tableConfig.cols}
                            onChange={(e) =>
                                setTableConfig((prev) => ({
                                    ...prev,
                                    cols: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="toolbar-field">
                        <label htmlFor="listening-table-width">Width %</label>
                        <input
                            id="listening-table-width"
                            type="number"
                            min="20"
                            max="100"
                            value={tableConfig.width}
                            onChange={(e) =>
                                setTableConfig((prev) => ({
                                    ...prev,
                                    width: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="toolbar-field">
                        <label htmlFor="listening-table-height">Height px</label>
                        <input
                            id="listening-table-height"
                            type="number"
                            min="0"
                            max="800"
                            value={tableConfig.height}
                            onChange={(e) =>
                                setTableConfig((prev) => ({
                                    ...prev,
                                    height: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="toolbar-field toolbar-field--wide">
                        <label htmlFor="listening-table-row-heights">Row heights</label>
                        <input
                            id="listening-table-row-heights"
                            type="text"
                            placeholder="e.g. 36, 44, 52 (px)"
                            title="Comma-separated row heights. If you give rows+1 values, the first one is used for the header row."
                            value={tableConfig.rowHeights}
                            onChange={(e) =>
                                setTableConfig((prev) => ({
                                    ...prev,
                                    rowHeights: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="toolbar-field toolbar-field--wide">
                        <label htmlFor="listening-table-col-widths">Col widths</label>
                        <input
                            id="listening-table-col-widths"
                            type="text"
                            placeholder="e.g. 30, 70 or 120px, 200px"
                            title="Comma-separated column widths. Numbers default to %, or use px explicitly."
                            value={tableConfig.colWidths}
                            onChange={(e) =>
                                setTableConfig((prev) => ({
                                    ...prev,
                                    colWidths: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <span className="toolbar-note">
                        Editor: Questions
                    </span>
                </div>

                <div className="listening-editors">
                    <div className="editor-col">
                        <h3>Questions (Part {activePart + 1})</h3>
                        <div
                            className="editor-box"
                            ref={questionEditorRef}
                            contentEditable
                            onInput={handleQuestionInput}
                            data-placeholder="Savollar matnini yozing va tokenlardan foydalaning..."
                        />
                    </div>
                </div>

                <div className="preview-toggle">
                    <button
                        type="button"
                        onClick={() => {
                            saveCurrentPart();
                            setShowPreview((prev) => !prev);
                        }}
                    >
                        {showPreview ? "Hide Preview" : "Preview (1:1)"}
                    </button>
                </div>

                {showPreview && (
                    <>
                        <Preview
                            html={currentPart.questionHtml}
                            answers={currentPart.questions.map((q) => q.value)}
                            onAnswersChange={handleAnswersChange}
                        />
                        <AnswerKey
                            questions={currentPart.questions}
                            onAnswersChange={handleAnswersChange}
                        />
                    </>
                )}

                <div className="actions">
                    <button type="button" onClick={handleSubmitFull} disabled={saving}>
                        {saving ? "Saving..." : "💾 Saqlash"}
                    </button>
                    <button type="button" className="ghost" onClick={handleClear}>
                        🗑 Tozalash
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ListeningTest;
