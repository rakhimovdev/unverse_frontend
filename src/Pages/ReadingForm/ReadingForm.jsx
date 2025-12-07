import React, { useState, useEffect, useRef } from "react";
import "./ReadingForm.css";
import { FaClock } from "react-icons/fa6";
import { Link, useParams } from "react-router-dom";
import axios from "../../Api/Axios";

function ReadingForm() {
    const { testId } = useParams();
    const [open, setOpen] = useState(false);
    const [test, setTest] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [secondsLeft, setSecondsLeft] = useState(1200);
    const textRef = useRef(null);
    const [buttonPos, setButtonPos] = useState(null);

    const toggleDropdown = () => setOpen(!open);
    // console.log(data)

    // Barcha testlarni olish
    useEffect(() => {
        const getApi = async () => {
            try {
                const res = await axios.get(`/test/all`);
                setData(res.data);
            } catch {
                console.error("xato");
            }
        };
        getApi();
    }, []);

    // Bitta testni olish
    // Bitta testni olish
    useEffect(() => {
        axios
            .get(`/test/${testId}`)
            .then((res) => {
                if (!res.data) {
                    setError("Test ma'lumotlari topilmadi.");
                    return;
                }

                const testData = res.data;
                setTest(testData);

                // === TEST MODE => TIMER ===
                if (testData.mode === "full") {
                    setSecondsLeft(3600); // 60 minut
                } else {
                    setSecondsLeft(1200); // 20 minut
                }
                // ===========================

                // input/select joylari bo‘yicha javoblar massivini yaratish
                const answerCount =
                    testData.testText.match(/\[\[(input|select(?::yn)?)\]\]/g) || [];

                setUserAnswers(Array(answerCount.length).fill(""));
            })
            .catch(() => {
                setError("Test yuklashda xatolik yuz berdi.");
            });
    }, [testId]);


    // Timer
    useEffect(() => {
        if (results) return;
        if (secondsLeft <= 0) {
            handleSubmit();
            return;
        }
        const timerId = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timerId);
    }, [secondsLeft, results]);

    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const handleChange = (val, index) => {
        const updated = [...userAnswers];
        updated[index] = val;
        setUserAnswers(updated);
    };

    const normalizeAnswer = (ans) => {
        ans = ans.trim().toLowerCase();
        if (ans === "yes") return "true";   // yes → true
        if (ans === "no") return "false";   // no → false
        return ans;
    };

    const handleSubmit = async () => {
        if (!test?.questions) return;
        const check = userAnswers.map((ans, idx) => {
            const correct = normalizeAnswer(
                test.questions[idx]?.value?.trim().toLowerCase() || ""
            );
            return normalizeAnswer(ans) === correct;
        });
        setResults(check);
        const score = check.filter((r) => r).length;
        console.log(localStorage.getItem("token"))

        try {
            await axios.post(
                "/score/add",
                { testId: test._id, score },
                {

                    headers: {

                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            console.log("Score saqlandi ✅");
            console.log(localStorage.getItem("token"))
        } catch (err) {
            console.error("Score saqlashda xato:", err.response?.data || err);
        }

    };

    // Highlight funksiyasi
    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setButtonPos(null);
            return;
        }
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setButtonPos({
            top: rect.top + window.scrollY - 50,
            left: rect.left + window.scrollX,
        });
    };

    const handleHighlight = (color) => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const span = document.createElement("span");
        span.className = `highlighted ${color}`;
        span.textContent = selection.toString();

        range.deleteContents();
        range.insertNode(span);

        selection.removeAllRanges();
        setButtonPos(null);
    };

    const handleRemove = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const selectedNode = range.startContainer.parentNode;

        if (
            selectedNode.tagName === "SPAN" &&
            selectedNode.classList.contains("highlighted")
        ) {
            const textNode = document.createTextNode(selectedNode.textContent);
            selectedNode.replaceWith(textNode);
        }

        selection.removeAllRanges();
        setButtonPos(null);
    };

    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!test) return <p>Loading test...</p>;

    // testText dan input/select joylarini ajratib olish
    const regex = /\[\[(input|select(?::yn)?)\]\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    const inputTypes = [];

    while ((match = regex.exec(test.testText)) !== null) {
        parts.push(test.testText.substring(lastIndex, match.index));
        inputTypes.push(match[1]); // input, select, select:yn
        lastIndex = regex.lastIndex;
    }
    parts.push(test.testText.substring(lastIndex));

    return (
        <div className="readingform">
            <header>
                <h1>{test.name || "Test"}</h1>
                <h1>
                    <FaClock /> {formatTime(secondsLeft)}
                </h1>
                <div className="bar-icon" onClick={toggleDropdown}>
                    &#9776;
                </div>
                {open && (
                    <div className="dropdown-menu">
                        <button className="menu-item">Enter Focus Mode</button>
                        <Link to="/read" className="menu-item">
                            All IELTS Reading Tests
                        </Link>
                        <Link to="/" className="menu-item">
                            Go to Homepage
                        </Link>
                    </div>
                )}
            </header>

            <div className="contain">
                <div className="reading-half">
                    <div
                        className="reading_text"
                        ref={textRef}
                        onMouseUp={handleMouseUp}
                    >
                        {data.length > 0 ? (
                            <p>{test.readingText}</p>
                        ) : (
                            <p style={{ color: "orange" }}>Reading matni mavjud emas</p>
                        )}
                    </div>
                </div>

                <div className="test-half">
                    {parts.map((part, i) => (
                        <div key={i} style={{ marginBottom: "8px" }}>
                            {part}
                            {i < inputTypes.length &&
                                (inputTypes[i] === "input" ? (
                                    <input
                                        type="text"
                                        value={userAnswers[i] || ""}
                                        onChange={(e) => handleChange(e.target.value, i)}
                                        disabled={!!results}
                                    />
                                ) : inputTypes[i] === "select:yn" ? (
                                    <select
                                        value={userAnswers[i] || ""}
                                        onChange={(e) => handleChange(e.target.value, i)}
                                        disabled={!!results}
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
                                    >
                                        <option value="">-- Tanlang --</option>
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                        <option value="not given">Not Given</option>
                                    </select>
                                ))}

                            {results &&
                                (results[i] ? (
                                    <span style={{ color: "green", marginLeft: "8px" }}>✅</span>
                                ) : (
                                    <span style={{ color: "red", marginLeft: "8px" }}>
                                        ❌ To‘g‘ri javob:{" "}
                                        <b>{test.questions[i]?.value}</b>
                                    </span>
                                ))}
                        </div>
                    ))}

                    {!results && (
                        <button className="submit-btn" onClick={handleSubmit}>
                            Javobni yuborish
                        </button>
                    )}
                </div>

                {buttonPos && (
                    <div
                        className="highlight-toolbar"
                        style={{ top: buttonPos.top, left: buttonPos.left }}
                    >
                        <button
                            className="highlight-blue"
                            onClick={() => handleHighlight("blue")}
                        >
                            A
                        </button>
                        <button
                            className="highlight-green"
                            onClick={() => handleHighlight("green")}
                        >
                            A
                        </button>
                        <button
                            className="highlight-pink"
                            onClick={() => handleHighlight("pink")}
                        >
                            A
                        </button>
                        <button className="highlight-remove" onClick={handleRemove}>
                            🩹
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReadingForm;
