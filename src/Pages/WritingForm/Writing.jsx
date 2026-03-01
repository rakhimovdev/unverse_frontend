import React, { useEffect, useState, useCallback } from "react";
import axios from "../../Api/Axios";
import { useNavigate } from "react-router-dom";
import "./Writing.css";

function Writing() {
    const [uploadedTests, setUploadedTests] = useState([]);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const isAuthenticated = !!token;
    const userRole = localStorage.getItem("role"); // student | teacher | admin

    const fetchTests = useCallback(() => {
        axios
            .get("/posts/all", {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            .then((res) => {
                setUploadedTests(res.data || []);
            })
            .catch(() => setUploadedTests([]));
    }, [token]);

    useEffect(() => {
        fetchTests();
    }, [fetchTests]);

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

    const handleTakeTest = (id) => {
        if (!isAuthenticated) {
            alert("Siz ro'yxatdan o'tmagansiz. Avval ro'yxatdan o'ting.");
            navigate("/sign_in");
        } else {
            navigate(`/writingpage/${id}`);
        }
    };

    return (
        <div className="writing_page">
            <div className="test_list">
                <h1>IELTS Writing Tests</h1>

                <div className="card_container">
                    {uploadedTests.map((item) => (
                        <div className="test_card" key={item._id}>
                            <h3>{item.task1Topic || item.topic}</h3>
                            <button
                                onClick={() => handleTakeTest(item._id)}
                                className="start_btn"
                            >
                                Start
                            </button>
                            {(userRole === "teacher" || userRole === "admin") && (
                                <button onClick={() => handleDelete(item._id)}>
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Writing;
