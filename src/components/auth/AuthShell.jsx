import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "./AuthShell.css";

const defaultHighlights = [
    "JWT session persistence with protected access",
    "6-digit OTP verification in under 5 minutes",
    "Google sign-in powered by the official OAuth flow"
];

function AuthShell({
    badge = "DigiEduSystem Auth",
    title,
    subtitle,
    children,
    footer,
    highlights = defaultHighlights
}) {
    return (
        <div className="auth-shell">
            <div className="auth-orb auth-orb--one" />
            <div className="auth-orb auth-orb--two" />

            <div className="auth-layout">
                <motion.aside
                    className="auth-showcase"
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <Link className="auth-brand" to="/">
                        <img
                            src={`${process.env.PUBLIC_URL}/digiedusystem-logo.png`}
                            alt="DigiEduSystem logo"
                        />
                        <div>
                            <strong>DigiEduSystem</strong>
                            <span>Smarter language learning platform</span>
                        </div>
                    </Link>

                    <div className="auth-showcase__copy">
                        <span className="auth-badge">{badge}</span>
                        <h1>{title}</h1>
                        <p>{subtitle}</p>
                    </div>

                    <div className="auth-stats">
                        <div className="auth-stat">
                            <span>Modern Security</span>
                            <strong>JWT + OTP + Google OAuth</strong>
                        </div>
                        <div className="auth-stat">
                            <span>Startup Feel</span>
                            <strong>Fast, responsive, mobile-ready flow</strong>
                        </div>
                    </div>

                    <div className="auth-highlights">
                        {highlights.map((item) => (
                            <div className="auth-highlight" key={item}>
                                <span className="auth-highlight__dot" />
                                <p>{item}</p>
                            </div>
                        ))}
                    </div>
                </motion.aside>

                <motion.section
                    className="auth-card"
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
                >
                    {children}
                    {footer ? <div className="auth-footer">{footer}</div> : null}
                </motion.section>
            </div>
        </div>
    );
}

export default AuthShell;
