import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL;

const Files = () => {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const cache = useRef(new Map());
  const MAX_CACHE_SIZE = 20;

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [localSortBy, setLocalSortBy] = useState(null);
  const [localSortOrder, setLocalSortOrder] = useState("asc");

  const [filterName, setFilterName] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterUploaderEmail, setFilterUploaderEmail] = useState("");
  const [filterUploadedAtBefore, setFilterUploadedAtBefore] = useState("");
  const [filterUploadedAtAfter, setFilterUploadedAtAfter] = useState("");

  useEffect(() => {
    const fetchPage = async () => {
      const cacheKey = JSON.stringify({
        page,
        limit,
        sortBy,
        sortOrder,
        filterName,
        filterDescription,
        filterUploaderEmail,
        filterUploadedAtBefore,
        filterUploadedAtAfter
      });

      if (cache.current.has(cacheKey)) {
        const cached = cache.current.get(cacheKey);
        setFiles(cached.files);
        setHasNextPage(cached.hasNextPage);
        return;
      }

      try {
        const response = await axios.get(`${API_SERVER_URL}/api`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: {
            page,
            limit,
            sortBy,
            sortOrder,
            filterName,
            filterDescription,
            filterUploaderEmail,
            filterUploadedAtBefore,
            filterUploadedAtAfter
          }
        });

        const { files, hasNextPage } = response.data;
        setFiles(files);
        setHasNextPage(hasNextPage);

        // add to cache
        cache.current.set(cacheKey, { files, hasNextPage });

        // control cache size (FIFO)
        if (cache.current.size > MAX_CACHE_SIZE) {
          const oldestKey = cache.current.keys().next().value;
          cache.current.delete(oldestKey);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
        }
      }
    };

    fetchPage();
  }, [
    navigate,
    page,
    limit,
    sortBy,
    sortOrder,
    filterName,
    filterDescription,
    filterUploaderEmail,
    filterUploadedAtBefore,
    filterUploadedAtAfter
  ]);

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

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);

    // reset to first page when limit changes
    setPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);

    // reset to first page when filter changes
    setPage(1);
  }

  const clearFilters = () => {
    setFilterName("");
    setFilterDescription("");
    setFilterUploaderEmail("");
    setFilterUploadedAtBefore("");
    setFilterUploadedAtAfter("");

    // reset to first page after clearing filters
    setPage(1);
  }

  // sort for all files (in DB)
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
    }

    // reset to first page when sorting changes
    setPage(1);
  };

  // sort for current page (by React state)
  const toggleLocalSort = (column) => {
    if (localSortBy === column) {
      if (localSortOrder === "asc") {
        // "asc" to "desc"
        setLocalSortOrder("desc");
      } else {
        // "desc" to "none"
        setLocalSortBy(null);
        setLocalSortOrder("asc");
      }
    } else {
      setLocalSortBy(column);
      setLocalSortOrder("asc");
    }
  };

  // apply sorting by current sort order
  const locallySortedFiles = useMemo(() => {
    if (!localSortBy) return files;

    return [...files].sort((a, b) => {
      const aVal = a[localSortBy]?.toLowerCase?.() || "";
      const bVal = b[localSortBy]?.toLowerCase?.() || "";
      return localSortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [files, localSortBy, localSortOrder]);

  return (
    <div>
      <Navbar />
      <h2>Files</h2>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "10px" }}>
        <button onClick={clearFilters} style={{ alignSelf: "flex-end", height: "33px" }}>
          Clear Filters
        </button>

        {[
          { label: "Name", value: filterName, setter: setFilterName, type: "text", placeholder: "Search by name" },
          { label: "Description", value: filterDescription, setter: setFilterDescription, type: "text", placeholder: "Search by description" },
          { label: "Email", value: filterUploaderEmail, setter: setFilterUploaderEmail, type: "text", placeholder: "Search by email" },
          { label: "Uploaded After", value: filterUploadedAtAfter, setter: setFilterUploadedAtAfter, type: "date" },
          { label: "Uploaded Before", value: filterUploadedAtBefore, setter: setFilterUploadedAtBefore, type: "date" }
        ].map(({ label, value, setter, type, placeholder }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
            <label style={{ marginBottom: "4px", fontWeight: "bold", fontSize: "0.9em" }}>{label}</label>
            <input type={type} value={value} onChange={handleFilterChange(setter)} placeholder={placeholder} style={{ padding: "6px 8px", fontSize: "0.9em", heigh: "28px" }}/>
          </div>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th onClick={() => toggleLocalSort("name")} style={{ cursor: "pointer" }}>
              Name {localSortBy === "name" && (localSortOrder === "asc" ? "↑" : localSortOrder === "desc" ? "↓" : "")}
            </th>
            <th onClick={() => toggleLocalSort("description")} style={{ cursor: "pointer" }}>
              Description {localSortBy === "description" && (localSortOrder === "asc" ? "↑" : localSortOrder === "desc" ? "↓" : "")}
            </th>
            <th onClick={() => toggleLocalSort("uploaderEmail")} style={{ cursor: "pointer" }}>
              Email {localSortBy === "uploaderEmail" && (localSortOrder === "asc" ? "↑" : localSortOrder === "desc" ? "↓" : "")}
            </th>
            <th onClick={() => toggleLocalSort("uploadedAt")} style={{ cursor: "pointer" }}>
              Upload Time {localSortBy === "uploadedAt" && (localSortOrder === "asc" ? "↑" : localSortOrder === "desc" ? "↓" : "")}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locallySortedFiles.map((file) => (
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

      <div style={{display: "flex", alignItems: "center", gap: "20px", marginTop: "20px", marginBottom: "10px"}}>
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={!hasNextPage}>
          Next
        </button>

        <label>
          Sort by:{" "}
          <select value={sortBy} onChange={(e) => toggleSort(e.target.value)}>
            <option value="name">Name</option>
            <option value="description">Description</option>
            <option value="uploaderEmail">Email</option>
            <option value="uploadedAt">Upload Time</option>
          </select>
        </label>

        <label>
          Order:{" "}
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>

        <label>
          Items per page:{" "}
          <select value={limit} onChange={handleLimitChange}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default Files;