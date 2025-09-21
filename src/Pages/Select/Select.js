import React from 'react'
import "./Select.css";
import { Link } from 'react-router-dom';

function Select() {
    return (
        <div>
            <div className="select-container">
                <h1>Are You </h1>
                <div className="box">
                    <Link to="/techer">

                        <button>Teacher</button>
                    </Link>
                    <h1>OR</h1>
                    <Link to="/sign_up">
                        <button>Student</button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Select
