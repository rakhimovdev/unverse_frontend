import React, { useState } from "react";
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

function Writing() {
    const [activeTask, setActiveTask] = useState("task1");
    const [forms, setForms] = useState({
        task1: { ...emptyForm },
        task2: { ...emptyForm }
    });
    const [errors, setErrors] = useState({ task1: "", task2: "" });
    const [loading, setLoading] = useState(false);

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

    const handleTextChange = (taskKey, value) => {
        updateForm(taskKey, { taskText: value });
        setErrors((prev) => ({ ...prev, [taskKey]: "" }));
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
                                                <textarea
                                                    id={`tasktext-${task.key}`}
                                                    className="task-textarea"
                                                    rows={6}
                                                    placeholder={task.textPlaceholder}
                                                    value={current.taskText}
                                                    onChange={(e) =>
                                                        handleTextChange(task.key, e.target.value)
                                                    }
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
                                                        <div className="task1-text-preview">
                                                            {current.taskText}
                                                        </div>
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
                                            <div className="text-preview">
                                                <p>{current.taskText}</p>
                                            </div>
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
