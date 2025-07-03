const PageSortingControls = ({
  sortBy,
  sortOrder,
  toggleSort
}) => {
    return (
      <thead>
        <tr>
          <th onClick={() => toggleSort("name")} style={{ cursor: "pointer" }}>
            Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : sortOrder === "desc" ? "↓" : "")}
          </th>
          <th onClick={() => toggleSort("description")} style={{ cursor: "pointer" }}>
            Description {sortBy === "description" && (sortOrder === "asc" ? "↑" : sortOrder === "desc" ? "↓" : "")}
          </th>
          <th onClick={() => toggleSort("uploaderEmail")} style={{ cursor: "pointer" }}>
            Email {sortBy === "uploaderEmail" && (sortOrder === "asc" ? "↑" : sortOrder === "desc" ? "↓" : "")}
          </th>
          <th onClick={() => toggleSort("uploadedAt")} style={{ cursor: "pointer" }}>
            Upload Time {sortBy === "uploadedAt" && (sortOrder === "asc" ? "↑" : sortOrder === "desc" ? "↓" : "")}
          </th>
          <th>Actions</th>
        </tr>
      </thead>
    );
}

export default PageSortingControls;