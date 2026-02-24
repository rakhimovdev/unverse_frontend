import axios from "../../Api/Axios";
import { useEffect, useState, useCallback } from "react";
import "./Students.css";
import "../WritingPage/App.css";

function WritingR({ timeSlotId }) {
    const [data, setData] = useState([]);
    const [selected, setSelected] = useState(null);
    const [activeTask, setActiveTask] = useState("task1");
    const [saving, setSaving] = useState({});
    const token = localStorage.getItem("token");

    const resolveImageSrc = (value) => {
        if (!value) return "";
        if (value.startsWith("http") || value.startsWith("data:")) return value;
        return `${axios.defaults.baseURL}uploads/${value}`;
    };

    // 📌 Barcha writing response'larni olish
    const fetchResponses = useCallback(() => {
        axios
            .get("/scorew/responses", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setData(res.data || []))
            .catch((err) => console.error(err.response?.data || err.message));
    }, [token]);

    // 📌 Response o‘chirish
    const deleteResponse = async (id) => {
        if (!window.confirm("Rostdan ham o‘chirmoqchimisiz?")) return;

        try {
            await axios.delete(`/scorew/responses/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // O‘chirilgandan keyin listni yangilash
            setData((prev) => prev.filter((s) => s._id !== id));
            if (selected?._id === id) {
                setSelected(null);
            }
        } catch (err) {
            console.error(err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchResponses();
    }, [fetchResponses]);

    const openViewer = (response) => {
        setSelected(response);
        setActiveTask("task1");
    };

    const closeViewer = () => {
        setSelected(null);
    };

    const updateScoreLocal = (id, value) => {
        setData((prev) =>
            prev.map((item) =>
                item._id === id ? { ...item, score: value } : item
            )
        );
    };

    const saveScore = async (id, rawScore) => {
        const score = String(rawScore ?? "").trim();
        if (!score) return;

        const response = data.find((item) => item._id === id);
        if (!response) return;

        const writingId = response.writingId?._id || response.writingId;
        const studentId = response.userId?._id || response.userId;
        if (!writingId || !studentId) return;

        setSaving((prev) => ({ ...prev, [id]: true }));
        try {
            await axios.post(
                "/scorew/add",
                { writingId, studentId, score },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error(err.response?.data || err.message);
        } finally {
            setSaving((prev) => ({ ...prev, [id]: false }));
        }
    };

    const getWritingData = (response) => {
        const writing = response?.writingId || {};
        const sharedTopic =
            writing.task1Topic || writing.topic || response?.task1Topic || "";

        const task1 = {
            topic: sharedTopic,
            image: writing.task1Image || writing.image || "",
            text:
                writing.task1Text ||
                (writing.task === "task1" ? writing.taskText : "") ||
                "",
            answer: response?.task1Answer || response?.answer || ""
        };

        const task2 = {
            topic: sharedTopic || writing.task2Topic || response?.task2Topic || "",
            text: writing.task2Text || writing.taskText || "",
            answer: response?.task2Answer || ""
        };

        return { task1, task2 };
    };

    const selectedData = selected ? getWritingData(selected) : null;

    const filteredData = timeSlotId
        ? data.filter((row) => {
              const user = row.userId;
              if (!user) return false;
              const single = user.timeSlot;
              const list = user.timeSlots || [];
              const inList = Array.isArray(list)
                  ? list.some((s) => (typeof s === "string" ? s === timeSlotId : s._id === timeSlotId))
                  : false;
              if (inList) return true;
              if (!single) return false;
              return typeof single === "string"
                  ? single === timeSlotId
                  : single._id === timeSlotId;
          })
        : data;

    return (
        <div className="students-container">
            {filteredData.length > 0 ? (
                <table className="students-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Lastname</th>
                            <th>Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((response, index) => (
                            <tr key={response._id}>
                                <td>{index + 1}</td>
                                <td>{response.userName || "N/A"}</td>
                                <td>{response.userLastname || "N/A"}</td>
                                <td>
                                    <input
                                        className="score-input"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Score"
                                        value={response.score || ""}
                                        disabled={!!saving[response._id]}
                                        onChange={(e) =>
                                            updateScoreLocal(response._id, e.target.value)
                                        }
                                        onBlur={(e) => saveScore(response._id, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                    />
                                </td>
                                <td>
                                    <button
                                        className="delete-btn1"
                                        onClick={() => deleteResponse(response._id)}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        className="view-btn"
                                        onClick={() => openViewer(response)}
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="loading">Loading...</p>
            )}

            {selected && selectedData && (
                <div className="writing-modal" onClick={closeViewer}>
                    <div
                        className="writing-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="writing-modal-close" onClick={closeViewer}>
                            ✕
                        </button>

                        <div className="writing-test-header">
                            <div>
                                <p className="writing-test-eyebrow">IELTS Writing</p>
                                <h1>Student Writing</h1>
                                <p className="writing-modal-meta">
                                    {selected.userName} {selected.userLastname}
                                </p>
                            </div>
                            <div className="writing-test-switch" role="tablist">
                                <button
                                    type="button"
                                    className={`writing-test-switch-btn ${
                                        activeTask === "task1" ? "active" : ""
                                    }`}
                                    onClick={() => setActiveTask("task1")}
                                    aria-pressed={activeTask === "task1"}
                                >
                                    Task 1
                                </button>
                                <button
                                    type="button"
                                    className={`writing-test-switch-btn ${
                                        activeTask === "task2" ? "active" : ""
                                    }`}
                                    onClick={() => setActiveTask("task2")}
                                    aria-pressed={activeTask === "task2"}
                                >
                                    Task 2
                                </button>
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
                                            <p className="writing-test-topic">
                                                {selectedData.task1.topic}
                                            </p>
                                            {selectedData.task1.image ? (
                                                <img
                                                    src={resolveImageSrc(selectedData.task1.image)}
                                                    alt="task 1"
                                                />
                                            ) : (
                                                <div className="no-image">
                                                    Bu task uchun rasm yo'q.
                                                </div>
                                            )}
                                            {selectedData.task1.text ? (
                                                <div className="task-text">
                                                    {selectedData.task1.text}
                                                </div>
                                            ) : (
                                                <div className="no-image">
                                                    Bu task uchun matn yo'q.
                                                </div>
                                            )}
                                        </div>
                                        <div className="writing-test-answer">
                                            <h3>Task 1 Answer</h3>
                                            <textarea
                                                value={selectedData.task1.answer}
                                                readOnly
                                                placeholder="Student javobi yo'q"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="writing-test-panel">
                                    <div className="writing-test-card">
                                        <div className="writing-test-prompt">
                                            <h2>Task 2</h2>
                                            <p className="writing-test-topic">
                                                {selectedData.task2.topic}
                                            </p>
                                            {selectedData.task2.text ? (
                                                <div className="task-text">
                                                    {selectedData.task2.text}
                                                </div>
                                            ) : (
                                                <div className="no-image">
                                                    Bu task uchun matn yo'q.
                                                </div>
                                            )}
                                        </div>
                                        <div className="writing-test-answer">
                                            <h3>Task 2 Answer</h3>
                                            <textarea
                                                value={selectedData.task2.answer}
                                                readOnly
                                                placeholder="Student javobi yo'q"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WritingR;
