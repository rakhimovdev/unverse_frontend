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
        <nav>
            <div className="in_nav">
                {/* Logo */}
                <a className="logo_a" href="/">
                    <img
                        className="logo"
                        src={`${process.env.PUBLIC_URL}/universe-logo.svg`}
                        alt="Universe Language School Logo"
                    />
                    <div className="logoText">
                        <p>Universe</p>
                        <p>Language School</p>
                    </div>
                </a>

                {/* Menu */}
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
                        <a className="a" href="/writingform">Writing</a>
                    </li>
                    <li>
                        {/* About Us is not a real link, use button instead */}
                        <button className="a" onClick={() => alert("About Us page coming soon!")}>
                            About Us
                        </button>
                    </li>
                </ul>

                {/* User actions */}
                <div>
                    {!isLoggedIn ? (
                        role !== "teacher" && (
                            <>
                                <a className="a" href="/sign_in">
                                    <button>Sign In</button>
                                </a>
                                <a className="a" href="/sign_up">
                                    <button className="btn2">Sign Up</button>
                                </a>
                            </>
                        )
                    ) : (
                        <div className="logged-in">
                            <button onClick={handleLogout}>Logout</button>

                            <a href={role === "teacher" ? "/teachacc" : "/account"}>
                                <button>Account</button>
                            </a>

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
    );
};

export default Navbar;
