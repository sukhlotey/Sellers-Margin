import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import "../components/componentsUI/admin-components.css";
import { useNavigate } from "react-router-dom";
import { IoIosLogOut } from "react-icons/io";

const AdminNavbar = ({ toggleSidebar }) => {
    const { admin, logout } = useContext(AuthContext);
    const [dropdown, setDropdown] = useState(false);
    const navigate = useNavigate();

    return (
        <nav className="navbar admin-navbar">
            <button className="hamburger" onClick={toggleSidebar}>
                ☰
            </button>
            <div className="nav-right">
                {admin ? (
                    <>
                        <div className="profile" onClick={() => setDropdown(!dropdown)}>
                            <span className="avatar">{admin.name.charAt(0).toUpperCase()}</span>
                            {dropdown && (
                                <div className="dropdown">
                                    <p>{admin.name}</p>
                                    <p>{admin.email}</p>
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

export default AdminNavbar;