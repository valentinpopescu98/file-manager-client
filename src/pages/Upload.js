import { api } from "../lib/api";
import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const Upload = () => {
  const [items, setItems] = useState([]);
  const [description, setDescription] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    setItems(prev => {
      // Keep only active items (remove items with status DONE and ERROR)
      const activeFiles = prev.filter(
        it => it.status !== "DONE" && it.status !== "ERROR"
      );

      const existingKeys = new Set(
        activeFiles.map(
          it => `${it.name}|${it.file.size}|${it.file.lastModified}`
        )
      );

      const newFiles = [];
      for (const file of selectedFiles) {
        const key = `${file.name}|${file.size}|${file.lastModified}`;
  
        if (existingKeys.has(key)) {
          continue;
        }
  
        newFiles.push({
          localId: uuidv4(),
          uploadId: null,
          name: file.name,
          file,
          status: "PENDING",
        });
  
        existingKeys.add(key);
      }

      return [...activeFiles, ...newFiles];
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!items || items.length === 0) return;
    const pending = items.filter(it => it.status === "PENDING");
    if (pending.length === 0) return;

    // Update all statuses to 'PROCESSING'
    setItems(prev => 
      prev.map(it => 
        it.status === "PENDING" ? { ...it, status: "PROCESSING" } : it));
    
    const formData = new FormData();
    for (const it of pending) {
      formData.append("files", it.file);
    }
    formData.append("description", description);

    try {
      const response = await api.post('/api/upload', formData);
      const uploaded = Array.isArray(response.data) ? response.data : [];
      if (uploaded.length === 0) {
        throw new Error("Empty response from server -- no files to upload");
      }

      setItems(prev => {
        // add uploadId from the server server to the items
        const updatedItems = prev.map(it => {
          const match = uploaded.find(tf => tf.originalName === it.name);
          return match
            ? { ...it, uploadId: match.uploadId }
            : it;
        });

        // start polling for each new uploadId that is stil PROCESSING
        updatedItems
          .filter(it => it.status === "PROCESSING" && it.uploadId)
          .forEach(it => {
            checkUploadStatus(it.uploadId, it.localId);
          });

        return updatedItems;
      });
    } catch (err) {
      console.error(err);

      setItems(prev =>
        prev.map(it =>
          it.status === "PROCESSING" && it.uploadId === null ? { ...it, status: "ERROR" } : it)
      );
      alert("Upload failed! Try again...");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setDescription("");
    }
  };

  const checkUploadStatus = async (uploadId, localId) => {
    let finished = false;
    
    while (!finished) {
      try {
        const res = await api.get(`/api/upload/status?uploadId=${uploadId}`);
        const { status } = res.data;
  
        if (status === "DONE" || status === "ERROR") {
          finished = true;
  
          setItems(prev =>
            prev.map(it =>
              (it.uploadId === uploadId || it.localId === localId) ? { ...it, status: status } : it)
          );
  
          // mark as invalidated, to be handled by Files component
          // files count updated -> remove current key from cache -> next fetchPage will call backend
          if (status === "DONE") {
            localStorage.setItem("filesInvalidated", "true");
          }
        } else {
          // schedule next check
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        console.error(err);
        finished = true;
  
        setItems(prev =>
          prev.map(it =>
            (it.uploadId === uploadId || it.localId === localId) ? { ...it, status: "ERROR" } : it)
        );
      }
    }
  };

  const colorForStatus = (st) => {
    if (st === "ERROR") return "red";
    if (st === "DONE") return "green";
    return "inherit";
  };
  const busy = items.some(s => s.status === "PROCESSING");
  const isDisabled = busy || description.trim() === "" || !items.some(i => i.status === "PENDING");

  return (
    <div>
      <title>Upload</title>
      <h2>Upload Files</h2>
      <form onSubmit={handleUpload}>
        <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} />
        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit" disabled={isDisabled}>{busy ? "Uploading..." : "Upload"}</button>
      </form>
      <ul>
        {items.map((item) => (
          <li key={item.localId} style={{ color: colorForStatus(item.status) }}>
            {item.name} – {item.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Upload;