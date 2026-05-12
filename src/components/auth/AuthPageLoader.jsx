import React from "react";

function AuthPageLoader({ title = "Checking your session", subtitle = "Preparing secure access..." }) {
    return (
        <div className="auth-loader">
            <div className="auth-loader__card">
                <div className="auth-loader__spinner" aria-hidden="true" />
                <h2>{title}</h2>
                <p>{subtitle}</p>
            </div>
        </div>
    );
}

export default AuthPageLoader;
