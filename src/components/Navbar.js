import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuthToken } from "../auth/jwt";

const Navbar = () => {
  const navigate = useNavigate();
  const token = getAuthToken();

  if (!token) return null;

  return (
    <nav style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      <button onClick={() => navigate("/")}>Files</button>
      <button onClick={() => navigate("/upload")}>Upload</button>
      <button
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("pageCache");
          localStorage.removeItem("lastMutationTimestamp");
          navigate("/login");
        }}
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;