import { useMemo } from "react";

export function useFilesPageSorting(pageSortBy, pageSortOrder, setPageSortBy, setPageSortOrder, files) {
    // sort for current page (by React state)
    const pageToggleSort = (column) => {
        if (pageSortBy === column) {
            if (pageSortOrder === "asc") {
                // "asc" to "desc"
                setPageSortOrder("desc");
            } else {
                // "desc" to "none"
                setPageSortBy(null);
                setPageSortOrder("asc");
            }
        } else {
            setPageSortBy(column);
            setPageSortOrder("asc");
        }
    };

    // apply sorting by current sort order
    const pageSortedFiles = useMemo(() => {
        if (!pageSortBy) return files;

        return [...files].sort((a, b) => {
            const aVal = a[pageSortBy]?.toLowerCase?.() || "";
            const bVal = b[pageSortBy]?.toLowerCase?.() || "";
            return pageSortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
    }, [files, pageSortBy, pageSortOrder]);

    return {
        pageToggleSort,
        pageSortedFiles
    };
}

export default useFilesPageSorting;