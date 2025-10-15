export function useFilesGlobalSorting(
    sortBy,
    setSortBy,
    setSortOrder,
    goToFirstPage
) {
    // sort for all files (in DB)
    const globalToggleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }

        // reset to first page when sorting changes
        goToFirstPage();
    };

    return { globalToggleSort };
}

export default useFilesGlobalSorting;