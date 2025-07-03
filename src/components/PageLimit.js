const PageLimit = ({
    limit,
    handleLimitChange
}) => {
    return (
        <label>
          Items per page:{" "}
          <select value={limit} onChange={handleLimitChange}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
    );
}

export default PageLimit;