import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Files from './pages/Files';
import Login from './pages/Login';
import Register from "./pages/Register";
import OAuth2Success from "./pages/OAuth2Success";
import Upload from './pages/Upload';
import { useAuthBootstrap } from "./lib/api";

const PrivateRoute = () => {
  useAuthBootstrap();
  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Files />} />
          <Route path="/upload" element={<Upload />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth2/success" element={<OAuth2Success />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
