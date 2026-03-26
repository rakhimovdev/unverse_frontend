import React, { useEffect, useState } from 'react';
import axios from '../../Api/Axios';
import { Link, useNavigate } from 'react-router-dom';
import './Sign_up.css';

function Sign_up() {
    const [userData, setUserData] = useState({
        studentType: 'insider',
        username: '',
        name: '',
        lastname: '',
        email: '',
        password: '',
        role: 'student', // 🔥 student sifatida default
        teacherId: '',
        timeGroup: '',
        time: '',
        timeSlotIds: []
    });

    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [teachers, setTeachers] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTeachers = async () => {
            setLoadingOptions(true);
            try {
                const tRes = await axios.get('/student/teachers');
                setTeachers(tRes.data || []);
            } catch (error) {
                console.error('Teacher load error:', error);
                setErrorMsg("Teacher ro'yxatini olishda xatolik ❌");
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchTeachers();
    }, []);

    useEffect(() => {
        const fetchSlots = async () => {
            if (!userData.teacherId || !userData.timeGroup) {
                setTimeSlots([]);
                setUserData((prev) => ({ ...prev, time: "", timeSlotIds: [] }));
                return;
            }
            setLoadingOptions(true);
            try {
                const sRes = await axios.get('/student/timeslots', {
                    params: { teacherId: userData.teacherId, group: userData.timeGroup }
                });
                setTimeSlots(sRes.data || []);
                setUserData((prev) => ({ ...prev, time: "", timeSlotIds: [] }));
            } catch (error) {
                console.error('Time slots load error:', error);
                setErrorMsg("Vaqtlar ro'yxatini olishda xatolik ❌");
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchSlots();
    }, [userData.teacherId, userData.timeGroup]);

    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        if (userData.password.length < 6) {
            setErrorMsg("Password must be at least 6 characters long ❌");
            setLoading(false);
            return;
        }

        if (userData.studentType !== "outsider") {
            if (!userData.teacherId || !userData.timeGroup || !userData.time) {
                setErrorMsg("Teacher, juft/toq va vaqtni tanlang ❌");
                setLoading(false);
                return;
            }
        }

        try {
            // 1️⃣ Avval ro‘yxatdan o‘tish
            await axios.post('/student/register', userData);

            // 2️⃣ So‘ng avtomatik login qilish
            const loginRes = await axios.post('/student/login', {
                username: userData.username,
                password: userData.password
            });

            // 3️⃣ Tokenni saqlash
            localStorage.setItem("token", loginRes.data.token);
            localStorage.setItem("role", loginRes.data.user.role);
            localStorage.setItem("user", JSON.stringify(loginRes.data.user));

            alert("Registration successful! 🎉");
            navigate("/account");

        } catch (error) {
            console.error('Registration error:', error);
            setErrorMsg(error.response?.data?.message || "Registration failed ❌");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="signup-page">
            <h1 className="signup-title">Create Student Account</h1>

            <form onSubmit={handleSignUpSubmit} className="signup-form">
                {errorMsg && <p className="error-message">{errorMsg}</p>}

                <div className="form-group">
                    <label>Student turi</label>
                    <select
                        value={userData.studentType}
                        onChange={(e) => {
                            const nextType = e.target.value;
                            setUserData((prev) => ({
                                ...prev,
                                studentType: nextType,
                                teacherId: nextType === "outsider" ? "" : prev.teacherId,
                                timeGroup: nextType === "outsider" ? "" : prev.timeGroup,
                                time: nextType === "outsider" ? "" : prev.time,
                                timeSlotIds: nextType === "outsider" ? [] : prev.timeSlotIds
                            }));
                        }}
                        required
                    >
                        <option value="insider">Insider (teacher bilan)</option>
                        <option value="outsider">Outsider (mustaqil)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={userData.username}
                        onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        placeholder="Enter name"
                        value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Lastname</label>
                    <input
                        type="text"
                        placeholder="Enter lastname"
                        value={userData.lastname}
                        onChange={(e) => setUserData({ ...userData, lastname: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Enter email"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        required
                    />
                </div>

                {userData.studentType !== "outsider" && (
                    <>
                        <div className="form-group">
                            <label>Select Teacher</label>
                            <select
                                value={userData.teacherId}
                                onChange={(e) =>
                                    setUserData({ ...userData, teacherId: e.target.value })
                                }
                                required
                                disabled={loadingOptions}
                            >
                                <option value="">Choose a teacher</option>
                                {teachers.map((teacher) => (
                                    <option key={teacher._id} value={teacher._id}>
                                        {teacher.name} {teacher.lastname}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Juft / Toq</label>
                            <select
                                value={userData.timeGroup}
                                onChange={(e) =>
                                    setUserData({ ...userData, timeGroup: e.target.value })
                                }
                                required
                                disabled={loadingOptions || !userData.teacherId}
                            >
                                <option value="">Juft yoki toq tanlang</option>
                                <option value="juft">
                                    Juft (Seshanba, Payshanba, Shanba)
                                </option>
                                <option value="toq">
                                    Toq (Dushanba, Chorshanba, Juma)
                                </option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Select Time</label>
                            <select
                                value={userData.time}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const match = timeSlots.find((slot) => slot.time === value);
                                    setUserData({
                                        ...userData,
                                        time: value,
                                        timeSlotIds: match?.slotIds || []
                                    });
                                }}
                                required
                                disabled={
                                    loadingOptions || !userData.teacherId || !userData.timeGroup
                                }
                            >
                                <option value="">Choose a time</option>
                                {timeSlots.map((slot) => (
                                    <option key={slot.time} value={slot.time}>
                                        {slot.time}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={userData.password}
                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                        required
                    />
                </div>

                <button type="submit" className="signup-button" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>

                <p className="signin-link">
                    Already have an account?
                    <Link to="/sign_in"> Sign In</Link>
                </p>
            </form>

            <Link to="/" className="back-link">← Back to Home</Link>
        </div>
    );
}

export default Sign_up;
