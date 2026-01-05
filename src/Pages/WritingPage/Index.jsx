import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../Api/Axios";
import "./App.css";

function Index() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [score, setScore] = useState("");
    const [test, setTest] = useState(null);
    const [writing, setWriting] = useState("");
    const [answer, setAnswer] = useState("");

    const userId = "6655abc12345678900000000"; // vaqtincha

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

    const handleSubmit = async () => {
        try {
            await axios.post(
                "/posts/response",
                { writingId: test._id, score, writing }, // ✅ to‘g‘rilandi
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            console.log("Score saqlandi ✅");
        } catch (err) {
            console.error("Score saqlashda xato:", err.response?.data || err);
        }
    };

    if (!test) return <h2>Loading...</h2>;

    return (
        <div className="test_screen">
            <button onClick={() => navigate("/writing")}>← Back</button>

            <div className="left_panel">
                <h2>{test.topic}</h2>
                <img
                    src={`${axios.defaults.baseURL}/uploads/${test.image}`}
                    alt="task"
                />
            </div>

            <div className="right_panel">
                <h3>Your Response</h3>
                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Write here..."
                />
                <button onClick={handleSubmit}>Save</button>
            </div>
        </div>
    );
}

export default Index;
