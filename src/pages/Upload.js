import React, { useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";

const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL;

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState("");
  const [uploadStatuses, setUploadStatuses] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setUploadStatuses(selectedFiles.map(file => ({
      name: file.name,
      status: "PENDING", // PENDING | PROCESSING | DONE | ERROR
    })));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    for (let file of files) {
      // Update status to 'PROCESSING'
      setUploadStatuses(prev =>
        prev.map(status =>
          status.name === file.name ? { ...status, status: "PROCESSING" } : status
        )
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("description", description);

      try {
        const response = await axios.post(`${API_SERVER_URL}/api/upload`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        const uploadId = response.data;
        checkUploadStatus(uploadId, file.name);
      } catch (err) {
        console.error(err.response);
        setUploadStatuses(prev =>
          prev.map(status =>
            status.name === file.name ? { ...status, status: "ERROR" } : status
          )
        );
        alert("Upload failed! Try again...");
      }

      formData.delete("file");
      formData.delete("description");
    }
  };

  const checkUploadStatus = async (uploadId, fileName) => {
    let finished = false;
    while (!finished) {
      try {
        const res = await axios.get(`${API_SERVER_URL}/api/upload/status?uploadId=${uploadId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        const { status } = res.data;
        if (status === "DONE") {
          finished = true;
          setUploadStatuses(prev =>
            prev.map(item =>
              item.name === fileName ? { ...item, status: "DONE" } : item
            )
          );
        } else if (status === "ERROR") {
          finished = true;
          setUploadStatuses(prev =>
            prev.map(item =>
              item.name === fileName ? { ...item, status: "ERROR" } : item
            )
          );
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (e) {
        console.error(e);
        finished = true;
        setUploadStatuses(prev =>
          prev.map(item =>
            item.name === fileName ? { ...item, status: "ERROR" } : item
          )
        );
        alert("Upload failed! Try again...");
      }
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
      <ul>
        {uploadStatuses.map((status, idx) => (
          <li key={idx}>
            {status.name} – {status.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Upload;