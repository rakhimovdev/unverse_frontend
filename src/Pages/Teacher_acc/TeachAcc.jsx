import React from 'react'
import "./TeachAcc.css"
import { Link } from 'react-router-dom'
function TeachAcc() {
    return (
        <div>
            <div className="sidebar">
                <Link to="/students">
                    <button>Your Students</button>
                </Link>
                <Link to="/selectt">
                    <button>Add New Test</button>
                </Link>
            </div>
        </div>
    )
}

export default TeachAcc
