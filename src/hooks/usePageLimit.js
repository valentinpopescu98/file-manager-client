export function usePageLimit(setLimit, goToFirstPage) {
    const handleLimitChange = (e) => {
        const newLimit = parseInt(e.target.value);
        setLimit(newLimit);

        // reset to first page when limit changes
        goToFirstPage();
    };

    return { handleLimitChange };
}

export default usePageLimit;