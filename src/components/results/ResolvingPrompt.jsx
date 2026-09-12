import React from "react";
import "./ResolvingPrompt.css";

function ResolvingPrompt({ onYes, onNo }) {
    return (
        <div className="resolving-prompt" role="dialog" aria-modal="true">
            <div className="resolving-prompt__backdrop" />
            <div className="resolving-prompt__panel">
                <p className="results-hero__eyebrow">Solving Completed</p>
                <h2>Would you like to try Resolving Mode?</h2>
                <p>
                    Testni yakunladingiz. Endi ushbu testni vaqt cheklovisiz qayta ishlab,
                    natijangizni yaxshilashni xohlaysizmi?
                </p>
                <div className="resolving-prompt__actions">
                    <button type="button" onClick={onYes}>Yes, Start Resolving</button>
                    <button type="button" onClick={onNo}>No, Finish Test</button>
                </div>
            </div>
        </div>
    );
}

export default ResolvingPrompt;