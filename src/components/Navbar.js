import { useNavigate } from "react-router-dom";
import { logoutAndPurge } from "../auth/logout";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
      <button onClick={() => navigate("/")}>Files</button>
      <button onClick={() => navigate("/upload")}>Upload</button>
      <button
        onClick={() => logoutAndPurge("user-logout")}
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;