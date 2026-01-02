import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    mobile: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5989/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        alert("Registration Successful!");

        // Clear form
        setForm({
          username: "",
          password: "",
          mobile: "",
        });

        // Navigate to login page
        navigate("/login");
      } else {
        alert("Registration Failed!");
      }
    } catch (err) {
      alert("Server Error: Unable to register!");
    }
  };

  return (
    <div className="reg-container">
      <div className="reg-box">
        <h2 className="reg-title">Register</h2>

        <form onSubmit={handleRegister}>

          <div className="reg-input-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="reg-input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          <div className="reg-input-group">
            <label>Mobile No</label>
            <input
              type="text"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="Enter mobile number"
              required
            />
          </div>

          <button className="reg-btn">Register</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
