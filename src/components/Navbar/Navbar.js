import React from "react";
import "./Navbar.css";

const Navbar = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const isLoggedIn = !!token;

    // Logout handler
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    return (
        <div>
            <nav>
                <div className="in_nav">
                    <a href="/">
                        <div className="logo">
                            <h1>Logo</h1>
                        </div>
                    </a>

                    {/* Student uchun menyular */}
                    <ul>
                        <li>
                            <a href="/">Home</a>
                        </li>
                        <li>
                            <a href="/read">Reading</a>
                        </li>
                        <li>
                            <a href="/audio">Listening</a>
                        </li>
                        <li>
                            <a href="#">About Us</a>
                        </li>
                    </ul>

                    <div className="    ">
                        {!isLoggedIn ? (
                            <>
                                {/* 🔥 Agar teacher bo‘lsa Sign In / Sign Up chiqmaydi */}
                                {role !== "teacher" && (
                                    <>
                                        <a href="/sign_in">
                                            <button>Sign In</button>
                                        </a>
                                        <a href="/sign_up">
                                            <button className="btn2">Sign Up</button>
                                        </a>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="logged-in">
                                <button onClick={handleLogout}>
                                    Logout
                                </button>
                                <a href={role === "teacher" ? "/teachacc" : "/account"}>
                                    <button>Account</button>
                                </a>

                                {/* Teacher uchun maxsus tugmalar */}
                                {role === "teacher" && (
                                    <>
                                        <a href="/selectt">
                                            <button>Add Test</button>
                                        </a>
                                        <a href="/students">
                                            <button className="btn2">Your Students</button>
                                        </a>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Navbar;
