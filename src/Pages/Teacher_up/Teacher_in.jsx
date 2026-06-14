import React, { useState } from 'react';
import "./Teacher_in.css";
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../Api/Axios';
import { useAuth } from '../../context/AuthContext';

function Teacher_in() {
    const { persistSession } = useAuth();
    const [loginData, setLoginData] = useState({
        username: '',
        password: ''
    });

    const navigate = useNavigate(); // navigate hook

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/user/login', loginData);

            // Backenddan token keldi deb faraz qilamiz
            if (response.data.token) {
                const userRole = response.data.user?.role || 'teacher';
                persistSession({
                    token: response.data.token,
                    user: {
                        ...response.data.user,
                        role: userRole
                    }
                });

                // Teacher account sahifasiga yo'naltirish
                navigate(userRole === "admin" ? "/admin" : "/teachacc");
            } else {
                alert('Login muvaffaqiyatli, lekin token topilmadi!');
            }

            console.log(response.data);
        } catch (error) {
            console.error(error);
            alert('Login xato! Username yoki parol noto‘g‘ri.');
        }
    };

    return (
        <div className='t_signin'>
            <div className="teacher-signin__panel">
                <div className="teacher-signin__brand">
                    <img
                        className="teacher-signin__logo"
                        src={`${process.env.PUBLIC_URL}/bandup-icon.svg`}
                        alt="BandUp icon"
                    />
                    <div className="teacher-signin__brand-copy">
                        <strong>
                            Band<span>Up</span>
                        </strong>
                        <span>Practice. Improve. Achieve.</span>
                    </div>
                </div>
                <p className="teacher-signin__eyebrow">Teacher Portal</p>
                <h1 className="signin-title">Teacher Sign In</h1>
                <p className="teacher-signin__subtitle">
                    Manage tests, monitor student progress, and stay in sync with your BandUp dashboard.
                </p>

                <form onSubmit={handleLoginSubmit} className="tsignin-form">
                    <div className='t_login'>
                        <input
                            required
                            name="username"
                            id="username"
                            className="inputName"
                            type="text"
                            value={loginData.username}
                            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        />
                        <label htmlFor="username" className="nameLabel">
                            User Name
                        </label>
                    </div>

                    <div className='t_login'>
                        <input
                            id="password"
                            className="inputName"
                            type="password"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                        />
                        <label htmlFor="password" className="nameLabel">
                            Password
                        </label>
                    </div>

                    <button type="submit" className="signin-button">Log In</button>
                </form>

                <h1 className="back-link">
                    <Link to="/">← Back to Home</Link>
                </h1>
            </div>
        </div>
    );
}

export default Teacher_in;
