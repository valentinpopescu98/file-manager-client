import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { logoutAndPurge } from "./auth/logout";
import api from "./lib/api";
import Files from './pages/Files';
import Login from './pages/Login';
import Register from "./pages/Register";
import OAuth2Success from "./pages/OAuth2Success";
import Upload from './pages/Upload';
import { getAuthToken } from "./auth/jwt";

const PrivateRoute = ({ element: Element }) => {
  const token = getAuthToken();
  return token ? Element : <Navigate to="/login" />;
};

function App() {
  useEffect(() => {
    // Validate one time when starting application
    const token = getAuthToken();
    if (token) {
      api.get("/api/auth/validate").catch(() => {
        // NO-OP: api interceptor will do logoutAndPurge()
      });
    }

    // Detect logout message and then log out
    try {
      const bc = new BroadcastChannel("auth");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "logout") logoutAndPurge(ev.data.reason);
      };

      return () => bc.close();
    } catch {
      // Fallback on the storage event
      const onStorage = (e) => {
        if (e.key === "logout-event") logoutAndPurge("broadcast");
      };

      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PrivateRoute element={<Files />} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth2/success" element={<OAuth2Success />} />
        <Route path="/upload" element={<PrivateRoute element={<Upload />} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
