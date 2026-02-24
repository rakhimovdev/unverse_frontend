import React from 'react'
import { Link } from 'react-router-dom';
import "./Select_in.css";
function Select_in() {
    return (
        <div>
            <div className="select-container">
                <h1>Are You </h1>
                <div className="box">
                    <Link to="/teacher_in">

                        <button>Teacher</button>
                    </Link>
                    <h1>OR</h1>
                    <Link to="/sign_in">
                        <button>Student</button>
                    </Link>
                    <h1>OR</h1>
                    <Link to="/admin_login">
                        <button>Admin</button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Select_in
