import { useEffect, useMemo, useState } from "react";
import axios from "../../Api/Axios";
import Reading from "./ReadingR";
import Listening from "./ListeningR";
import Writing from "./WritingR";
import "./Students.css";

function StudentsTabs() {
    const [activeTab, setActiveTab] = useState("reading"); // default tab
    const [timeGroup, setTimeGroup] = useState("");
    const [timeOptions, setTimeOptions] = useState([]);
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedSlotIds, setSelectedSlotIds] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(true);
    const storedUser = localStorage.getItem("user");
    const userId = useMemo(() => (storedUser ? JSON.parse(storedUser)?.id : ""), [storedUser]);

    useEffect(() => {
        const loadSlots = async () => {
            if (!userId || !timeGroup) {
                setTimeOptions([]);
                setSelectedTime("");
                setSelectedSlotIds([]);
                setLoadingSlots(false);
                return;
            }
            setLoadingSlots(true);
            try {
                const res = await axios.get("/student/timeslots", {
                    params: { teacherId: userId, group: timeGroup }
                });
                setTimeOptions(res.data || []);
                setSelectedTime("");
                setSelectedSlotIds([]);
            } catch (err) {
                console.error(err.response?.data || err.message);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [userId, timeGroup]);

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
                    value={timeGroup}
                    onChange={(e) => setTimeGroup(e.target.value)}
                    disabled={loadingSlots}
                    aria-label="Juft yoki toq"
                >
                    <option value="">Juft/Toq</option>
                    <option value="juft">Juft</option>
                    <option value="toq">Toq</option>
                </select>
                <select
                    value={selectedTime}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSelectedTime(value);
                        const match = timeOptions.find((t) => t.time === value);
                        setSelectedSlotIds(match?.slotIds || []);
                    }}
                    disabled={loadingSlots || !timeGroup}
                    aria-label="Dars vaqti"
                >
                    <option value="">Vaqt tanlang</option>
                    {timeOptions.map((slot) => (
                        <option key={slot.time} value={slot.time}>
                            {slot.time}
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
            {activeTab === "reading" && <Reading timeSlotIds={selectedSlotIds} />}
            {activeTab === "listening" && <Listening timeSlotIds={selectedSlotIds} />}
            {activeTab === "writing" && <Writing timeSlotIds={selectedSlotIds} />}
        </div>
    );
}

export default StudentsTabs;
