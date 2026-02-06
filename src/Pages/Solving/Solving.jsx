import { useEffect, useRef, useState } from "react";

import axios from "../../Api/Axios";

import "./Solving.css";

/* ================= PREVIEW ================= */

function Preview({ passage, testName }) {
    const [answers, setAnswers] = useState([]);

    const html = passage.testText || "";
  const markerRegex =
    /\[\[(input|select(?::yn)?|radio(?::[^\]]+)?|redio(?::[^\]]+)?)\]\]/g;

    const renderQuestionHTML = () => {
        let index = 0;
        let lastIndex = 0;
        const nodes = [];
        let match;

    while ((match = markerRegex.exec(html))) {
      const token = match[1].replace(/^redio/, "radio");

      nodes.push(
        <span
          key={`text-${index}`}
          dangerouslySetInnerHTML={{
            __html: html.slice(lastIndex, match.index),
          }}
        />
      );

      if (token === "input") {
        nodes.push(
          <input
            key={`input-${index}`}
            value={answers[index] || ""}
            onChange={(e) => {
                            const copy = [...answers];
                            copy[index] = e.target.value;
                            setAnswers(copy);
                        }}
                    />
                );
            }

      if (token.startsWith("select")) {
        nodes.push(
          <select
            key={`select-${index}`}
            value={answers[index] || ""}
            onChange={(e) => {
              const copy = [...answers];
              copy[index] = e.target.value;
              setAnswers(copy);
            }}
          >
            <option value=""></option>
            <option value="true">True</option>
            <option value="false">False</option>
            <option value="not given">Not Given</option>
          </select>
        );
      }

      if (token.startsWith("radio")) {
        const optionString = token.startsWith("radio:")
          ? token.slice("radio:".length)
          : "A|B|C|D";
        const options = optionString
          .split("|")
          .map((opt) => opt.trim())
          .filter(Boolean);

        nodes.push(
          <span key={`radio-${index}`}>
            {options.map((opt, optIndex) => (
              <label key={`radio-${index}-${optIndex}`}>
                <input
                  type="radio"
                  name={`radio-${index}`}
                  value={opt}
                  checked={answers[index] === opt}
                  onChange={(e) => {
                    const copy = [...answers];
                    copy[index] = e.target.value;
                    setAnswers(copy);
                  }}
                />
                {opt}
              </label>
            ))}
          </span>
        );
      }

      lastIndex = markerRegex.lastIndex;
      index++;
    }

        nodes.push(
            <span
                key="end"
                dangerouslySetInnerHTML={{
                    __html: html.slice(lastIndex),
                }}
            />
        );

        return nodes;
    };

    useEffect(() => {
        const count = (html.match(markerRegex) || []).length;
        setAnswers(Array(count).fill(""));
    }, [html]);

    return (
        <div className="readingform-blue">
            <header className="reading-header">
                <h1>{testName}</h1>
                <div className="timer">⏱ 60:00</div>
            </header>

            <div className="container-blue">
                <div
                    className="reading-half"
                    dangerouslySetInnerHTML={{
                        __html: passage.readingText,
                    }}
                />

                <div className="test-half">{renderQuestionHTML()}</div>
            </div>
        </div>
    );
}

/* ================= MAIN ================= */

const emptyPassage = {
    readingText: "",
    testText: "",
};

