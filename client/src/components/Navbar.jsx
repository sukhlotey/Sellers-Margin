import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { SubscriptionContext } from "../context/SubscriptionContext";
import "./componentsUI/components.css";
import { useNavigate } from "react-router-dom";
import { IoIosLogOut } from "react-icons/io";


const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const { subscription } = useContext(SubscriptionContext);
  const [dropdown, setDropdown] = useState(false);
  const navigate = useNavigate();

  const getPlanBadge = () => {
    switch (subscription?.plan) {
      case "basic_monthly":
        return { text: "Basic", class: "plan-badge-basic" };
      case "all_monthly":
        return { text: "Monthly", class: "plan-badge-monthly" };
      case "annual":
        return { text: "Annual", class: "plan-badge-annual" };
      default:
        return { text: "Free", class: "plan-badge-free" };
    }
  };

  const { text: planText, class: planClass } = getPlanBadge();

  return (
    <nav className="navbar">
      <button className="hamburger" onClick={toggleSidebar}>
        ☰
      </button>

      <div className="nav-right">
        {user ? (
          <>
            <div className="profile" onClick={() => setDropdown(!dropdown)}>
              <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              {dropdown && (
                <div className="dropdown">
                  <p>{user.name}</p>
                  <p>{user.email}</p>
                  <span onClick={() => navigate("/subscription")} className={`plan-badge ${planClass} --plan-badge`}>{planText}</span>
                  <button onClick={logout}>Logout <IoIosLogOut size={20} /></button>
                </div>
              )}
            </div>
          </>
        ) : (
          <span>Not logged in</span>
        )}
      </div>
    </nav>
  );
};

export default Navbar;