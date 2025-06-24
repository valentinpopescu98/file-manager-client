import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL;

const Files = () => {
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get(`${API_SERVER_URL}/api`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: { page, limit }
        });

        setFiles(response.data.files);
        setTotal(response.data.total);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchFiles();
  }, [navigate, page, limit]);

  const handleDownload = async (s3Key) => {
    try {
      const response = await axios.get(`${API_SERVER_URL}/api/download?s3Key=${encodeURIComponent(s3Key)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let fileName = "downloaded_file";

      if (contentDisposition && contentDisposition.includes("filename=")) {
        fileName = contentDisposition
          .split("filename=")[1]
          .split(";")[0]
          .replace(/"/g, "")
          .trim();
      }

      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Download failed", error);
      alert("Download failed! Try again...");
    }
  };

  const handleDelete = async (s3Key) => {
    // remove from UI immediately
    const removedFile = files.find(file => file.s3Key === s3Key);
    setFiles(prev => prev.filter(file => file.s3Key !== s3Key));

    // try to delete from the server
    try {
      await axios.delete(`${API_SERVER_URL}/api/delete?s3Key=${s3Key}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (error) {
      // if failed, add the file back and notify
      setFiles(prev => [removedFile, ...prev]);
      console.error("Eroare la ștergere:", error);
      alert("Deletion failed! Try again...");
    }
  };

  const formatDate = (isoString) => {
    const cleanDateStr = isoString.slice(0, 23);
    const date = new Date(cleanDateStr);

    if (isNaN(date)) {
      return "NaN";
    }

    return date.toLocaleString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      <Navbar />
      <h2>Files</h2>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Email</th>
            <th>Upload Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.s3Key}>
              <td>{file.name}</td>
              <td>{file.description}</td>
              <td>{file.uploaderEmail}</td>
              <td>{formatDate(file.uploadedAt)}</td>
              <td>
                <button onClick={() => handleDownload(file.s3Key)}>Download</button>
                <button onClick={() => handleDelete(file.s3Key)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "20px", marginBottom: "10px" }}>
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
          Previous
        </button>
        <span style={{ margin: "0 10px" }}>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Files;