import axios from "../../Api/Axios";
import { useEffect, useState, useCallback } from "react";
import "./Students.css"; // 👉 CSS alohida faylga chaqirilgan

function ReadingR({ timeSlotIds }) {
    const [data, setData] = useState([]);
    const token = localStorage.getItem("token");

    // 📌 Barcha scorelarni olish
    const fetchScores = useCallback(() => {
        axios
            .get("/score/all", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setData(res.data))
            .catch((err) => console.error(err.response?.data || err.message));
    }, [token]);

    // 📌 Score o‘chirish
    const deleteScore = async (id) => {
        if (!window.confirm("Rostdan ham o‘chirmoqchimisiz?")) return;

        try {
            await axios.delete(`/score/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // O‘chirilgandan keyin listni yangilash
            setData((prev) => prev.filter((s) => s._id !== id));
        } catch (err) {
            console.error(err.response?.data || err.message);
        }
    };

    // useEffect dependency’da fetchScores qo‘shildi
    useEffect(() => {
        fetchScores();
    }, [fetchScores]);

    const selectedIds = Array.isArray(timeSlotIds)
        ? timeSlotIds
        : timeSlotIds
            ? [timeSlotIds]
            : [];

    const filteredData = selectedIds.length
        ? data.filter((row) => {
              const student = row.student;
              if (!student) return false;
              const single = student.timeSlot;
              const list = Array.isArray(student.timeSlots) ? student.timeSlots : [];
              const all = [...list, single].filter(Boolean);
              return all.some((s) =>
                  selectedIds.includes(typeof s === "string" ? s : s._id)
              );
          })
        : data;

    return (
        <div className="students-container">
            {filteredData.length > 0 ? (
                <table className="students-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Lastname</th>
                            <th>Email</th>
                            <th>Test</th>
                            <th>Score</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((student, index) => (
                            <tr key={student._id}>
                                <td>{index + 1}</td>
                                <td>{student.student?.name || "N/A"}</td>
                                <td>{student.student?.lastname || "N/A"}</td>
                                <td>{student.student?.email || "N/A"}</td>
                                <td>{student.test?.name || "N/A"}</td>
                                <td>{student.score}</td>
                                <td>
                                    <button
                                        className="delete-btn1"
                                        onClick={() => deleteScore(student._id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="loading">Loading...</p>
            )}
        </div>
    );
}

export default ReadingR;
