import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import useDebouncedValue from "../hooks/useDebouncedValue";

const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL;
const CACHE_KEY = "pageCache";
const CACHE_MAX_SIZE = 20;
const LAST_MUTATION_KEY = "lastMutationTimestamp";
const CACHE_UPDATE_INTERVAL = 60 * 60 * 1000;

const Files = () => {
  const navigate = useNavigate();
  const cache = useRef(new Map());

  const [files, setFiles] = useState([]);
  const [filesCount, setFilesCount] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [localSortBy, setLocalSortBy] = useState(null);
  const [localSortOrder, setLocalSortOrder] = useState("asc");

  const [draftFilterName, setDraftFilterName] = useState("");
  const [draftFilterDescription, setDraftFilterDescription] = useState("");
  const [draftFilterUploaderEmail, setDraftFilterUploaderEmail] = useState("");
  const [draftFilterUploadedAtBefore, setDraftFilterUploadedAtBefore] = useState("");
  const [draftFilterUploadedAtAfter, setDraftFilterUploadedAtAfter] = useState("");

  const filterName = useDebouncedValue(draftFilterName);
  const filterDescription = useDebouncedValue(draftFilterDescription);
  const filterUploaderEmail = useDebouncedValue(draftFilterUploaderEmail);
  const filterUploadedAtBefore = useDebouncedValue(draftFilterUploadedAtBefore);
  const filterUploadedAtAfter = useDebouncedValue(draftFilterUploadedAtAfter);

  const getPageKey = useCallback(() => {
    return JSON.stringify({
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
  }, [
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

  // File fetch logic
  const fetchPage = useCallback(async () => {
    const pageKey = getPageKey();

    if (cache.current.has(pageKey)) {
      const pageCache = cache.current.get(pageKey);
      setFiles(pageCache.files);
      setFilesCount(pageCache.filesCount);
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
          filterUploadedAtBefore: filterUploadedAtBefore || undefined,
          filterUploadedAtAfter: filterUploadedAtAfter || undefined
        }
      });

      const { files, filesCount } = response.data;
      setFiles(files);
      setFilesCount(filesCount);

      // add to cache
      cache.current.set(pageKey, { files, filesCount });

      // control cache size (FIFO)
      if (cache.current.size > CACHE_MAX_SIZE) {
        const oldestKey = cache.current.keys().next().value;
        cache.current.delete(oldestKey);
      }

      // save cache to local storage
      const serializedCache = JSON.stringify(Array.from(cache.current.entries()));
      localStorage.setItem(CACHE_KEY, serializedCache);
    } catch (error) {
      console.error("Files fetch failed", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  }, [
    navigate,
    getPageKey,
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

  // Load up from local storage
  useEffect(() => {
    // load cache
    const json = localStorage.getItem(CACHE_KEY);
    if (json) {
      try {
        const entries = JSON.parse(json);
        cache.current = new Map(entries);
      } catch {
        cache.current = new Map();
      }
    }

    // load last mutation (UPLOAD/DELETE)
    if (!localStorage.getItem(LAST_MUTATION_KEY)) {
      localStorage.setItem(LAST_MUTATION_KEY, new Date().toISOString());
    }
  }, []);

  // Detect self-invalidations (same tab)
  useEffect(() => {
    const invalidated = localStorage.getItem("filesInvalidated");
    if (invalidated === "true") {
      console.log("Self-detected cache invalidation.");
      cache.current.clear();
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem("filesInvalidated");
      fetchPage();
    }
  }, [fetchPage]);

  // Detect cross-tab invalidations (from another tab)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "filesInvalidated") {
        console.log("Received cache invalidation signal.");

        // Empty cache
        cache.current.clear();
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem("filesInvalidated");

        // Force refetch for current page
        fetchPage();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [fetchPage]);

  // When removing all elements from page, move to previous page
  useEffect(() => {
    if (filesCount !== null) {
      const maxPage = Math.max(1, Math.ceil(filesCount / limit));
      if (page > maxPage) {
        setPage(maxPage);
      }
    }
  }, [filesCount, page, limit]);

  // Handle fetch files
  useEffect(() => {
    fetchPage();
  }, [
    navigate,
    fetchPage, 
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

  // Update cache
  useEffect(() => {
    const checkForInvalidation = async () => {
      try {
        const response = await axios.get(`${API_SERVER_URL}/api/log/files/actions/last-mutation`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        const serverTimestamp = new Date(response.data).toISOString();
        const localTimestamp = localStorage.getItem(LAST_MUTATION_KEY);

        if (!localTimestamp || serverTimestamp > localTimestamp) {
          console.log("Cache invalidated due to newer backend mutation");
          localStorage.setItem(LAST_MUTATION_KEY, serverTimestamp);
          cache.current.clear();
          localStorage.removeItem(CACHE_KEY);
          fetchPage();
        }
      } catch (err) {
        console.error("Could not check for last mutation", err);
      }
    };

    // initially
    checkForInvalidation();

    // then every hour
    const interval = setInterval(checkForInvalidation, CACHE_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPage]);

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

      // mark as invalidated
      // files count updated -> remove current key from cache -> next fetchPage will call backend
      localStorage.setItem("filesInvalidated", "true");
    } catch (error) {
      // if failed, add the file back and notify
      setFiles(prev => [removedFile, ...prev]);
      console.error("Deletion failed:", error);
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

  const getPageNumbers = (page, lastPage) => {
    const delta = 2; // how many pages before and after current page
    const pages = [];

    // first page
    pages.push(1);

    // if there are more than 2 pages between page 1 and current page, write …
    if (page - delta > 2) {
      pages.push("left-ellipsis");
    }

    // pages around current page
    for (let p = Math.max(2, page - delta); p <= Math.min(lastPage - 1, page + delta); p++) {
      pages.push(p);
    }

    // if there are more than 2 pages between current page and last page, write …
    if (page + delta < lastPage - 1) {
      pages.push("right-ellipsis");
    }

    // last page (if bigger than 1)
    if (lastPage > 1) {
      pages.push(lastPage);
    }

    return pages;
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
    setDraftFilterName("");
    setDraftFilterDescription("");
    setDraftFilterUploaderEmail("");
    setDraftFilterUploadedAtBefore("");
    setDraftFilterUploadedAtAfter("");

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

  const lastPage = Math.ceil(filesCount / limit);
  const pageNumbers = getPageNumbers(page, lastPage);

  return (
    <div>
      <Navbar />
      <h2>Files</h2>
      
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "10px" }}>
        <button onClick={clearFilters} style={{ alignSelf: "flex-end", height: "33px" }}>
          Clear Filters
        </button>

        {[
          { label: "Name", value: draftFilterName, setter: setDraftFilterName, type: "text", placeholder: "Search by name" },
          { label: "Description", value: draftFilterDescription, setter: setDraftFilterDescription, type: "text", placeholder: "Search by description" },
          { label: "Email", value: draftFilterUploaderEmail, setter: setDraftFilterUploaderEmail, type: "text", placeholder: "Search by email" },
          { label: "Uploaded After", value: draftFilterUploadedAtAfter, setter: setDraftFilterUploadedAtAfter, type: "date" },
          { label: "Uploaded Before", value: draftFilterUploadedAtBefore, setter: setDraftFilterUploadedAtBefore, type: "date" }
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
          {locallySortedFiles.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                There are no files.
              </td>
            </tr>
          ) : (
            locallySortedFiles.map((file) => (
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
            ))
          )}
        </tbody>
      </table>

      <div style={{display: "flex", alignItems: "center", gap: "20px", marginTop: "20px", marginBottom: "10px"}}>
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

      <div style={{ marginTop: "20px", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
        {pageNumbers.map((p, i) =>
          p === "left-ellipsis" || p === "right-ellipsis" ? (
            <span key={p + i} style={{ userSelect: "none" }}>...</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              disabled={p === page}
              style={{
                fontWeight: p === page ? "bold" : "normal",
                cursor: p === page ? "default" : "pointer",
                padding: "6px 10px",
                borderRadius: "4px",
                border: p === page ? "2px solid #007bff" : "1px solid #ccc",
                backgroundColor: p === page ? "#e7f1ff" : "white",
              }}
            >
              {p}
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default Files;