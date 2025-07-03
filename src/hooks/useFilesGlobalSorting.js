export function useFilesGlobalSorting(
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    goToFirstPage
) {
    // sort for all files (in DB)
    const globalToggleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
        }

        // reset to first page when sorting changes
        goToFirstPage();
    };

    return { globalToggleSort };
}

export default useFilesGlobalSorting;