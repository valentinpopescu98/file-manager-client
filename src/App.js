import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Files from './pages/Files';
import Login from './pages/Login';
import OAuth2Success from "./pages/OAuth2Success";
import Upload from './pages/Upload';

const PrivateRoute = ({ element: Element }) => {
  const token = localStorage.getItem("token");
  return token ? Element : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PrivateRoute element={<Files />} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/oauth2/success" element={<OAuth2Success />} />
        <Route path="/upload" element={<PrivateRoute element={<Upload />} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
