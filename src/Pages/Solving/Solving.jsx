import React, { useState, useEffect } from "react";
import axios from "../../Api/Axios";
import "./Solving.css";

function FillInTheBlankTest() {
    const [testName, setTestName] = useState("");
    const [testText, setTestText] = useState(
        "2 + 2 = [[input]]\nBu gap rostmi? [[select]]\nYoki: [[input:text]]\nHa/Yo‘q savol: [[select:yn]]"
    );
    const [answers, setAnswers] = useState([]);
    const [readingText, setReadingText] = useState("");

    // ✅ Serverdan oxirgi testni olish
    useEffect(() => {
        axios
            .get("/user/tests/last")
            .then((res) => {
                const d = res.data || {};
                if (d.testText) setTestText(d.testText);
                if (d.name) setTestName(d.name);
                if (d.readingText) setReadingText(d.readingText);
                if (Array.isArray(d.questions)) {
                    setAnswers(
                        d.questions.map((q) => ({
                            value: q.value || "",
                            type: q.type || "text",
                            rawType: q.type || "text",
                        }))
                    );
                }
            })
            .catch(() => { });
    }, []);

    // [[input]], [[select]], [[input:type]], [[select:yn]] larni topish
    const inputMatches = [...testText.matchAll(/\[\[(input(?::(\w+))?|select(?::yn)?)\]\]/g)];
    const inputCount = inputMatches.length;

    // ✅ answers massivini inputlarga moslashtirish
    useEffect(() => {
        setAnswers((prev) => {
            const arr = [...prev];
            while (arr.length < inputCount) {
                const match = inputMatches[arr.length];
                let type = "text";
                let rawType = "text";

                if (match[1].startsWith("input")) {
                    type = match[2] || "text";
                    rawType = "input:" + (match[2] || "text");
                } else if (match[1].startsWith("select")) {
                    type = "select";       // backend faqat "select" ko‘radi
                    rawType = match[1];    // "select" yoki "select:yn"
                }

                arr.push({ value: "", type, rawType });
            }
            return arr.slice(0, inputCount);
        });
    }, [testText, inputCount]);

    // ✅ Javob o‘zgarishi
    const handleAnswerChange = (idx, value) => {
        setAnswers((prev) => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], value };
            return arr;
        });
    };

    // ✅ Tozalash tugmasi
    const handleClearInputs = () => {
        setTestName("");
        setReadingText("");
        setTestText("");
    };

    // ✅ Savolni inputlar bilan render qilish
    const renderQuestion = () => {
        const parts = testText.split(/\[\[(?:input(?::\w+)?|select(?::yn)?)\]\]/g);
        const elements = [];

        for (let i = 0; i < parts.length; i++) {
            elements.push(<span key={`text-${i}`}>{parts[i]}</span>);
            if (i < inputCount) {
                const match = inputMatches[i];
                let type = "text";
                let rawType = "text";

                if (match[1].startsWith("input")) {
                    type = match[2] || "text";
                    rawType = "input:" + (match[2] || "text");
                } else if (match[1].startsWith("select")) {
                    type = "select";
                    rawType = match[1];
                }

                if (type === "text") {
                    elements.push(
                        <input
                            key={`input-text-${i}`}
                            type="text"
                            className="blank-input"
                            value={answers[i]?.value || ""}
                            onChange={(e) => handleAnswerChange(i, e.target.value)}
                            placeholder="Javob"
                        />
                    );
                } else if (type === "select") {
                    if (rawType === "select:yn") {
                        // ✅ Yes / No / Not Given
                        elements.push(
                            <select
                                key={`input-select-yn-${i}`}
                                value={answers[i]?.value || ""}
                                onChange={(e) => handleAnswerChange(i, e.target.value)}
                                className="choice-select"
                            >
                                <option value="">-- Tanlang --</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                <option value="not given">Not Given</option>
                            </select>
                        );
                    } else {
                        // ✅ True / False / Not Given
                        elements.push(
                            <select
                                key={`input-select-${i}`}
                                value={answers[i]?.value || ""}
                                onChange={(e) => handleAnswerChange(i, e.target.value)}
                                className="choice-select"
                            >
                                <option value="">-- Tanlang --</option>
                                <option value="true">True</option>
                                <option value="false">False</option>
                                <option value="not given">Not Given</option>
                            </select>
                        );
                    }
                }
            }
        }

        return elements;
    };

    // ✅ Testni serverga yuborish
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/test/upload", {
                name: testName,
                testText,
                questions: answers.map((ans, idx) => ({
                    id: idx + 1,
                    value: ans.value,
                    type: ans.type, // faqat "text" yoki "select" boradi
                })),
                readingText,
            });
            alert("✅ Test va javoblar yuklandi!");
        } catch (err) {
            alert("❌ Xatolik: " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="container">
            <h2>To‘ldirish uchun savol</h2>

            <input
                type="text"
                className="test-name-input"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Test nomini kiriting"
                style={{ width: "100%", marginBottom: "10px", padding: "8px", fontSize: "16px" }}
            />

            <label style={{ display: "block", marginTop: 8, marginBottom: 6 }}>Reading matni:</label>
            <textarea
                className="reading-textarea"
                rows={6}
                value={readingText}
                onChange={(e) => setReadingText(e.target.value)}
                placeholder="Bu yerga reading matnini yozing..."
                style={{
                    width: "100%",
                    margin: "6px 0 12px",
                    padding: "8px",
                    fontSize: "16px",
                    background: "#f9f9f9",
                }}
            />

            <label style={{ display: "block", marginTop: 8, marginBottom: 6 }}>Savol matni:</label>
            <textarea
                className="test-textarea"
                rows={5}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Savolingizni yozing va [[input]] yoki [[select]], [[select:yn]] joyiga javob uchun maydon qo‘shing"
                style={{ width: "100%", marginBottom: "10px", padding: "8px", fontSize: "16px" }}
            />

            <div className="question-preview" style={{ whiteSpace: "pre-wrap" }}>
                <strong>Ko‘rinishi:</strong>
                <div className="view" style={{ marginTop: "1rem" }}>{renderQuestion()}</div>
            </div>

            <form onSubmit={handleSubmit}>
                <button
                    type="button"
                    onClick={handleClearInputs}
                    className="clear-btn"
                    style={{ marginTop: 12, marginRight: 10 }}
                >
                    Tozalash
                </button>

                <button type="submit" className="upload-btn" style={{ marginTop: 12 }}>
                    Yuborish
                </button>
            </form>
        </div>
    );
}

export default FillInTheBlankTest;
