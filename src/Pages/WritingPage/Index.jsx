import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../Api/Axios";
import "./App.css";

function Index() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);

    useEffect(() => {
        const getTest = async () => {
            try {
                const response = await axios.get(`/posts/${id}`);
                setTest(response.data);
            } catch (error) {
                console.error("Error fetching writing task:", error);
            }
        };

        getTest();
    }, [id]);

    if (!test) {
        return <h2>Loading...</h2>;
    }

    return (
        <div className="test_screen">
            <button className="back_btn" onClick={() => navigate("/writing")}>
                ← Back
            </button>

            <div className="left_panel">
                <h2>{test.topic}</h2>
                <img
                    src={`http://localhost:5000/uploads/${test.image}`}
                    alt="writing task"
                />
            </div>

            <div className="right_panel">
                <h3>Your Response:</h3>
                <textarea placeholder="Write here..."></textarea>
            </div>
        </div>
    );
}

export default Index;
