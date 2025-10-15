import { useMemo } from "react";

export function useFilesPageSorting(
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    files
) {
    // sort for current page (by React state)
    const pageToggleSort = (column) => {
        if (sortBy === column) {
            if (sortOrder === "asc") {
                // "asc" to "desc"
                setSortOrder("desc");
            } else {
                // "desc" to "none"
                setSortBy(null);
                setSortOrder("asc");
            }
        } else {
            // default to "asc"
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    // apply sorting by current sort order
    const pageSortedFiles = useMemo(() => {
        if (!sortBy) return files;

        return [...files].sort((a, b) => {
            const aVal = a[sortBy]?.toLowerCase?.() || "";
            const bVal = b[sortBy]?.toLowerCase?.() || "";
            return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
    }, [files, sortBy, sortOrder]);

    return {
        pageToggleSort,
        pageSortedFiles
    };
}

export default useFilesPageSorting;