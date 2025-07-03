import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useDebouncedValue from "../hooks/useDebouncedValue";
import useFilesGlobalSorting from "../hooks/useFilesGlobalSorting";
import useFilesPageSorting from "../hooks/useFilesPageSorting";
import usePageLimit from "../hooks/usePageLimit";
import usePagination from "../hooks/usePagination";
import Navbar from "../components/Navbar";
import GlobalSortingControls from "../components/GlobalSortingControls";
import PageSortingControls from "../components/PageSortingControls";
import PageLimit from "../components/PageLimit";
import PaginationControls from "../components/PaginationControls";

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

  const [globalSortBy, setGlobalSortBy] = useState("name");
  const [globalSortOrder, setGlobalSortOrder] = useState("asc");
  const [pageSortBy, setPageSortBy] = useState(null);
  const [pageSortOrder, setPageSortOrder] = useState("asc");

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

  const [loading, setLoading] = useState(false);

  const { globalToggleSort } = useFilesGlobalSorting(
        globalSortBy,
        globalSortOrder,
        setGlobalSortBy,
        setGlobalSortOrder,
        () => setPage(1)
    );

  const { pageToggleSort, pageSortedFiles } = useFilesPageSorting(
    pageSortBy,
    pageSortOrder,
    setPageSortBy,
    setPageSortOrder,
    files
  );

  const { pageNumbers } = usePagination(
    page,
    filesCount,
    limit
  );

  const { handleLimitChange } = usePageLimit(
    setLimit,
    () => setPage(1)
  );

  const getPageKey = useCallback(() => {
    return JSON.stringify({
      page,
      limit,
      globalSortBy,
      globalSortOrder,
      filterName,
      filterDescription,
      filterUploaderEmail,
      filterUploadedAtBefore,
      filterUploadedAtAfter
    });
  }, [
    page,
    limit,
    globalSortBy,
    globalSortOrder,
    filterName,
    filterDescription,
    filterUploaderEmail,
    filterUploadedAtBefore,
    filterUploadedAtAfter
  ]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`
  });

  const invalidateCache = () => {
    cache.current.clear();
    localStorage.removeItem(CACHE_KEY);
  }

  // File fetch logic
  const fetchPage = useCallback(async () => {
    setLoading(true);
    const pageKey = getPageKey();
    
    if (cache.current.has(pageKey)) {
      const pageCache = cache.current.get(pageKey);
      setFiles(pageCache.files);
      setFilesCount(pageCache.filesCount);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_SERVER_URL}/api`, {
        headers: getAuthHeaders(),
        params: {
          page,
          limit,
          globalSortBy,
          globalSortOrder,
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
      try {
        localStorage.setItem(CACHE_KEY, serializedCache);
      } catch (err) {
        console.warn("Failed to write to localStorage", err);
      }
    } catch (error) {
      console.error("Files fetch failed", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [
    navigate,
    getPageKey,
    page,
    limit,
    globalSortBy,
    globalSortOrder,
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
      try {
        localStorage.setItem(LAST_MUTATION_KEY, new Date().toISOString());
      } catch (err) {
        console.warn("Failed to write to localStorage", err);
      }
    }
  }, []);

  // Detect self-invalidations (same tab) -- trigger
  useEffect(() => {
    const invalidated = localStorage.getItem("filesInvalidated");
    if (invalidated === "true") {
      console.log("Self-detected cache invalidation.");
      invalidateCache();
      localStorage.removeItem("filesInvalidated");
      fetchPage();
    }
  }, [fetchPage]);

  // Detect cross-tab invalidations (from another tab)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "filesInvalidated" && e.storageArea === localStorage && e.newValue === "true") {
        console.log("Received cache invalidation signal.");

        // Empty cache
        invalidateCache();
        localStorage.removeItem("filesInvalidated");

        // Force refetch for current page
        setTimeout(fetchPage, 0);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [fetchPage]);

  // Update cache after invalidation (for situations when other clients make changes, but cache is stale)
  useEffect(() => {
    const checkForInvalidation = async () => {
      try {
        const response = await axios.get(`${API_SERVER_URL}/api/log/files/actions/last-mutation`, {
          headers: getAuthHeaders()
        });

        const serverTimestamp = new Date(response.data).toISOString();
        const localTimestamp = localStorage.getItem(LAST_MUTATION_KEY);

        if (!localTimestamp || serverTimestamp > localTimestamp) {
          console.log("Cache invalidated due to newer backend mutation");
          try {
            localStorage.setItem(LAST_MUTATION_KEY, serverTimestamp);
          } catch (err) {
            console.warn("Failed to write to localStorage", err);
          }
          invalidateCache();
          setTimeout(fetchPage, 0);
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
    globalSortBy, 
    globalSortOrder, 
    filterName, 
    filterDescription, 
    filterUploaderEmail, 
    filterUploadedAtBefore, 
    filterUploadedAtAfter
  ]);

  const handleDownload = async (s3Key) => {
    try {
      const response = await axios.get(`${API_SERVER_URL}/api/download?s3Key=${encodeURIComponent(s3Key)}`, {
        headers: getAuthHeaders(),
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
    setFilesCount(prev => prev - 1);

    // try to delete from the server
    try {
      await axios.delete(`${API_SERVER_URL}/api/delete?s3Key=${s3Key}`, {
        headers: getAuthHeaders(),
      });

      // mark as invalidated
      // files count updated -> remove current key from cache -> next fetchPage will call backend
      localStorage.setItem("filesInvalidated", "true");
      invalidateCache();
    } catch (error) {
      // if failed, add the file back and notify
      setFiles(prev => [removedFile, ...prev]);
      setFilesCount(prev => prev + 1);
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
            <input type={type} value={value} onChange={handleFilterChange(setter)} placeholder={placeholder} style={{ padding: "6px 8px", fontSize: "0.9em", height: "28px" }}/>
          </div>
        ))}
      </div>

      <PageSortingControls sortBy={pageSortBy} sortOrder={pageSortOrder} toggleSort={pageToggleSort}
       files={pageSortedFiles} loading={loading} formatDate={formatDate} handleDownload={handleDownload} handleDelete={handleDelete} />

      <div style={{display: "flex", alignItems: "center", gap: "20px", marginTop: "20px", marginBottom: "10px"}}>
        <GlobalSortingControls sortBy={globalSortBy} sortOrder={globalSortOrder} toggleSort={globalToggleSort} setSortOrder={setGlobalSortOrder} />

        <PageLimit limit={limit} handleLimitChange={handleLimitChange} />
      </div>

      <PaginationControls page={page} pageNumbers={pageNumbers} setPage={setPage} />
    </div>
  );
};

export default Files;