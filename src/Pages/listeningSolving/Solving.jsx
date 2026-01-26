import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../Api/Axios";
import "./Solving.css";

function ListeningTest() {
    const { id } = useParams();
    const [test, setTest] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const imgRef = useRef(null);

    // 🔹 Testni olish
    useEffect(() => {
        const fetchTest = async () => {
            try {
                const res = await axios.get(`/testl/info/${id}`);
                if (!res.data) {
                    setError("Test ma'lumotlari topilmadi.");
                    return;
                }
                setTest(res.data);
                setUserAnswers(Array((res.data.questions || []).length).fill(""));
            } catch (err) {
                console.error("Test yuklashda xatolik:", err);
                setError("Test yuklashda xatolik yuz berdi.");
            }
        };
        fetchTest();
    }, [id]);

    const handleChange = (val, index) => {
        const updated = [...userAnswers];
        updated[index] = val;
        setUserAnswers(updated);
    };

    const normalizeAnswer = (ans) => {
        ans = ans.trim().toLowerCase();
        if (ans === "yes") return "true";
        if (ans === "no") return "false";
        return ans;
    };

    // 🔹 Javoblarni tekshirish
    const handleSubmit = useCallback(async () => {
        if (!test?.questions || results) return;

        const check = userAnswers.map((ans, idx) => {
            const correct = normalizeAnswer(
                test.questions[idx]?.value?.trim().toLowerCase() || ""
            );
            return normalizeAnswer(ans) === correct;
        });

        setResults(check);
        const score = check.filter((r) => r).length;

        try {
            await axios.post(
                "/scorel/add",
                { listeningId: test._id, score },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            console.log("Score saqlandi ✅");
        } catch (err) {
            console.error("Score saqlashda xato:", err.response?.data || err);
        }
    }, [test, userAnswers, results]);

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!test) return <p>Loading test...</p>;

    return (
        <div className="listeningform">
            <header>
                <h1>{test.title || "Listening Test"}</h1>
                <Link to="/listen" className="menu-item">
                    All IELTS Listening Tests
                </Link>
            </header>

            {/* 🔹 Audio + Rasm yonma-yon */}
            <div className="media-section">
                {/* Audio */}
                <div className="audio-player">
                    <audio controls onEnded={handleSubmit}>
                        <source src={test.audioUrl} type="audio/mpeg" />
                        Sizning brauzeringiz audio qo‘llab-quvvatlamaydi.
                    </audio>
                </div>

                {/* Rasm + Inputlar */}
                {test.imageUrl && (
                    <div className="test-image" style={{ position: "relative" }}>
                        <img
                            ref={imgRef}
                            src={test.imageUrl}
                            alt="listening"
                        />

                        {(test.questions || []).map((q, i) => (
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
                                        value={userAnswers[i] || ""}
                                        onChange={(e) => handleChange(e.target.value, i)}
                                        disabled={!!results}
                                        style={{ width: "100%" }}
                                    />
                                ) : q.type === "yn" ? (
                                    <select
                                        value={userAnswers[i] || ""}
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
                                        value={userAnswers[i] || ""}
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
                                    (results[i] ? (
                                        <span style={{ color: "green", marginLeft: "8px" }}>✅</span>
                                    ) : (
                                        <span style={{ color: "red", marginLeft: "8px", backgroundColor: "#ccccccd5" }}>
                                            ❌ To‘g‘ri javob: <b>{test.questions[i]?.value}</b>
                                        </span>
                                    ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!results && (
                <button className="submit-btn" onClick={handleSubmit}>
                    Javobni yuborish
                </button>
            )}
        </div>
    );
}

export default ListeningTest;
