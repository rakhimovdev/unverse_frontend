import React, { useEffect, useState } from "react";
import axios from "../../Api/Axios";
import { useNavigate } from "react-router-dom";
import "./Writing.css";

function Writing() {
    const [tests, setTests] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const res = await axios.get("/posts/all");
                setTests(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchTests();
    }, []);

    return (
        <div className="writing_page">
            <div className="test_list">
                <h1>IELTS Writing Tests</h1>

                <div className="card_container">
                    {tests.map((item) => (
                        <div className="test_card" key={item._id}>
                            <h3>{item.topic}</h3>

                            <button
                                onClick={() => navigate(`/writingpage/${item._id}`)}
                                className="start_btn"
                            >
                                Start
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Writing;
