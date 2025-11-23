import React, { useState } from 'react';
import axios from '../../Api/Axios';
import "./Writing.css";

function Writing() {
    const [image, setImage] = useState(null);
    const [topic, setTopic] = useState("");
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!image) {
            setError("Rasm tanlang!");
            return;
        }
        if (!topic.trim()) {
            setError("Topic yozing!");
            return;
        }

        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("image", image);
        formData.append("topic", topic); // ← TOPIC qo‘shildi

        try {
            await axios.post("/posts/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            alert("Saved!");

            // Reset
            setTopic("");
            setImage(null);
            setPreview(null);

        } catch (err) {
            console.error(err);
            setError("Xatolik yuz berdi!");
        }

        setLoading(false);
    };

    return (
        <div className="writing-wrapper">
            <div className="container">
                <div className="container1">

                    {/* Topic input */}
                    <div className="topic">
                        <input
                            type="text"
                            placeholder="Topic yozing..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>

                    {/* Rasm tanlash */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                    />

                    {/* Preview */}
                    {preview && (
                        <img
                            src={preview}
                            alt="preview"
                            className="image-preview"
                        />
                    )}
                </div>
            </div>

            {error && <p className="error">{error}</p>}

            <button onClick={handleSubmit} className="saveBtn" disabled={loading}>
                {loading ? "Saving..." : "Save"}
            </button>
        </div>
    );
}

export default Writing;
