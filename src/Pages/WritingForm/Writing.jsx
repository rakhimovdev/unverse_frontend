import React, { useEffect, useState } from "react";
import axios from "../../Api/Axios";
import { useNavigate } from "react-router-dom";
import "./Writing.css";

function Writing() {
    const [uploadedTests, setUploadedTests] = useState([]);
    const navigate = useNavigate();

    const userRole = localStorage.getItem("role"); // student | teacher | admin

    const fetchTests = () => {
        axios
            .get("/posts/all")
            .then((res) => {
                setUploadedTests(res.data || []);
            })
            .catch(() => setUploadedTests([]));
    };

    useEffect(() => {
        fetchTests();
    }, []);

    const handleDelete = async (id) => {
        if (userRole === "teacher" || userRole === "admin") {
            if (window.confirm("Testni o‘chirishni istaysizmi?")) {
                try {
                    await axios.delete(`/posts/delete/${id}`);
                    fetchTests(); // qayta yuklash
                } catch (err) {
                    alert("❌ O‘chirishda xatolik yuz berdi!");
                }
            }
        } else {
            alert("Siz testni o‘chira olmaysiz!");
        }
    }

    return (
        <div className="writing_page">
            <div className="test_list">
                <h1>IELTS Writing Tests</h1>

                <div className="card_container">
                    {uploadedTests.map((item) => (
                        <div className="test_card" key={item._id}>
                            <h3>{item.topic}</h3>

                            <button
                                onClick={() => navigate(`/writingpage/${item._id}`)}
                                className="start_btn"
                            >
                                Start
                            </button>
                            <button onClick={() => handleDelete(item._id)}>Delete</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Writing;
