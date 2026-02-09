import React from "react";
import "./Navbar.css";

const Navbar = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const isLoggedIn = !!token;

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    return (
        <nav className="site-nav">
            <div className="site-nav__inner">
                <a className="brand" href="/">
                    <span className="brand-mark">
                        <img
                            src={`${process.env.PUBLIC_URL}/nine-logo.svg`}
                            alt="Nine Language School logo"
                        />
                    </span>
                    <div className="brand-text">
                        <span>Universe</span>
                        <span>Language School</span>
                    </div>
                </a>

                <ul className="site-nav__links">
                    <li>
                        <a className="site-nav__link" href="/">Home</a>
                    </li>
                    <li>
                        <a className="site-nav__link" href="/read">Reading</a>
                    </li>
                    <li>
                        <a className="site-nav__link" href="/audio">Listening</a>
                    </li>
                    <li>
                        <a className="site-nav__link" href="/writingform">Writing</a>
                    </li>
                    <li>
                        <button
                            className="site-nav__link site-nav__link--button"
                            onClick={() => alert("About Us page coming soon!")}
                        >
                            About Us
                        </button>
                    </li>
                </ul>

                <div className="site-nav__actions">
                    {!isLoggedIn ? (
                        role !== "teacher" && (
                            <>
                                <a className="nav-btn nav-btn--ghost" href="/sign_in">
                                    Sign In
                                </a>
                                <a className="nav-btn nav-btn--primary" href="/sign_up">
                                    Sign Up
                                </a>
                            </>
                        )
                    ) : (
                        <div className="site-nav__actions-group">
                            <button className="nav-btn nav-btn--ghost" onClick={handleLogout}>
                                Logout
                            </button>
                            <a
                                className="nav-btn nav-btn--ghost"
                                href={role === "teacher" ? "/teachacc" : "/account"}
                            >
                                Account
                            </a>

                            {role === "teacher" && (
                                <>
                                    <a className="nav-btn nav-btn--ghost" href="/selectt">
                                        Add Test
                                    </a>
                                    <a className="nav-btn nav-btn--primary" href="/students">
                                        Your Students
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
