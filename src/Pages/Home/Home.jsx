import React from 'react';
import { Link } from 'react-router-dom';
import "./Home.css";

function Home() {
    return (
        <div className="Home">
            <h1>Take your first step toward knowledge with us!</h1>
            <div className="contant">
                <Link className='contact_a' to="/contact">
                    <button>Contact With Us</button>
                </Link>

                <Link className='contact_a' to="/about">
                    <button>About Us</button>
                </Link>

                <Link className='contact_a' to="/read">
                    <button>IELTS practise test</button>
                </Link>
            </div>
        </div>
    );
}

export default Home;
