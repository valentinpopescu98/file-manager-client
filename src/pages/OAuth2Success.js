import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken } from "../auth/jwt";

const OAuth2Success = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setAuthToken(token)
      navigate("/");
    }
  }, [navigate]);

  return (
    <div>
      <title>Login Successful</title>
      <div>Logging in...</div>
    </div>
  );
};

export default OAuth2Success;