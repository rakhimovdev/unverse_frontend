import React, { useCallback, useEffect, useState } from "react";

import { FaClock } from "react-icons/fa6";
import { useParams } from "react-router-dom";

import axios from "../../Api/Axios";

import "./ReadingForm.css";

function ReadingForm() {
    const { testId } = useParams();

    /* ================= STATE ================= */

    const [test, setTest] = useState(null);
    const [activePassage, setActivePassage] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [secondsLeft, setSecondsLeft] = useState(3600);

    /* ================= LOAD TEST ================= */

    useEffect(() => {
        axios
            .get(`/test/${testId}`)
            .then((res) => {
                const data = res.data;
                setTest(data);

        const regex =
          /\[\[(input|select(?::yn)?|radio(?::[^\]]+)?|redio(?::[^\]]+)?)\]\]/g;

                const answers = data.passages.map((p) => {
                    const count = (p.testText.match(regex) || []).length;
                    return Array(count).fill("");
                });

                setUserAnswers(answers);
            })
            .catch((err) => {
                console.log("LOAD ERROR:", err.response?.data || err);
            });
    }, [testId]);

    /* ================= TIMER ================= */

    useEffect(() => {
        if (secondsLeft <= 0) return;

        const timer = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [secondsLeft]);

    /* ================= FORMAT TIME ================= */

    const formatTime = (sec) => {
        const min = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    /* ================= ANSWER CHANGE ================= */

    const handleChange = (value, index) => {
        setUserAnswers((prev) => {
            const copy = [...prev];
            copy[activePassage][index] = value;
            return copy;
        });
    };

    /* ================= SUBMIT ================= */

    const handleSubmit = useCallback(() => {
        console.log("Submitted answers:", userAnswers[activePassage]);
        alert(`Passage ${activePassage + 1} submitted`);
    }, [userAnswers, activePassage]);

    /* ================= SAFE CHECK ================= */

    if (!test) return <p>Loading...</p>;

    const passage = test.passages[activePassage];

    /* ================= PARSE TEST TEXT ================= */

  const regex =
    /\[\[(input|select(?::yn)?|radio(?::[^\]]+)?|redio(?::[^\]]+)?)\]\]/g;
    const parts = [];
    const types = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(passage.testText))) {
        parts.push(passage.testText.slice(lastIndex, match.index));
    types.push(match[1].replace(/^redio/, "radio"));
        lastIndex = regex.lastIndex;
    }

    parts.push(passage.testText.slice(lastIndex));

    /* ================= UI ================= */

    return (
        <div className="readingform-blue">
            {/* HEADER */}
            <header className="reading-header">
                <h1>{test.name}</h1>

                <div className="timer">
                    <FaClock />
                    {formatTime(secondsLeft)}
                </div>
            </header>

            {/* PASSAGE TABS */}
            <div className="passage-tabs">
                {test.passages.map((_, i) => (
                    <button
                        key={i}
                        className={activePassage === i ? "active" : ""}
                        onClick={() => setActivePassage(i)}
                    >
                        Passage {i + 1}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="container-blue">
                {/* READING TEXT */}
                <div
                    className="reading-half"
                    dangerouslySetInnerHTML={{ __html: passage.readingText }}
                />

                {/* QUESTIONS */}
                <div className="test-half">
                    {parts.map((text, index) => (
                        <span key={index}>
                            <span dangerouslySetInnerHTML={{ __html: text }} />

                            {types[index] === "input" && (
                                <input
                                    value={userAnswers[activePassage]?.[index] || ""}
                                    onChange={(e) => handleChange(e.target.value, index)}
                                />
                            )}

              {types[index]?.startsWith("select") && (
                <select
                  value={userAnswers[activePassage]?.[index] || ""}
                  onChange={(e) => handleChange(e.target.value, index)}
                >
                  <option value=""></option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                  <option value="not given">Not Given</option>
                </select>
              )}

              {types[index]?.startsWith("radio") && (() => {
                const optionString = types[index].startsWith("radio:")
                  ? types[index].slice("radio:".length)
                  : "A|B|C|D";
                const options = optionString
                  .split("|")
                  .map((opt) => opt.trim())
                  .filter(Boolean);

                return (
                  <span>
                    {options.map((opt, optIndex) => (
                      <label key={`radio-${index}-${optIndex}`}>
                        <input
                          type="radio"
                          name={`radio-${index}`}
                          value={opt}
                          checked={userAnswers[activePassage]?.[index] === opt}
                          onChange={(e) =>
                            handleChange(e.target.value, index)
                          }
                        />
                        {opt}
                      </label>
                    ))}
                  </span>
                );
              })()}
                        </span>
                    ))}

                    <br />

                    <button className="submit-btn" onClick={handleSubmit}>
                        Submit Passage {activePassage + 1}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReadingForm;
