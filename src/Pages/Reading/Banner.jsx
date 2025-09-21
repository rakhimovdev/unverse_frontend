import React, { useState, useEffect } from 'react';
import "./Banner.css";
import { useNavigate } from 'react-router-dom';
import axios from '../../Api/Axios';
import { FaTrash } from "react-icons/fa";

function Banner() {
  const [uploadedTests, setUploadedTests] = useState([]);
  const navigate = useNavigate();

  // LocalStorage'dan token va role olish
  const isAuthenticated = !!localStorage.getItem("token");
  const userRole = localStorage.getItem("role"); // student | teacher | admin

  // Testlarni backenddan olish
  const fetchTests = () => {
    axios.get('/test/all')
      .then(res => {
        setUploadedTests(res.data || []);
      })
      .catch(() => setUploadedTests([]));
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // Testni o'chirish (faqat teacher va admin)
  const handleDelete = async (id) => {
    if (userRole === "teacher" || userRole === "admin") {
      if (window.confirm("Testni o'chirishni istaysizmi?")) {
        try {
          await axios.delete(`/test/${id}`);
          fetchTests(); // O‘chirib bo‘lgach yangilash
        } catch (err) {
          alert("O'chirishda xatolik yuz berdi!");
        }
      }
    } else {
      alert("Siz testni o‘chira olmaysiz! ❌");
    }
  };

  // Testni ishlash
  const handleTakeTest = (id) => {
    if (!isAuthenticated) {
      if (window.confirm("Testni ishlash uchun akkauntga kirishingiz kerak. Login sahifasiga o'tishni xohlaysizmi?")) {
        navigate("/sign_in");
      }
    } else {
      navigate(`/reading/${id}`);
    }
  };

  return (
    <div className='banner'>
      <div className="right">
        <div className="heading">
          <h2>Uploaded Tests</h2>
        </div>
        <div className="box">
          {uploadedTests.length > 0 ? (
            uploadedTests.map(test => (
              <div className="cart" key={test._id}>
                <p>{test.name}</p>
                <div className="cart-buttons">
                  {/* Take test tugmasi */}
                  <button onClick={() => handleTakeTest(test._id)}>
                    Take Test
                  </button>

                  {/* Faqat teacher va admin uchun delete tugmasi */}
                  {(userRole === "teacher" || userRole === "admin") && (
                    <button
                      className='delete-btn'
                      onClick={() => handleDelete(test._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No uploaded tests found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Banner;
