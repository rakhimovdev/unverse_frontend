import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../../Api/Axios";
import "./App.css";

const TASKS = [
    { key: "task1", label: "Task 1" },
    { key: "task2", label: "Task 2" }
];

function Index() {
    const { id } = useParams();
    const [test, setTest] = useState(null);
    const [activeTask, setActiveTask] = useState("task1");
    const [answers, setAnswers] = useState({ task1: "", task2: "" });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60 * 60);

    useEffect(() => {
        const getTest = async () => {
            try {
                const res = await axios.get(`/posts/${id}`);
                setTest(res.data);
            } catch (error) {
                console.error("GET test error:", error);
            }
        };

        getTest();
    }, [id]);

    useEffect(() => {
        setTimeLeft(60 * 60);
    }, [id]);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const intervalId = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600)
            .toString()
            .padStart(2, "0");
        const minutes = Math.floor((totalSeconds % 3600) / 60)
            .toString()
            .padStart(2, "0");
        const seconds = Math.floor(totalSeconds % 60)
            .toString()
            .padStart(2, "0");

        return `${hours}:${minutes}:${seconds}`;
    };

    const countWords = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return 0;
        return trimmed.split(/\s+/).length;
    };

    const wordCounts = useMemo(
        () => ({
            task1: countWords(answers.task1),
            task2: countWords(answers.task2)
        }),
        [answers.task1, answers.task2]
    );

    const handleSubmit = async () => {
        if (!answers.task1.trim() || !answers.task2.trim()) {
            setError("Ikkala task uchun javob yozing!");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await axios.post(
                "/scorew/response",
                {
                    writingId: test._id,
                    task1Answer: answers.task1.trim(),
                    task2Answer: answers.task2.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            alert("Saved!");
        } catch (err) {
            console.error("Response saqlashda xato:", err.response?.data || err);
            setError("Javobni saqlashda xatolik bo'ldi!");
        }

        setSaving(false);
    };

    if (!test) return <h2>Loading...</h2>;

    const sharedTopic = test.task1Topic || test.topic || "";

    const task1 = {
        topic: sharedTopic,
        image: test.task1Image || test.image || "",
        text: test.task1Text || (test.task === "task1" ? test.taskText : "") || ""
    };

    const task2 = {
        topic: sharedTopic,
        text: test.task2Text || test.taskText || ""
    };

    return (
        <div className="writing-test-page">
            <div className="writing-test-header">
                <div>
                    <p className="writing-test-eyebrow">IELTS Writing</p>
                    <h1>Writing Test</h1>
                </div>
                <div className="writing-test-meta">
                    <div
                        className={`writing-test-timer ${
                            timeLeft === 0 ? "is-done" : ""
                        }`}
                        aria-live="polite"
                    >
                        <span className="writing-test-timer-label">Time left</span>
                        <span className="writing-test-timer-value">
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <div className="writing-test-wordcounts">
                        <span>Task 1: {wordCounts.task1} words</span>
                        <span>Task 2: {wordCounts.task2} words</span>
                    </div>
                </div>
                <div className="writing-test-switch" role="tablist" aria-label="Task switch">
                    {TASKS.map((task) => (
                        <button
                            key={task.key}
                            type="button"
                            className={`writing-test-switch-btn ${
                                activeTask === task.key ? "active" : ""
                            }`}
                            onClick={() => setActiveTask(task.key)}
                            aria-pressed={activeTask === task.key}
                        >
                            {task.label}
                        </button>
                    ))}
                </div>
            </div>

            <div
                className={`writing-test-carousel ${
                    activeTask === "task2" ? "is-task2" : ""
                }`}
            >
                <div className="writing-test-track">
                    <div className="writing-test-panel">
                        <div className="writing-test-card">
                            <div className="writing-test-prompt">
                                <h2>Task 1</h2>
                                <p className="writing-test-topic">{task1.topic}</p>
                                {task1.image ? (
                                    <img
                                        src={`${axios.defaults.baseURL}uploads/${task1.image}`}
                                        alt="task 1"
                                    />
                                ) : (
                                    <div className="no-image">Bu task uchun rasm yo'q.</div>
                                )}
                                {task1.text ? (
                                    <div
                                        className="task-text"
                                        dangerouslySetInnerHTML={{ __html: task1.text }}
                                    />
                                ) : (
                                    <div className="no-image">Bu task uchun matn yo'q.</div>
                                )}
                            </div>
                            <div className="writing-test-answer">
                                <h3>Task 1 Answer</h3>
                                <div className="writing-test-answer-meta">
                                    <span className="writing-test-wordcount">
                                        {wordCounts.task1} words
                                    </span>
                                </div>
                                <textarea
                                    value={answers.task1}
                                    onChange={(e) => {
                                        setAnswers((prev) => ({
                                            ...prev,
                                            task1: e.target.value
                                        }));
                                        if (error) setError("");
                                    }}
                                    placeholder="Task 1 javobingiz..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="writing-test-panel">
                        <div className="writing-test-card">
                            <div className="writing-test-prompt">
                                <h2>Task 2</h2>
                                <p className="writing-test-topic">{task2.topic}</p>
                                {task2.text ? (
                                    <div
                                        className="task-text"
                                        dangerouslySetInnerHTML={{ __html: task2.text }}
                                    />
                                ) : (
                                    <div className="no-image">Bu task uchun matn yo'q.</div>
                                )}
                            </div>
                            <div className="writing-test-answer">
                                <h3>Task 2 Answer</h3>
                                <div className="writing-test-answer-meta">
                                    <span className="writing-test-wordcount">
                                        {wordCounts.task2} words
                                    </span>
                                </div>
                                <textarea
                                    value={answers.task2}
                                    onChange={(e) => {
                                        setAnswers((prev) => ({
                                            ...prev,
                                            task2: e.target.value
                                        }));
                                        if (error) setError("");
                                    }}
                                    placeholder="Task 2 javobingiz..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && <p className="writing-test-error">{error}</p>}

            <button
                onClick={handleSubmit}
                className="writing-test-save"
                disabled={saving}
            >
                {saving ? "Saving..." : "Save Both Answers"}
            </button>
        </div>
    );
}

export default Index;
