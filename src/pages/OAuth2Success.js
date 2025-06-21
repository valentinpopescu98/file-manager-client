import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OAuth2Success = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      navigate("/");
    }
  }, [navigate]);

  return <div>Logging in...</div>;
};

export default OAuth2Success;