const PaginationControls = ({
    page,
    pageNumbers,
    setPage
}) => {
  return (
    <div style={{ marginTop: "20px", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
      {pageNumbers.map((p, i) =>
        p === "left-ellipsis" || p === "right-ellipsis" ? (
          <span key={p + i} style={{ userSelect: "none" }}>...</span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(p)}
            disabled={p === page}
            style={{
              fontWeight: p === page ? "bold" : "normal",
              cursor: p === page ? "default" : "pointer",
              padding: "6px 10px",
              borderRadius: "4px",
              border: p === page ? "2px solid #007bff" : "1px solid #ccc",
              backgroundColor: p === page ? "#e7f1ff" : "white",
            }}
          >
            {p}
          </button>
        )
      )}
    </div>
  );
}

export default PaginationControls;