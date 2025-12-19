import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../Api/Axios";
import "./App.css";

function Index() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
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

    const handleSave = async () => {
        try {
            await axios.post("/posts/response", {
                writingId: test._id,
                topic: test.topic,
                userId,
                answer
            });

            alert("Saved successfully!");
            setAnswer("");
        } catch (error) {
            console.error("Save error:", error.response?.data || error.message);
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
                <button onClick={handleSave}>Save</button>
            </div>
        </div>
    );
}

export default Index;
