import React, { useEffect, useMemo, useState } from "react";
import axios from "../../Api/Axios";
import WritingResult from "../../components/WritingResult";

const READING_ACADEMIC_TABLE = [
    { min: 39, max: 40, band: 9 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8 },
    { min: 33, max: 34, band: 7.5 },
    { min: 30, max: 32, band: 7 },
    { min: 27, max: 29, band: 6.5 },
    { min: 23, max: 26, band: 6 },
    { min: 19, max: 22, band: 5.5 },
    { min: 15, max: 18, band: 5 },
    { min: 12, max: 14, band: 4.5 },
    { min: 9, max: 11, band: 4 },
    { min: 5, max: 8, band: 3 },
    { min: 0, max: 4, band: 0 }
];

const READING_GENERAL_TABLE = [
    { min: 39, max: 40, band: 9 },
    { min: 38, max: 38, band: 8.5 },
    { min: 37, max: 37, band: 8 },
    { min: 36, max: 36, band: 7.5 },
    { min: 34, max: 35, band: 7 },
    { min: 32, max: 33, band: 6.5 },
    { min: 30, max: 31, band: 6 },
    { min: 27, max: 29, band: 5.5 },
    { min: 23, max: 26, band: 5 },
    { min: 19, max: 22, band: 4.5 },
    { min: 15, max: 18, band: 4 },
    { min: 12, max: 14, band: 3 },
    { min: 0, max: 11, band: 0 }
];

const LISTENING_BAND_TABLE = [
    { min: 39, max: 40, band: 9 },
    { min: 37, max: 38, band: 8.5 },
    { min: 35, max: 36, band: 8 },
    { min: 32, max: 34, band: 7.5 },
    { min: 30, max: 31, band: 7 },
    { min: 26, max: 29, band: 6.5 },
    { min: 23, max: 25, band: 6 },
    { min: 18, max: 22, band: 5.5 },
    { min: 16, max: 17, band: 5 },
    { min: 13, max: 15, band: 4.5 },
    { min: 10, max: 12, band: 4 },
    { min: 6, max: 9, band: 3.5 },
    { min: 4, max: 5, band: 3 },
    { min: 2, max: 3, band: 2.5 },
    { min: 1, max: 1, band: 1 },
    { min: 0, max: 0, band: 0 }
];

const getBandScore = (rawScore, table) => {
    const value = Number(rawScore);
    if (!Number.isFinite(value)) return null;
    const row = table.find((r) => value >= r.min && value <= r.max);
    return row ? row.band : null;
};

const getLatestByDate = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return items.reduce((latest, current) => {
        if (!latest) return current;
        const latestTime = new Date(latest.createdAt).getTime();
        const currentTime = new Date(current.createdAt).getTime();
        return currentTime > latestTime ? current : latest;
    }, null);
};

function Account() {
    const [results, setResults] = useState([]);
    const [writingResults, setWritingResults] = useState([]);
    const [listeningResults, setListeningResults] = useState([]);
    const [writingAiResults, setWritingAiResults] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem("role");
    const isAiUser = role === "mooc" || role === "mock_user";
    const canUseAiWriting =
        role === "student" || role === "mooc" || role === "mock_user";

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

                const resListening = await axios.get("/scorel/my", {
                    headers: { Authorization: token }
                });
                setListeningResults(resListening.data);

                if (canUseAiWriting) {
                    const resWritingAi = await axios.get("/api/writing/ai-results", {
                        headers: { Authorization: token }
                    });
                    const aiPayload = Array.isArray(resWritingAi.data)
                        ? resWritingAi.data
                        : Array.isArray(resWritingAi.data?.result)
                        ? resWritingAi.data.result
                        : [];
                    setWritingAiResults(aiPayload);
                } else {
                    setWritingAiResults([]);
                }

                if (role === "student" || role === "mooc") {
                    const resWriting = await axios.get("/scorew/my", {
                        headers: { Authorization: token }
                    });
                    setWritingResults(resWriting.data);
                } else {
                    setWritingResults([]);
                }
            } catch (err) {
                console.error("Error loading account:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [role, canUseAiWriting]);

    const readingBands = useMemo(
        () =>
            results.map((r) => {
                const raw = r.score;
                return {
                    academic: getBandScore(raw, READING_ACADEMIC_TABLE),
                    general: getBandScore(raw, READING_GENERAL_TABLE)
                };
            }),
        [results]
    );

    const listeningBands = useMemo(
        () =>
            listeningResults.map((r) => getBandScore(r.score, LISTENING_BAND_TABLE)),
        [listeningResults]
    );

    const latestReadingBand = useMemo(() => {
        const latest = getLatestByDate(results);
        return latest ? getBandScore(latest.score, READING_ACADEMIC_TABLE) : null;
    }, [results]);

    const latestListeningBand = useMemo(() => {
        const latest = getLatestByDate(listeningResults);
        return latest ? getBandScore(latest.score, LISTENING_BAND_TABLE) : null;
    }, [listeningResults]);

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

            {isAiUser ? (
                <WritingResult
                    user={user}
                    readingBand={latestReadingBand}
                    listeningBand={latestListeningBand}
                />
            ) : (
                <>
                    {canUseAiWriting ? (
                        <WritingResult
                            user={user}
                            readingBand={latestReadingBand}
                            listeningBand={latestListeningBand}
                        />
                    ) : null}

                    <div className="results">
                <h2>My Reading Results</h2>
                {results.length > 0 ? (
                    <table border="1" cellPadding="10" style={{ marginTop: "20px", width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Test Name</th>
                                <th>Raw Score</th>
                                <th>Band (Academic)</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i}>
                                    <td>{r.testName || r.test?.name || "Unknown Test"}</td>
                                    <td>{r.score}</td>
                                    <td>{readingBands[i]?.academic ?? "N/A"}</td>
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
                        <h2>My Listening Results</h2>
                        {listeningResults.length > 0 ? (
                            <table border="1" cellPadding="10" style={{ marginTop: "20px", width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>Test Name</th>
                                        <th>Raw Score</th>
                                        <th>Band</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listeningResults.map((r, i) => (
                                        <tr key={i}>
                                            <td>{r.testName || r.test?.title || "Listening Test"}</td>
                                            <td>{r.score}</td>
                                            <td>{listeningBands[i] ?? "N/A"}</td>
                                            <td>{new Date(r.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>You have no listening results yet.</p>
                        )}
                    </div>

                    <div className="results" style={{ marginTop: "30px" }}>
                        <h2>My Writing Results</h2>
                        {writingAiResults.length > 0 ? (
                            <table border="1" cellPadding="10" style={{ marginTop: "20px", width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>Task</th>
                                        <th>Raw Score</th>
                                        <th>Band</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {writingAiResults.map((r, i) => (
                                        <tr key={i}>
                                            <td>
                                                {r.taskType === "overall"
                                                    ? "overall"
                                                    : r.taskType || "task2"}
                                            </td>
                                            <td>{r.result?.raw_score ?? "—"}</td>
                                            <td>
                                                {r.result?.estimated_band ??
                                                    r.result?.band_score ??
                                                    "N/A"}
                                            </td>
                                            <td>{new Date(r.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : writingResults.length > 0 ? (
                            <table border="1" cellPadding="10" style={{ marginTop: "20px", width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th>Test Name</th>
                                        <th>Raw Score</th>
                                        <th>Band</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {writingResults.map((r, i) => (
                                        <tr key={i}>
                                            <td>{r.testName || "Writing Test"}</td>
                                            <td>{r.score}</td>
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
                </>
            )}
        </div>
    );
}

export default Account;
