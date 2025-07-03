const GlobalSortingControls = ({
    sortBy,
    sortOrder,
    toggleSort,
    setSortOrder
}) => {
    return (
        <div>
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
        </div>
    );
}

export default GlobalSortingControls;