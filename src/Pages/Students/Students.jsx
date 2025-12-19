import { useState } from "react";
import Reading from "./ReadingR";
import Listening from "./ListeningR";
import Writing from "./WritingR";
import "./Students.css";

function StudentsTabs() {
    const [activeTab, setActiveTab] = useState("reading"); // default tab

    return (
        <div className="students-container">
            <h1 className="title">📊 Student Scores</h1>

            {/* Karusel tugmalari */}
            <div className="carousel-tabs">
                <button
                    className={activeTab === "reading" ? "active" : ""}
                    onClick={() => setActiveTab("reading")}
                >
                    📘 Reading
                </button>
                <button
                    className={activeTab === "listening" ? "active" : ""}
                    onClick={() => setActiveTab("listening")}
                >
                    🎧 Listening
                </button>
                <button
                    className={activeTab === "writing" ? "active" : ""}
                    onClick={() => setActiveTab("writing")}
                >
                    ✍️ Writing
                </button>
            </div>

            {/* Karuselga mos komponent */}
            {activeTab === "reading" && <Reading />}
            {activeTab === "listening" && <Listening />}
            {activeTab === "writing" && <Writing />}
        </div>
    );
}

export default StudentsTabs;
