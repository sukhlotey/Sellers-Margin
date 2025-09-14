import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import "./componentsUI/components.css";
import { FaRegStar } from "react-icons/fa";
import { RiMoneyRupeeCircleLine } from "react-icons/ri";
import { IoSettingsOutline, IoHomeOutline } from "react-icons/io5";
import { GrDocumentConfig } from "react-icons/gr";

const Sidebar = ({ isOpen, isMobile, toggleSidebar }) => {
    return (
        <aside className={`sidebar ${isOpen ? "open" : ""} ${isMobile ? "mobile" : "desktop"}`}>
            <div className="nav-left">
                <Logo />
            </div>
            <ul>
                <li>
                    <NavLink 
                        to="/dashboard" 
                        className={({ isActive }) => isActive ? "active-link" : ""} 
                        onClick={isMobile ? toggleSidebar : null}
                    >
                        <IoHomeOutline size={25} /> Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink 
                        to="/profit-fee" 
                        className={({ isActive }) => isActive ? "active-link" : ""} 
                        onClick={isMobile ? toggleSidebar : null}
                    >
                        <RiMoneyRupeeCircleLine size={25} /> Profit & Fee Calculator
                    </NavLink>
                </li>
                <li>
                    <NavLink 
                        to="/ai-optimizer" 
                        className={({ isActive }) => isActive ? "active-link" : ""} 
                        onClick={isMobile ? toggleSidebar : null}
                    >
                        <FaRegStar size={25} /> Review & Rating Tracker
                    </NavLink>
                </li>
                <li>
                    <NavLink 
                        to="/gst-settlement" 
                        className={({ isActive }) => isActive ? "active-link" : ""} 
                        onClick={isMobile ? toggleSidebar : null}
                    >
                        <GrDocumentConfig size={25} /> GST & Settlement
                    </NavLink>
                </li>
                <li>
                    <NavLink 
                        to="/settings" 
                        className={({ isActive }) => isActive ? "active-link" : ""} 
                        onClick={isMobile ? toggleSidebar : null}
                    >
                        <IoSettingsOutline size={25} /> Settings
                    </NavLink>
                </li>
            </ul>
        </aside>
    );
};

export default Sidebar;
