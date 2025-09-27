import { NavLink } from "react-router-dom";
import Logo from "../components/Logo";
import "../components/componentsUI/admin-components.css";
import { IoHomeOutline } from "react-icons/io5";
import { FaStar } from "react-icons/fa";
import { MdPeopleOutline } from "react-icons/md";
import { BsCreditCard2Back } from "react-icons/bs";

const AdminSidebar = ({ isOpen, isMobile, toggleSidebar, onClick }) => {
  return (
    <aside className={`sidebar admin-sidebar ${isOpen ? "open" : ""} ${isMobile ? "mobile" : "desktop"}`} onClick={onClick}>
      <div className="nav-left">
        <Logo />
      </div>
      <ul>
        <li>
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => (isActive ? "active-link" : "")}
            onClick={() => isMobile && toggleSidebar()}
          >
            <IoHomeOutline size={25} /> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/ratings"
            className={({ isActive }) => (isActive ? "active-link" : "")}
            onClick={() => isMobile && toggleSidebar()}
          >
            <FaStar size={25} /> Ratings
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/active-users"
            className={({ isActive }) => (isActive ? "active-link" : "")}
            onClick={() => isMobile && toggleSidebar()}
          >
            <MdPeopleOutline size={25} /> Active Users
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/subscriptions"
            className={({ isActive }) => (isActive ? "active-link" : "")}
            onClick={() => isMobile && toggleSidebar()}
          >
            <BsCreditCard2Back size={25} /> Subscriptions
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default AdminSidebar;