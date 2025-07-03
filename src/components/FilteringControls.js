const FilteringControls = ({
    filters,
    setters,
    handleFilterChange,
    clearFilters
}) => {
    const filterConfig = [
        { filter: "draftFilterName", setter: "setDraftFilterName", label: "Name", type: "text", placeholder: "Search by name" },
        { filter: "draftFilterDescription", setter: "setDraftFilterDescription", label: "Description", type: "text", placeholder: "Search by description" },
        { filter: "draftFilterUploaderEmail", setter: "setDraftFilterUploaderEmail", label: "Email", type: "text", placeholder: "Search by email" },
        { filter: "draftFilterUploadedAtAfter", setter: "setDraftFilterUploadedAtAfter", label: "Uploaded After", type: "date" },
        { filter: "draftFilterUploadedAtBefore", setter: "setDraftFilterUploadedAtBefore", label: "Uploaded Before", type: "date" }
    ];

    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "10px" }}>
            <button onClick={clearFilters} style={{ alignSelf: "flex-end", height: "33px" }}>
                Clear Filters
            </button>

            {filterConfig.map(({ filter, setter, label, type, placeholder }) => (
                <div key={filter} style={{ display: "flex", flexDirection: "column", minWidth: "150px" }}>
                    <label style={{ marginBottom: "4px", fontWeight: "bold", fontSize: "0.9em" }}>
                        {label}
                    </label>
                    <input
                        type={type}
                        value={filters[filter]}
                        onChange={handleFilterChange(setters[setter])}
                        placeholder={placeholder}
                        style={{ padding: "6px 8px", fontSize: "0.9em", height: "28px" }}
                    />
                </div>
            ))}
        </div>
    );
}

export default FilteringControls;