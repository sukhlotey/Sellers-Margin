import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import "./componentsUI/components.css";

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const [dropdown, setDropdown] = useState(false);

  return (
    <nav className="navbar">

      <button className="hamburger" onClick={toggleSidebar}>
        ☰
      </button>

      <div className="nav-right">
        {user ? (
          <div className="profile" onClick={() => setDropdown(!dropdown)}>
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            {dropdown && (
              <div className="dropdown">
                <p>{user.name}</p>
                <p>{user.email}</p>
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <span>Not logged in</span>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
