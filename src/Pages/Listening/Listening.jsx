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

const TOKEN_BUTTONS = [
    { key: "input", label: "Input", token: "[[input]]" },
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
    const [imageFile, setImageFile] = useState(null);
    const [transcriptHtml, setTranscriptHtml] = useState("");
    const [questionHtml, setQuestionHtml] = useState("");
    const [questions, setQuestions] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);
    const [saving, setSaving] = useState(false);

    const transcriptRef = useRef(null);
    const questionEditorRef = useRef(null);

    const syncQuestions = (html, existingQuestions = []) => {
        const defs = getQuestionDefs(html);
        return defs.map((def, i) => ({
            value: existingQuestions[i]?.value || "",
            type: def.type,
        }));
    };

    useEffect(() => {
        if (transcriptRef.current && transcriptRef.current.innerHTML !== transcriptHtml) {
            transcriptRef.current.innerHTML = transcriptHtml;
        }
    }, [transcriptHtml]);

    useEffect(() => {
        if (questionEditorRef.current && questionEditorRef.current.innerHTML !== questionHtml) {
            questionEditorRef.current.innerHTML = questionHtml;
        }
    }, [questionHtml]);

    const handleTranscriptInput = () => {
        const html = transcriptRef.current?.innerHTML || "";
        setTranscriptHtml(html);
    };

    const handleQuestionInput = () => {
        const html = questionEditorRef.current?.innerHTML || "";
        setQuestionHtml(html);
        setQuestions((prev) => syncQuestions(html, prev));
    };

    const handleAnswersChange = (nextAnswers) => {
        setQuestions((prev) =>
            prev.map((q, i) => ({
                ...q,
                value: nextAnswers[i] || "",
            }))
        );
    };

    const handleClear = () => {
        setTitle("");
        setAudioFile(null);
        setImageFile(null);
        setTranscriptHtml("");
        setQuestionHtml("");
        setQuestions([]);
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

        const questionHtmlValue = questionEditorRef.current?.innerHTML || "";
        if (!questionHtmlValue.trim()) {
            alert("Savollar matnini kiriting!");
            return;
        }

        const syncedQuestions = syncQuestions(questionHtmlValue, questions);
        setQuestions(syncedQuestions);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("audio", audioFile);
        if (imageFile) formData.append("image", imageFile);
        formData.append("transcript", transcriptRef.current?.innerHTML || "");
        formData.append("testText", questionHtmlValue);
        formData.append("questions", JSON.stringify(syncedQuestions));

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

                    <div className="listening-field">
                        <label>Rasm (ixtiyoriy)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                        />
                        {imageFile && <p className="file-note">{imageFile.name}</p>}
                    </div>
                </div>

                {imageFile && (
                    <div className="image-preview">
                        <img src={URL.createObjectURL(imageFile)} alt="preview" />
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

                <div className="listening-editors">
                    <div className="editor-col">
                        <h3>Transcript (ixtiyoriy)</h3>
                        <div
                            className="editor-box"
                            ref={transcriptRef}
                            contentEditable
                            onInput={handleTranscriptInput}
                            data-placeholder="Listening transcriptni shu yerga yozing..."
                        />
                    </div>

                    <div className="editor-col">
                        <h3>Questions</h3>
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
                    <button type="button" onClick={() => setShowPreview((prev) => !prev)}>
                        {showPreview ? "Hide Answer Preview" : "Answer Preview"}
                    </button>
                </div>

                {showPreview && (
                    <Preview
                        html={questionHtml}
                        answers={questions.map((q) => q.value)}
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
