import PageSortingControls from "./PageSortingControls";

const FileMetadata = ({
  pageSortBy,
  pageSortOrder,
  pageToggleSort,
  files,
  loading,
  isoToDate,
  handleDownload,
  handleDelete,
}) => {
    return (
      <table>
        <PageSortingControls sortBy={pageSortBy} sortOrder={pageSortOrder} toggleSort={pageToggleSort} />
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
                <td>{isoToDate(file.uploadedAt)}</td>
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

export default FileMetadata;