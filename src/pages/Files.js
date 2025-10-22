import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../lib/api";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { isoToDate } from "../utils/date";
import useFilesFilter from "../hooks/useFilesFilter";
import useFilesGlobalSorting from "../hooks/useFilesGlobalSorting";
import useFilesPageSorting from "../hooks/useFilesPageSorting";
import usePageLimit from "../hooks/usePageLimit";
import usePagination from "../hooks/usePagination";
import GlobalSortingControls from "../components/GlobalSortingControls";
import FileMetadata from "../components/FileMetadata";
import FilteringControls from "../components/FilteringControls";
import PageLimit from "../components/PageLimit";
import PaginationControls from "../components/PaginationControls";
import { logoutAndPurge } from "../auth/logout";

const CACHE_KEY = "pageCache";
const CACHE_MAX_SIZE = 20;
const LAST_MUTATION_KEY = "lastMutationTimestamp";
const CACHE_UPDATE_INTERVAL = 60 * 60 * 1000;

const Files = () => {
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
  const [deleting, setDeleting] = useState(false);
  
  const { handleFilterChange, clearFilters } = useFilesFilter({
      setDraftFilterName,
      setDraftFilterDescription,
      setDraftFilterUploaderEmail,
      setDraftFilterUploadedAtBefore,
      setDraftFilterUploadedAtAfter
    }, () => setPage(1)
  );

  const { pageToggleSort, pageSortedFiles } = useFilesPageSorting(
    pageSortBy,
    pageSortOrder,
    setPageSortBy,
    setPageSortOrder,
    files
  );

  const { globalToggleSort } = useFilesGlobalSorting(
    globalSortBy,
    globalSortOrder,
    setGlobalSortBy,
    setGlobalSortOrder
  );

  const { handleLimitChange } = usePageLimit(
    setLimit,
    () => setPage(1)
  );

  const { pageNumbers } = usePagination(
    page,
    filesCount,
    limit
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

  const invalidateCache = () => {
    cache.current.clear();
    localStorage.removeItem(CACHE_KEY);
  }

  // File fetch logic
  const fetchPage = useCallback(async () => {
    if (deleting) {
      console.log("Skipping fetch - delete in progress");
      return;
    }

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
      const response = await api.get('/api', {
        params: {
          page,
          limit,
          sortBy: globalSortBy,
          sortOrder: globalSortOrder,
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
        logoutAndPurge();
      }
    } finally {
      setLoading(false);
    }
  }, [
    getPageKey,
    deleting,
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

  // Set page name
  useEffect(() => {
    document.title = `Files | Page ${page}`;
  }, [page]);

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
        const response = await api.get('/api/log/files/actions/last-mutation');
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
        if (err.response?.status === 401) {
          logoutAndPurge();
        }
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
  }, [fetchPage]);

  const handleDownload = async (s3Key) => {
    try {
      const encoded = encodeURIComponent(s3Key);
      const response = await api.get(`/api/download?s3Key=${encoded}`, {
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
    setDeleting(true);

    // remove from UI immediately
    const removedFile = files.find(file => file.s3Key === s3Key);
    setFiles(prev => prev.filter(file => file.s3Key !== s3Key));
    setFilesCount(prev => prev - 1);

    // mark as invalidated
    // files count updated -> remove current key from cache -> next fetchPage will call backend
    invalidateCache();
    localStorage.setItem("filesInvalidated", "true");

    // try to delete from the server
    try {
      const encoded = encodeURIComponent(s3Key);
      await api.delete(`/api/delete?s3Key=${encoded}`);
    } catch (error) {
      // if failed, add the file back and notify
      setFiles(prev => [removedFile, ...prev]);
      setFilesCount(prev => prev + 1);
      console.error("Deletion failed:", error);
      alert("Deletion failed! Try again...");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h2>Files</h2>
      
      <FilteringControls filters={{draftFilterName, draftFilterDescription, draftFilterUploaderEmail, draftFilterUploadedAtBefore, draftFilterUploadedAtAfter}}
        setters={{setDraftFilterName, setDraftFilterDescription, setDraftFilterUploaderEmail, setDraftFilterUploadedAtBefore, setDraftFilterUploadedAtAfter}}
        handleFilterChange={handleFilterChange} clearFilters={clearFilters} />

      <FileMetadata pageSortBy={pageSortBy} pageSortOrder={pageSortOrder} pageToggleSort={pageToggleSort}
        files={pageSortedFiles} loading={loading} isoToDate={isoToDate} handleDownload={handleDownload} handleDelete={handleDelete} />

      <div style={{display: "flex", alignItems: "center", gap: "20px", marginTop: "20px", marginBottom: "10px"}}>
        <GlobalSortingControls sortBy={globalSortBy} sortOrder={globalSortOrder} toggleSort={globalToggleSort} setSortOrder={setGlobalSortOrder} />

        <PageLimit limit={limit} handleLimitChange={handleLimitChange} />
      </div>

      <PaginationControls page={page} pageNumbers={pageNumbers} setPage={setPage} />
    </div>
  );
};

export default Files;