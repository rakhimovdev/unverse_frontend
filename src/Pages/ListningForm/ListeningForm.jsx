import React, { useEffect, useState } from "react";
import axios from "../../Api/Axios"; 
import "./ListeningForm.css";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function ListeningForm() {
    const [audios, setAudios] = useState([]);
    const navigate = useNavigate();
    const userRole = localStorage.getItem("role"); // student | teacher | admin

    // 🔹 Audiosni olish
    const fetchAudios = async () => {
        try {
            const res = await axios.get("/testl/all");
            setAudios(res.data);
        } catch (err) {
            console.error("Audiosni olishda xatolik:", err);
        }
    };

    useEffect(() => {
        fetchAudios();
    }, []);

    // 🔹 Audio o‘chirish
    const handleDelete = async (id) => {
        if (!window.confirm("Haqiqatan ham o‘chirmoqchimisiz?")) return;

        try {
            await axios.delete(`/testl/${id}`);
            setAudios((prev) => prev.filter((a) => a._id !== id));
        } catch (err) {
            console.error("Audio o‘chirishda xato:", err);
        }
    };

    // 🔹 Testni ishlash
    const handleTakeTest = (id) => {
        navigate(`/listening/audio/${id}`);
    };

    return (
        <div className="listening-form">
            <h2>Uploaded Listening Tests</h2>
            <div className="listening-box">
                {audios.length === 0 ? (
                    <p>Hozircha audio yuklanmagan...</p>
                ) : (
                    audios.map((audio) => (
                        <div className="listening-card" key={audio._id}>
                            <p className="audio-title">{audio.title}</p>
                            <div className="card-buttons">
                                {/* Take Test tugmasi */}
                                <button
                                    className="take-btn"
                                    onClick={() => handleTakeTest(audio._id)}
                                >
                                    Take Test
                                </button>

                                {/* Faqat teacher va admin uchun delete tugmasi */}
                                {(userRole === "teacher" || userRole === "admin") && (
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(audio._id)}
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ListeningForm;
