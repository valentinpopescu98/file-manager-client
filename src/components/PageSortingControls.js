const PageSortingControls = ({
  sortBy,
  sortOrder,
  toggleSort,
  files,
  loading,
  formatDate,
  handleDownload,
  handleDelete,
}) => {
    return (
        <table>
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
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                  Loading...
                </td>
              </tr>
            ) : files.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                  There are no files.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.s3Key}>
                  <td>{file.name}</td>
                  <td>{file.description}</td>
                  <td>{file.uploaderEmail}</td>
                  <td>{formatDate(file.uploadedAt)}</td>
                  <td>
                    <button onClick={() => handleDownload(file.s3Key)}>Download</button>
                    <button onClick={() => handleDelete(file.s3Key)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
    );
}

export default PageSortingControls;