export function useFilesGlobalSorting(
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder
) {
    // sort for all files (in DB)
    const globalToggleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
        }
    };

    return { globalToggleSort };
}

export default useFilesGlobalSorting;