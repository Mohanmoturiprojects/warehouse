import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5989/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set login state
        setIsLoggedIn(true);

        // 🔥 Save login persistence
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(data.user));

        // 🔥 Role-based redirect
        if (data.user.role?.toLowerCase() === "delivery") {
          navigate("/tracking");  
        } else {
          navigate("/gatein");      
        }

        setTimeout(() => {
          alert("Login Successful!");
        }, 200);

      } else {
        alert(data.message || "Login failed");
      }

    } catch (error) {
      console.error("Login Error:", error);
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Login</h2>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="login-btn">Login</button>
        </form>

        <p className="register-text">
          New user? <Link to="/register" className="register-link">Register here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
