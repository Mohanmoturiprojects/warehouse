import { BrowserRouter, Routes, Route, NavLink, Link, useNavigate,Navigate,} from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import Login from "./Login";
import Register from "./Register";
import Gatein from "./Gatein";
import Inventory from "./Inventory";
import Outbound from "./Outbound";
import Shipment from "./Shipment";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load login state
  useEffect(() => {
    const logged = localStorage.getItem("isLoggedIn");
    if (logged === "true") setIsLoggedIn(true);
  }, []);

  return (
    <BrowserRouter>
      <AppContent isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </BrowserRouter>
  );
}

function AppContent({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-top">
          <h1 className="logo">Logikal WMS</h1>

          {!isLoggedIn ? (
            <Link to="/login" className="login-btn">
              Login
            </Link>
          ) : (
            <div className="avatar-container">
              <div
                className="avatar-circle"
                onClick={() => setShowMenu(!showMenu)}
              >
                👤
              </div>

              {showMenu && (
                <div className="avatar-menu">
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        {isLoggedIn && (
          <nav className="nav">
            <NavLink to="/gatein" className="nav-link">
              Gate In
            </NavLink>
             <NavLink to="/shipment" className="nav-link">
              Shipment
            </NavLink>
            <NavLink to="/inventory" className="nav-link">
              Inventory
            </NavLink>
            <NavLink to="/outbound" className="nav-link">
              Outbound
            </NavLink>
           
          </nav>
        )}
      </header>

      {/* ROUTES */}
      <div className="content">
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? <Navigate to="/gatein" /> : <Navigate to="/login" />
            }
          />

          <Route path="/gatein" element={<Gatein />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/outbound" element={<Outbound />} />
          <Route path="/shipment" element={<Shipment />} />

          <Route
            path="/login"
            element={<Login setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
