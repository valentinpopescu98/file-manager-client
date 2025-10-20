import { api } from "../lib/api";
import { useState } from "react";
import Navbar from "../components/Navbar";

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
        const response = await api.post('/api/upload', formData);
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
        const res = await api.get(`/api/upload/status?uploadId=${uploadId}`);

        const { status } = res.data;
        if (status === "DONE") {
          finished = true;
          setUploadStatuses(prev =>
            prev.map(item =>
              item.name === fileName ? { ...item, status: "DONE" } : item
            )
          );

          // mark as invalidated, to be handled by Files component
          // files count updated -> remove current key from cache -> next fetchPage will call backend
          localStorage.setItem("filesInvalidated", "true");
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