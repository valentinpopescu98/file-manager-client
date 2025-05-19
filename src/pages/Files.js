import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL;

const Files = () => {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get(API_SERVER_URL, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setFiles(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchFiles();
  }, [navigate]);

  const handleDownload = (key) => {
    axios
      .get(`${API_SERVER_URL}/download?key=${key}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: "blob",
      })
      .then((response) => {
        const blob = new Blob([response.data]);
        const link = document.createElement("a");

        const contentDisposition = response.headers["content-disposition"];
        let fileName = contentDisposition
          .split("filename=")[1]
          .replace(/"/g, "");
        
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(console.error);
  };

  const handleDelete = (key) => {
    axios
      .delete(`${API_SERVER_URL}/delete?key=${key}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(() => {
        setFiles((prev) => prev.filter((file) => file.key !== key));
      })
      .catch(console.error);
  };

  return (
    <div>
      <Navbar />
      <h2>Files</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.key}>
              <td>{file.name}</td>
              <td>{file.description}</td>
              <td>{file.uploaderEmail}</td>
              <td>
                <button onClick={() => handleDownload(file.key)}>Download</button>
                <button onClick={() => handleDelete(file.key)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Files;