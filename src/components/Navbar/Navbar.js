import React from "react";
import "./Navbar.css";
import img1 from "../../Images/image.png";

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
                    <a className="logo_a" href="/">
                        <img className="logo" src={img1} alt="" />
                        <div className="logoText">
                            <p>Universe</p>
                            <p>Language School</p>
                        </div>
                    </a>

                    {/* Student uchun menyular */}
                    <ul>
                        <li>
                            <a className="a" href="/">Home</a>
                        </li>
                        <li>
                            <a className="a" href="/read">Reading</a>
                        </li>
                        <li>
                            <a className="a" href="/audio">Listening</a>
                        </li>
                        <li>
                            <a className="a" href="/writing">Writing</a>
                        </li>
                        <li>
                            <a className="a" href="#">About Us</a>
                        </li>
                    </ul>

                    <div className="    ">
                        {!isLoggedIn ? (
                            <>
                                {/* 🔥 Agar teacher bo‘lsa Sign In / Sign Up chiqmaydi */}
                                {role !== "teacher" && (
                                    <>
                                        <a className="a" href="/sign_in">
                                            <button>Sign In</button>
                                        </a>
                                        <a className="a" href="/sign_up">
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
