export function useFilesFilter(
    setters,
    goToFirstPage
) {
    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);

        // reset to first page when filter changes
        goToFirstPage();
    }

    const clearFilters = () => {
        setters.setDraftFilterName("");
        setters.setDraftFilterDescription("");
        setters.setDraftFilterUploaderEmail("");
        setters.setDraftFilterUploadedAtBefore("");
        setters.setDraftFilterUploadedAtAfter("");

        // reset to first page after clearing filters
        goToFirstPage();
    }

    return {
        handleFilterChange,
        clearFilters
    };
}

 export default useFilesFilter;