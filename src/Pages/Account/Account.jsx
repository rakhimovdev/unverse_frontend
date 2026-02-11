import React, { useEffect, useState } from "react";
import axios from "../../Api/Axios";

function Account() {
    const [results, setResults] = useState([]);
    const [writingResults, setWritingResults] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Foydalanuvchi va natijalarni olish
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Tokenni olish
                const token = localStorage.getItem("token");

                // User ma'lumotlarini olish
                const resUser = await axios.get("/score/me", {
                    headers: { Authorization: token }
                });
                setUser(resUser.data);

                // Natijalarni olish
                const resScores = await axios.get("/score/my", {
                    headers: { Authorization: token }
                });
                setResults(resScores.data);

                const resWriting = await axios.get("/scorew/my", {
                    headers: { Authorization: token }
                });
                setWritingResults(resWriting.data);
            } catch (err) {
                console.error("Error loading account:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div className="container_acc" style={{ padding: "20px" }}>
            <div className="detailes" style={{ marginBottom: "30px" }}>
                <div className="info">
                    <h1>Name: {user?.name}</h1>
                    <h1>Lastname: {user?.lastname}</h1>
                    <h2>Username: {user?.username}</h2>
                    <h2>Email: {user?.email}</h2>
                </div>
            </div>

            <div className="results">
                <h2>My Results</h2>
                {results.length > 0 ? (
                    <table border="1" cellPadding="10" style={{ marginTop: "20px", width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Score</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i}>
                                    <td>{r.test?.name || "Unknown Test"}</td>
                                    <td>{r.score}</td>
                                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>You have not completed any tests yet.</p>
                )}
            </div>

            <div className="results" style={{ marginTop: "30px" }}>
                <h2>My Writing Results</h2>
                {writingResults.length > 0 ? (
                    <table border="1" cellPadding="10" style={{ marginTop: "20px", width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Score</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {writingResults.map((r, i) => (
                                <tr key={i}>
                                    <td>{r.testName || "Writing Test"}</td>
                                    <td>{r.score}</td>
                                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>You have no writing results yet.</p>
                )}
            </div>
        </div>
    );
}

export default Account;
