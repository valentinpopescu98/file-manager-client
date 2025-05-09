import React, { useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    for (let file of files) {
      formData.append("file", file);
      formData.append("description", description);

      try {
        const response = await axios.post("http://localhost:8080/upload", formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });
        setMessage(response.data);
      } catch (err) {
        console.error(err.response);
        setMessage("Upload failed");
      }

      formData.delete("file");
      formData.delete("description");
    }
  };

  return (
    <div>
      <Navbar />
      <h2>Upload Files</h2>
      <form onSubmit={handleUpload}>
        <input type="file" multiple onChange={handleFileChange} />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Upload;