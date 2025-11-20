import React from 'react'
import "./Home.css"
function Home() {
    return (
        <div>
            <div className="Home">
                <h1>Take your first step toward knowledge with us!</h1>
                <div className="contant">
                    <a className='contact_a' href="">
                        <button>Contact With Us</button>

                    </a>
                    <a className='contact_a' href="">
                        <button>About Us</button>
                    </a>
                    <a className='contact_a' href="/read">
                        <button>IELTS practise test</button>
                    </a>
                </div>
            </div>
        </div>
    )
}

export default Home
