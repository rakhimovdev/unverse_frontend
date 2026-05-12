import React from "react";
import { GoogleLogin } from "@react-oauth/google";

function GoogleAuthButton({ onSuccess, onError }) {
    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
        return (
            <div className="auth-helper-text">
                Google sign-in is disabled until `REACT_APP_GOOGLE_CLIENT_ID` is configured.
            </div>
        );
    }

    return (
        <div className="auth-google">
            <GoogleLogin
                onSuccess={(credentialResponse) => onSuccess?.(credentialResponse?.credential || "")}
                onError={() => onError?.()}
                text="continue_with"
                shape="pill"
                theme="outline"
                size="large"
                width="100%"
            />
        </div>
    );
}

export default GoogleAuthButton;
