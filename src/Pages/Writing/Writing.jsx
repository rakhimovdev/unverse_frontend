import React, { useEffect, useRef, useState } from "react";
import axios from "../../Api/Axios";
import "./Writing.css";

const TASKS = [
    {
        key: "task1",
        label: "Task 1",
        subtitle: "Grafik, diagramma yoki rasm bilan yozish",
        imageRequired: true,
        textRequired: true,
        textLabel: "Task 1 matni (rasm ostiga)",
        textPlaceholder: "Task 1 matnini yozing..."
    },
    {
        key: "task2",
        label: "Task 2",
        subtitle: "Insho mavzusi bilan yozish",
        imageRequired: false,
        textRequired: true,
        textLabel: "Task 2 matni",
        textPlaceholder: "Task 2 matnini yozing..."
    }
];

const emptyForm = {
    topic: "",
    image: null,
    preview: null,
    taskText: ""
};

const INPUT_SNIPPET = `<input class="writing-inline-input" type="text" placeholder="Answer" />`;

function Writing() {
    const [activeTask, setActiveTask] = useState("task1");
    const [audience, setAudience] = useState("regular");
    const [forms, setForms] = useState({
        task1: { ...emptyForm },
        task2: { ...emptyForm }
    });
    const [errors, setErrors] = useState({ task1: "", task2: "" });
    const [loading, setLoading] = useState(false);
    const [tableConfig, setTableConfig] = useState({
        rows: 2,
        cols: 2,
        width: 100,
        height: 0
    });
    const task1EditorRef = useRef(null);
    const task2EditorRef = useRef(null);

    const updateForm = (taskKey, patch) => {
        setForms((prev) => ({
            ...prev,
            [taskKey]: {
                ...prev[taskKey],
                ...patch
            }
        }));
    };

    const handleTopicChange = (_taskKey, value) => {
        setForms((prev) => ({
            ...prev,
            task1: { ...prev.task1, topic: value },
            task2: { ...prev.task2, topic: value }
        }));
        setErrors((prev) => ({ ...prev, task1: "", task2: "" }));
    };

    useEffect(() => {
        if (
            task1EditorRef.current &&
            task1EditorRef.current.innerHTML !== forms.task1.taskText
        ) {
            task1EditorRef.current.innerHTML = forms.task1.taskText || "";
        }
    }, [forms.task1.taskText]);

    useEffect(() => {
        if (
            task2EditorRef.current &&
            task2EditorRef.current.innerHTML !== forms.task2.taskText
        ) {
            task2EditorRef.current.innerHTML = forms.task2.taskText || "";
        }
    }, [forms.task2.taskText]);

    const handleImageChange = (taskKey, e) => {
        const file = e.target.files[0] || null;
        setForms((prev) => {
            if (prev[taskKey].preview) {
                URL.revokeObjectURL(prev[taskKey].preview);
            }
            return {
                ...prev,
                [taskKey]: {
                    ...prev[taskKey],
                    image: file,
                    preview: file ? URL.createObjectURL(file) : null
                }
            };
        });
        setErrors((prev) => ({ ...prev, [taskKey]: "" }));
    };

    const handleEditorInput = (taskKey) => {
        const editor =
            taskKey === "task1" ? task1EditorRef.current : task2EditorRef.current;
        const html = editor?.innerHTML || "";
        updateForm(taskKey, { taskText: html });
        setErrors((prev) => ({ ...prev, [taskKey]: "" }));
    };

    const insertHtml = (taskKey, html) => {
        const editor =
            taskKey === "task1" ? task1EditorRef.current : task2EditorRef.current;
        if (!editor) return;

        editor.focus();

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            editor.insertAdjacentHTML("beforeend", html);
            handleEditorInput(taskKey);
            return;
        }

        const range = selection.getRangeAt(0);
        if (!editor.contains(range.commonAncestorContainer)) {
            editor.insertAdjacentHTML("beforeend", html);
            handleEditorInput(taskKey);
            return;
        }

        range.deleteContents();
        const fragment = range.createContextualFragment(html);
        range.insertNode(fragment);
        selection.removeAllRanges();
        const nextRange = document.createRange();
        nextRange.selectNodeContents(editor);
        nextRange.collapse(false);
        selection.addRange(nextRange);
        handleEditorInput(taskKey);
    };

    const handleInsertTable = (taskKey) => {
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
<div class="writing-table-wrap" style="width:${width}%;">
    <table class="writing-inline-table" style="width:100%;${heightStyle}">
        <thead>
            <tr>${headerCells}</tr>
        </thead>
        <tbody>
            ${bodyRows}
        </tbody>
    </table>
</div>
`;

        insertHtml(taskKey, tableHtml);
    };

    const handleInsertInput = (taskKey) => {
        insertHtml(taskKey, INPUT_SNIPPET);
    };

    const handleInsertImage = (taskKey) => {
        const url = window.prompt("Image URL");
        if (!url) return;
        insertHtml(
            taskKey,
            `<img class="writing-inline-image" src="${url}" alt="writing visual" />`
        );
    };

    const handleSubmit = async () => {
        const task1 = forms.task1;
        const task2 = forms.task2;
        const nextErrors = { task1: "", task2: "" };

        const sharedTopic = task1.topic.trim();
        if (!sharedTopic) {
            nextErrors.task1 = "Topic yozing!";
            nextErrors.task2 = "Topic yozing!";
        } else if (!task1.image) {
            nextErrors.task1 = "Task 1 uchun rasm tanlang!";
        } else if (!task1.taskText.trim()) {
            nextErrors.task1 = "Task 1 matnini yozing!";
        }

        if (!task2.taskText.trim()) {
            nextErrors.task2 = "Task 2 matnini yozing!";
        }

        if (nextErrors.task1 || nextErrors.task2) {
            setErrors(nextErrors);
            return;
        }

        setLoading(true);
        setErrors({ task1: "", task2: "" });

        const formData = new FormData();
        formData.append("task1Topic", sharedTopic);
        formData.append("task1Text", task1.taskText.trim());
        formData.append("task2Topic", sharedTopic);
        formData.append("task2Text", task2.taskText.trim());
        formData.append("topic", sharedTopic);
        formData.append("audience", audience);
        if (task1.image) {
            formData.append("image", task1.image);
        }

        try {
            await axios.post("/posts/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            alert("Saved!");

            if (task1.preview) {
                URL.revokeObjectURL(task1.preview);
            }
            if (task2.preview) {
                URL.revokeObjectURL(task2.preview);
            }
            setForms({ task1: { ...emptyForm }, task2: { ...emptyForm } });
            setAudience("regular");
        } catch (err) {
            console.error(err);
            setErrors({ task1: "Xatolik yuz berdi!", task2: "Xatolik yuz berdi!" });
        }

        setLoading(false);
    };

    return (
        <div className="writing-page">
            <div className="writing-hero">
                <div>
                    <p className="writing-eyebrow">IELTS Writing Upload</p>
                    <h1>Yangi writing testini qo'shing</h1>
                    <p className="writing-subtitle">
                        Task 1 va Task 2 ni bir test sifatida yuklang. Tugmalar orqali
                        tez almashing.
                    </p>
                </div>

                <div className="writing-hero-controls">
                    <div className="writing-type">
                        <label>Test turi</label>
                        <select
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                        >
                            <option value="regular">Oddiy test</option>
                            <option value="mooc">Mooc test uchun</option>
                        </select>
                    </div>
                    <div className="task-switch" role="tablist" aria-label="IELTS task switch">
                        {TASKS.map((task) => (
                            <button
                                key={task.key}
                                type="button"
                                className={`switch-btn ${activeTask === task.key ? "active" : ""}`}
                                onClick={() => setActiveTask(task.key)}
                                aria-pressed={activeTask === task.key}
                            >
                                {task.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div
                className={`task-carousel ${activeTask === "task2" ? "is-task2" : ""}`}
            >
                <div className="task-track">
                    {TASKS.map((task) => {
                        const current = forms[task.key];
                        return (
                            <div className="task-panel" key={task.key}>
                                <div className="panel-card">
                                    <div className="panel-left">
                                        <div className="panel-header">
                                            <h2>{task.label}</h2>
                                            <span className="panel-pill">{task.subtitle}</span>
                                        </div>

                                        <label className="field-label" htmlFor={`topic-${task.key}`}>
                                            {task.key === "task2"
                                                ? "Topic (Task 1 bilan bir xil)"
                                                : "Topic"}
                                        </label>
                                        <input
                                            id={`topic-${task.key}`}
                                            type="text"
                                            placeholder={
                                                task.key === "task2"
                                                    ? "Topic Task 1 bilan avtomatik bir xil bo'ladi"
                                                    : "Topic yozing..."
                                            }
                                            value={current.topic}
                                            onChange={(e) => handleTopicChange(task.key, e.target.value)}
                                        />

                                        <div className="hint">
                                            {task.imageRequired
                                                ? "Task 1 uchun rasm va rasm osti matni talab qilinadi."
                                                : "Task 2 uchun rasm o'rniga matn yoziladi."}
                                        </div>

                                        {task.textRequired && (
                                            <>
                                                <label
                                                    className="field-label"
                                                    htmlFor={`tasktext-${task.key}`}
                                                >
                                                    {task.textLabel}
                                                </label>
                                                <div className="writing-editor-toolbar">
                                                    <span className="toolbar-label">Insert:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInsertTable(task.key)}
                                                    >
                                                        Table
                                                    </button>
                                                    <div className="toolbar-field">
                                                        <label htmlFor={`rows-${task.key}`}>Rows</label>
                                                        <input
                                                            id={`rows-${task.key}`}
                                                            type="number"
                                                            min="1"
                                                            max="12"
                                                            value={tableConfig.rows}
                                                            onChange={(e) =>
                                                                setTableConfig((prev) => ({
                                                                    ...prev,
                                                                    rows: e.target.value
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="toolbar-field">
                                                        <label htmlFor={`cols-${task.key}`}>Cols</label>
                                                        <input
                                                            id={`cols-${task.key}`}
                                                            type="number"
                                                            min="1"
                                                            max="12"
                                                            value={tableConfig.cols}
                                                            onChange={(e) =>
                                                                setTableConfig((prev) => ({
                                                                    ...prev,
                                                                    cols: e.target.value
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="toolbar-field">
                                                        <label htmlFor={`width-${task.key}`}>Width %</label>
                                                        <input
                                                            id={`width-${task.key}`}
                                                            type="number"
                                                            min="20"
                                                            max="100"
                                                            value={tableConfig.width}
                                                            onChange={(e) =>
                                                                setTableConfig((prev) => ({
                                                                    ...prev,
                                                                    width: e.target.value
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div className="toolbar-field">
                                                        <label htmlFor={`height-${task.key}`}>
                                                            Height px
                                                        </label>
                                                        <input
                                                            id={`height-${task.key}`}
                                                            type="number"
                                                            min="0"
                                                            max="800"
                                                            value={tableConfig.height}
                                                            onChange={(e) =>
                                                                setTableConfig((prev) => ({
                                                                    ...prev,
                                                                    height: e.target.value
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInsertInput(task.key)}
                                                    >
                                                        Input
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInsertImage(task.key)}
                                                    >
                                                        Image URL
                                                    </button>
                                                </div>
                                                <div
                                                    id={`tasktext-${task.key}`}
                                                    className="task-editor"
                                                    ref={
                                                        task.key === "task1"
                                                            ? task1EditorRef
                                                            : task2EditorRef
                                                    }
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    role="textbox"
                                                    aria-multiline="true"
                                                    onInput={() => handleEditorInput(task.key)}
                                                    data-placeholder={task.textPlaceholder}
                                                />
                                            </>
                                        )}

                                        {task.imageRequired && (
                                            <div className="file-row">
                                                <input
                                                    id={`file-${task.key}`}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageChange(task.key, e)}
                                                />
                                                <label htmlFor={`file-${task.key}`} className="file-btn">
                                                    {current.image ? "Rasmni almashtirish" : "Rasm yuklash"}
                                                </label>
                                                <span className="file-name">
                                                    {current.image ? current.image.name : "Rasm tanlanmagan"}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="panel-right">
                                        {task.imageRequired ? (
                                            current.preview ? (
                                                <div className="task1-preview">
                                                    <img
                                                        src={current.preview}
                                                        alt="preview"
                                                        className="image-preview"
                                                    />
                                                    {current.taskText ? (
                                                        <div
                                                            className="task1-text-preview"
                                                            dangerouslySetInnerHTML={{
                                                                __html: current.taskText
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="task1-text-placeholder">
                                                            Matn hali yozilmagan
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="preview-placeholder">
                                                    <span>Preview ko'rinmayapti</span>
                                                    <p>Rasm yuklasangiz shu yerda ko'rinadi</p>
                                                </div>
                                            )
                                        ) : current.taskText ? (
                                            <div
                                                className="text-preview"
                                                dangerouslySetInnerHTML={{ __html: current.taskText }}
                                            />
                                        ) : (
                                            <div className="preview-placeholder">
                                                <span>Matn hali yozilmagan</span>
                                                <p>Task 2 matni shu yerda ko'rinadi</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {errors[task.key] && (
                                    <p className="error">{errors[task.key]}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <button onClick={handleSubmit} className="saveBtn" disabled={loading}>
                {loading ? "Saving..." : "Save Test"}
            </button>
        </div>
    );
}

export default Writing;
