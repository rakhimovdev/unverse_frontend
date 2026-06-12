import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../Api/Axios";
import { useAuth } from "../../context/AuthContext";
import "./AdminLogin.css";

function AdminLogin() {
    const { persistSession } = useAuth();
    const [loginData, setLoginData] = useState({
        username: "",
        password: ""
    });
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        try {
            const response = await axios.post("/user/login", loginData);

            if (response.data.token) {
                const userRole = response.data.user?.role;
                if (userRole !== "admin") {
                    setErrorMsg("Siz admin emassiz ❌");
                    return;
                }

                persistSession({
                    token: response.data.token,
                    user: {
                        ...response.data.user,
                        role: userRole
                    }
                });
                navigate("/admin");
            } else {
                setErrorMsg("Token topilmadi ❌");
            }
        } catch (error) {
            console.error(error);
            setErrorMsg("Login xato! Username yoki parol noto‘g‘ri.");
        }
    };

    return (
        <div className="signin-page">
            <h1 className="signin-title">Admin Sign In</h1>

            <form onSubmit={handleLoginSubmit} className="signin-form">
                {errorMsg && <p className="error-message">{errorMsg}</p>}

                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={loginData.username}
                        onChange={(e) =>
                            setLoginData({ ...loginData, username: e.target.value })
                        }
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={loginData.password}
                        onChange={(e) =>
                            setLoginData({ ...loginData, password: e.target.value })
                        }
                        required
                    />
                </div>

                <button type="submit" className="signin-button">
                    Log In
                </button>

                <p className="signup-link">
                    Teacher login? <Link to="/teacher_in">Teacher Sign In</Link>
                </p>
                {/* <p className="signup-link">
                    Admin account yo'qmi? <Link to="/admin_signup">Sign Up</Link>
                </p> */}
            </form>

            <Link to="/" className="back-link">← Back to Home</Link>
        </div>
    );
}

export default AdminLogin;
