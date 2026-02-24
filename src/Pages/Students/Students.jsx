import { useEffect, useMemo, useState } from "react";
import axios from "../../Api/Axios";
import Reading from "./ReadingR";
import Listening from "./ListeningR";
import Writing from "./WritingR";
import "./Students.css";

function StudentsTabs() {
    const [activeTab, setActiveTab] = useState("reading"); // default tab
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState("");
    const [loadingSlots, setLoadingSlots] = useState(true);
    const storedUser = localStorage.getItem("user");
    const userId = useMemo(() => (storedUser ? JSON.parse(storedUser)?.id : ""), [storedUser]);

    useEffect(() => {
        const loadSlots = async () => {
            setLoadingSlots(true);
            try {
                const res = await axios.get("/student/timeslots", {
                    params: userId ? { teacherId: userId } : {}
                });
                setTimeSlots(res.data || []);
            } catch (err) {
                console.error(err.response?.data || err.message);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [userId]);

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
                <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    disabled={loadingSlots}
                    aria-label="Dars vaqti"
                >
                    <option value="">Barcha vaqtlar</option>
                    {timeSlots.map((slot) => (
                        <option key={slot._id} value={slot._id}>
                            {slot.day} · {slot.time}
                        </option>
                    ))}
                </select>
                <button
                    className={activeTab === "writing" ? "active" : ""}
                    onClick={() => setActiveTab("writing")}
                >
                    ✍️ Writing
                </button>
            </div>

            {/* Karuselga mos komponent */}
            {activeTab === "reading" && <Reading timeSlotId={selectedTime} />}
            {activeTab === "listening" && <Listening timeSlotId={selectedTime} />}
            {activeTab === "writing" && <Writing timeSlotId={selectedTime} />}
        </div>
    );
}

export default StudentsTabs;
