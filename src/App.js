import React from 'react'
import "./App.css"

function App() {
  return (
    <div className="announcement" role="status">
      <div className="announcement__inner">
        <span className="announcement__pill">Beta</span>
        <span className="announcement__text">Ushbu sayt test rejimida ishlamoqda.</span>
        <span className="announcement__dot" aria-hidden="true"></span>
        <a className="announcement__link" href="/sign_up">Early access</a>
      </div>
    </div>
  )
}

export default App
