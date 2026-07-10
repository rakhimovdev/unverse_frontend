import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiMoon, FiSun } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getStoredRole, getStoredToken } from "../../utils/authStorage";
import { isAuthExperiencePath, resolveDashboardPath } from "../../utils/authRoutes";
import { getPlanSummary } from "../../utils/subscription";
import "./Navbar.css";

const Navbar = () => {
    const { token: authToken, user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const location = useLocation();
    const token = authToken || getStoredToken();
    const role = user?.role || getStoredRole();
    const isLoggedIn = !!token;
    const accountHref = resolveDashboardPath(role);
    const accountLabel = role === "admin" ? "Admin" : "Account";
    const planSummary = getPlanSummary(user);
    const displayName =
        user?.fullname || user?.username || user?.email || accountLabel;
    const initials = String(displayName)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase();

    if (isAuthExperiencePath(location.pathname)) {
        return null;
    }

    const handleLogout = () => {
        logout();
        window.location.href = "/";
    };

    return (
        <nav className="site-nav">
            <div className="site-nav__inner">
                <Link className="brand" to="/">
                    <span className="brand-mark">
                        <img
                            src={`${process.env.PUBLIC_URL}/bandup-icon.svg`}
                            alt="BandUp icon"
                        />
                    </span>
                    <div className="brand-text">
                        <span>
                            Band<span className="brand-text__accent">Up</span>
                        </span>
                        <span>Practice. Improve. Achieve.</span>
                    </div>
                </Link>

                <ul className="site-nav__links">
                    <li>
                        <Link className="site-nav__link" to="/">Home</Link>
                    </li>
                    <li>
                        <Link className="site-nav__link" to="/read">Reading</Link>
                    </li>
                    <li>
                        <Link className="site-nav__link" to="/audio">Listening</Link>
                    </li>
                    <li>
                        <Link className="site-nav__link" to="/writingform">Writing</Link>
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
                    <button
                        type="button"
                        className="nav-btn nav-btn--ghost nav-btn--icon"
                        onClick={toggleTheme}
                        aria-label={isDark ? "Light mode yoqish" : "Dark mode yoqish"}
                    >
                        {isDark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
                        <span>{isDark ? "Light" : "Dark"}</span>
                    </button>

                    {!isLoggedIn ? (
                        role !== "teacher" && (
                            <>
                                <Link className="nav-btn nav-btn--ghost" to="/sign_in">
                                    Sign In
                                </Link>
                                <Link className="nav-btn nav-btn--primary" to="/sign_up">
                                    Sign Up
                                </Link>
                                <Link className="nav-btn nav-btn--ghost" to="/admin_login">
                                    Admin Login
                                </Link>
                            </>
                        )
                    ) : (
                        <div className="site-nav__actions-group">
                            <div className="site-nav__profile">
                                <div className="site-nav__avatar">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={displayName} />
                                    ) : (
                                        <span>{initials || "U"}</span>
                                    )}
                                </div>
                                <div className="site-nav__profile-copy">
                                    <strong>{displayName}</strong>
                                    <span
                                        className={`site-nav__plan ${
                                            planSummary.isPro ? "is-pro" : ""
                                        }`}
                                    >
                                        {planSummary.detail}
                                    </span>
                                </div>
                            </div>

                            {!planSummary.isPro && role !== "admin" && role !== "teacher" && (
                                <Link className="nav-btn nav-btn--primary" to="/upgrade">
                                    Upgrade
                                </Link>
                            )}

                            <button className="nav-btn nav-btn--ghost" onClick={handleLogout}>
                                Logout
                            </button>
                            <Link
                                className="nav-btn nav-btn--ghost"
                                to={accountHref}
                            >
                                {accountLabel}
                            </Link>

                            {role === "teacher" && (
                                <>
                                    <Link className="nav-btn nav-btn--ghost" to="/selectt">
                                        Add Test
                                    </Link>
                                    <Link className="nav-btn nav-btn--primary" to="/students">
                                        Your Students
                                    </Link>
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
