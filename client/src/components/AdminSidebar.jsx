import { NavLink } from "react-router-dom";
import Logo from "../components/Logo";
import "../components/componentsUI/admin-components.css";
import { IoHomeOutline } from "react-icons/io5";
import { FaStar } from "react-icons/fa";

const AdminSidebar = ({ isOpen, isMobile, toggleSidebar }) => {
    return (
        <aside className={`sidebar admin-sidebar ${isOpen ? "open" : ""} ${isMobile ? "mobile" : "desktop"}`}>
            <div className="nav-left">
                <Logo />
            </div>
            <ul>
                <li>
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) => isActive ? "active-link" : ""}
                        onClick={isMobile ? toggleSidebar : null}
                    >
                        <IoHomeOutline size={25} /> Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink
                        to="/admin/ratings"
                        className={({ isActive }) => isActive ? "active-link" : ""}
                        onClick={isMobile ? toggleSidebar : null}
                    >
                        <FaStar size={25} /> Ratings
                    </NavLink>
                </li>
            </ul>
        </aside>
    );
};

export default AdminSidebar;