export default function CreateReadingTest() {
    const [testName, setTestName] = useState("");
    const [activePassage, setActivePassage] = useState(0);
    const [showPreview, setShowPreview] = useState(false);

    const [passages, setPassages] = useState([
        { ...emptyPassage },
        { ...emptyPassage },
        { ...emptyPassage },
    ]);

    const editorRef = useRef(null);
    const questionEditorRef = useRef(null);

    const [toolbar, setToolbar] = useState(null);
    const [toolbarPos, setToolbarPos] = useState({
        top: 0,
        left: 0,
    });

    const current = passages[activePassage];

    /* ================= ENTER FIX ================= */

    const handleEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();

            const sel = window.getSelection();
            if (!sel.rangeCount) return;

            const range = sel.getRangeAt(0);
            const br = document.createElement("br");

            range.insertNode(br);
            range.setStartAfter(br);
            range.setEndAfter(br);

            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    /* ================= SHORTCUTS ================= */

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === "b") {
            e.preventDefault();
            applyFormat("bold");
        }

        if (e.key === "Enter") {
            handleEnter(e);
        }
    };

    /* ================= SELECT ================= */

    const handleSelect = () => {
        setTimeout(() => {
            const sel = window.getSelection();
            if (!sel.rangeCount) return;

            const range = sel.getRangeAt(0);

            if (range.collapsed) {
                setToolbar(null);
                return;
            }

            const rect = range.getBoundingClientRect();

            setToolbar(true);

            setToolbarPos({
                top: rect.top - 40,
                left: rect.left,
            });
        }, 0);
    };

    /* ================= APPLY FORMAT ================= */

    const applyFormat = (type) => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const span = document.createElement("span");

        if (type === "bold") span.className = "highlight-bold";
        if (type === "large") span.className = "highlight-large";

        span.appendChild(range.extractContents());
        range.insertNode(span);

        sel.removeAllRanges();

        setToolbar(null);
    };

    /* ================= REMOVE FORMAT ================= */

    const removeFormat = () => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        let node = range.commonAncestorContainer;

        if (node.nodeType === 3) node = node.parentNode;

        if (
            node.classList &&
            (node.classList.contains("highlight-bold") ||
                node.classList.contains("highlight-large"))
        ) {
            const parent = node.parentNode;

            while (node.firstChild) {
                parent.insertBefore(node.firstChild, node);
            }

            parent.removeChild(node);
        }

        setToolbar(null);
    };

    /* ================= SAVE ================= */

    const saveCurrentPassage = () => {
        setPassages((prev) => {
            const copy = [...prev];

            copy[activePassage] = {
                readingText: editorRef.current.innerHTML,
                testText: questionEditorRef.current.innerHTML,
            };

            return copy;
        });
    };

    useEffect(() => {
        editorRef.current.innerHTML = current.readingText;
        questionEditorRef.current.innerHTML = current.testText;
    }, [activePassage]);

    const handleSave = async () => {
        saveCurrentPassage();

        await axios.post("/test/upload", {
            name: testName,
            passages,
        });

        alert("Saved");
    };

    /* ================= UI ================= */

    return (
        <div className="create-test-container">
            <h1>IELTS Reading Test Creator</h1>

            {/* PASSAGE TABS */}
            <div className="passage-tabs">
                {passages.map((_, i) => (
                    <button
                        key={i}
                        className={i === activePassage ? "active" : ""}
                        onClick={() => {
                            saveCurrentPassage();
                            setActivePassage(i);
                        }}
                    >
                        Passage {i + 1}
                    </button>
                ))}
            </div>

            {/* TEST NAME */}
            <div className="test-name-container">
                <label className="test-name-label">Test Name</label>

                <input
                    type="text"
                    className="test-name-input"
                    placeholder="Enter test name..."
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                />
            </div>

            {/* EDITORS */}
            <div className="split-screen">
                <div className="left">
                    <h3>Reading</h3>

                    <div
                        ref={editorRef}
                        className="reading-editor"
                        contentEditable
                        onMouseUp={handleSelect}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className="right">
                    <h3>Questions</h3>

                    <div
                        ref={questionEditorRef}
                        className="question-editor"
                        contentEditable
                        onMouseUp={handleSelect}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>

            {/* TOOLBAR */}
            {toolbar && (
                <div className="selection-buttons" style={toolbarPos}>
                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            removeFormat();
                        }}
                    >
                        Oddiy
                    </button>

                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            applyFormat("bold");
                        }}
                    >
                        Bold
                    </button>

                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            applyFormat("large");
                        }}
                    >
                        Large
                    </button>
                </div>
            )}

            {/* ACTIONS */}
            <div className="actions">
                <button className="save-btn" onClick={handleSave}>
                    Save
                </button>

                <button
                    className="preview-btn"
                    onClick={() => {
                        saveCurrentPassage();
                        setShowPreview(!showPreview);
                    }}
                >
                    Preview
                </button>
            </div>

            {/* PREVIEW */}
            {showPreview && <Preview testName={testName} passage={current} />}
        </div>
    );
}
