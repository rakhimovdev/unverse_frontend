import React, { useState } from 'react';
import axios from 'axios';
import "./Writing.css";

function Writing() {

    const [image, setImage] = useState(null);
    const [text, setText] = useState("");

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append("image", image);       // backend: upload.single("image")
        formData.append("content", text);      // backend: req.body.content
        formData.append("title", "my title");  // agar title kerak bo'lsa

        try {
            await axios.post("/posts/writing", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            alert("Saved!");

        } catch (error) {
            console.log(error);
            alert("Error occurred!");
        }
    };

    return (
        <div>
            <div className="container">

                {/* Rasm yuklash */}
                <div className="container1">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                    />
                </div>

                {/* Text yozish */}
                <div className="container2">
                    <textarea
                        placeholder='Write your answer'
                        className='writingText'
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    ></textarea>
                </div>

            </div>

            <button onClick={handleSubmit} className="saveBtn">
                Save
            </button>
        </div>
    );
}

export default Writing;
