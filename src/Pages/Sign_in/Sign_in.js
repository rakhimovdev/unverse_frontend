import React, { useState } from 'react';
import axios from '../../Api/Axios';
import { Link, useNavigate } from 'react-router-dom';
import './Sign_in.css';

function Sign_in() {
    const [loginData, setLoginData] = useState({
        username: '',
        password: ''
    });

    const navigate = useNavigate(); // navigate hook

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/student/login', loginData);

            // Backenddan token keldi deb faraz qilamiz
            if (response.data.token) {
                // Tokenni localStorage'ga saqlash
                localStorage.setItem('token', response.data.token);

                // Rolni backenddan olamiz
                localStorage.setItem('role', response.data.user?.role || 'student');
                localStorage.setItem('user', JSON.stringify(response.data.user));

                // Account/dashboard sahifasiga yo'naltirish
                navigate('/account');
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
        <div className="signin-page">
            <h1 className="signin-title">Sign In</h1>

            <form onSubmit={handleLoginSubmit} className="signin-form">
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                    />
                </div>

                <button type="submit" className="signin-button">Log In</button>

                <p className="signup-link">
                    Don't have an account? <Link to="/sign_up">Sign Up</Link>
                </p>
            </form>

            <Link to="/" className="back-link">← Back to Home</Link>
        </div>
    );
}

export default Sign_in;
