import { useState } from "react";
import api from "../lib/api";
import { useNavigate, Link } from "react-router-dom";
import { setAuthToken } from "../auth/jwt";

const Login = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
      });
      setAuthToken(response.data.token)
      navigate("/");
    } catch (error) {
      setError("Invalid credentials");
      console.log(error.response);
    }
  };

  const handleGoogleLogin = async (e) => {
    window.location.href = `${process.env.REACT_APP_API_SERVER_URL}/oauth2/authorization/google`;
  }

  return (
    <div>
      <h2>Login</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Log In</button>
      </form>

      <hr />
      <button onClick={handleGoogleLogin}>Login with Google</button>
      <p>
        Don't have an account yet? <Link to="/register">Register here</Link>.
      </p>
    </div>
  );
};

export default Login;