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
        return { kind: "textarea" };
    }

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
            type: parsed.kind === "input" || parsed.kind === "textarea" ? "text" : "select",
        });
    }

    return defs;
};

const TOKEN_BUTTONS = [
    { key: "input", label: "Input", token: "[[input]]" },
    { key: "textarea", label: "Textarea", token: "[[textarea]]" },
    { key: "mc", label: "Multiple choice", token: "[[mc]]" },
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
    transcriptHtml: "",
    questionHtml: "",
    questions: [],
    imageFile: null,
    imagePreview: null,
});

function Preview({ html, answers, onAnswersChange }) {
    const renderQuestionHTML = () => {
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
                    <input
                        key={`input-${nodeKey++}`}
                        value={answers[currentIndex] || ""}
                        onChange={(e) => {
                            const copy = [...answers];
                            copy[currentIndex] = e.target.value;
                            onAnswersChange(copy);
                        }}
                    />
                );
                questionIndex++;
            }

            if (parsed.kind === "textarea") {
                const currentIndex = questionIndex;
                nodes.push(
                    <textarea
                        key={`textarea-${nodeKey++}`}
                        rows={3}
                        value={answers[currentIndex] || ""}
                        onChange={(e) => {
                            const copy = [...answers];
                            copy[currentIndex] = e.target.value;
                            onAnswersChange(copy);
                        }}
                    />
                );
                questionIndex++;
            }

            if (parsed.kind === "select") {
                const currentIndex = questionIndex;
                nodes.push(
                    <select
                        key={`select-${nodeKey++}`}
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
                                    name={`radio-${currentIndex}`}
                                    value={opt}
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

    return <div className="listening-preview">{renderQuestionHTML()}</div>;
}

function ListeningTest() {
    const [title, setTitle] = useState("");
    const [audioFile, setAudioFile] = useState(null);
    const [activePart, setActivePart] = useState(0);
    const [parts, setParts] = useState(() =>
        Array.from({ length: 4 }, () => createEmptyPart())
    );
    const [tableConfig, setTableConfig] = useState({
        rows: 2,
        cols: 2,
        width: 100,
        height: 0,
    });
    const [activeEditor, setActiveEditor] = useState("questions");
    const [showPreview, setShowPreview] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);
    const [saving, setSaving] = useState(false);

    const transcriptRef = useRef(null);
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
            transcriptRef.current &&
            transcriptRef.current.innerHTML !== currentPart.transcriptHtml
        ) {
            transcriptRef.current.innerHTML = currentPart.transcriptHtml;
        }
    }, [currentPart.transcriptHtml]);

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
        const transcriptHtml = transcriptRef.current?.innerHTML || "";
        const questionHtml = questionEditorRef.current?.innerHTML || "";
        updatePart(activePart, {
            transcriptHtml,
            questionHtml,
            questions: syncQuestions(questionHtml, currentPart.questions),
        });
    };

    const handleTranscriptInput = () => {
        const html = transcriptRef.current?.innerHTML || "";
        updatePart(activePart, { transcriptHtml: html });
    };

    const handleQuestionInput = () => {
        const html = questionEditorRef.current?.innerHTML || "";
        updatePart(activePart, {
            questionHtml: html,
            questions: syncQuestions(html, currentPart.questions),
        });
    };

    const insertHtml = (target, html) => {
        const editor =
            target === "transcript" ? transcriptRef.current : questionEditorRef.current;
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

        if (target === "transcript") {
            handleTranscriptInput();
        } else {
            handleQuestionInput();
        }
    };

    const handleInsertTable = () => {
        const rows = Math.max(1, Number(tableConfig.rows) || 1);
        const cols = Math.max(1, Number(tableConfig.cols) || 1);
        const width = Math.min(100, Math.max(20, Number(tableConfig.width) || 100));
        const height = Math.max(0, Number(tableConfig.height) || 0);

        const headerCells = Array.from({ length: cols }, (_, index) => {
            return `<th>Header ${index + 1}</th>`;
        }).join("");

        const bodyRows = Array.from({ length: rows }, () => {
            const cells = Array.from({ length: cols }, () => "<td>Cell</td>").join("");
            return `<tr>${cells}</tr>`;
        }).join("");

        const heightStyle = height > 0 ? `height:${height}px;` : "";
        const tableHtml = `
<div class="listening-table-wrap" style="width:${width}%;${heightStyle}">
    <table class="listening-inline-table" style="width:100%;${heightStyle}">
        <thead>
            <tr>${headerCells}</tr>
        </thead>
        <tbody>
            ${bodyRows}
        </tbody>
    </table>
</div>
`;

        insertHtml(activeEditor, tableHtml);
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

    const handleClear = () => {
        parts.forEach((part) => {
            if (part.imagePreview) {
                URL.revokeObjectURL(part.imagePreview);
            }
        });
        setTitle("");
        setAudioFile(null);
        setActivePart(0);
        setParts(Array.from({ length: 4 }, () => createEmptyPart()));
        setShowPreview(false);
        setCopiedKey(null);
        if (transcriptRef.current) transcriptRef.current.innerHTML = "";
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
        if (!title || !audioFile) {
            alert("Iltimos, title va audio faylni kiriting!");
            return;
        }

        const updatedParts = parts.map((part, index) => {
            const transcriptHtml =
                index === activePart
                    ? transcriptRef.current?.innerHTML || part.transcriptHtml
                    : part.transcriptHtml;
            const questionHtml =
                index === activePart
                    ? questionEditorRef.current?.innerHTML || part.questionHtml
                    : part.questionHtml;
            const syncedQuestions = syncQuestions(questionHtml, part.questions);
            return {
                ...part,
                transcriptHtml,
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

        setParts(updatedParts);

        const payloadParts = updatedParts.map((part) => ({
            transcript: part.transcriptHtml,
            testText: part.questionHtml,
            questions: part.questions,
        }));

        const formData = new FormData();
        formData.append("title", title);
        formData.append("audio", audioFile);
        formData.append("parts", JSON.stringify(payloadParts));
        updatedParts.forEach((part, index) => {
            if (part.imageFile) {
                formData.append(`imagePart${index}`, part.imageFile);
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

                <div className="listening-row">
                    <div className="listening-field">
                        <label>Audio fayl</label>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => setAudioFile(e.target.files[0])}
                        />
                        {audioFile && <p className="file-note">{audioFile.name}</p>}
                    </div>
                </div>

                <div className="part-image-row">
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
                    <span className="toolbar-note">
                        Active editor: {activeEditor === "transcript" ? "Transcript" : "Questions"}
                    </span>
                </div>

                <div className="listening-editors">
                    <div className="editor-col">
                        <h3>Transcript (Part {activePart + 1})</h3>
                        <div
                            className="editor-box"
                            ref={transcriptRef}
                            contentEditable
                            onInput={handleTranscriptInput}
                            onFocus={() => setActiveEditor("transcript")}
                            data-placeholder="Listening transcriptni shu yerga yozing..."
                        />
                    </div>

                    <div className="editor-col">
                        <h3>Questions (Part {activePart + 1})</h3>
                        <div
                            className="editor-box"
                            ref={questionEditorRef}
                            contentEditable
                            onInput={handleQuestionInput}
                            onFocus={() => setActiveEditor("questions")}
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
                        {showPreview ? "Hide Answer Preview" : "Answer Preview"}
                    </button>
                </div>

                {showPreview && (
                    <Preview
                        html={currentPart.questionHtml}
                        answers={currentPart.questions.map((q) => q.value)}
                        onAnswersChange={handleAnswersChange}
                    />
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
