import React, { useState, useEffect, useCallback } from "react";
import "./ListeningForm.css";
import { useNavigate } from "react-router-dom";
import axios from "../../Api/Axios";
import { FaTrash } from "react-icons/fa";

function ListeningForm() {
    const [uploadedTests, setUploadedTests] = useState([]);
    const navigate = useNavigate();

    // LocalStorage’dan token va role olish
    const token = localStorage.getItem("token");
    const isAuthenticated = !!token;
    const userRole = localStorage.getItem("role"); // student | teacher | admin

    // Testlarni olish
    const fetchTests = useCallback(() => {
        axios
            .get("/testl/all", {
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

    // Testni o‘chirish
    const handleDelete = async (id) => {
        if (userRole === "teacher" || userRole === "admin") {
            if (window.confirm("Testni o‘chirishni istaysizmi?")) {
                try {
                    await axios.delete(`/testl/${id}`);
                    fetchTests(); // qayta yuklash
                } catch (err) {
                    alert("❌ O‘chirishda xatolik yuz berdi!");
                }
            }
        } else {
            alert("Siz testni o‘chira olmaysiz!");
        }
    };

    // Testni ishlash
    const handleTakeTest = (id) => {
        if (!isAuthenticated) {
            if (
                window.confirm(
                    "Testni ishlash uchun akkauntga kirishingiz kerak. Login sahifasiga o‘tishni xohlaysizmi?"
                )
            ) {
                navigate("/sign_in");
            }
        } else {
            navigate(`/listening/audio/${id}`);
        }
    };

    return (
        <div className="listening-form">
            <div className="heading">
                <h2>Uploaded Listening Tests</h2>
            </div>
            <div className="box">
                {uploadedTests.length > 0 ? (
                    uploadedTests.map((test) => (
                        <div className="cart" key={test._id}>
                            <p>{test.title}</p>
                            <div className="cart-buttons">
                                {/* Take Test */}
                                <button onClick={() => handleTakeTest(test._id)}>Take Test</button>
                                {(userRole === "teacher" || userRole === "admin") && (
                                    <button
                                        className='deletebtn'
                                        onClick={() => handleDelete(test._id)}
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                )}

                            </div>
                        </div>
                    ))
                ) : (
                    <p>No listening tests found.</p>
                )}
            </div>
        </div>
    );
}

export default ListeningForm;
