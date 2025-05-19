import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL;

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_SERVER_URL}/login`, {
        username,
        password,
      });
      localStorage.setItem("token", response.data.token);
      navigate("/");
    } catch (error) {
      setError("Invalid credentials");
      console.log(error.response);
    }
  };

  const handleGoogleLogin = async (e) => {
    window.location.href = `${API_SERVER_URL}/oauth2/authorization/google`;
  }

  return (
    <div>
      <h2>Login</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
    </div>
  );
};

export default Login;