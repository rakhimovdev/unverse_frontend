import React, { useState, useRef } from "react";
import axios from "../../Api/Axios";
import "./Listening.css";

function ListeningTest() {
    const [title, setTitle] = useState("");
    const [file, setFile] = useState(null); // audio
    const [image, setImage] = useState(null); // rasm
    const [inputs, setInputs] = useState([]); // inputlar
    const [draggingId, setDraggingId] = useState(null);
    const [resizingId, setResizingId] = useState(null); // resize uchun
    const offsetRef = useRef({ x: 0, y: 0 });
    const startWidthRef = useRef(0);

    // Rasm ref
    const imageRef = useRef(null);

    // Input qo‘shish
    const handleAddInput = () => {
        setInputs(prev => [
            ...prev,
            { id: Date.now(), value: "", top: 50 + prev.length * 40, left: 50, width: 120 }
        ]);
    };

    // Input qiymatini o‘zgartirish
    const handleAnswerChange = (id, value) => {
        setInputs(prev =>
            prev.map(inp => (inp.id === id ? { ...inp, value } : inp))
        );
    };

    // Inputni o‘chirish
    const handleDeleteInput = (id) => {
        setInputs(prev => prev.filter(inp => inp.id !== id));
    };

    // Drag boshlanishi
    const handleMouseDown = (id, e) => {
        if (e.target.classList.contains("resizer")) return; // resize bilan aralashmasin
        const rect = imageRef.current.getBoundingClientRect();
        setDraggingId(id);
        offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    // Resize boshlanishi
    const handleResizeMouseDown = (id, e) => {
        e.stopPropagation();
        setResizingId(id);
        offsetRef.current.x = e.clientX;
        const inp = inputs.find(inp => inp.id === id);
        startWidthRef.current = inp ? inp.width : 120;
    };

    // Drag va resize davomida
    const handleMouseMove = (e) => {
        const rect = imageRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Drag
        if (draggingId) {
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            setInputs(prev =>
                prev.map(inp =>
                    inp.id === draggingId
                        ? { ...inp, left: mouseX - offsetRef.current.x + inp.width / 2, top: mouseY - offsetRef.current.y + 15 }
                        : inp
                )
            );
        }

        // Resize
        if (resizingId) {
            const deltaX = e.clientX - offsetRef.current.x;
            setInputs(prev =>
                prev.map(inp =>
                    inp.id === resizingId
                        ? { ...inp, width: Math.max(30, startWidthRef.current + deltaX) } // minimal width 30px
                        : inp
                )
            );
        }
    };

    // Drag yoki resize tugagach
    const handleMouseUp = () => {
        setDraggingId(null);
        setResizingId(null);
    };

    // Tozalash
    const handleClear = () => {
        setTitle("");
        setFile(null);
        setImage(null);
        setInputs([]);
    };

    // Full submit
    const handleSubmitFull = async () => {
        if (!title || !file || !image) {
            alert("Iltimos, title, audio va rasm yuklang!");
            return;
        }

        const rect = imageRef.current?.getBoundingClientRect();
        if (!rect) return;

        const formData = new FormData();
        formData.append("title", title);
        formData.append("audio", file);
        formData.append("image", image);
        formData.append(
            "questions",
            JSON.stringify(
                inputs.map((inp) => ({
                    value: inp.value,
                    type: inp.type || "text",
                    // 🔹 Rasmga nisbatan foizlarda saqlash
                    top: inp.top / rect.height,
                    left: inp.left / rect.width,
                    width: inp.width / rect.width,
                }))
            )
        );

        try {
            await axios.post("/testl/full", formData, { headers: { "Content-Type": "multipart/form-data" } });
            alert("✅ Listening test saqlandi!");
            handleClear();
        } catch (err) {
            alert("❌ Xatolik: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            <h2>🎧 Listening Test (Image + Drag & Resize Inputs)</h2>

            <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Listening test nomi"
                style={{ width: "100%", marginBottom: "10px", padding: "8px", fontSize: "16px" }}
            />

            <label>Audio fayl:</label>
            <input
                type="file"
                accept="audio/*"
                onChange={e => setFile(e.target.files[0])}
                style={{ marginBottom: "12px" }}
            />

            <label>Test rasmi:</label>
            <input
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files[0])}
                style={{ marginBottom: "12px" }}
            />

            {image && (
                <div className="test-container" style={{ position: "relative", border: "1px solid #ddd", marginTop: "10px", padding: "10px" }}>
                    <img ref={imageRef} src={URL.createObjectURL(image)} alt="Test" style={{ display: "block" }} className="img_upload" />
                    {inputs.map(inp => (
                        <div
                            key={inp.id}
                            style={{ position: "absolute", top: inp.top, left: inp.left, display: "flex", alignItems: "center", cursor: "move", gap: "5px" }}
                            onMouseDown={e => handleMouseDown(inp.id, e)}
                        >
                            <input
                                type="text"
                                value={inp.value}
                                onChange={e => handleAnswerChange(inp.id, e.target.value)}
                                style={{ width: inp.width, border: "1px solid #000", padding: "3px" }}
                                placeholder="Javob"
                            />
                            {/* Resizer */}
                            <div
                                className="resizer"
                                onMouseDown={e => handleResizeMouseDown(inp.id, e)}
                                style={{ width: "6px", height: "100%", background: "blue", cursor: "ew-resize" }}
                            />
                            <button
                                type="button"
                                onClick={() => handleDeleteInput(inp.id)}
                                style={{ background: "red", color: "white", border: "none", borderRadius: "4px", padding: "2px 6px", cursor: "pointer" }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
                <button type="button" onClick={handleAddInput}>➕ Input qo‘shish</button>
                <button type="button" onClick={handleClear}>🗑 Tozalash</button>
                <button type="button" onClick={handleSubmitFull}>💾 Saqlash</button>
            </div>
        </div>
    );
}

export default ListeningTest;
