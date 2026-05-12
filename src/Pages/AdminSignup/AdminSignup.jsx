import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../Api/Axios";
import { useAuth } from "../../context/AuthContext";
import "./AdminSignup.css";

function AdminSignup() {
    const { persistSession } = useAuth();
    const [userData, setUserData] = useState({
        username: "",
        name: "",
        lastname: "",
        email: "",
        password: "",
        role: "admin"
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        if (userData.password.length < 6) {
            setErrorMsg("Password must be at least 6 characters long ❌");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post("/user/register", userData);

            if (response.data.token) {
                persistSession({
                    token: response.data.token,
                    user: response.data.user
                });
            }

            alert("Admin account created successfully! 🎉");
            navigate("/admin");
        } catch (error) {
            console.error("Admin registration error:", error);
            setErrorMsg(error.response?.data?.message || "Ro'yxatdan o'tishda xatolik ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-page">
            <h1 className="signup-title">Admin Sign Up</h1>

            <form onSubmit={handleSubmit} className="signup-form">
                {errorMsg && <p className="error-message">{errorMsg}</p>}

                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={userData.username}
                        onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        placeholder="Enter name"
                        value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Lastname</label>
                    <input
                        type="text"
                        placeholder="Enter lastname"
                        value={userData.lastname}
                        onChange={(e) => setUserData({ ...userData, lastname: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Enter email"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={userData.password}
                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                        required
                    />
                </div>

                <button type="submit" className="signup-button" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>

                <p className="signin-link">
                    Already have an admin account?
                    <Link to="/admin_login"> Sign In</Link>
                </p>
            </form>

            <Link to="/" className="back-link">← Back to Home</Link>
        </div>
    );
}

export default AdminSignup;
