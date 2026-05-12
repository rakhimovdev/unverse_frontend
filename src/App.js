import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./App.css";

function App() {
  const location = useLocation();

  if (location.pathname !== "/") {
    return null;
  }

  return (
    <div className="announcement" role="status">
      <div className="announcement__inner">
        <span className="announcement__pill">Beta</span>
        <span className="announcement__text">Ushbu sayt test rejimida ishlamoqda.</span>
        <span className="announcement__dot" aria-hidden="true"></span>
        <Link className="announcement__link" to="/sign_up">Early access</Link>
      </div>
    </div>
  );
}

export default App;
